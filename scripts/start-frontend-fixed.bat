@echo off
echo Starting 7 Days to Calm Frontend...
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%\..\em-frontend"

echo Frontend directory: %CD%
echo.

if not exist node_modules (
    echo ERROR: node_modules not found. Run setup-fixed.bat first.
    pause
    exit /b 1
)

echo Starting Next.js development server...
echo Frontend will be available at http://localhost:3000
echo Press Ctrl+C to stop
echo.
npm run dev