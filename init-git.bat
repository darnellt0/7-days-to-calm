@echo off
REM Git Initialization Script for Elevated Movements
REM This script initializes the git repository and prepares for first commit

echo ==========================================
echo Git Initialization Script
echo ==========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo [1/5] Checking current directory...
cd /d "%~dp0"
echo Current directory: %CD%
echo.

REM Check if already initialized
if exist .git (
    echo WARNING: Git repository already initialized
    echo.
    choice /C YN /M "Do you want to continue anyway? This might reset your repository"
    if errorlevel 2 exit /b 0
    echo.
)

echo [2/5] Initializing Git repository...
git init
if errorlevel 1 (
    echo ERROR: Failed to initialize git repository
    pause
    exit /b 1
)
echo Git repository initialized successfully
echo.

echo [3/5] Adding all files to staging area...
git add .
if errorlevel 1 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)
echo Files added successfully
echo.

echo [4/5] Creating initial commit...
git commit -m "Initial commit: 7 Days to Calm meditation app"
if errorlevel 1 (
    echo ERROR: Failed to create commit
    echo NOTE: This is normal if there are no changes to commit
)
echo.

echo [5/5] Setting default branch to 'main'...
git branch -M main
echo.

echo ==========================================
echo Git repository initialized successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Create a repository on GitHub (https://github.com/new)
echo 2. Run: git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
echo 3. Run: git push -u origin main
echo.
echo Or use the deploy.bat script to automate deployment setup
echo.

pause
