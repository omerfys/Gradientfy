@echo off
title Gradientfy - 207 Live GPU Gradients App
cd /d "%~dp0"
color 0B

echo ============================================================
echo           GRADIENTFY - 207 GPU GRADIENTS STUDIO
echo ============================================================
echo.
echo Checking environment...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [Notice] Node.js not detected in PATH. Checking Python...
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        echo [Error] Neither Node.js nor Python was found.
        echo Please install Node.js from https://nodejs.org or Python.
        pause
        exit /b 1
    )
    
    echo [OK] Using Python fallback server on port 3030...
    if not exist "dist\index.html" (
        echo [Error] dist\ folder not found. Please build the app with Node.js first.
        pause
        exit /b 1
    )
    start http://localhost:3030
    python -m http.server 3030 --directory dist
    pause
    exit /b 0
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [Info] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [Error] npm install failed.
        pause
        exit /b 1
    )
)

:: Check if dist exists
if not exist "dist\index.html" (
    echo [Info] Building production bundle...
    call npm run build
    if %errorlevel% neq 0 (
        echo [Error] npm run build failed.
        pause
        exit /b 1
    )
)

echo [OK] Launching Gradientfy server...
echo.
node server.js

if %errorlevel% neq 0 (
    echo.
    echo Server exited with code %errorlevel%
    pause
)
