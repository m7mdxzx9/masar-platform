@echo off
REM Masar Platform Startup Script for Windows

echo ============================================================
echo   MASAR Platform - AI Learning OS
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://python.org
    exit /b 1
)

echo [1/4] Checking dependencies...
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Some backend dependencies may not be installed
)
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)
cd ..

echo [2/4] Environment Check
echo.

REM Copy .env.example if .env doesn't exist
if not exist backend\.env (
    copy backend\.env.example backend\.env >nul 2>&1
    echo [INFO] Created backend\.env from example
    echo [INFO] Please add your NVIDIA_API_KEY to backend\.env
)

echo [3/4] Starting Backend Server...
start "Masar Backend" cmd /c "cd backend ^&^& python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend Dev Server...
start "Masar Frontend" cmd /c "cd frontend ^&^& npm run dev"

echo.
echo ============================================================
echo   Services Started Successfully!
echo ============================================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo   Press Ctrl+C to stop all services
echo ============================================================
echo.

REM Wait for user interrupt
pause