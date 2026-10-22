@echo off
title Gradientfy
cd /d "%~dp0"

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        echo Error: Neither Node.js nor Python was found.
        echo Please install Node.js from https://nodejs.org
        pause
        exit /b 1
    )
    if not exist "dist\index.html" (
        echo Error: dist folder not found.
        pause
        exit /b 1
    )
    start http://localhost:3030
    python -m http.server 3030 --directory dist
    pause
    exit /b 0
)

:: Install dependencies if missing
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Error: npm install failed.
        pause
        exit /b 1
    )
)

:: Build project if dist is missing
if not exist "dist\index.html" (
    echo Building application...
    call npm run build
    if %errorlevel% neq 0 (
        echo Error: Build failed.
        pause
        exit /b 1
    )
)

node server.js
if %errorlevel% neq 0 pause
