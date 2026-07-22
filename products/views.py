from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Category, Product, ProductImage, Review, Wishlist
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer, ReviewSerializer, ReviewCreateSerializer,
    ProductImageSerializer, WishlistSerializer
)
from .filters import ProductFilter


class IsAdminOrReadOnly(BasePermission):
    """Allow read for all; write only for admin users."""
    def has_permission(self, request, view):
        from rest_framework.permissions import SAFE_METHODS
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsAdminOrSellerOrReadOnly(BasePermission):
    """Allow read for all; write only for admin or approved sellers."""
    def has_permission(self, request, view):
        from rest_framework.permissions import SAFE_METHODS
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        # Admin always permitted
        if request.user.is_admin:
            return True
        # Role based for sellers
        return request.user.role == 'seller'


class CategoryListView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrSellerOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)
        qs = Category.objects.filter(is_active=True)
        if tenant:
            qs = qs.filter(tenant=tenant)
        return qs



class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        return Category.objects.all()



class ProductListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'tags', 'category__name']
    ordering_fields = ['price', 'effective_price', 'created_at', 'name', 'average_rating']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateUpdateSerializer
        return ProductListSerializer

    def perform_create(self, serializer):
        # Admin creations are auto-approved
        if self.request.user.is_admin:
            serializer.save(approval_status='approved')
        else:
            serializer.save()

    def filter_queryset(self, queryset):
        # Map ordering from price/ -price to effective_price/ -effective_price
        ordering = self.request.query_params.get('ordering', '')
        if ordering == 'price':
            self.request.GET = self.request.GET.copy()
            self.request.GET['ordering'] = 'effective_price'
        elif ordering == '-price':
            self.request.GET = self.request.GET.copy()
            self.request.GET['ordering'] = '-effective_price'
            
        return super().filter_queryset(queryset)

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)
        qs = Product.objects.filter(is_active=True).select_related('category').prefetch_related('images', 'reviews')
        
        # Tenant filter
        if tenant:
            qs = qs.filter(tenant=tenant)

        # Non-admins can only see products that are active AND explicitly approved
        if not (self.request.user.is_authenticated and self.request.user.is_admin):
            qs = qs.filter(is_active=True, approval_status='approved')
            
        from django.db.models import F, Value, DecimalField
        from django.db.models.functions import Coalesce
        qs = qs.annotate(
            effective_price=F('price') - Coalesce('discount_price', Value(0, output_field=DecimalField()))
        )
        return qs



class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = Product.objects.all().select_related('category').prefetch_related('images', 'reviews__user')
        user = self.request.user
        # Allow Admins to view everything
        if user.is_authenticated and user.is_admin:
            return qs
        # Restrict general access to approved ONLY. 
        # Edge case: Allow seller owner to view their own pending product detail.
        if user.is_authenticated and hasattr(user, 'store'):
            from django.db.models import Q
            return qs.filter(Q(approval_status='approved', is_active=True) | Q(seller=user.store))
        
        return qs.filter(approval_status='approved', is_active=True)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer


class ProductImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        
        # Verify ownership (Admin or Seller)
        if not request.user.is_admin:
            if request.user.role != 'seller' or not hasattr(request.user, 'store') or product.seller != request.user.store:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
                
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        is_primary = request.data.get('is_primary', 'false').lower() == 'true'
        
        # If it's the first image, make it primary automatically
        if not product.images.exists():
            is_primary = True
            
        if is_primary:
            product.images.update(is_primary=False)
            
        img = ProductImage.objects.create(
            product=product,
            image=image_file,
            is_primary=is_primary
        )
        return Response(ProductImageSerializer(img).data, status=status.HTTP_201_CREATED)


class ProductImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk, image_id):
        product = get_object_or_404(Product, pk=pk)
        
        # Verify ownership
        if not request.user.is_admin:
            if request.user.role != 'seller' or not hasattr(request.user, 'store') or product.seller != request.user.store:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
                
        image = get_object_or_404(ProductImage, pk=image_id, product=product)
        image.delete()
        
        # If deleted was primary, make another one primary
        if image.is_primary and product.images.exists():
            first_img = product.images.first()
            first_img.is_primary = True
            first_img.save()
            
        return Response({'message': 'Image deleted'}, status=status.HTTP_204_NO_CONTENT)


class FeaturedProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)
        qs = Product.objects.filter(is_featured=True, is_active=True, approval_status='approved')
        if tenant:
            qs = qs.filter(tenant=tenant)
        return qs.prefetch_related('images')



class ReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        product = get_object_or_404(Product, slug=self.kwargs['slug'])
        return Review.objects.filter(product=product)

    def perform_create(self, serializer):
        product = get_object_or_404(Product, slug=self.kwargs['slug'])
        serializer.save(user=self.request.user, product=product)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        return Response(WishlistSerializer(wishlist).data)

    def post(self, request):
        product_id = request.data.get('product_id')
        product = get_object_or_404(Product, id=product_id)
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        wishlist.products.add(product)
        return Response({'message': 'Added to wishlist.'})

    def delete(self, request):
        product_id = request.data.get('product_id')
        product = get_object_or_404(Product, id=product_id)
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        wishlist.products.remove(product)
        return Response({'message': 'Removed from wishlist.'})


class AdminProductStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'error': 'Admin only'}, status=403)
        total = Product.objects.count()
        active = Product.objects.filter(is_active=True).count()
        oos = Product.objects.filter(stock=0, is_active=True).count()
        return Response({
            'total_products': total,
            'active_products': active,
            'out_of_stock': oos,
        })


class AdminProductApprovalView(APIView):
    """Allows administrators to quickly Approve or Reject a submitted product."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, action):
        if not request.user.is_admin:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        product = get_object_or_404(Product, pk=pk)
        
        if action == 'approve':
            product.approval_status = 'approved'
        elif action == 'reject':
            product.approval_status = 'rejected'
        elif action == 'pending':
            product.approval_status = 'pending'
        else:
            return Response({'error': 'Invalid action (must be approve, reject, or pending)'}, status=status.HTTP_400_BAD_REQUEST)
        
        product.save()
        
        return Response({
            'message': f'Product {action}d successfully',
            'id': product.id,
            'approval_status': product.approval_status
        }, status=status.HTTP_200_OK)
