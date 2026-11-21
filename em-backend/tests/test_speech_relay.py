import asyncio
import base64
import json
import os
import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

import main
import speech_relay as relay


class TicketTests(unittest.TestCase):
    def test_browser_sdk_subprotocol_is_negotiated(self):
        store = relay.Tickets()
        key = store.issue('wss://provider', 'http://localhost:3000', 3, 'one')
        async def fake_relay(browser, *args):
            await browser.send_json({'ready': True})
        with patch.dict(os.environ, {'VOICE_PLAYBACK_MODE': 'flash25'}), \
             patch.object(relay, 'tickets', store), patch.object(relay, 'relay', fake_relay):
            client = TestClient(main.app)
            with client.websocket_connect('/convai/session?ticket=' + key,
                    headers={'Origin': 'http://localhost:3000'}, subprotocols=['convai']) as socket:
                self.assertEqual(socket.accepted_subprotocol, 'convai')
                self.assertTrue(socket.receive_json()['ready'])

    def test_origin_bound_expiring_single_use_tickets(self):
        store = relay.Tickets()
        with patch.object(relay.time, 'monotonic', return_value=100):
            key = store.issue('wss://provider', 'https://app', 3, 'one')
            self.assertIsNone(store.take(key, 'https://evil'))
            self.assertIsNone(store.take(key, 'https://app'))
            key = store.issue('wss://provider', 'https://app', 3, 'one')
            self.assertEqual(store.take(key, 'https://app').day, 3)
            self.assertIsNone(store.take(key, 'https://app'))
            expired = store.issue('wss://provider', 'https://app', 3, 'one')
        with patch.object(relay.time, 'monotonic', return_value=146):
            self.assertIsNone(store.take(expired, 'https://app'))

    def test_start_rate_is_bounded(self):
        store = relay.Tickets()
        for _ in range(6):
            store.issue('wss://provider', 'https://app', 1, 'one')
        with self.assertRaises(ValueError):
            store.issue('wss://provider', 'https://app', 1, 'one')

    def test_signing_opt_in_never_exposes_upstream_url(self):
        with patch.dict(os.environ, {'VOICE_PLAYBACK_MODE': 'flash25', 'ELEVENLABS_API_KEY': 'test', 'AGENT_ID': 'test'}), \
             patch.object(main, '_signed_url', return_value='wss://provider?secret=upstream'), \
             patch.object(relay, 'tickets', relay.Tickets()):
            client = TestClient(main.app)
            response = client.get('/convai/signed-url?challenge_day=3', headers={'Origin': 'http://localhost:3000'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['playback_model'], 'eleven_turbo_v2_5')
            self.assertNotIn('upstream', response.text)
            self.assertNotIn('signed_url', response.json())
            self.assertEqual(client.get('/convai/signed-url').status_code, 403)
            with self.assertRaises(WebSocketDisconnect):
                with client.websocket_connect('/convai/session?ticket=invalid', headers={'Origin': 'http://localhost:3000'}):
                    pass


class RelayTests(unittest.IsolatedAsyncioTestCase):
    async def test_synthesis_explicitly_requests_english_turbo25_and_fixed_voice(self):
        seen = []
        def respond(request):
            seen.append(request)
            return httpx.Response(200, content=b'pcm-data')
        original = httpx.AsyncClient
        transport = httpx.MockTransport(respond)
        with patch.object(relay.httpx, 'AsyncClient', side_effect=lambda **kw: original(transport=transport, **kw)), \
             patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'private'}):
            result = b''.join([chunk async for chunk in relay.synthesize('A gentle breath.', 'Earlier cue.')])
        self.assertEqual(result, b'pcm-data')
        body = json.loads(seen[0].content)
        self.assertEqual(body['model_id'], 'eleven_turbo_v2_5')
        self.assertEqual(body['language_code'], 'en')
        self.assertEqual(body['voice_settings'], relay.SETTINGS)
        self.assertEqual(body['previous_text'], 'Earlier cue.')
        self.assertEqual(seen[0].url.params['output_format'], 'pcm_16000')

    async def test_completed_responses_condition_next_turn_with_same_voice_and_model(self):
        seen = []
        def respond(request):
            seen.append(request)
            return httpx.Response(200, content=b'pcm', headers={'request-id': f'turn-{len(seen)}'})
        original = httpx.AsyncClient
        history = []
        with patch.object(relay.httpx, 'AsyncClient', side_effect=lambda **kw: original(transport=httpx.MockTransport(respond), **kw)), \
             patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'private'}):
            for text in ['Welcome. I am Shria.', 'Let your shoulders soften.', 'Breathe gently.', 'Rest.', 'Close.']:
                self.assertEqual(b''.join([chunk async for chunk in relay.synthesize(text, 'prior text', history)]), b'pcm')
        bodies = [json.loads(request.content) for request in seen]
        self.assertIsNone(bodies[0]['previous_request_ids'])
        self.assertEqual(bodies[1]['previous_request_ids'], ['turn-1'])
        self.assertIsNone(bodies[1]['previous_text'])
        self.assertEqual(bodies[4]['previous_request_ids'], ['turn-2', 'turn-3', 'turn-4'])
        self.assertEqual(history, ['turn-3', 'turn-4', 'turn-5'])
        for request, body in zip(seen, bodies):
            self.assertIn(relay.VOICE, str(request.url))
            self.assertEqual(body['model_id'], 'eleven_turbo_v2_5')
            self.assertEqual(body['voice_settings'], relay.SETTINGS)
            self.assertEqual(body['language_code'], 'en')

    async def test_interrupted_generation_never_enters_continuity_history(self):
        original = httpx.AsyncClient
        history = ['completed-turn']
        transport = httpx.MockTransport(lambda request: httpx.Response(
            200, content=b'pcm' * 5000, headers={'request-id': 'interrupted-turn'}))
        with patch.object(relay.httpx, 'AsyncClient', side_effect=lambda **kw: original(transport=transport, **kw)), \
             patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'private'}):
            stream = relay.synthesize('A long practice.', '', history)
            await anext(stream)
            await stream.aclose()
        self.assertEqual(history, ['completed-turn'])

    async def exercise(self, fail=False):
        closed = asyncio.Event()
        ready = asyncio.Event()
        sent, forwarded, spoken = [], [], []

        class Browser:
            first = True
            async def receive_text(self):
                if self.first:
                    self.first = False
                    return json.dumps({'type': 'conversation_initiation_client_data',
                        'dynamic_variables': {'challenge_day': 7},
                        'conversation_config_override': {'tts': {'voice_id': 'wrong'}}})
                await asyncio.Future()
            async def send_json(self, event):
                sent.append(event)
                if event['type'] == 'audio':
                    closed.set()

        class Upstream:
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def send(self, event):
                forwarded.append(json.loads(event))
                ready.set()
            def __aiter__(self): return self.events()
            async def events(self):
                await ready.wait()
                yield json.dumps({'type': 'conversation_initiation_metadata',
                    'conversation_initiation_metadata_event': {'agent_output_audio_format': 'ulaw_8000'}})
                yield json.dumps({'type': 'audio', 'audio_event': {'event_id': 9, 'audio_base_64': 'NATIVE'}})
                yield json.dumps({'type': 'agent_response', 'agent_response_event': {'agent_response': 'Day three. Breathe gently.'}})
                await closed.wait()

        async def synth(text, previous, request_ids):
            spoken.append(text)
            if fail:
                raise RuntimeError('private-provider-error')
            yield b'TURBO25'

        with patch.object(relay.websockets, 'connect', return_value=Upstream()), patch.object(relay, 'synthesize', synth):
            if fail:
                with self.assertRaises(RuntimeError):
                    await asyncio.wait_for(relay.relay(Browser(), 'wss://provider', 3, 'https://app'), 2)
            else:
                await asyncio.wait_for(relay.relay(Browser(), 'wss://provider', 3, 'https://app'), 2)
        self.assertEqual(forwarded[0]['dynamic_variables']['challenge_day'], 3)
        self.assertNotIn('conversation_config_override', forwarded[0])
        self.assertEqual(spoken, ['Day three. Breathe gently.'])
        audio = [x['audio_event']['audio_base_64'] for x in sent if x['type'] == 'audio']
        self.assertNotIn('NATIVE', audio)
        if not fail:
            self.assertEqual(base64.b64decode(audio[0]), b'TURBO25')
            self.assertEqual(sent[0]['conversation_initiation_metadata_event']['agent_output_audio_format'], 'pcm_16000')

    async def test_provider_audio_replaced_and_context_preserved(self):
        await self.exercise()

    async def test_tts_failure_never_falls_back_to_wrong_voice(self):
        await self.exercise(fail=True)

    async def test_interruption_cancels_old_speech_before_next_reply(self):
        ready, started, cancelled, finished = (asyncio.Event() for _ in range(4))
        sent, calls = [], []
        class Browser:
            first = True
            async def receive_text(self):
                if self.first:
                    self.first = False
                    return json.dumps({'type': 'conversation_initiation_client_data'})
                await asyncio.Future()
            async def send_json(self, event):
                sent.append(event)
                if event['type'] == 'audio': finished.set()
        class Upstream:
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def send(self, event): ready.set()
            def __aiter__(self): return self.events()
            async def events(self):
                await ready.wait()
                yield json.dumps({'type': 'agent_response', 'agent_response_event': {'agent_response': 'old'}})
                await started.wait()
                yield json.dumps({'type': 'interruption', 'interruption_event': {'event_id': 1}})
                await cancelled.wait()
                yield json.dumps({'type': 'agent_response', 'agent_response_event': {'agent_response': 'new'}})
                await finished.wait()
        async def synth(text, previous, request_ids):
            calls.append(text)
            if text == 'old':
                started.set()
                try: await asyncio.Future()
                finally: cancelled.set()
            yield b'new'
        with patch.object(relay.websockets, 'connect', return_value=Upstream()), patch.object(relay, 'synthesize', synth):
            await asyncio.wait_for(relay.relay(Browser(), 'wss://provider', 3, 'https://app'), 2)
        self.assertTrue(cancelled.is_set())
        self.assertEqual(calls, ['old', 'new'])
        self.assertEqual([e['type'] for e in sent], ['agent_response', 'interruption', 'agent_response', 'audio'])
        # Native timing/IDs cannot cause the SDK to discard the new response.
        self.assertEqual(sent[1]['interruption_event']['event_id'], 1)
        self.assertEqual(sent[-1]['audio_event']['event_id'], 2)
