@echo off
echo Starting 7 Days to Calm Backend...
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%\..\em-backend"

echo Backend directory: %CD%
echo.

if not exist venv (
    echo ERROR: Virtual environment not found. Run setup-fixed.bat first.
    pause
    exit /b 1
)

call venv\Scripts\activate
echo Starting FastAPI server on http://localhost:8787
echo Press Ctrl+C to stop
echo.
python -m uvicorn main:app --reload --port 8787