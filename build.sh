#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Run setup scripts automatically since free tier has no shell
python manage.py shell < setup_default_tenant.py
python create_admin.py
