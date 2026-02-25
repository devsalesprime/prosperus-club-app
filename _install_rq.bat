@echo off
cd /d "c:\xampp\htdocs\prosperus-club-app"
npm install --save "@tanstack/react-query" "@tanstack/react-query-devtools"
echo INSTALL_RESULT=%ERRORLEVEL%
