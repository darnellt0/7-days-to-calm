@echo off
REM Deployment Helper Script
REM Guides through the deployment process with interactive prompts

echo ==========================================
echo Elevated Movements - Deployment Helper
echo ==========================================
echo.

REM Check if git is initialized
if not exist .git (
    echo ERROR: Git repository not initialized
    echo Please run init-git.bat first
    pause
    exit /b 1
)

echo This script will help you deploy your application
echo.
echo Prerequisites:
echo - GitHub account
echo - Render account (backend)
echo - Vercel account (frontend)
echo - ElevenLabs API key
echo.
pause

echo.
echo ==========================================
echo Step 1: Git Status Check
echo ==========================================
echo.

git status
echo.

choice /C YN /M "Do you want to commit current changes"
if not errorlevel 2 (
    set /p commit_msg="Enter commit message: "
    git add .
    git commit -m "!commit_msg!"
    echo Changes committed
)
echo.

echo ==========================================
echo Step 2: Push to GitHub
echo ==========================================
echo.

REM Check if remote exists
git remote -v | findstr origin >nul
if errorlevel 1 (
    echo No GitHub remote configured
    echo.
    echo Please follow these steps:
    echo 1. Go to https://github.com/new
    echo 2. Create a new repository named 'elevated-movements-7dtc'
    echo 3. Copy the repository URL
    echo.
    set /p repo_url="Paste your repository URL: "
    git remote add origin !repo_url!
    echo Remote added successfully
)
echo.

echo Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo Push failed. This might be because:
    echo - Remote already has different history
    echo - Authentication failed
    echo.
    echo Try: git push -u origin main --force
    echo WARNING: This will overwrite remote history
    echo.
    pause
)
echo.

echo ==========================================
echo Step 3: Backend Deployment (Render)
echo ==========================================
echo.

echo Please follow these steps manually:
echo.
echo 1. Go to https://render.com and log in
echo 2. Click 'New +' and select 'Web Service'
echo 3. Connect your GitHub repository
echo 4. Configure:
echo    - Name: elevated-movements-backend
echo    - Root Directory: em-backend
echo    - Runtime: Python 3
echo    - Build Command: pip install -r requirements.txt
echo    - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
echo 5. Add environment variables:
echo    - PYTHON_VERSION: 3.11.0
echo    - ELEVENLABS_API_KEY: (your key)
echo    - ELEVENLABS_AGENT_ID: agent_4201k708pqxsed39y0vsz05gn66e
echo    - CORS_ORIGINS: http://localhost:3000
echo 6. Click 'Create Web Service'
echo.
pause

echo.
set /p backend_url="Enter your Render backend URL (e.g., https://your-app.onrender.com): "
echo Backend URL saved: %backend_url%
echo.

echo ==========================================
echo Step 4: Frontend Deployment (Vercel)
echo ==========================================
echo.

echo Please follow these steps manually:
echo.
echo 1. Go to https://vercel.com and log in
echo 2. Click 'Add New...' then 'Project'
echo 3. Import your GitHub repository
echo 4. Configure:
echo    - Framework Preset: Next.js
echo    - Root Directory: em-frontend
echo 5. Add environment variable:
echo    - NEXT_PUBLIC_BACKEND_URL: %backend_url%
echo 6. Click 'Deploy'
echo.
pause

echo.
set /p frontend_url="Enter your Vercel frontend URL (e.g., https://your-app.vercel.app): "
echo Frontend URL saved: %frontend_url%
echo.

echo ==========================================
echo Step 5: Update CORS Settings
echo ==========================================
echo.

echo IMPORTANT: Update CORS_ORIGINS on Render
echo.
echo 1. Go to your Render service dashboard
echo 2. Navigate to 'Environment' tab
echo 3. Edit CORS_ORIGINS to: %frontend_url%,http://localhost:3000
echo 4. Save changes (Render will auto-redeploy)
echo.
pause

echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Your URLs:
echo - Frontend: %frontend_url%
echo - Backend: %backend_url%
echo.
echo Next steps:
echo 1. Test the health endpoint: %backend_url%/health
echo 2. Visit your frontend: %frontend_url%/7-days-to-calm
echo 3. Verify the widget loads correctly
echo.
echo For detailed instructions, see DEPLOYMENT.md
echo.

pause
