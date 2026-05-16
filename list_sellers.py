import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User

print("\n--- ADMIN USERS ---")
for u in User.objects.filter(role='admin'):
    print(f"Email: {u.email} | Role: {u.role}")

print("\n--- SELLER USERS ---")
for u in User.objects.filter(role='seller'):
    print(f"Email: {u.email} | Role: {u.role}")

if not User.objects.filter(role='seller').exists():
    print("No sellers found in database!")
