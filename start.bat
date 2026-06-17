@echo off
REM Masar Platform Windows Startup Script

echo ============================================================
echo   MASAR Platform - AI Learning OS
echo ============================================================
echo.

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

python start.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Masar Platform failed to start.
    pause
)