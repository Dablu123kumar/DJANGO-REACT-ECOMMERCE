from django.db import models
from django.conf import settings
import uuid
from PIL import Image
from io import BytesIO
from django.core.files import File


from tenants.models import TenantAwareModel

class Category(TenantAwareModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True, max_length=500)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['name', 'tenant'], name='unique_category_name_per_tenant'),
            models.UniqueConstraint(fields=['slug', 'tenant'], name='unique_category_slug_per_tenant')
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base = slugify(self.name)
            self.slug = base
            n = 1
            while Category.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f'{base}-{n}'
                n += 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def product_count(self):
        # Sum direct products and products in all subcategories
        direct = self.products.filter(is_active=True).count()
        indirect = sum(child.products.filter(is_active=True).count() for child in self.children.all())
        return direct + indirect


class Product(TenantAwareModel):
    APPROVAL_CHOICES = (
        ('pending',  'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    seller   = models.ForeignKey(
        'sellers.Store',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='products',
        help_text='Leave blank for platform-owned products',
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(blank=True, max_length=300)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=100, blank=True)
    tags = models.CharField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=10, choices=APPROVAL_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['slug', 'tenant'], name='unique_product_slug_per_tenant'),
            models.UniqueConstraint(fields=['sku', 'tenant'], name='unique_product_sku_per_tenant')
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        if not self.sku:
            self.sku = f'SKU-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def effective_price(self):
        if self.discount_price:
            return max(self.price - self.discount_price, 0)
        return self.price

    @property
    def discount_percentage(self):
        if self.discount_price and self.price > 0:
            return round((self.discount_price / self.price) * 100)
        return 0

    @property
    def in_stock(self):
        return self.stock > 0

    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if not reviews:
            return 0
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

    @property
    def review_count(self):
        return self.reviews.count()

    @property
    def primary_image(self):
        return self.images.filter(is_primary=True).first() or self.images.first()

    @property
    def category_name(self):
        return self.category.name if self.category else ''


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/', max_length=500)
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', '-is_primary']

    def __str__(self):
        return f'{self.product.name} - Image {self.id}'

    def save(self, *args, **kwargs):
        if self.image:
            # Basic optimization and resizing
            img = Image.open(self.image)
            
            # Ensure proper orientation
            try:
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            # Max bounds 1200px
            max_size = (1200, 1200)
            if img.height > max_size[1] or img.width > max_size[0]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Keep transparency (RGBA). Convert others as needed.
            if img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGBA')

            output = BytesIO()
            # Convert and compress as WebP to fully support transparency + ultra small size
            img.save(output, format='WEBP', quality=85)
            output.seek(0)

            # Force WebP extension on storage
            import os
            base_name = os.path.splitext(os.path.basename(self.image.name))[0]
            self.image = File(output, name=f"{base_name}.webp")

        super().save(*args, **kwargs)


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.product.name} ({self.rating}★)'

    @property
    def user_name(self):
        return self.user.full_name


class Wishlist(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} wishlist'
