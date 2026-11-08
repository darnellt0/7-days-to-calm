"""Run: python -m unittest discover -s tests -v (from em-backend)."""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import main

class ApiTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test-key', 'AGENT_ID': 'test-agent', 'TOOL_BEARER_TOKEN': ''})
        self.env.start()
        self.client = TestClient(main.app)
    def tearDown(self):
        self.env.stop()
    def test_signing_sdk_contract(self):
        url = 'wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=test'
        with patch.object(main, 'ElevenLabs') as sdk:
            sdk.return_value.conversational_ai.conversations.get_signed_url.return_value = SimpleNamespace(signed_url=url)
            r = self.client.get('/convai/signed-url?challenge_day=3')
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json(), {'signed_url': url, 'challenge_day': 3})
            self.assertEqual(r.headers['cache-control'], 'no-store')
            sdk.return_value.conversational_ai.conversations.get_signed_url.assert_called_once_with(agent_id='test-agent')
    def test_missing_configuration(self):
        with patch.dict(os.environ, {'ELEVENLABS_API_KEY': ''}):
            r = self.client.get('/convai/signed-url')
            self.assertEqual(r.status_code, 503)
            self.assertFalse(self.client.get('/health').json()['ready'])
    def test_legacy_agent_environment(self):
        with patch.dict(os.environ, {'AGENT_ID': '', 'ELEVENLABS_AGENT_ID': 'legacy'}):
            self.assertEqual(main.agent_id(), 'legacy')
    def test_provider_failure_redacts_secrets(self):
        with patch.object(main, '_signed_url', side_effect=RuntimeError('secret-key signed-url-secret')):
            with self.assertLogs('em-backend', level='ERROR') as captured:
                r = self.client.get('/convai/signed-url')
            self.assertEqual(r.status_code, 502)
            self.assertIn('x-request-id', r.headers)
            self.assertNotIn('secret-key', r.text + str(captured.output))
            self.assertNotIn('signed-url-secret', r.text + str(captured.output))
    def test_day_validation(self):
        for value in ['0', '8', '1.5', 'nope']:
            self.assertEqual(self.client.get('/convai/signed-url?challenge_day='+value).status_code, 422)
        self.assertEqual(self.client.post('/tool/log-goal?day=8').status_code, 422)
    def test_cors_preflight(self):
        r = self.client.options('/convai/signed-url', headers={'Origin': 'http://localhost:3000', 'Access-Control-Request-Method': 'GET'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers['access-control-allow-origin'], 'http://localhost:3000')
        denied = self.client.options('/convai/signed-url', headers={'Origin': 'https://untrusted.example', 'Access-Control-Request-Method': 'GET'})
        self.assertEqual(denied.status_code, 400)
        self.assertNotIn('access-control-allow-origin', denied.headers)
        with patch.object(main, 'ElevenLabs') as sdk:
            self.assertEqual(self.client.get('/convai/signed-url', headers={'Origin': 'https://untrusted.example'}).status_code, 403)
            sdk.assert_not_called()
    def test_goal_auth_and_closing(self):
        with patch.dict(os.environ, {'TOOL_BEARER_TOKEN': 'test-token'}):
            self.assertEqual(self.client.post('/tool/log-goal?day=1').status_code, 401)
            self.assertEqual(self.client.post('/tool/log-goal?day=1', headers={'Authorization': 'Bearer test-token'}).status_code, 200)
        r = self.client.post('/tts/closing?day=7')
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()['audio_generated'])
