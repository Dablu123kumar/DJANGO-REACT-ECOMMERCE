import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tenants.models import Tenant
from accounts.models import User, SavedAddress
from sellers.models import Store
from products.models import Category, Product
from orders.models import Coupon, Order, Cart

def setup():
    print("Setting up default tenant...")
    
    # 1. Create default tenant if none exists
    tenant, created = Tenant.objects.get_or_create(
        tenant_id="default",
        defaults={"name": "Default Store", "is_active": True}
    )
    if created:
        print(f"Created default tenant: {tenant}")
    else:
        print(f"Using existing default tenant: {tenant}")

    # 2. Migrate all TenantAwareModels to default tenant
    # For User, we use all_objects since objects filters by current context
    users = User.all_objects.filter(tenant__isnull=True)
    updated_users = users.update(tenant=tenant)
    print(f"Migrated {updated_users} users to default tenant.")

    # For Store
    stores = Store.all_objects.filter(tenant__isnull=True)
    updated_stores = stores.update(tenant=tenant)
    print(f"Migrated {updated_stores} stores to default tenant.")

    # For Category
    cats = Category.all_objects.filter(tenant__isnull=True)
    updated_cats = cats.update(tenant=tenant)
    print(f"Migrated {updated_cats} categories to default tenant.")

    # For Product
    prods = Product.all_objects.filter(tenant__isnull=True)
    updated_prods = prods.update(tenant=tenant)
    print(f"Migrated {updated_prods} products to default tenant.")

    # For Coupon
    coupons = Coupon.all_objects.filter(tenant__isnull=True)
    updated_coupons = coupons.update(tenant=tenant)
    print(f"Migrated {updated_coupons} coupons to default tenant.")

    # For Order
    orders = Order.all_objects.filter(tenant__isnull=True)
    updated_orders = orders.update(tenant=tenant)
    print(f"Migrated {updated_orders} orders to default tenant.")

    # For SavedAddress
    addrs = SavedAddress.all_objects.filter(tenant__isnull=True)
    updated_addrs = addrs.update(tenant=tenant)
    print(f"Migrated {updated_addrs} addresses to default tenant.")

    # For Cart
    carts = Cart.all_objects.filter(tenant__isnull=True)
    updated_carts = carts.update(tenant=tenant)
    print(f"Migrated {updated_carts} carts to default tenant.")

    print("Success! All existing data is now associated with the 'default' tenant.")


    print("Success! All existing data is now associated with the 'default' tenant.")

if __name__ == "__main__":
    setup()
