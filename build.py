import os
import subprocess
import sys

def run_cmd(cmd):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, text=True)
    if result.returncode != 0:
        print(f"Command failed with exit code {result.returncode}")
        sys.exit(1)

def build():
    print("Starting python-based build script...")
    
    run_cmd("pip install -r requirements.txt")
    
    print("Collecting static files...")
    run_cmd("python manage.py collectstatic --no-input")
    
    print("Running migrations...")
    run_cmd("python manage.py migrate")
    
    print("Setting up default tenant...")
    try:
        run_cmd("python setup_default_tenant.py")
        run_cmd("python setup_vogue.py")
    except Exception as e:
        print(f"Warning: Tenant setup failed: {e}")
        
    print("Creating admin user...")
    try:
        run_cmd("python create_admin.py")
    except Exception as e:
        print(f"Warning: Admin creation failed: {e}")
        
    print("Build script completed successfully!")

if __name__ == '__main__':
    build()
