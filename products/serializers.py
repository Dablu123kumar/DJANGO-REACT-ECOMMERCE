from rest_framework import serializers
from .models import Category, Product, ProductImage, Review, Wishlist


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'parent', 'product_count')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_primary', 'order')


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField()

    class Meta:
        model = Review
        fields = ('id', 'user_name', 'rating', 'title', 'comment', 'created_at')


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('rating', 'title', 'comment')


class ProductListSerializer(serializers.ModelSerializer):
    effective_price = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    primary_image = ProductImageSerializer(read_only=True)
    category_name = serializers.ReadOnlyField()
    seller_name = serializers.SerializerMethodField()

    def get_seller_name(self, obj):
        return obj.seller.store_name if obj.seller else "Admin"

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'price', 'discount_price', 'effective_price',
            'discount_percentage', 'stock', 'in_stock', 'is_featured', 'is_active',
            'approval_status', 'average_rating', 'review_count', 'primary_image', 
            'category_name', 'tags', 'sizes', 'seller', 'seller_name',
        )


class ProductDetailSerializer(serializers.ModelSerializer):
    effective_price = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_name = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = '__all__'


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        exclude = ('slug', 'created_at', 'updated_at')
        # Crucial: Prevent non-admins from injecting approved status in form submissions
        read_only_fields = ('approval_status', 'sku')


class WishlistSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'products')
