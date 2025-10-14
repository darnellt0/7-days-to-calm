@echo off
echo ========================================
echo 7 Days to Calm - Setup Script
echo ========================================
echo.

echo [1/4] Setting up Python backend...
cd em-backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
echo Backend setup complete!
echo.

echo [2/4] Setting up Node.js frontend...
cd ..\em-frontend
call npm install
copy .env.local.example .env.local
echo Frontend setup complete!
echo.

echo [3/4] Setup complete!
echo.
echo Next steps:
echo 1. Edit em-backend\.env with your API keys
echo 2. Edit em-frontend\.env.local with your backend URL
echo 3. Run 'start-backend.bat' to start the backend
echo 4. Run 'start-frontend.bat' to start the frontend
echo.
pause
