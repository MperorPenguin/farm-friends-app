@echo off
cd /d %~dp0
echo Starting local server at http://localhost:8080
echo Press CTRL+C to stop the server.
python -m http.server 8080
pause
