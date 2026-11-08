"""Production signing and challenge tools for 7 Days to Calm."""
import hmac
import logging
import os
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Optional
from urllib.parse import urlparse
from uuid import uuid4

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).with_name('.env'))
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('em-backend')
DEFAULT_ORIGINS = [
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:3001', 'http://127.0.0.1:3001',
    'http://localhost:3003', 'http://127.0.0.1:3003',
    'https://7-days-to-calm.vercel.app', 'https://7dtc.elevatedmovements.com',
    'https://7-days-to-calm.elevatedmovements.com',
    'https://elevatedmovements.com', 'https://www.elevatedmovements.com',
]
ALLOW_ORIGINS = [x.strip() for x in os.getenv('CORS_ALLOWLIST', ','.join(DEFAULT_ORIGINS)).split(',') if x.strip()]
app = FastAPI(title='7 Days to Calm API')
app.add_middleware(CORSMiddleware, allow_origins=ALLOW_ORIGINS,
                   allow_credentials=False, allow_methods=['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
                   allow_headers=['*'], expose_headers=['X-Request-ID'])
Day = Annotated[int, Query(ge=1, le=7)]

def now():
    return datetime.now(timezone.utc).isoformat()

def agent_id():
    return (os.getenv('AGENT_ID') or os.getenv('ELEVENLABS_AGENT_ID') or '').strip()

def missing_env():
    missing = []
    if not os.getenv('ELEVENLABS_API_KEY', '').strip():
        missing.append('ELEVENLABS_API_KEY')
    if not agent_id():
        missing.append('AGENT_ID')
    return missing

@app.get('/health')
def health():
    missing = missing_env()
    return {'status': 'healthy', 'ready': not missing, 'timestamp': now(),
            'agent_configured': bool(agent_id()),
            'api_key_configured': 'ELEVENLABS_API_KEY' not in missing, 'missing_env': missing}

def _signed_url():
    # Supported method in the pinned SDK. Day context belongs in initiation data.
    client = ElevenLabs(api_key=os.environ['ELEVENLABS_API_KEY'].strip(), timeout=20)
    result = client.conversational_ai.conversations.get_signed_url(agent_id=agent_id())
    signed_url = result.signed_url
    parsed = urlparse(signed_url)
    if parsed.scheme != 'wss' or not parsed.hostname or not parsed.hostname.endswith('.elevenlabs.io'):
        raise ValueError('Invalid provider response')
    return signed_url

@app.get('/convai/signed-url')
def get_signed_url(response: Response, request: Request, challenge_day: Day = 1):
    request_id = uuid4().hex
    headers = {'Cache-Control': 'no-store', 'X-Request-ID': request_id}
    origin = request.headers.get('origin')
    if origin and origin not in ALLOW_ORIGINS:
        raise HTTPException(403, detail='Origin not allowed', headers=headers)
    missing = missing_env()
    if missing:
        logger.error('signing unavailable request_id=%s missing_env=%s', request_id, ','.join(missing))
        raise HTTPException(503, detail='Voice guide is not configured. Contact the site administrator.', headers=headers)
    try:
        signed_url = _signed_url()
    except Exception as exc:
        # Raw provider exception messages can contain keys or signed URLs.
        frames = traceback.extract_tb(exc.__traceback__)
        location = ' > '.join(f'{Path(f.filename).name}:{f.lineno}:{f.name}' for f in frames)
        body = getattr(exc, 'body', {})
        detail = body.get('detail', {}) if isinstance(body, dict) else {}
        code = detail.get('code') if isinstance(detail, dict) else None
        safe_code = code if code in {'invalid_api_key', 'insufficient_permissions', 'agent_not_found', 'quota_exceeded'} else 'unclassified'
        logger.error('provider error request_id=%s code=%s', request_id, safe_code)
        logger.error('signing failed request_id=%s day=%s type=%s provider_status=%s trace=%s',
                     request_id, challenge_day, type(exc).__name__, getattr(exc, 'status_code', None), location)
        raise HTTPException(502, detail='Voice provider unavailable. Please try again.', headers=headers) from None
    response.headers.update(headers)
    logger.info('signed URL issued request_id=%s day=%s', request_id, challenge_day)
    return {'signed_url': signed_url, 'challenge_day': challenge_day}

@app.post('/tool/log-goal')
def log_goal(day: Day, completed: bool = True, authorization: Optional[str] = Header(None)):
    expected = os.getenv('TOOL_BEARER_TOKEN', '').strip()
    if expected and not hmac.compare_digest(authorization or '', f'Bearer {expected}'):
        raise HTTPException(401, detail='Invalid token')
    data = {'day': day, 'completed': completed, 'timestamp': now()}
    logger.info('goal logged day=%s completed=%s', day, completed)
    return {'success': True, 'message': f'Day {day} logged', 'data': data}

@app.post('/tts/closing')
def closing(day: Day):
    """Closing text contract; audio synthesis is not implemented."""
    return {'success': True, 'day': day,
            'message': f'Day {day} complete. Thank you for making time for calm.',
            'audio_url': None, 'audio_generated': False}
