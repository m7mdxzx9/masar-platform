#!/usr/bin/env python3
"""
Masar Platform - Startup Script
Start both frontend and backend services
"""

import os
import sys
import subprocess
import time
import signal
import platform

REQUIRED_FILES = {
    'backend': ['app/main.py', 'requirements.txt'],
    'frontend': ['package.json', 'vite.config.ts'],
}

def check_files(base_path, files_dict):
    """Check if required files exist."""
    all_good = True
    for component, files in files_dict.items():
        for file in files:
            path = os.path.join(base_path, file)
            if not os.path.exists(path):
                print(f"❌ Missing {component}/{file}")
                all_good = False
    return all_good

def install_backend():
    """Install backend dependencies."""
    print("\n📦 Installing backend dependencies...")
    try:
        subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'],
            cwd='backend',
            check=True
        )
        print("✅ Backend dependencies installed")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install backend dependencies: {e}")
        return False
    return True

def install_frontend():
    """Install frontend dependencies."""
    print("\n📦 Installing frontend dependencies...")
    try:
        subprocess.run(['npm', 'install'], cwd='frontend', check=True)
        print("✅ Frontend dependencies installed")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"❌ Failed to install frontend dependencies: {e}")
        print("   Make sure Node.js is installed: https://nodejs.org")
        return False
    return True

def start_backend():
    """Start the backend server."""
    print("\n🚀 Starting backend server...")
    print("   URL: http://localhost:8000")
    print("   Docs: http://localhost:8000/docs")

    env = os.environ.copy()
    env['PYTHONPATH'] = 'backend'

    cmd = [sys.executable, '-m', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000']

    proc = subprocess.Popen(
        cmd,
        cwd='backend',
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    return proc

def start_frontend():
    """Start the frontend dev server."""
    print("\n🚀 Starting frontend dev server...")
    print("   URL: http://localhost:5173")

    proc = subprocess.Popen(
        ['npm', 'run', 'dev'],
        cwd='frontend',
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    return proc

def print_banner():
    print("=" * 60)
    print("   MASAR Platform - منصة تعلم الذكاء الاصطناعي")
    print("   Version 3.0 - Integration Complete")
    print("=" * 60)

def main():
    base_path = os.path.dirname(os.path.abspath(__file__))

    print_banner()

    print("\n🔍 Checking project structure...")
    if not check_files(base_path, REQUIRED_FILES):
        print("\n❌ Project structure incomplete!")
        print("   Make sure you're running from the project root.")
        sys.exit(1)

    print("✅ Project structure OK")

    if platform.system() == 'Windows':
        print("\n⚠️  Windows detected. Using manual startup...")
        print("\n   Terminal 1 (Backend):")
        print("   cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload")
        print("\n   Terminal 2 (Frontend):")
        print("   cd frontend && npm install && npm run dev")
        return

    processes = []

    try:
        print("\n" + "=" * 60)
        print("   Starting services...")
        print("=" * 60)

        backend_proc = start_backend()
        processes.append(('Backend', backend_proc))

        time.sleep(3)

        frontend_proc = start_frontend()
        processes.append(('Frontend', frontend_proc))

        print("\n" + "=" * 60)
        print("   ✅ All services started!")
        print("=" * 60)
        print("\n   🌐 Frontend: http://localhost:5173")
        print("   📚 Backend:  http://localhost:8000")
        print("   📖 API Docs: http://localhost:8000/docs")
        print("\n   Press Ctrl+C to stop all services")
        print("=" * 60)

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down services...")
    finally:
        for name, proc in processes:
            print(f"   Stopping {name}...")
            proc.terminate()
            proc.wait(timeout=5)

        print("\n👋 Masar Platform stopped.")

if __name__ == '__main__':
    main()