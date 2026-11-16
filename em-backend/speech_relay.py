"""Opt-in speech relay: provider ASR/agent, explicit English Flash v2.5 playback.

Single worker required: short-lived, one-use tickets never expose provider URLs.
Native agent audio is discarded, never used as a fallback.
"""
import asyncio
import base64
from collections import deque
import contextlib
from dataclasses import dataclass
import json
import os
import secrets
import time

import httpx
import websockets

VOICE = "DoEstgRs2aKZVhKhJhnx"
MODEL = "eleven_flash_v2_5"
SETTINGS = {"speed": 0.94, "stability": 0.30, "similarity_boost": 0.85}


@dataclass
class Ticket:
    upstream: str
    origin: str
    day: int
    expires: float


class Tickets:
    def __init__(self):
        self.pending = {}
        self.starts = {}

    def issue(self, upstream, origin, day, address):
        now = time.monotonic()
        self.pending = {k: v for k, v in self.pending.items() if v.expires > now}
        self.starts = {k: v for k, v in self.starts.items() if v and v[-1] > now - 60}
        recent = self.starts.setdefault(address, deque())
        while recent and recent[0] <= now - 60:
            recent.popleft()
        if len(recent) >= 6 or len(self.pending) >= 500:
            raise ValueError("Voice start rate exceeded")
        recent.append(now)
        token = secrets.token_urlsafe(32)
        self.pending[token] = Ticket(upstream, origin, day, now + 45)
        return token

    def take(self, token, origin):
        ticket = self.pending.pop(token, None)
        if not ticket or ticket.expires <= time.monotonic() or ticket.origin != origin:
            return None
        return ticket


tickets = Tickets()


def enabled():
    return os.getenv("VOICE_PLAYBACK_MODE", "native") == "flash25"


async def synthesize(text, previous=""):
    """Only called with upstream agent replies; no public arbitrary-text TTS route."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(30, connect=10)) as client:
        async with client.stream(
            "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/stream",
            headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]},
            params={"output_format": "pcm_16000"},
            json={"model_id": MODEL, "language_code": "en", "text": text,
                  "voice_settings": SETTINGS, "previous_text": previous[-1000:] or None},
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(6400):
                yield chunk


async def relay(browser, upstream_url, day, origin):
    send_lock = asyncio.Lock()
    current_speech = None
    playback_id = 0
    previous_text = ""
    pending = asyncio.Queue(maxsize=4)

    async def send(event):
        async with send_lock:
            await browser.send_json(event)

    async def cancel_speech():
        nonlocal current_speech
        while not pending.empty():
            pending.get_nowait()
        task = current_speech
        if task:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
            if current_speech is task:
                current_speech = None

    async def speak(text, event_id):
        nonlocal previous_text
        async for chunk in synthesize(text, previous_text):
            await send({"type": "audio", "audio_event": {
                "audio_base_64": base64.b64encode(chunk).decode(), "event_id": event_id}})
        previous_text = text

    async def playback():
        nonlocal current_speech
        while True:
            text, event_id = await pending.get()
            current_speech = asyncio.create_task(speak(text, event_id))
            try:
                await current_speech
            except asyncio.CancelledError:
                if asyncio.current_task().cancelling():
                    raise
            finally:
                current_speech = None

    async with websockets.connect(upstream_url, origin=origin, max_size=8 * 1024 * 1024) as upstream:
        async def listen():
            initial = True
            while True:
                raw = await browser.receive_text()
                if len(raw) > 65536:
                    raise ValueError("Client frame too large")
                event = json.loads(raw)
                if initial:
                    if event.get("type") != "conversation_initiation_client_data":
                        raise ValueError("Missing initiation")
                    initial = False
                    variables = event.setdefault("dynamic_variables", {})
                    variables["challenge_day"] = day
                    # No client voice/model/text-only overrides on this fixed English route.
                    event.pop("conversation_config_override", None)
                elif event.get("type") == "conversation_initiation_client_data":
                    raise ValueError("Duplicate initiation")
                await upstream.send(json.dumps(event))

        async def receive():
            nonlocal playback_id
            async for raw in upstream:
                event = json.loads(raw)
                kind = event.get("type")
                if kind == "audio":
                    continue
                if kind == "conversation_initiation_metadata":
                    event["conversation_initiation_metadata_event"]["agent_output_audio_format"] = "pcm_16000"
                if kind == "interruption":
                    await cancel_speech()
                    # Our audio can arrive at different times from discarded native audio.
                    # Use our sequence so the SDK drops old audio, never the next reply.
                    event["interruption_event"]["event_id"] = playback_id
                await send(event)
                if kind == "agent_response":
                    text = event["agent_response_event"]["agent_response"]
                    if not isinstance(text, str) or len(text) > 12000:
                        raise ValueError("Invalid agent response")
                    playback_id += 1
                    pending.put_nowait((text, playback_id))

        tasks = [asyncio.create_task(fn()) for fn in (listen, receive, playback)]
        try:
            done, _ = await asyncio.wait(tasks, timeout=600, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                task.result()
        finally:
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
            await cancel_speech()
