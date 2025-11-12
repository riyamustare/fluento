import os
import asyncio
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional
import json
from pathlib import Path
from rq import Queue
from redis import Redis
from fastapi import BackgroundTasks
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

# Load .env file manually
env_file = Path(__file__).parent.parent / '.env'
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                value = value.strip('"').strip("'")
                os.environ[key.strip()] = value

# Load environment variables from .env file or OS environment
ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

print(f"[STARTUP] ASSEMBLYAI_API_KEY loaded: {bool(ASSEMBLYAI_API_KEY)}")
print(f"[STARTUP] GEMINI_API_KEY loaded: {bool(GEMINI_API_KEY)}")

# Try to import Google AI SDK
try:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    GENAI_AVAILABLE = True
    print("[STARTUP] Google AI SDK (genai) available")
except ImportError:
    GENAI_AVAILABLE = False
    print("[STARTUP] Google AI SDK not available, will use httpx fallback")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def transcribe_with_assemblyai(file_bytes: bytes) -> Optional[str]:
    """Upload audio bytes to AssemblyAI and return the transcript text.
    
    If ASSEMBLYAI_API_KEY is not set, returns a placeholder transcript for testing.
    In production, ensure the API key is set in environment variables.
    """
    print(f"[TRANSCRIBE] Starting transcription. API Key present: {bool(ASSEMBLYAI_API_KEY)}")
    print(f"[TRANSCRIBE] Audio file size: {len(file_bytes)} bytes")
    
    if not ASSEMBLYAI_API_KEY:
        print("[TRANSCRIBE] No AssemblyAI API key found, using placeholder")
        # Return placeholder transcript for development/testing
        placeholder_transcripts = {
            'introduce': 'My name is John. I am a software engineer from California. I enjoy coding and hiking in my free time.',
            'hobby': 'I really enjoy painting in my free time. I started painting three years ago and now I paint almost every week. I love using watercolors because the colors are so vibrant.',
            'vacation': 'Last year I went to Japan for vacation. It was an amazing trip. I visited Tokyo and Kyoto and stayed in traditional ryokan hotels. I also climbed Mount Fuji which was challenging but rewarding.',
            'routine': 'My daily routine starts at six in the morning. I go for a jog, then have breakfast. I work from nine to five as a software engineer. In the evening I cook dinner and spend time with family.',
            'goals': 'My career goals are to become a technical leader in my company. I want to start my own company eventually. I also believe in continuous learning and self improvement.'
        }
        return placeholder_transcripts.get('introduce', 'I am practicing English speaking today.')

    headers = {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/json'
    }

    async with httpx.AsyncClient(timeout=60) as client:
        # Upload file to AssemblyAI (upload endpoint)
        upload_url = 'https://api.assemblyai.com/v2/upload'
        try:
            print(f"[TRANSCRIBE] Uploading audio to AssemblyAI...")
            upload_resp = await client.post(upload_url, headers={'authorization': ASSEMBLYAI_API_KEY}, content=file_bytes)
            upload_resp.raise_for_status()
            upload_json = upload_resp.json()
            audio_url = upload_json.get('upload_url') or upload_json.get('url')
            print(f"[TRANSCRIBE] Upload successful, audio URL: {audio_url[:50]}...")

            # Start transcription request
            print(f"[TRANSCRIBE] Starting transcription job (webhook-enabled)...")
            # Request AssemblyAI to process and callback to our webhook
            callback_url = os.environ.get('ASSEMBLYAI_CALLBACK_URL')
            body = {'audio_url': audio_url}
            if callback_url:
                body['webhook_url'] = callback_url

            transcript_req = await client.post(
                'https://api.assemblyai.com/v2/transcript',
                headers={'authorization': ASSEMBLYAI_API_KEY, 'content-type': 'application/json'},
                json=body
            )
            transcript_req.raise_for_status()
            job = transcript_req.json()
            transcript_id = job.get('id')
            print(f"[TRANSCRIBE] Job started with ID: {transcript_id}")

            # If webhook is configured, return the id and wait for callback flow
            if callback_url:
                print('[TRANSCRIBE] Webhook configured, returning transient id')
                return f'__webhook_pending__:{transcript_id}'

            # Fallback to polling if no webhook configured
            polling_url = f'https://api.assemblyai.com/v2/transcript/{transcript_id}'
            for attempt in range(60):
                status_resp = await client.get(polling_url, headers={'authorization': ASSEMBLYAI_API_KEY})
                status_resp.raise_for_status()
                data = status_resp.json()
                status = data.get('status')
                print(f"[TRANSCRIBE] Poll attempt {attempt+1}: status={status}")
                
                if status == 'completed':
                    transcript = data.get('text')
                    print(f"[TRANSCRIBE] Transcription complete: {transcript[:100]}...")
                    return transcript
                if status == 'error':
                    print(f"[TRANSCRIBE] Transcription error: {data.get('error')}")
                    return None
                await asyncio.sleep(1)
            
            print(f"[TRANSCRIBE] Timeout after 60 seconds")
            return None
            
        except Exception as e:
            print(f"[TRANSCRIBE] AssemblyAI transcription error: {e}")
            import traceback
            traceback.print_exc()
            return None

    return None


async def analyze_with_gemini(transcript: str, topic: str, mode: str = 'speak') -> dict:
    """Send transcript and topic to Gemini API and get analysis.
    
    Args:
        transcript: The user's spoken text
        topic: The speaking level topic (e.g., "Introduce yourself")
        mode: 'speak' for free speaking, 'read' for reading mode
    
    Returns:
        Dict with grammar_score, vocabulary_score, fluency_score, topic_relevance_score, feedback, transcript
    """
    print(f"[GEMINI] Starting analysis. API Key present: {bool(GEMINI_API_KEY)}, Mode: {mode}")
    print(f"[GEMINI] Transcript: {transcript[:100]}...")
    print(f"[GEMINI] Topic: {topic}")
    
    if not GEMINI_API_KEY:
        print("[GEMINI] No Gemini API key found, using fallback heuristic")
        # Fallback to heuristic if no API key
        avg_len = len(transcript.split())
        grammar_score = min(10.0, max(3.0, 7.0 + (avg_len - 30) / 50))
        vocabulary_score = min(10.0, max(3.0, 6.0 + (avg_len - 20) / 60))
        fluency_score = min(10.0, max(3.0, 6.5 + (avg_len - 25) / 80))
        topic_relevance_score = 8.0 if topic.lower() in transcript.lower() else 6.0
        return {
            'grammar_score': round(grammar_score, 1),
            'vocabulary_score': round(vocabulary_score, 1),
            'fluency_score': round(fluency_score, 1),
            'topic_relevance_score': round(topic_relevance_score, 1),
            'feedback': "Analysis unavailable: Gemini API key not configured.",
            'transcript': transcript,
        }
    
    try:
        # Try using Google AI SDK first (if available)
        if GENAI_AVAILABLE:
            print("[GEMINI] Using Google AI SDK (genai)")
            import google.generativeai as genai
            
            if mode == 'read':
                focus = "focus on pronunciation, pacing, clarity, and how naturally the text was read"
            else:
                focus = "evaluate natural speaking ability, spontaneity, and conversational flow"
            
            prompt = f"""Analyze this English speaking sample and provide structured feedback.

Topic: {topic}
Transcript: "{transcript}"

Evaluate this speech on the following criteria and respond with ONLY valid JSON (no markdown, no code blocks):
{{
    "grammar_score": <number 1-10>,
    "vocabulary_score": <number 1-10>,
    "fluency_score": <number 1-10>,
    "topic_relevance_score": <number 1-10>,
    "feedback": "<2-3 sentence specific feedback about grammar, vocabulary, fluency, and {focus}>"
}}

Scoring guidelines:
- Grammar (1-10): Correct sentence structure, tense, articles, prepositions. 1=Many errors, 10=Perfect
- Vocabulary (1-10): Range of words, word choice appropriateness. 1=Very limited, 10=Excellent range
- Fluency (1-10): Smooth delivery, natural pace, minimal hesitations. 1=Very choppy, 10=Native-like
- Topic Relevance (1-10): How well the response addresses the topic. 1=Off-topic, 10=Perfectly on-topic

Respond ONLY with the JSON object, nothing else."""

            model = genai.GenerativeModel('gemini-2.5-flash')
            print(f"[GEMINI] Sending request to Gemini 2.5 Flash model (no streaming)...")
            response = model.generate_content(prompt, stream=False)
            text_content = response.text
            print(f"[GEMINI] Response received (complete): {text_content[:300]}...")
            
            # Clean up response (remove markdown code blocks if present)
            text_content = text_content.strip()
            if text_content.startswith('```'):
                text_content = text_content.split('```')[1]
                if text_content.startswith('json'):
                    text_content = text_content[4:]
            text_content = text_content.strip()
            
            # Parse JSON
            print(f"[GEMINI] Parsing JSON...")
            analysis = json.loads(text_content)
            print(f"[GEMINI] Parsed analysis: {analysis}")
            
            # Ensure scores are valid numbers between 1-10
            analysis['grammar_score'] = max(1, min(10, float(analysis.get('grammar_score', 5))))
            analysis['vocabulary_score'] = max(1, min(10, float(analysis.get('vocabulary_score', 5))))
            analysis['fluency_score'] = max(1, min(10, float(analysis.get('fluency_score', 5))))
            analysis['topic_relevance_score'] = max(1, min(10, float(analysis.get('topic_relevance_score', 5))))
            
            analysis['transcript'] = transcript
            
            print(f"[GEMINI] Final analysis: {analysis}")
            return analysis
        
        else:
            # Fallback to httpx with correct endpoint
            print("[GEMINI] Using httpx with Gemini API")
            async with httpx.AsyncClient(timeout=30) as client:
                url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}'
                
                if mode == 'read':
                    focus = "focus on pronunciation, pacing, clarity, and how naturally the text was read"
                else:
                    focus = "evaluate natural speaking ability, spontaneity, and conversational flow"
                
                prompt = f"""Analyze this English speaking sample and provide structured feedback.

Topic: {topic}
Transcript: "{transcript}"

Evaluate this speech on the following criteria and respond with ONLY valid JSON (no markdown, no code blocks):
{{
    "grammar_score": <number 1-10>,
    "vocabulary_score": <number 1-10>,
    "fluency_score": <number 1-10>,
    "topic_relevance_score": <number 1-10>,
    "feedback": "<2-3 sentence specific feedback about grammar, vocabulary, fluency, and {focus}>"
}}

Scoring guidelines:
- Grammar (1-10): Correct sentence structure, tense, articles, prepositions. 1=Many errors, 10=Perfect
- Vocabulary (1-10): Range of words, word choice appropriateness. 1=Very limited, 10=Excellent range
- Fluency (1-10): Smooth delivery, natural pace, minimal hesitations. 1=Very choppy, 10=Native-like
- Topic Relevance (1-10): How well the response addresses the topic. 1=Off-topic, 10=Perfectly on-topic

Respond ONLY with the JSON object, nothing else."""

                payload = {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                }
                
                print(f"[GEMINI] Sending request to {url[:60]}...")
                response = await client.post(url, json=payload)
                response.raise_for_status()
                result = response.json()
                print(f"[GEMINI] Response received: {str(result)[:200]}...")
                
                if result.get('candidates') and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        text_content = candidate['content']['parts'][0].get('text', '{}')
                        print(f"[GEMINI] Raw text content: {text_content[:200]}...")
                        
                        text_content = text_content.strip()
                        if text_content.startswith('```'):
                            text_content = text_content.split('```')[1]
                            if text_content.startswith('json'):
                                text_content = text_content[4:]
                        text_content = text_content.strip()
                        
                        print(f"[GEMINI] Parsing JSON...")
                        analysis = json.loads(text_content)
                        print(f"[GEMINI] Parsed analysis: {analysis}")
                        
                        analysis['grammar_score'] = max(1, min(10, float(analysis.get('grammar_score', 5))))
                        analysis['vocabulary_score'] = max(1, min(10, float(analysis.get('vocabulary_score', 5))))
                        analysis['fluency_score'] = max(1, min(10, float(analysis.get('fluency_score', 5))))
                        analysis['topic_relevance_score'] = max(1, min(10, float(analysis.get('topic_relevance_score', 5))))
                        
                        analysis['transcript'] = transcript
                        
                        print(f"[GEMINI] Final analysis: {analysis}")
                        return analysis
                
                print(f"[GEMINI] Unexpected response: {result}")
                return {
                    'grammar_score': 5.0,
                    'vocabulary_score': 5.0,
                    'fluency_score': 5.0,
                    'topic_relevance_score': 5.0,
                    'feedback': 'Unable to analyze speech at this time. Please try again.',
                    'transcript': transcript,
                }
            
    except json.JSONDecodeError as e:
        print(f"[GEMINI] JSON parsing error: {e}")
        return {
            'grammar_score': 5.0,
            'vocabulary_score': 5.0,
            'fluency_score': 5.0,
            'topic_relevance_score': 5.0,
            'feedback': 'Error parsing analysis. Please try again.',
            'transcript': transcript,
        }
    except Exception as e:
        print(f"[GEMINI] Error calling Gemini API: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'grammar_score': 5.0,
            'vocabulary_score': 5.0,
            'fluency_score': 5.0,
            'topic_relevance_score': 5.0,
            'feedback': f'Analysis error: {str(e)}',
            'transcript': transcript,
        }


@app.post('/api/analyze_speech/')
async def analyze_speech(audio: UploadFile = File(...), topic: str = Form(...)):
    try:
        content = await audio.read()
        if not content:
            return JSONResponse({'detail': 'No audio file received'}, status_code=400)
        
        transcript = await transcribe_with_assemblyai(content)
        if not transcript:
            return JSONResponse(
                {'detail': 'Transcription failed. Please check AssemblyAI API key.'}, 
                status_code=500
            )

        analysis = await analyze_with_gemini(transcript, topic, mode='speak')
        return JSONResponse(analysis)
    except Exception as e:
        print(f"Error in analyze_speech: {str(e)}")
        return JSONResponse(
            {'detail': f'Error processing audio: {str(e)}'}, 
            status_code=500
        )


@app.post('/api/analyze_reading/')
async def analyze_reading(audio: UploadFile = File(...), topic: str = Form(...)):
    try:
        content = await audio.read()
        if not content:
            return JSONResponse({'detail': 'No audio file received'}, status_code=400)
        
        transcript = await transcribe_with_assemblyai(content)
        if not transcript:
            return JSONResponse(
                {'detail': 'Transcription failed. Please check AssemblyAI API key.'}, 
                status_code=500
            )

        analysis = await analyze_with_gemini(transcript, topic, mode='read')
        # Emphasize pronunciation / tone in feedback (already in Gemini prompt)
        return JSONResponse(analysis)
    except Exception as e:
        print(f"Error in analyze_reading: {str(e)}")
        return JSONResponse(
            {'detail': f'Error processing audio: {str(e)}'}, 
            status_code=500
        )


@app.post('/api/queue_job/')
async def queue_job(audio: UploadFile = File(...), topic: str = Form(...), mode: str = Form('speak')):
    """Enqueue audio transcription + analysis as background job using RQ/Redis."""
    try:
        content = await audio.read()
        if not content:
            return JSONResponse({'detail': 'No audio file received'}, status_code=400)

        # Connect to Redis (REDIS_URL env var)
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_conn = Redis.from_url(redis_url)
        q = Queue('default', connection=redis_conn)

        # Enqueue the job - use the tasks module to keep implementation single-sourced
        from .tasks import transcribe_and_analyze
        job = q.enqueue(transcribe_and_analyze, content, topic, mode)

        return JSONResponse({'job_id': job.get_id()}, status_code=202)
    except Exception as e:
        print('Error enqueueing job:', e)
        return JSONResponse({'detail': str(e)}, status_code=500)


@app.get('/api/job_status/{job_id}')
def job_status(job_id: str):
    try:
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_conn = Redis.from_url(redis_url)
        q = Queue('default', connection=redis_conn)
        job = q.fetch_job(job_id)
        if not job:
            return JSONResponse({'status': 'not_found'}, status_code=404)
        data = {
            'id': job.get_id(),
            'status': job.get_status(),
            'result': job.result if job.is_finished else None,
            'exc_info': job.exc_info if job.is_failed else None,
        }
        return JSONResponse(data)
    except Exception as e:
        print('Error fetching job status:', e)
        return JSONResponse({'detail': str(e)}, status_code=500)


# AssemblyAI webhook receiver: AssemblyAI will POST the transcript result here
@app.post('/api/assemblyai_callback/')
async def assemblyai_callback(payload: dict):
    """Handle AssemblyAI webhook callbacks. Payload follows AssemblyAI webhook structure."""
    print('[WEBHOOK] Received AssemblyAI callback')
    try:
        # Minimal handling: log and store to temp file or forward to queue result store
        # Example payload contains 'id' and 'status' and 'text' when done
        job_id = payload.get('id')
        status = payload.get('status')
        text = payload.get('text')
        print(f'[WEBHOOK] id={job_id} status={status} text_len={len(text) if text else 0}')
        # Store to a simple Redis key so workers or HTTP endpoints can read it
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_conn = Redis.from_url(redis_url)
        key = f'assemblyai:result:{job_id}'
        redis_conn.set(key, json.dumps(payload), ex=60*60)
        return JSONResponse({'ok': True})
    except Exception as e:
        print('[WEBHOOK] Error handling callback:', e)
        return JSONResponse({'error': str(e)}, status_code=500)


# Prometheus metrics
REQUEST_COUNTER = Counter('s2s_requests_total', 'Total requests received')
JOB_DURATION = Histogram('s2s_job_duration_seconds', 'Time taken for jobs')

@app.get('/metrics')
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
