from rest_framework import serializers
from .models import Store
from accounts.models import User


class StoreSerializer(serializers.ModelSerializer):
    owner_email    = serializers.CharField(source='user.email',     read_only=True)
    owner_name     = serializers.CharField(source='user.full_name', read_only=True)
    product_count  = serializers.SerializerMethodField()

    class Meta:
        model  = Store
        fields = (
            'id', 'store_name', 'slug', 'description', 'logo',
            'phone', 'address', 'website', 'gstin',
            'status', 'rejection_reason',
            'created_at', 'approved_at',
            'owner_email', 'owner_name', 'product_count',
        )
        read_only_fields = ('slug', 'status', 'rejection_reason', 'approved_at')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class SellerRegisterSerializer(serializers.Serializer):
    """Creates a User (role=seller) + Store in one go."""
    # User fields
    full_name        = serializers.CharField(max_length=150)
    email            = serializers.EmailField()
    phone            = serializers.CharField(max_length=15, required=False, allow_blank=True)
    password         = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    # Store fields
    store_name       = serializers.CharField(max_length=150)
    description      = serializers.CharField(required=False, allow_blank=True)
    store_phone      = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address          = serializers.CharField(required=False, allow_blank=True)
    website          = serializers.URLField(required=False, allow_blank=True)
    gstin            = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        store_fields = {
            'store_name':  validated_data.pop('store_name'),
            'description': validated_data.pop('description', ''),
            'phone':       validated_data.pop('store_phone', ''),
            'address':     validated_data.pop('address', ''),
            'website':     validated_data.pop('website', ''),
            'gstin':       validated_data.pop('gstin', ''),
        }
        password = validated_data.pop('password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            full_name=validated_data['full_name'],
            phone=validated_data.get('phone', ''),
            role='seller',
        )
        Store.objects.create(user=user, **store_fields)
        return user


class AdminStoreSerializer(serializers.ModelSerializer):
    """Full admin view including rejection reason and action fields."""
    owner_email   = serializers.CharField(source='user.email',     read_only=True)
    owner_name    = serializers.CharField(source='user.full_name', read_only=True)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model  = Store
        fields = '__all__'
        read_only_fields = ('slug', 'user', 'created_at', 'updated_at')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()
