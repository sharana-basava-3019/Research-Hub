@echo off
echo ========================================================
echo   RESEARCH-HUB - Starting Backend and Frontend
echo ========================================================
echo.

echo Starting Server on port 5000...
start "RESEARCH-HUB Server (Port 5000)" cmd /k "cd /d %~dp0server && npm start"

timeout /t 2 /nobreak >nul

echo Starting Frontend on port 3000...
start "RESEARCH-HUB Frontend (Port 3000)" cmd /k "cd /d %~dp0FRONTEND && npm start"

echo.
echo ========================================================
echo   Both services launched in separate windows!
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================================
