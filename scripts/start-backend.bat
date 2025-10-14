@echo off
cd em-backend
call venv\Scripts\activate
python -m uvicorn main:app --reload --port 8787
