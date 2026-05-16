from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('products/featured/', views.FeaturedProductsView.as_view(), name='product-featured'),
    path('products/admin/stats/', views.AdminProductStatsView.as_view(), name='product-admin-stats'),
    path('products/<int:pk>/approval/<str:action>/', views.AdminProductApprovalView.as_view(), name='product-admin-approval'),
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/images/', views.ProductImageUploadView.as_view(), name='product-images'),
    path('products/<int:pk>/images/<int:image_id>/', views.ProductImageDeleteView.as_view(), name='product-image-delete'),
    path('products/<slug:slug>/reviews/', views.ReviewListCreateView.as_view(), name='product-reviews'),
    path('wishlist/', views.WishlistView.as_view(), name='wishlist'),
]
