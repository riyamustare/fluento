# Fluento - AI-Powered English Speaking Practice Platform

An intelligent language learning platform that provides real-time feedback on English speaking and reading exercises using AI-powered speech analysis. Users can record themselves speaking on various topics, receive instant feedback on grammar, vocabulary, fluency, and topic relevance.

---

## 📋 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [System Components](#system-components)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Development Setup](#development-setup)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                         │
│  React + Vite + Tailwind CSS (fluentoai.vercel.app)            │
│  - User authentication & registration                           │
│  - Level selection & progress tracking                          │
│  - Audio recording (Continue/Read modes)                        │
│  - Real-time feedback display                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND API (Django REST - Render)                  │
│         fluento-backend.onrender.com                             │
│  - User authentication (JWT)                                    │
│  - Level management & progression                               │
│  - Feedback storage & history                                   │
│  - User progress tracking                                       │
└────────────┬──────────────────────────────────────┬─────────────┘
             │                                      │
             ▼                                      ▼
    ┌──────────────────┐         ┌─────────────────────────┐
    │  PostgreSQL DB   │         │ AI Analysis Service     │
    │  (Render)        │         │ (FastAPI - Render)      │
    │  - Users         │         │ fluento-ai-api.onrender │
    │  - Levels        │         │  - Speech recognition   │
    │  - Feedback      │         │  - AI analysis          │
    └──────────────────┘         └───────┬────────────┬────┘
                                         │            │
                                         ▼            ▼
                            ┌──────────────────┐  ┌─────────────┐
                            │  AssemblyAI API  │  │  Gemini API │
                            │  (Transcription) │  │  (Analysis) │
                            └──────────────────┘  └─────────────┘
```

### Data Flow - Exercise Completion

```
User Records Audio
        │
        ├─→ [Frontend] Sends audio blob to FastAPI
        │
        ├─→ [FastAPI] Receives audio file
        │   ├─→ Upload to AssemblyAI
        │   ├─→ Poll for transcription (up to 120 attempts, 2 min timeout)
        │   ├─→ Send transcript + topic to Gemini API
        │   ├─→ Receive scored feedback (grammar, vocab, fluency, relevance)
        │   └─→ Return analysis to frontend
        │
        ├─→ [Frontend] Displays results on ResultsPage
        │   ├─→ Shows scores (1-10 scale)
        │   ├─→ Shows Gemini feedback
        │   ├─→ Calculates XP earned
        │
        └─→ [Frontend] Submits feedback to Django backend
            ├─→ Save to Feedback table
            ├─→ Update user XP
            ├─→ Update completed_levels list
            └─→ Update user progress
```

---

## Technology Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Deployment**: Vercel

### Backend - Django REST API
- **Framework**: Django 4.2
- **API Framework**: Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: PostgreSQL
- **ORM**: Django ORM
- **Server**: Gunicorn
- **Static Files**: WhiteNoise
- **Deployment**: Render

### Backend - FastAPI AI Service
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Async**: asyncio, httpx
- **External APIs**:
  - **AssemblyAI**: Speech-to-text transcription
  - **Google Gemini**: AI-powered feedback analysis
- **Deployment**: Render

### Infrastructure
- **Database**: PostgreSQL (Render)
- **Cache/Queue**: Redis (Render)
- **Container**: Docker (optional, for local development)
- **Deployment**: Render (backend) + Vercel (frontend)
- **Monitoring**: Prometheus metrics

---

## System Components

### 1. Frontend (React + Vite)

#### Key Features
- **Authentication**: Login/Signup with JWT tokens stored in localStorage
- **Level Dashboard**: Shows all 21 levels with unlock progression
- **Exercise Modes**:
  - **Continue Mode**: Free speaking about a topic
  - **Read Mode**: Read provided text (teleprompter style)
- **Audio Recording**: Web Audio API for recording user speech
- **Progress Tracking**: XP system and completed levels tracking

#### Key Files
```
frontend/
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication state
│   │   └── ProgressContext.jsx     # Level & progress state
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── LevelsDashboard.jsx     # Main level selection
│   │   ├── LevelDetailPage.jsx     # Exercise interface
│   │   └── ResultsPage.jsx         # Feedback display
│   ├── components/
│   │   ├── Recorder.jsx            # Audio recording component
│   │   ├── Teleprompter.jsx        # Text display for read mode
│   │   └── FeedbackCard.jsx        # Result display
│   └── utils/
│       └── api.js                  # API client with interceptors
├── index.html                      # Tailwind entry point
└── vite.config.js
```

#### State Management
```javascript
// AuthContext: user, loading, error, signup(), login(), logout()
// ProgressContext: levels, userProgress, fetchLevels(), fetchUserProgress(), isLevelUnlocked()
```

### 2. Django Backend (REST API)

#### Database Schema
```
CustomUser
├── username (unique)
├── email (unique)
├── password (hashed)
├── first_name
├── last_name
├── xp (int, default 0)
├── completed_levels (JSON list)
└── language (English/German)

Level
├── id (primary key)
├── topic (char)
├── difficulty (int 1-10)
├── text (English text for read mode)
└── text_german (German text for read mode)

Feedback
├── id (primary key)
├── user (FK to CustomUser)
├── level (FK to Level)
├── transcript (text)
├── grammar_score (float 1-10)
├── vocabulary_score (float 1-10)
├── fluency_score (float 1-10)
├── topic_relevance_score (float 1-10)
├── feedback_text (text, from Gemini)
└── created_at (timestamp)
```

#### API Endpoints

**Authentication**
- `POST /api/signup/` - Register new user
- `POST /api/login/` - Login with email/password
- `GET /api/health/` - Health check

**Levels**
- `GET /api/levels/` - Get all levels (authenticated)
- `GET /api/levels/{id}/` - Get specific level (authenticated)
- `GET /api/user_progress/` - Get user progress/XP (authenticated)

**Feedback**
- `POST /api/save_feedback/` - Save exercise feedback (authenticated)
- `GET /api/feedback/{level_id}/` - Get feedback history (authenticated)

#### Key Files
```
backend/
├── app/
│   ├── models.py              # CustomUser, Level, Feedback
│   ├── serializers.py         # DRF serializers
│   ├── views.py               # API views
│   ├── urls.py                # URL routing
│   └── management/
│       └── commands/
│           └── create_levels.py   # Bootstrap 21 levels
├── core/
│   ├── settings.py            # Django configuration
│   ├── urls.py                # Root URL config
│   └── wsgi.py                # WSGI entry point
└── requirements.txt
```

### 3. FastAPI AI Service

#### Speech Analysis Pipeline

```
Audio Input (WebM/MP3)
        │
        ├─→ Upload to AssemblyAI (/v2/upload)
        │
        ├─→ Submit for transcription (/v2/transcript)
        │   └─→ Returns job ID
        │
        ├─→ Poll for completion (120 attempts, every 1-2 sec)
        │   └─→ Status: processing → completed
        │
        ├─→ Get transcript text
        │
        ├─→ Send to Gemini with structured prompt
        │   ├─→ Scores on 4 dimensions
        │   └─→ Generate 2-3 sentence feedback
        │
        └─→ Return JSON with all scores & feedback
```

#### Gemini Analysis Prompt
```
Analyze English speaking sample for:
- Grammar Score (1-10): Sentence structure, tense, articles
- Vocabulary Score (1-10): Range & appropriateness of words
- Fluency Score (1-10): Smooth delivery, natural pace
- Topic Relevance (1-10): How well response addresses topic
- Feedback (2-3 sentences): Specific, actionable feedback
```

#### Key Files
```
backend/fastapi_service/
├── main.py
│   ├── transcribe_with_assemblyai()  # Handles transcription
│   ├── analyze_with_gemini()         # Handles AI analysis
│   ├── @app.post('/api/analyze_speech/')
│   └── @app.post('/api/analyze_reading/')
├── tasks.py                          # RQ background jobs
└── worker-start.sh                   # Worker startup script
```

#### Error Handling & Fallbacks
- **No AssemblyAI key**: Returns placeholder transcripts (development mode)
- **No Gemini key**: Uses heuristic scoring based on word count
- **Transcription timeout**: Returns 500 error after 2 minutes
- **CORS**: Configured for Vercel domains with regex pattern

---

## Deployment

### Production URLs
- **Frontend**: https://fluentoai.vercel.app
- **Backend API**: https://fluento-backend.onrender.com/api
- **FastAPI**: https://fluento-ai-api.onrender.com/api

### Render Configuration (render.yaml)

**Database (PostgreSQL)**
- Free tier, Oregon region
- Automatic backups
- Connected to Django backend via `DATABASE_URL`

**Redis**
- Free tier for caching & queuing
- Connected via `REDIS_URL`

**Django Backend Service**
- Runtime: Python 3.11
- Build: `pip install && migrate && create_levels && collectstatic`
- Start: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2`
- Auto-redeploy on git push to main

**FastAPI AI Service**
- Runtime: Python 3.11
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
- Health check: `/health` endpoint
- Timeout: 180 seconds (to allow for long transcription/analysis)

### Vercel Configuration (frontend/vercel.json)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "env": {
    "VITE_API_URL": "https://fluento-backend.onrender.com/api",
    "VITE_FASTAPI_URL": "https://fluento-ai-api.onrender.com/api"
  }
}
```

---

## Environment Variables

### Backend (Django) - Render

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | ✅ | `postgres://...` | PostgreSQL connection |
| `DJANGO_SECRET_KEY` | ✅ | Random 50 chars | Django security |
| `DJANGO_DEBUG` | ✅ | `False` | Disable debug mode |
| `DJANGO_ALLOWED_HOSTS` | ✅ | `.onrender.com` | Allowed domains |
| `REDIS_URL` | ✅ | `redis://...` | Redis connection |
| `CORS_ALLOWED_ORIGINS` | ✅ | `https://fluentoai.vercel.app` | CORS whitelist |
| `ASSEMBLYAI_API_KEY` | ❌ | `aai_...` | Speech-to-text API |
| `GEMINI_API_KEY` | ❌ | `AIza...` | AI analysis API |

### FastAPI - Render

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `REDIS_URL` | ✅ | `redis://...` | Redis connection |
| `ASSEMBLYAI_API_KEY` | ❌ | `aai_...` | Speech-to-text API |
| `GEMINI_API_KEY` | ❌ | `AIza...` | AI analysis API |

### Frontend (React) - Vercel

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `VITE_API_URL` | ✅ | `https://fluento-backend.onrender.com/api` | Django API URL |
| `VITE_FASTAPI_URL` | ✅ | `https://fluento-ai-api.onrender.com/api` | FastAPI URL |

---

## API Reference

### Authentication Endpoints

#### Sign Up
```http
POST /api/signup/
Content-Type: application/json

{
  "first_name": "John",
  "email": "john@example.com",
  "password": "secure_password",
  "language": "English"
}

Response 201:
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "xp": 0,
    "completed_levels": [],
    "language": "English"
  }
}
```

#### Log In
```http
POST /api/login/
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}

Response 200: Same as signup
```

### Level Endpoints

#### Get All Levels
```http
GET /api/levels/
Authorization: Bearer {access_token}

Response 200:
[
  {
    "id": 1,
    "topic": "Introduce yourself",
    "difficulty": 1,
    "text": "Hello, my name is Emma...",
    "text_german": "Hallo, mein Name ist Emma..."
  },
  ...
]
```

#### Get User Progress
```http
GET /api/user_progress/
Authorization: Bearer {access_token}

Response 200:
{
  "total_xp": 150,
  "completed_levels": [1, 2, 3]
}
```

### AI Analysis Endpoints

#### Analyze Speech
```http
POST /api/analyze_speech/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Form Data:
- audio: <audio file (webm/mp3)>
- topic: "Introduce yourself"

Response 200:
{
  "grammar_score": 8.5,
  "vocabulary_score": 7.8,
  "fluency_score": 8.2,
  "topic_relevance_score": 9.0,
  "feedback": "Good use of past tense. Consider varying your sentence structure more.",
  "transcript": "My name is John..."
}
```

#### Save Feedback
```http
POST /api/save_feedback/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "level_id": 1,
  "transcript": "My name is John...",
  "grammar_score": 8.5,
  "vocabulary_score": 7.8,
  "fluency_score": 8.2,
  "topic_relevance_score": 9.0,
  "feedback_text": "Good feedback..."
}

Response 201:
{
  "detail": "Feedback saved",
  "xp_earned": 20
}
```

---

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Docker (optional)

### Local Development

#### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with local settings

# Run migrations
python manage.py migrate

# Create initial levels
python manage.py create_levels

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

#### FastAPI Setup
```bash
cd backend/fastapi_service

# Dependencies already installed from backend/requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Access at http://localhost:5173
```

### Docker Compose (Full Stack)

```bash
docker-compose up

# Services will be available at:
# Django: http://localhost:8000
# FastAPI: http://localhost:8001
# Frontend: http://localhost:5173
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

---

## Key Features & Implementation Details

### 1. Authentication Flow
- Users sign up with email/name/password
- Password hashed with Django's PBKDF2
- JWT tokens (access + refresh) issued on signup/login
- Tokens stored in localStorage on frontend
- Token sent in `Authorization: Bearer` header for authenticated requests

### 2. Level Progression
- 21 levels total, increasing difficulty
- Level 1 unlocked by default
- Subsequent levels unlock when previous is completed
- Completion based on `completed_levels` JSON array in User model
- XP awarded on exercise completion (0-25 points)

### 3. Audio Recording
- Web Audio API with MediaRecorder
- Records in WebM format
- Max duration: 5 minutes per recording
- Real-time transcript display during recording

### 4. AI Analysis
- **Transcription**: AssemblyAI speech-to-text (polling mode, not webhooks)
- **Analysis**: Google Gemini API for scoring & feedback
- **Fallbacks**: Heuristic scoring if API keys not configured
- **Timeout**: 2 minutes max for entire transcription + analysis

### 5. CORS Configuration
- Django: Regex pattern allows all `*.vercel.app` domains
- FastAPI: Explicit list + regex pattern for Vercel domains
- Credentials enabled for session/token passing
- All necessary headers whitelisted

### 6. Error Handling
- Frontend displays user-friendly error messages
- Backend returns structured error responses
- FastAPI provides detailed logs for debugging
- Timeout handling for long-running transcription

---

## Performance Considerations

1. **API Polling**: AssemblyAI transcription uses polling (not webhooks) for reliability
2. **Timeout**: 120-second timeout for transcription + analysis to avoid Render free tier timeouts
3. **Frontend Caching**: Levels cached in ProgressContext to reduce API calls
4. **Database**: Connection pooling with `CONN_MAX_AGE = 600`
5. **Static Files**: Compressed with WhiteNoise for fast delivery

---

## Monitoring & Debugging

### Logs
- **Django**: `python manage.py runserver` shows request logs
- **FastAPI**: Console output shows [TRANSCRIBE], [GEMINI], [WEBHOOK] tags
- **Frontend**: Browser console shows [API] tags for network activity

### Health Checks
- Django: `GET /api/health/` returns service status
- FastAPI: `GET /health` returns API status with API key configuration

### Prometheus Metrics
- FastAPI exports metrics at `GET /metrics`
- Track request counts and job duration

---

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes across backend/frontend as needed
3. Test locally with `docker-compose`
4. Push and create pull request
5. Changes auto-deploy to Render/Vercel on merge to main

---

## License

Proprietary - Fluento 2025

---

## Support

For issues or questions:
- Check logs in Render dashboard
- Review API responses in browser network tab
- Ensure environment variables are correctly set
- Verify AssemblyAI & Gemini API keys are active

