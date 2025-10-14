# 7 Days to Calm - Elevated Movements

A guided mindfulness meditation challenge powered by ElevenLabs Conversational AI.

## 🌟 Features

- **7-Day Progressive Challenge**: Each day unlocks a new meditation practice
- **AI Voice Coach**: Shria guides users through personalized meditation sessions
- **Progress Tracking**: Visual progress bar with localStorage persistence
- **Analytics Integration**: Google Tag Manager and GA4 tracking
- **Audio Features**: Celebration chimes, TTS closing messages
- **Multi-Platform Logging**: Google Sheets and Notion integration

## 🏗️ Architecture

### Backend (FastAPI)
- `/convai/signed-url` - Generate ElevenLabs signed URLs
- `/tool/log-goal` - Log meditation completions
- `/tts/closing` - Generate TTS closing messages
- `/health` - Health check endpoint

### Frontend (Next.js 14)
- React components with TypeScript
- Tailwind CSS styling
- ElevenLabs ConvAI widget integration
- localStorage for progress persistence

## 🚀 Quick Start

### 1. Run Setup
```bash
cd scripts
setup.bat
```

### 2. Configure Environment Variables

**Backend (.env)**:
```
ELEVENLABS_API_KEY=your_key_here
AGENT_ID=agent_4201k708pqxsed39y0vsz05gn66e
JWT_SECRET=your-secret-key
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
```

### 3. Start Services

**Backend**:
```bash
cd scripts
start-backend.bat
```

**Frontend** (new terminal):
```bash
cd scripts
start-frontend.bat
```

### 4. Access the App
- Frontend: http://localhost:3000/7-days-to-calm
- Backend API: http://localhost:8787
- API Docs: http://localhost:8787/docs

## 📅 Daily Themes

1. **Day 1: Arrive** - 2-minute quick reset with breath + sound
2. **Day 2: Longer Exhale** - In 4 / Out 6 breath pattern
3. **Day 3: Body Scan** - Head to feet awareness
4. **Day 4: Label Thoughts** - Notice thinking patterns
5. **Day 5: Box Breathing** - 4-4-4-4 steady rhythm
6. **Day 6: Open Awareness** - Sounds, touch, breath
7. **Day 7: Integration** - Choose your favorite practice

## 🔧 Development

### Backend
```bash
cd em-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8787
```

### Frontend
```bash
cd em-frontend
npm install
npm run dev
```

## 📦 Deployment

### Quick Deploy (30 minutes)

**Prerequisites:**
- GitHub account
- Render.com account (backend hosting)
- Vercel account (frontend hosting)
- ElevenLabs API key

**Steps:**

```bash
# 1. Initialize Git and push to GitHub
./setup-git.sh
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main

# 2. Deploy backend to Render
./deploy-backend.sh
# Follow prompts to configure Render.com

# 3. Deploy frontend to Vercel
./deploy-frontend.sh
# Follow prompts to configure Vercel

# 4. Test deployment
./test-deployment.sh
```

### Detailed Instructions

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step guide including:
- Platform setup instructions
- Environment variable configuration
- Troubleshooting common issues
- Post-deployment verification

### Production Checklist

Use [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) for a printable deployment checklist.

### Platform Configuration

**Backend (Render.com):**
- Service: Web Service
- Runtime: Python 3.11
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Root Directory: `em-backend`
- Environment Variables:
  - `ELEVENLABS_API_KEY`
  - `ELEVENLABS_AGENT_ID`
  - `CORS_ORIGINS`
  - `ENVIRONMENT=production`

**Frontend (Vercel):**
- Framework: Next.js 14
- Root Directory: `em-frontend`
- Build: `npm run build`
- Output: `.next`
- Environment Variables:
  - `NEXT_PUBLIC_BACKEND_URL`

### Continuous Deployment

Both platforms auto-deploy when you push to `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## 🔐 Security Notes

- Never commit `.env` files
- Rotate API keys regularly
- Use strong JWT secrets
- Enable CORS only for trusted domains

## 📝 License

Copyright © 2025 Elevated Movements. All rights reserved.

## 🙏 Support

For questions or support, visit: https://www.elevatedmovements.com
