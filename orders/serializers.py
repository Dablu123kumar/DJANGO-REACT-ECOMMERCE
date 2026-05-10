from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, Coupon
from products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    unit_price = serializers.ReadOnlyField()
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity', 'unit_price', 'total_price')


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total_items', 'subtotal')


class OrderItemSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_image', 'unit_price', 'quantity', 'total_price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'order_status', 'payment_status', 'payment_method',
            'subtotal', 'discount_amount', 'shipping_charge', 'total_price',
            'shipping_address', 'razorpay_order_id', 'razorpay_payment_id',
            'tracking_number', 'notes', 'created_at', 'updated_at',
            'items', 'user_email',
        )
        read_only_fields = ('order_number', 'created_at', 'updated_at', 'user_email')


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    order_total = serializers.DecimalField(max_digits=12, decimal_places=2)
