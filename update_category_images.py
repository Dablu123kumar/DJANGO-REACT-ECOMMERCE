import os
import sys
import django

# Adjust path to make sure it resolves perfectly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Category, Product

def update_images():
    print("Starting category image synchronization...")
    # Skip parent 'Electronics' category, only focus on sub-categories
    categories = Category.objects.exclude(parent=None)
    
    success_count = 0
    for cat in categories:
        # Find first approved product in this category
        prod = Product.objects.filter(category=cat).first()
        if not prod:
            print(f"  [-] No products listed in category '{cat.name}'. Skipping.")
            continue
            
        # Grab its primary image or fallback to first
        primary_img = prod.images.filter(is_primary=True).first() or prod.images.first()
        if not primary_img or not primary_img.image:
            print(f"  [-] First product for '{cat.name}' ({prod.name}) has no images. Skipping.")
            continue
            
        try:
            # Map product image path directly to Category.image (zero duplication, high efficiency)
            cat.image = primary_img.image.name
            cat.save()
            print(f"  [+] Successfully mapped category '{cat.name}' image -> '{primary_img.image.name}'")
            success_count += 1
        except Exception as e:
            print(f"  [Error] Failed to map category '{cat.name}': {str(e)}")

    print(f"\nCompleted! Successfully assigned images for {success_count} categories.")

if __name__ == '__main__':
    update_images()
