@echo off
REM Pre-Deployment Checklist Script
REM Verifies everything is ready for deployment

echo ==========================================
echo Pre-Deployment Checklist
echo ==========================================
echo.

set /a checks_passed=0
set /a checks_total=0

REM Check 1: Git installed
set /a checks_total+=1
echo [Check 1/%checks_total%] Verifying Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Git is not installed
    echo   Install from: https://git-scm.com/
) else (
    echo   [PASS] Git is installed
    set /a checks_passed+=1
)
echo.

REM Check 2: Node.js installed
set /a checks_total+=1
echo [Check 2/%checks_total%] Verifying Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Node.js is not installed
    echo   Install from: https://nodejs.org/
) else (
    echo   [PASS] Node.js is installed
    set /a checks_passed+=1
)
echo.

REM Check 3: Python installed
set /a checks_total+=1
echo [Check 3/%checks_total%] Verifying Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Python is not installed
    echo   Install from: https://python.org/
) else (
    echo   [PASS] Python is installed
    set /a checks_passed+=1
)
echo.

REM Check 4: Backend files exist
set /a checks_total+=1
echo [Check 4/%checks_total%] Checking backend files...
if exist "em-backend\main.py" (
    if exist "em-backend\requirements.txt" (
        if exist "em-backend\.env.example" (
            echo   [PASS] Backend files present
            set /a checks_passed+=1
        ) else (
            echo   [FAIL] em-backend\.env.example missing
        )
    ) else (
        echo   [FAIL] em-backend\requirements.txt missing
    )
) else (
    echo   [FAIL] em-backend\main.py missing
)
echo.

REM Check 5: Frontend files exist
set /a checks_total+=1
echo [Check 5/%checks_total%] Checking frontend files...
if exist "em-frontend\package.json" (
    if exist "em-frontend\next.config.js" (
        echo   [PASS] Frontend files present
        set /a checks_passed+=1
    ) else (
        echo   [FAIL] em-frontend\next.config.js missing
    )
) else (
    echo   [FAIL] em-frontend\package.json missing
)
echo.

REM Check 6: .gitignore files
set /a checks_total+=1
echo [Check 6/%checks_total%] Checking .gitignore files...
if exist "em-backend\.gitignore" (
    if exist "em-frontend\.gitignore" (
        echo   [PASS] .gitignore files present
        set /a checks_passed+=1
    ) else (
        echo   [FAIL] em-frontend\.gitignore missing
    )
) else (
    echo   [FAIL] em-backend\.gitignore missing
)
echo.

REM Check 7: Deployment configs
set /a checks_total+=1
echo [Check 7/%checks_total%] Checking deployment configurations...
if exist "em-backend\render.yaml" (
    if exist "em-frontend\vercel.json" (
        echo   [PASS] Deployment configs present
        set /a checks_passed+=1
    ) else (
        echo   [FAIL] em-frontend\vercel.json missing
    )
) else (
    echo   [FAIL] em-backend\render.yaml missing
)
echo.

REM Check 8: Environment variables
set /a checks_total+=1
echo [Check 8/%checks_total%] Checking environment variable templates...
if exist "em-backend\.env.example" (
    if exist "em-frontend\.env.example" (
        echo   [PASS] Environment templates present
        set /a checks_passed+=1
    ) else (
        echo   [FAIL] em-frontend\.env.example missing
    )
) else (
    echo   [FAIL] em-backend\.env.example missing
)
echo.

REM Summary
echo ==========================================
echo Checklist Summary
echo ==========================================
echo.
echo Passed: %checks_passed%/%checks_total% checks
echo.

if %checks_passed% equ %checks_total% (
    echo [SUCCESS] All checks passed! Ready for deployment.
    echo.
    echo Next steps:
    echo 1. Run init-git.bat to initialize Git repository
    echo 2. Create GitHub repository
    echo 3. Run deploy.bat for deployment guidance
    echo.
    echo Or follow DEPLOYMENT.md for detailed manual instructions
) else (
    echo [WARNING] Some checks failed. Please fix issues before deploying.
    echo.
    echo Review the failures above and:
    echo - Install missing software
    echo - Verify all files are in place
    echo - Check file paths and names
)
echo.

pause
