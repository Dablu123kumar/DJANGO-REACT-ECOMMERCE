import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tenants.models import Tenant
from tenants.utils import set_current_tenant, get_current_tenant
from products.models import Product, Category

def run_validation():
    print("=== RUNNING MULTI-TENANT VALIDATION ===")

    # 1. Get current tenants
    default_tenant = Tenant.objects.get(tenant_id="default")
    
    # 2. Create a new test tenant
    nike_tenant, created = Tenant.objects.get_or_create(
        tenant_id="nike",
        defaults={"name": "Nike Store"}
    )
    print(f"Using tenant: {nike_tenant}")

    # 3. Set tenant to Default and check counts
    set_current_tenant(default_tenant)
    default_count = Product.objects.count()
    print(f"[Default Tenant] Product count: {default_count}")
    assert default_count > 0, "Default tenant should have products!"

    # 4. Set tenant to Nike and check counts (should be 0)
    set_current_tenant(nike_tenant)
    nike_count = Product.objects.count()
    print(f"[Nike Tenant] Product count: {nike_count}")
    
    # 5. Create a dummy product under Nike tenant
    dummy_cat, _ = Category.objects.get_or_create(name="Test Category")
    
    nike_prod = Product.objects.create(
        name="Nike Air Max",
        description="Cool shoes",
        price=120.00,
        stock=10,
        category=dummy_cat
    )
    print(f"Created '{nike_prod.name}' under Nike context. Actual Tenant assigned: {nike_prod.tenant}")
    
    # Verify counts after creation
    set_current_tenant(nike_tenant)
    assert Product.objects.count() == nike_count + 1, "Nike product count should increase by 1!"
    print(f"[Nike Tenant] Verification passed. Now sees: {Product.objects.first().name}")

    # 6. Set tenant back to default and ensure Nike's product is NOT visible!
    set_current_tenant(default_tenant)
    assert not Product.objects.filter(name="Nike Air Max").exists(), "Default tenant should NOT see Nike products!"
    print("[Default Tenant] Verification passed. Cannot see Nike products.")

    # Clean up the dummy test product and tenant
    set_current_tenant(None)
    nike_prod.delete()
    if created:
        nike_tenant.delete()
    
    print("\n=== VALIDATION PASSED SUCCESSFULLY ===")
    print("Multi-tenancy isolation and auto-assignment are fully functional and verified!")

if __name__ == "__main__":
    run_validation()
