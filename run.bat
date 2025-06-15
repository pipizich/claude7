@echo off
chcp 65001 >nul
title Museum Art Gallery - Setup and Launch
color 0A
cls

echo.
echo ==============================================================
echo                MUSEUM ART GALLERY - STARTUP UTILITY
echo ==============================================================
echo.

:: Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python is not installed!
    echo.
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure you select "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Python found
echo.

:: Check pip version
python -m pip --version >nul 2>nul
if %errorlevel% neq 0 (
    color 0E
    echo [WARNING] Pip is not installed or not in PATH
    echo Installing pip...
    python -m ensurepip --upgrade
)

echo [OK] Pip is ready
echo.

:: Check and install required libraries
echo Checking required libraries...
echo.

python -c "import flask" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Flask is not installed. Installing...
    python -m pip install flask
) else (
    echo [OK] Flask is installed
)

python -c "import werkzeug" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Werkzeug is not installed. Installing...
    python -m pip install werkzeug
) else (
    echo [OK] Werkzeug is installed
)

python -c "import sqlite3" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] SQLite3 is not installed. Installing...
    python -m pip install pysqlite3
) else (
    echo [OK] SQLite3 is installed
)

echo.
echo =============================================================
color 0B
echo                 MUSEUM ART GALLERY - INSTRUCTIONS
echo =============================================================
echo.
echo  * Starting Museum Art Gallery web application...
echo  * Browser will automatically open with address: http://localhost:5000
echo  * To stop the application: Press CTRL+C in this window
echo  * To restart: Close this window and run run.bat again
echo.
echo =============================================================
echo.

:: Create uploads directory if it doesn't exist
if not exist "static\uploads" (
    echo [INFO] Creating uploads directory...
    mkdir "static\uploads"
)

:: Wait a moment for user to read instructions
echo [INFO] Starting in 3 seconds...
timeout /t 3 >nul

:: Prepare to start Flask server non-blocking then open browser
echo [INFO] Starting Flask server...
echo.
color 0E
echo =============================================================
echo  SERVER RUNNING - PRESS CTRL+C TO STOP
echo =============================================================
echo.

:: Start Flask server in a new window (non-blocking)
start "Flask Server" /B python app.py

:: Wait for Flask server to start
echo Waiting for Flask server to start...
timeout /t 2 >nul

:: Open browser with multiple options to ensure at least one works
echo [INFO] Opening browser...

:: Try opening with default browser
start http://localhost:5000

:: If that fails, try popular browsers
if %errorlevel% neq 0 (
    echo Trying other browsers...
    
    :: Try Chrome
    start chrome http://localhost:5000 >nul 2>nul
    if %errorlevel% equ 0 (
        echo Successfully opened with Chrome
        goto browser_opened
    )
    
    :: Try Edge
    start msedge http://localhost:5000 >nul 2>nul
    if %errorlevel% equ 0 (
        echo Successfully opened with Edge
        goto browser_opened
    )
    
    :: Try Firefox
    start firefox http://localhost:5000 >nul 2>nul
    if %errorlevel% equ 0 (
        echo Successfully opened with Firefox
        goto browser_opened
    )
    
    echo Cannot automatically open browser. Please open manually at: http://localhost:5000
)

:browser_opened
echo.
echo =============================================================
echo  SERVER RUNNING - BROWSER HAS BEEN OPENED
echo  TO STOP: PRESS CTRL+C OR CLOSE THIS WINDOW
echo =============================================================

:: Wait for user to close window
pause >nul

:: Kill Flask processes when batch is closed
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Flask Server" >nul 2>nul

color 0C
echo.
echo =============================================================
echo  SERVER STOPPED - GOODBYE
echo =============================================================
timeout /t 3 >nul
