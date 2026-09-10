@echo off
chcp 65001 > nul
echo Запуск Exam Scheduler...

:: 1. Запуск FastAPI бекенду через venv в окремому вікні
start "Exam Scheduler - Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn main:app --reload"

:: 2. Запуск React фронтенду в окремому вікні
start "Exam Scheduler - Frontend" cmd /k "cd frontend && npm run dev"

:: 3. Очікування 3 секунди та запуск браузера
timeout /t 3 /nobreak > nul
start http://localhost:5173