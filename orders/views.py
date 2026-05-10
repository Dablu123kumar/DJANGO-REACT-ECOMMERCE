from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from .models import Cart, CartItem, Order, OrderItem, Coupon
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer, CouponValidateSerializer
from products.models import Product


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        product = get_object_or_404(Product, id=product_id, is_active=True)
        if product.stock < quantity:
            return Response({'error': f'Only {product.stock} units available.'}, status=400)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared.'})


class CartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, item_id):
        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        quantity = int(request.data.get('quantity', 1))
        if quantity <= 0:
            item.delete()
        else:
            if item.product.stock < quantity:
                return Response({'error': f'Only {item.product.stock} units available.'}, status=400)
            item.quantity = quantity
            item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.delete()
        return Response(CartSerializer(cart).data)


class CouponValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        code = serializer.validated_data['code']
        order_total = serializer.validated_data['order_total']
        try:
            coupon = Coupon.objects.get(code=code.upper())
        except Coupon.DoesNotExist:
            return Response({'error': 'Coupon not found.'}, status=404)
        valid, message = coupon.is_valid(order_total)
        if not valid:
            return Response({'error': message}, status=400)
        discount = coupon.get_discount_amount(order_total)
        return Response({
            'code': coupon.code,
            'description': coupon.description,
            'discount_type': coupon.discount_type,
            'discount_value': str(coupon.discount_value),
            'discount_amount': str(discount),
        })


class OrderPlaceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart = get_object_or_404(Cart, user=request.user)
        if not cart.items.exists():
            return Response({'error': 'Cart is empty.'}, status=400)

        shipping_address = request.data.get('shipping_address', {})
        coupon_code = request.data.get('coupon_code', '').upper()
        payment_method = request.data.get('payment_method', 'online')

        subtotal = cart.subtotal
        discount = 0
        coupon_obj = None

        if coupon_code:
            try:
                coupon_obj = Coupon.objects.get(code=coupon_code)
                valid, msg = coupon_obj.is_valid(subtotal)
                if valid:
                    discount = coupon_obj.get_discount_amount(subtotal)
                    coupon_obj.used_count += 1
                    coupon_obj.save()
            except Coupon.DoesNotExist:
                pass

        shipping_charge = 0 if subtotal >= 500 else 49
        total = subtotal - discount + shipping_charge

        order = Order.objects.create(
            user=request.user,
            coupon=coupon_obj,
            subtotal=subtotal,
            discount_amount=discount,
            shipping_charge=shipping_charge,
            total_price=total,
            shipping_address=shipping_address,
            payment_method=payment_method,
        )

        for item in cart.items.all():
            primary_img = item.product.primary_image
            img_url = ''
            if primary_img and primary_img.image:
                try:
                    img_url = primary_img.image.url
                except ValueError:
                    pass

            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                product_image=img_url,
                unit_price=item.unit_price,
                quantity=item.quantity,
            )
            # Decrement stock
            item.product.stock -= item.quantity
            item.product.save()

        cart.items.all().delete()

        # Send confirmation email (console in dev)
        try:
            send_mail(
                subject=f'Order Confirmed — #{order.order_number}',
                message=f'Hi {request.user.full_name},\n\nYour order #{order.order_number} has been placed.\nTotal: ₹{order.total_price}\n\nThank you for shopping with ShopElite!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin:
            return Order.objects.all().prefetch_related('items')
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)


class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        if order.order_status in ['delivered', 'cancelled']:
            return Response({'error': f'Cannot cancel order with status: {order.order_status}'}, status=400)
        order.order_status = 'cancelled'
        order.save()
        return Response(OrderSerializer(order).data)


class OrderUpdateView(APIView):
    """Admin-only: update order status."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_admin:
            return Response({'error': 'Admin only'}, status=403)
        order = get_object_or_404(Order, pk=pk)
        order_status = request.data.get('order_status')
        payment_status = request.data.get('payment_status')
        tracking = request.data.get('tracking_number')
        if order_status:
            order.order_status = order_status
        if payment_status:
            order.payment_status = payment_status
        if tracking:
            order.tracking_number = tracking
        order.save()
        return Response(OrderSerializer(order).data)


class AdminOrderStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'error': 'Admin only'}, status=403)
        from django.db.models import Sum
        total = Order.objects.count()
        pending = Order.objects.filter(order_status='pending').count()
        revenue = Order.objects.filter(payment_status='paid').aggregate(r=Sum('total_price'))['r'] or 0
        return Response({
            'total_orders': total,
            'pending_orders': pending,
            'total_revenue': str(revenue),
        })
