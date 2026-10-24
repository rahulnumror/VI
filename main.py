"""
SOILEX Life Science ERP - Backend Launcher
Launches FastAPI backend server on http://127.0.0.1:8000
"""
import subprocess
import sys
import os

if __name__ == "__main__":
    venv_python = os.path.join(os.path.dirname(__file__), "backend", "venv", "Scripts", "python.exe")
    run_script = os.path.join(os.path.dirname(__file__), "backend", "run.py")
    
    if not os.path.exists(venv_python):
        venv_python = sys.executable

    subprocess.run([venv_python, run_script])
