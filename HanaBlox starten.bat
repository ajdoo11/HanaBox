@echo off
title HanaBlox Server
cd /d "%~dp0"
if not exist node_modules (
  echo Installiere einmalig...
  call npm install
)
start "" http://localhost:3000
node server/server.js
pause
