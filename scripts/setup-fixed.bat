@echo off
echo ========================================
echo 7 Days to Calm - Setup Script (Fixed)
echo ========================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%\.."

echo Current directory: %CD%
echo.

echo [1/4] Setting up Python backend...
cd em-backend
if not exist requirements.txt (
    echo ERROR: requirements.txt not found in %CD%
    pause
    exit /b 1
)

python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
if not exist .env (
    copy .env.example .env
)
cd ..
echo Backend setup complete!
echo.

echo [2/4] Setting up Node.js frontend...
cd em-frontend
if not exist package.json (
    echo ERROR: package.json not found in %CD%
    pause
    exit /b 1
)

call npm install
if not exist .env.local (
    copy .env.local.example .env.local
)
cd ..
echo Frontend setup complete!
echo.

echo [3/4] Setup complete!
echo.
echo Next steps:
echo 1. Edit em-backend\.env with your API keys
echo 2. Edit em-frontend\.env.local with your backend URL
echo 3. Run scripts\start-backend.bat to start the backend
echo 4. Run scripts\start-frontend.bat to start the frontend
echo.
pause