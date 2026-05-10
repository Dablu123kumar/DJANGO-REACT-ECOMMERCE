from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, generics
from django.utils import timezone
from django.db.models import Sum, Count, Q
from .models import Store
from .serializers import StoreSerializer, SellerRegisterSerializer, AdminStoreSerializer


# ─── Permission helpers ───────────────────────────────────────────────────────

class IsApprovedSeller(IsAuthenticated):
    """Request user must have an approved Store."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return (
            request.user.role == 'seller'
            and hasattr(request.user, 'store')
            and request.user.store.is_approved
        )


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_admin


# ─── Public: Seller Registration ──────────────────────────────────────────────

class SellerRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SellerRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(
            {'message': 'Store application submitted. You will be notified once approved.'},
            status=status.HTTP_201_CREATED,
        )


# ─── Seller: own store info & status ─────────────────────────────────────────

class SellerStoreView(APIView):
    """GET own store details — accessible even if pending."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'seller':
            return Response({'error': 'Not a seller account.'}, status=403)
        try:
            store = request.user.store
        except Store.DoesNotExist:
            return Response({'error': 'Store not found.'}, status=404)
        return Response(StoreSerializer(store).data)

    def patch(self, request):
        """Seller can update store info (not status)."""
        if request.user.role != 'seller':
            return Response({'error': 'Not a seller account.'}, status=403)
        store = request.user.store
        serializer = StoreSerializer(store, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


# ─── Seller: Dashboard stats ──────────────────────────────────────────────────

class SellerDashboardView(APIView):
    permission_classes = [IsApprovedSeller]

    def get(self, request):
        store = request.user.store
        from products.models import Product
        from orders.models import OrderItem, Order

        products = Product.objects.filter(seller=store)
        total_products = products.count()
        active_products = products.filter(is_active=True).count()
        out_of_stock = products.filter(stock=0, is_active=True).count()

        order_items = OrderItem.objects.filter(product__seller=store)
        total_orders = order_items.values('order').distinct().count()
        total_revenue = order_items.filter(
            order__payment_status='paid'
        ).aggregate(r=Sum('total_price'))['r'] or 0

        pending_orders = order_items.filter(
            order__order_status='pending'
        ).values('order').distinct().count()

        return Response({
            'store': StoreSerializer(store).data,
            'total_products': total_products,
            'active_products': active_products,
            'out_of_stock': out_of_stock,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'total_revenue': str(total_revenue),
        })


# ─── Seller: own products ─────────────────────────────────────────────────────

class SellerProductListView(APIView):
    permission_classes = [IsApprovedSeller]

    def get(self, request):
        from products.models import Product
        from products.serializers import ProductListSerializer
        qs = Product.objects.filter(seller=request.user.store)
        data = ProductListSerializer(qs, many=True, context={'request': request}).data
        return Response(data)

    def post(self, request):
        from products.serializers import ProductCreateUpdateSerializer
        serializer = ProductCreateUpdateSerializer(
            data=request.data, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(seller=request.user.store)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsApprovedSeller]

    def get_queryset(self):
        from products.models import Product
        return Product.objects.filter(seller=self.request.user.store)

    def get_serializer_class(self):
        from products.serializers import ProductCreateUpdateSerializer, ProductDetailSerializer
        if self.request.method in ['PUT', 'PATCH']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer


# ─── Seller: own orders ───────────────────────────────────────────────────────

class SellerOrderListView(APIView):
    permission_classes = [IsApprovedSeller]

    def get(self, request):
        from orders.models import Order
        from orders.serializers import OrderSerializer
        # Orders that contain at least one item from this seller's products
        orders = Order.objects.filter(
            items__product__seller=request.user.store
        ).distinct().order_by('-created_at')
        data = OrderSerializer(orders, many=True).data
        return Response(data)


# ─── Admin: manage sellers ────────────────────────────────────────────────────

class AdminSellerListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status')
        qs = Store.objects.select_related('user').all()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(AdminStoreSerializer(qs, many=True).data)


class AdminSellerApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            store = Store.objects.get(pk=pk)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found.'}, status=404)
        store.status = 'approved'
        store.rejection_reason = ''
        store.approved_at = timezone.now()
        store.save()
        return Response(AdminStoreSerializer(store).data)


class AdminSellerRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            store = Store.objects.get(pk=pk)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found.'}, status=404)
        reason = request.data.get('reason', '')
        store.status = 'rejected'
        store.rejection_reason = reason
        store.approved_at = None
        store.save()
        return Response(AdminStoreSerializer(store).data)


class AdminSellerDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            store = Store.objects.get(pk=pk)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found.'}, status=404)
        return Response(AdminStoreSerializer(store).data)
