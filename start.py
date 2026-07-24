#!/usr/bin/env python3
"""
Masar Platform - Startup Script (Cross-Platform)
Starts both frontend and backend services cleanly with venv support.
"""

import os
import sys
import subprocess
import time
import platform
import socket
import shutil

REQUIRED_FILES = {
    'backend': ['app/main.py', 'requirements.txt'],
    'frontend': ['package.json', 'vite.config.ts'],
}

def check_files(base_path, files_dict):
    """Check if required files exist."""
    all_good = True
    for component, files in files_dict.items():
        for file in files:
            path = os.path.join(base_path, component, file)
            if not os.path.exists(path):
                print(f"❌ Missing {component}/{file}")
                all_good = False
    return all_good

def is_port_in_use(port, host='127.0.0.1'):
    """Check if a local port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def get_venv_python():
    """Return the path to the python executable in the virtual environment."""
    if platform.system() == 'Windows':
        return os.path.join('backend', 'venv', 'Scripts', 'python.exe')
    return os.path.join('backend', 'venv', 'bin', 'python')

def setup_venv():
    """Create a virtual environment if it doesn't exist and install dependencies."""
    venv_dir = os.path.join('backend', 'venv')
    venv_python = get_venv_python()
    
    if not os.path.exists(venv_dir):
        print("🔧 [1/2] Creating Python virtual environment (venv) in backend/venv...")
        try:
            subprocess.run([sys.executable, '-m', 'venv', venv_dir], check=True)
            print("✅ Virtual environment created.")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to create virtual environment: {e}")
            return False
            
    print("📦 [2/2] Installing backend requirements inside venv...")
    try:
        # Upgrade pip silently
        subprocess.run([venv_python, '-m', 'pip', 'install', '--upgrade', 'pip'], check=True, stdout=subprocess.DEVNULL)
        # Install requirements
        subprocess.run([venv_python, '-m', 'pip', 'install', '-r', 'requirements.txt'], cwd='backend', check=True)
        print("✅ Backend dependencies installed successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies in venv: {e}")
        return False

def setup_frontend():
    """Install frontend dependencies if node_modules is missing."""
    node_modules = os.path.join('frontend', 'node_modules')
    if not os.path.exists(node_modules):
        print("📦 Installing frontend dependencies (npm install)...")
        try:
            npm_cmd = 'npm.cmd' if platform.system() == 'Windows' else 'npm'
            subprocess.run([npm_cmd, 'install'], cwd='frontend', check=True)
            print("✅ Frontend dependencies installed successfully.")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print(f"❌ Failed to run npm install: {e}")
            print("   Please make sure Node.js is installed and in your PATH.")
            return False
    else:
        print("✅ Frontend dependencies (node_modules) already present.")
        return True

def setup_env():
    """Create .env file from .env.example if missing."""
    env_file = os.path.join('backend', '.env')
    env_example = os.path.join('backend', '.env.example')
    if not os.path.exists(env_file):
        if os.path.exists(env_example):
            print("🔧 Creating backend/.env from example...")
            shutil.copy(env_example, env_file)
            print("✅ Created backend/.env successfully.")
        else:
            print("⚠️  Warning: backend/.env.example is missing. Cannot create .env automatically.")

def start_backend(venv_python):
    """Start the backend server using virtual environment python."""
    print("🚀 Starting Backend server (FastAPI)...")
    env = os.environ.copy()
    env['PYTHONPATH'] = 'backend'
    
    # Run uvicorn using venv Python to avoid global package conflicts
    cmd = [venv_python, '-m', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000']
    
    # We let output print directly to console (stdout=None) to prevent pipe buffer hangs
    proc = subprocess.Popen(
        cmd,
        cwd='backend',
        env=env,
        stdout=None,
        stderr=None
    )
    return proc

def start_frontend():
    """Start the frontend dev server."""
    print("🚀 Starting Frontend dev server (Vite)...")
    npm_cmd = 'npm.cmd' if platform.system() == 'Windows' else 'npm'
    
    proc = subprocess.Popen(
        [npm_cmd, 'run', 'dev'],
        cwd='frontend',
        stdout=None,
        stderr=None
    )
    return proc

def print_banner():
    print("=" * 60)
    print("   MASAR Platform - منصة تعلم الذكاء الاصطناعي")
    print("   AI Learning OS v3.0 - Setup & Orchestration")
    print("=" * 60)

def main():
    base_path = os.path.dirname(os.path.abspath(__file__))
    print_banner()

    # 1. Check project structure
    if not check_files(base_path, REQUIRED_FILES):
        print("\n❌ Project structure incomplete! Please run from the root of masar-platform.")
        sys.exit(1)

    # 2. Check for port conflicts
    if is_port_in_use(8000):
        print("⚠️  Warning: Port 8000 is already in use. The backend server might fail to start.")
    if is_port_in_use(5173):
        print("⚠️  Warning: Port 5173 is already in use. Vite dev server will run on another port.")

    # 3. Setup environment files
    setup_env()

    # 4. Setup Python Virtual Environment and install requirements
    if not setup_venv():
        print("❌ Setup failed: Backend environment is incomplete.")
        sys.exit(1)

    # 5. Setup Frontend node modules
    if not setup_frontend():
        print("❌ Setup failed: Frontend dependencies are missing.")
        sys.exit(1)

    # 6. Start Services
    processes = []
    try:
        print("\n" + "=" * 60)
        print("   Starting Masar services concurrently...")
        print("=" * 60)

        # Start backend inside venv
        venv_python = get_venv_python()
        backend_proc = start_backend(venv_python)
        processes.append(('Backend', backend_proc))

        time.sleep(2)  # Wait for backend initialization

        # Start frontend
        frontend_proc = start_frontend()
        processes.append(('Frontend', frontend_proc))

        print("\n" + "=" * 60)
        print("   🎉 All services started successfully!")
        print("=" * 60)
        print("   🌐 Frontend: http://localhost:5173")
        print("   📚 Backend:  http://localhost:8000")
        print("   📖 API Docs: http://localhost:8000/docs")
        print("   Press Ctrl+C to terminate both servers.")
        print("=" * 60 + "\n")

        # Keep parent script running and check process status
        while True:
            for name, proc in processes:
                if proc.poll() is not None:
                    print(f"⚠️  Process {name} terminated with code {proc.poll()}")
                    sys.exit(1)
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n🛑 KeyboardInterrupt detected: Shutting down servers...")
    finally:
        for name, proc in processes:
            print(f"   Stopping {name} server...")
            try:
                proc.terminate()
                proc.wait(timeout=2)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass
        print("✅ Services stopped successfully.")

if __name__ == '__main__':
    main()