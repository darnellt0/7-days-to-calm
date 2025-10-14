@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Elevated Movements - 7 Days to Calm
echo  Local Testing Script
echo ========================================
echo.

REM Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Install from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check for Node
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Install from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check environment files
if not exist "backend\.env" (
    echo [ERROR] backend/.env not found!
    echo Please copy backend/.env.example to backend/.env and fill in your API keys.
    pause
    exit /b 1
)

if not exist "frontend\.env.local" (
    echo [WARNING] frontend/.env.local not found!
    echo Creating from example...
    copy frontend\.env.local.example frontend\.env.local
)

echo [1/5] Checking backend dependencies...
cd backend
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)

call .venv\Scripts\activate
pip install -q -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
echo ✓ Backend dependencies ready
cd ..

echo.
echo [2/5] Checking frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
)
echo ✓ Frontend dependencies ready
cd ..

echo.
echo [3/5] Starting backend server...
start "EM Backend" cmd /k "cd backend && .venv\Scripts\activate && uvicorn main:app --reload --port 8787"
echo ✓ Backend starting at http://localhost:8787

timeout /t 3 /nobreak >nul

echo.
echo [4/5] Starting frontend server...
start "EM Frontend" cmd /k "cd frontend && npm run dev"
echo ✓ Frontend starting at http://localhost:3000

echo.
echo [5/5] Waiting for servers to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  Servers Running!
echo ========================================
echo.
echo Backend:  http://localhost:8787
echo Frontend: http://localhost:3000/7-days-to-calm
echo.
echo Backend API Docs: http://localhost:8787/docs
echo.
echo Press any key to open in browser...
pause >nul

start http://localhost:3000/7-days-to-calm

echo.
echo ========================================
echo  Testing Tips:
echo ========================================
echo.
echo 1. Check browser console (F12) for errors
echo 2. Verify widget loads without 401/403 errors
echo 3. Test Day 1 session start and completion
echo 4. Check localStorage for progress persistence
echo 5. Verify GTM events in preview mode
echo.
echo To stop servers: Close the terminal windows
echo.
pause
exit /b 0