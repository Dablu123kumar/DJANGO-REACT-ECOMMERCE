"""
Seed script — run with: python manage.py shell < seed_data.py
"""
from products.models import Category, Product

cats = [
    {'name': 'Electronics', 'description': 'Phones, laptops, gadgets and more'},
    {'name': 'Fashion', 'description': 'Clothing, footwear and accessories'},
    {'name': 'Home & Living', 'description': 'Furniture, decor and appliances'},
    {'name': 'Sports', 'description': 'Sports gear and outdoor equipment'},
    {'name': 'Books', 'description': 'Books, stationery and educational material'},
    {'name': 'Beauty', 'description': 'Skincare, makeup and wellness'},
]

created_cats = []
for c in cats:
    cat, _ = Category.objects.get_or_create(name=c['name'], defaults={'description': c['description']})
    created_cats.append(cat)
    print(f"Category: {cat.name}")

products = [
    {'name': 'Premium Wireless Headphones', 'price': 8999, 'discount_price': 6999, 'stock': 50, 'category': created_cats[0], 'description': 'High-quality wireless headphones with noise cancellation, 30hr battery, and premium sound quality.', 'is_featured': True, 'tags': 'headphones,wireless,audio'},
    {'name': 'Smart Watch Pro', 'price': 15999, 'discount_price': 12999, 'stock': 30, 'category': created_cats[0], 'description': 'Feature-packed smartwatch with health tracking, GPS, and 7-day battery life.', 'is_featured': True, 'tags': 'smartwatch,fitness,wearable'},
    {'name': 'Casual Cotton T-Shirt', 'price': 799, 'discount_price': 499, 'stock': 200, 'category': created_cats[1], 'description': 'Premium 100% cotton t-shirt, available in multiple colors. Perfect for everyday wear.', 'is_featured': False, 'tags': 'tshirt,casual,cotton'},
    {'name': 'Running Shoes Ultra', 'price': 5999, 'discount_price': 4499, 'stock': 75, 'category': created_cats[3], 'description': 'Lightweight running shoes with advanced cushioning technology for maximum performance.', 'is_featured': True, 'tags': 'shoes,running,sports'},
    {'name': 'Yoga Mat Premium', 'price': 1999, 'discount_price': None, 'stock': 100, 'category': created_cats[3], 'description': 'Non-slip, eco-friendly yoga mat with alignment lines. 6mm thickness for joint support.', 'is_featured': False, 'tags': 'yoga,fitness,mat'},
    {'name': 'The Art of Programming', 'price': 649, 'discount_price': None, 'stock': 150, 'category': created_cats[4], 'description': 'Comprehensive guide to software development and programming best practices.', 'is_featured': False, 'tags': 'book,programming,coding'},
    {'name': 'Laptop Stand Adjustable', 'price': 2499, 'discount_price': 1999, 'stock': 60, 'category': created_cats[2], 'description': 'Ergonomic aluminum laptop stand, adjustable height, compatible with all laptops.', 'is_featured': True, 'tags': 'laptop,stand,ergonomic'},
    {'name': 'Face Serum with Vitamin C', 'price': 1299, 'discount_price': 999, 'stock': 80, 'category': created_cats[5], 'description': 'Brightening vitamin C serum with hyaluronic acid. Reduces dark spots and boosts glow.', 'is_featured': False, 'tags': 'skincare,serum,beauty'},
]

for p in products:
    prod, created = Product.objects.get_or_create(
        name=p['name'],
        defaults={
            'description': p['description'],
            'price': p['price'],
            'discount_price': p['discount_price'],
            'stock': p['stock'],
            'category': p['category'],
            'is_featured': p['is_featured'],
            'is_active': True,
            'tags': p.get('tags', ''),
        }
    )
    print(f"Product {'created' if created else 'exists'}: {prod.name}")

print(f"\nDone! {Category.objects.count()} categories, {Product.objects.count()} products")
