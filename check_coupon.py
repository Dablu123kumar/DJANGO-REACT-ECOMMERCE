import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from orders.models import Coupon
from tenants.models import Tenant
from django.utils import timezone

def check_coupon():
    tenants = Tenant.objects.all()
    if not tenants:
        print("No tenants found.")
        return

    for tenant in tenants:
        coupon, created = Coupon.objects.get_or_create(
            code='WELCOME20',
            tenant=tenant,
            defaults={
                'description': '20% Welcome Discount',
                'discount_type': 'percent',
                'discount_value': 20.0,
                'min_order_amount': 0.0,
                'max_uses': 1000,
                'is_active': True,
                'expires_at': timezone.now() + timezone.timedelta(days=365)
            }
        )
        if created:
            print(f"Created coupon WELCOME20 for tenant: {tenant.name}")
        else:
            # Update it just in case
            coupon.description = '20% Welcome Discount'
            coupon.discount_type = 'percent'
            coupon.discount_value = 20.0
            coupon.is_active = True
            coupon.save()
            print(f"Verified/Updated coupon WELCOME20 for tenant: {tenant.name}")

if __name__ == '__main__':
    check_coupon()
