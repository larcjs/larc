@echo off
REM LARC Setup Script for Windows
REM Sets up the complete LARC development environment

echo.
echo ============================================================
echo.
echo        LARC - Lightweight Asynchronous Relay Core
echo                    Setup Script
echo.
echo ============================================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed. Please install git first.
    echo Download from: https://git-scm.com/download/win
    exit /b 1
)

echo [OK] Git is installed

REM Check if we're in a git repository
if not exist ".git" (
    echo [ERROR] Not in a git repository.
    echo Please run this script from the LARC root directory.
    exit /b 1
)

REM Initialize and update submodules
echo.
echo [*] Initializing submodules...
git submodule init

echo [*] Updating submodules to latest commits...
git submodule update --remote --recursive

echo.
echo [OK] All submodules updated!

REM List submodules
echo.
echo [*] Available repositories:
echo.
git submodule status

REM Check for Node.js (optional)
echo.
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js !NODE_VERSION! is installed
) else (
    echo [WARNING] Node.js is not installed (optional, but recommended)
)

REM Check for Python (for local server)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo [OK] !PYTHON_VERSION! is installed
) else (
    echo [WARNING] Python is not installed (needed for local HTTP server)
)

REM Print next steps
echo.
echo ============================================================
echo                    Setup Complete!
echo ============================================================
echo.
echo Next steps:
echo.
echo   1. Start a local server:
echo      python -m http.server 8000
echo      (or use any other HTTP server)
echo.
echo   2. Open your browser:
echo      http://localhost:8000/test-config.html  (Test configuration)
echo      http://localhost:8000/examples/         (View examples)
echo      http://localhost:8000/site/             (Documentation)
echo.
echo   3. Read the documentation:
echo      README.md              - Project overview
echo      README-CONFIG.md       - Configuration system
echo      QUICK-START-CONFIG.md  - Quick reference
echo.
echo Repository structure:
echo   core/        - Core PAN messaging bus
echo   components/  - UI component library
echo   examples/    - Demo applications
echo   site/        - Documentation website
echo   devtools/    - Chrome DevTools extension
echo.
echo Happy coding!
echo.
pause
