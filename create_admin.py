import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User
from tenants.models import Tenant

def create_admin():
    # Make sure we have the default tenant
    tenant, _ = Tenant.objects.get_or_create(tenant_id="default", defaults={"name": "Default Store", "is_active": True})
    
    # Create the superuser if it doesn't exist
    if not User.objects.filter(email='admin@example.com').exists():
        print("Creating superuser admin@example.com...")
        User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpassword123',
            tenant=tenant
        )
        print("Superuser created successfully! (Email: admin@example.com / Password: adminpassword123)")
    else:
        print("Superuser already exists.")

if __name__ == '__main__':
    create_admin()
