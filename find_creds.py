import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tenants.models import Tenant
from accounts.models import User
from sellers.models import Store

def find_kafka_creds():
    print("--- Searching for Kafka Store Tenants ---")
    tenants = Tenant.objects.filter(name__icontains='kafka')
    for t in tenants:
        print(f"Tenant: {t.name} (ID: {t.tenant_id})")
        
        # Look for stores associated with this tenant
        # Since Store is TenantAwareModel and we are running outside request context,
        # we should use all_objects to bypass tenant filtering or just check for all stores
        stores = Store.all_objects.filter(tenant=t)
        for s in stores:
            user = s.user
            print(f"  Store: {s.store_name}")
            print(f"  User Email: {user.email}")
            print(f"  User Role: {user.role}")
            print(f"  Is Staff: {user.is_staff}")
            print("-" * 20)

    if not tenants:
        print("No tenant found with 'kafka' in name.")
        # Try searching users directly
        print("\n--- Searching Users with 'kafka' ---")
        users = User.objects.filter(email__icontains='kafka')
        for u in users:
            print(f"User: {u.email} (Role: {u.role})")

if __name__ == '__main__':
    find_kafka_creds()
