import os
import json
from rq import Queue
from redis import Redis
from time import sleep

# Setup Redis connection (use REDIS_URL env var or default to localhost)
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
redis_conn = Redis.from_url(redis_url)
q = Queue('default', connection=redis_conn)

# Dummy wrapper functions that will be enqueued. These should call the same
# internal functions used by your FastAPI endpoints (transcribe/analyze).

def transcribe_and_analyze(audio_bytes: bytes, topic: str, mode: str = 'speak'):
    """Background job to transcribe audio and analyze using external APIs.

    This imports local functions to keep consistency with main service logic.
    """
    try:
        # Import here to avoid circular imports at module import time
        from .main import transcribe_with_assemblyai, analyze_with_gemini

        # Run the async functions using a fresh event loop in the worker process
        try:
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            transcript = loop.run_until_complete(transcribe_with_assemblyai(audio_bytes))
            if not transcript:
                return {'error': 'transcription_failed'}

            # If webhook mode was used, transcribe_with_assemblyai returns
            # a special marker: '__webhook_pending__:<assemblyai_id>'. In that
            # case wait for the webhook handler to store the result in Redis.
            if isinstance(transcript, str) and transcript.startswith('__webhook_pending__:'):
                _, aid = transcript.split(':', 1)
                key = f'assemblyai:result:{aid}'
                # wait up to 120 seconds for webhook to populate
                waited = 0
                final_payload = None
                while waited < 120:
                    raw = redis_conn.get(key)
                    if raw:
                        try:
                            final_payload = json.loads(raw)
                            break
                        except Exception:
                            final_payload = None
                            break
                    sleep(1)
                    waited += 1
                if not final_payload:
                    return {'error': 'transcription_webhook_timeout'}
                transcript = final_payload.get('text') or ''
                if not transcript:
                    return {'error': 'transcription_empty_after_webhook'}
            analysis = loop.run_until_complete(analyze_with_gemini(transcript, topic, mode))
            return analysis
        except Exception as e:
            return {'error': str(e)}
    except Exception as e:
        return {'error': str(e)}


def enqueue_transcription(audio_bytes: bytes, topic: str, mode: str = 'speak'):
    """Enqueue a transcription+analysis job and return job id"""
    job = q.enqueue(transcribe_and_analyze, audio_bytes, topic, mode)
    return job.get_id()