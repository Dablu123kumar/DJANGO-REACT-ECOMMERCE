import os
import sys
import django
import hashlib
import re
from django.core.files import File

# ─── 1. Setup Console Encoding & Django ──────────────────────────────────────────
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, ProductImage, Category

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_DIR = os.path.join(BASE_DIR, 'productsimage')

# ─── 2. Configuration Map for Generator ──────────────────────────────────────
CATEGORY_MAP = {
    'TV': ('Televisions', 14999, 129999, "Transform your entertainment experience with {name}. Quantum color technology, immersive Dolby digital sound, and built-in smart features to stream all your favorite shows."),
    'airpodes': ('Airpods & Airdopes', 1499, 8999, "Immerse yourself in pure crystal sound with {name}. Advanced active noise cancellation, ultra-low latency gaming mode, and up to 40 hours of total playtime with fast charging case."),
    'camera': ('Cameras', 24999, 189999, "Capture life's best moments in stunning detail with {name}. Equipped with ultra-sensitive high megapixel sensor, hyper-fast auto focus, and 4K cinematic video recording."),
    'earphones': ('Earphones', 699, 3999, "Elevate your daily listening with {name}. Features signature punchy bass, ergonomic tangle-free design, and in-line high definition microphone for crystal clear calls."),
    'mobile': ('Mobiles', 9999, 99999, "Experience cutting edge performance with {name}. Featuring immersive vivid display, next-gen multi-lens camera system, and massive battery backup for all-day usage."),
    'mouse': ('Mouse & Keyboards', 499, 4999, "Unleash extreme precision and speed with {name}. Ergonomically sculpted for comfort, with hyper-responsive tracking sensor and customizable buttons for ultimate productivity."),
    'printers': ('Printers', 6999, 34999, "Streamline your workspace with the high-efficiency {name}. Quick and sharp printing, wireless smart-app connectivity, and extremely low cost per page."),
    'processor': ('Processors', 9999, 59999, "Power your system to the next level with {name}. Multi-core heavy duty architecture designed to handle AAA gaming, intensive multi-tasking, and rendering tasks flawlessly."),
    'refrigerator': ('Refrigerators', 14999, 99999, "Keep your produce fresh for up to 15 days with {name}. Energy saving invertor technology, customizable modular storage, and rapid express cooling system."),
    'speakers': ('Speakers', 1999, 24999, "Fill your room with cinematic surround sound with {name}. Rich deep bass technology, Bluetooth connectivity, and elegant aesthetics that blend with home interior."),
    'trimmers': ('Trimmers', 899, 4599, "Get the perfect professional grooming look right at home with {name}. Features self-sharpening skin-friendly blades, multiple precise length settings, and extended battery runtime."),
    'watches': ('Smart Watches', 1999, 39999, "Stay ahead in fitness and style with {name}. Features active heart rate monitoring, blood oxygen (SpO2) tracking, smart notifications, and ultra-durable premium finish."),
}

def get_deterministic_val(name, min_v, max_v):
    h = int(hashlib.md5(name.encode('utf-8')).hexdigest(), 16)
    return min_v + (h % (max_v - min_v + 1))

def safe_str(s):
    """Sanitizes strings to prevent terminal-specific print failures."""
    try:
        return str(s).encode('ascii', 'replace').decode('ascii')
    except Exception:
        return "Unknown String"

def main():
    if not os.path.exists(IMAGE_DIR):
        print(f"Error: Directory {IMAGE_DIR} does not exist.")
        return

    # Ensure Main "Electronics" Category exists
    main_cat, _ = Category.objects.get_or_create(
        name='Electronics',
        defaults={'description': 'Premium consumer electronics and appliances'}
    )
    print(f"Main Category ready: {safe_str(main_cat)}")

    for folder_name in os.listdir(IMAGE_DIR):
        folder_path = os.path.join(IMAGE_DIR, folder_name)
        if not os.path.isdir(folder_path):
            continue

        if folder_name not in CATEGORY_MAP:
            print(f"Skipping unknown directory: {folder_name}")
            continue

        cat_display_name, min_price, max_price, desc_tmpl = CATEGORY_MAP[folder_name]
        
        sub_cat, _ = Category.objects.get_or_create(
            name=cat_display_name,
            defaults={
                'parent': main_cat,
                'description': f'High-performance premium {cat_display_name.lower()}'
            }
        )
        print(f"\nProcessing Category: {safe_str(cat_display_name)}")

        grouped_products = {}
        for filename in os.listdir(folder_path):
            if not filename.lower().endswith(('.webp', '.jpg', '.jpeg', '.png')):
                continue
            
            base_name = os.path.splitext(filename)[0]
            match = re.match(r"^(.*)\s+(\d+)$", base_name)
            if match:
                prod_name = match.group(1).strip()
                img_idx = int(match.group(2))
            else:
                prod_name = base_name.strip()
                img_idx = 1

            if prod_name not in grouped_products:
                grouped_products[prod_name] = []
            
            grouped_products[prod_name].append({
                'index': img_idx,
                'path': os.path.join(folder_path, filename)
            })

        created_count = 0
        skipped_count = 0

        for prod_name, img_list in grouped_products.items():
            # SELF-HEALING: Check if product exists. If it has NO images, delete it to recreate with images!
            # If it has images, skip it to save execution time.
            existing = Product.objects.filter(name=prod_name).first()
            if existing:
                if existing.images.exists():
                    print(f"  [Skip] Product '{safe_str(prod_name)}' already fully imported.")
                    skipped_count += 1
                    continue
                else:
                    print(f"  [Clean] Found orphaned product '{safe_str(prod_name)}' without images. Deleting to re-import...")
                    existing.delete()

            # Sort images
            img_list.sort(key=lambda x: x['index'])

            # Generate deterministic details
            price_raw = get_deterministic_val(prod_name, min_price, max_price)
            price = (price_raw // 100) * 100 - 1
            if price < min_price:
                price = min_price

            discount_pct = get_deterministic_val(prod_name, 8, 22)
            discount_price_raw = int(price * (1 - (discount_pct / 100.0)))
            discount_price = (discount_price_raw // 50) * 50 - 1

            stock = get_deterministic_val(prod_name, 15, 150)
            description = desc_tmpl.format(name=prod_name)
            
            tags = f"{cat_display_name}, {prod_name.split()[0]}, tech, premium"

            # Create Product
            try:
                product = Product.objects.create(
                    category=sub_cat,
                    seller=None, 
                    name=prod_name,
                    description=description,
                    price=price,
                    discount_price=discount_price,
                    stock=stock,
                    tags=tags,
                    is_active=True,
                    is_featured=(get_deterministic_val(prod_name, 0, 10) > 8),
                    approval_status='approved'
                )
                
                # Create Product Images
                for idx, img_meta in enumerate(img_list):
                    is_primary = (idx == 0)
                    img_path = img_meta['path']
                    
                    from django.utils.text import slugify
                    ext = os.path.splitext(img_path)[1] or '.jpg'
                    # Slugify and truncate name for foolproof short unique storage filename
                    filename_raw = f"{slugify(prod_name)[:25]}_{idx}{ext}"

                    with open(img_path, 'rb') as img_file:
                        prod_image = ProductImage(
                            product=product,
                            is_primary=is_primary,
                            order=idx
                        )
                        prod_image.image.save(filename_raw, File(img_file), save=True)
                
                created_count += 1
                # Print safely AFTER complete successful creation
                print(f"  [Success] Created {safe_str(prod_name)} - Price: Rs.{price} (Disc: Rs.{discount_price})")
            except Exception as e:
                print(f"  [Error] Failed on product '{safe_str(prod_name)}': {safe_str(e)}")

        print(f"Finished {safe_str(cat_display_name)}: {created_count} created, {skipped_count} skipped.")

if __name__ == '__main__':
    main()
