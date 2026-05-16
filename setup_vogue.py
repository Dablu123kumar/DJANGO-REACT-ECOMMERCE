import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tenants.models import Tenant
from products.models import Category, Product
from django.utils.text import slugify

def setup_vogue():
    print("--- Setting up VogueVault Tenant ---")
    tenant, created = Tenant.objects.get_or_create(
        tenant_id='vogue',
        defaults={'name': 'VogueVault Luxury'}
    )
    if created:
        print(f"Created tenant: {tenant.name}")
    else:
        print(f"Tenant {tenant.name} already exists.")

    # Create Luxury Categories
    cats = ['Haute Couture', 'Signature Accessories', 'Timepieces', 'Luxe Home']
    for cat_name in cats:
        cat, c = Category.all_objects.get_or_create(
            name=cat_name,
            tenant=tenant,
            defaults={'slug': slugify(cat_name)}
        )
        if c: print(f"  Created Category: {cat_name}")

    # Create Sample Luxury Products
    sample_products = [
        {
            'name': 'Midnight Velvet Gown',
            'desc': 'Exquisite midnight blue velvet gown with hand-stitched silk lining.',
            'price': 45000,
            'cat': 'Haute Couture'
        },
        {
            'name': 'Elysian Gold Timepiece',
            'desc': '18K gold-plated automatic watch with sapphire crystal face.',
            'price': 125000,
            'cat': 'Timepieces'
        },
        {
            'name': 'Onyx Leather Tote',
            'desc': 'Italian calfskin leather tote with gold-toned hardware.',
            'price': 28000,
            'cat': 'Signature Accessories'
        }
    ]

    for p in sample_products:
        category = Category.all_objects.get(name=p['cat'], tenant=tenant)
        prod, c = Product.all_objects.update_or_create(
            name=p['name'],
            tenant=tenant,
            defaults={
                'description': p['desc'],
                'price': p['price'],
                'category': category,
                'stock': 10,
                'is_active': True,
                'is_featured': True,
                'approval_status': 'approved'
            }
        )
        if c: print(f"    Created Product: {p['name']}")

if __name__ == '__main__':
    setup_vogue()
