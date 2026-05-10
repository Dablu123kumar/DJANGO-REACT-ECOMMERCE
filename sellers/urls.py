from django.urls import path
from . import views

urlpatterns = [
    # Seller self-service
    path('seller/register/',   views.SellerRegisterView.as_view(),    name='seller-register'),
    path('seller/store/',      views.SellerStoreView.as_view(),        name='seller-store'),
    path('seller/dashboard/',  views.SellerDashboardView.as_view(),    name='seller-dashboard'),
    path('seller/products/',   views.SellerProductListView.as_view(),  name='seller-products'),
    path('seller/products/<int:pk>/', views.SellerProductDetailView.as_view(), name='seller-product-detail'),
    path('seller/orders/',     views.SellerOrderListView.as_view(),    name='seller-orders'),

    # Admin management
    path('admin/sellers/',                views.AdminSellerListView.as_view(),    name='admin-seller-list'),
    path('admin/sellers/<int:pk>/',       views.AdminSellerDetailView.as_view(),  name='admin-seller-detail'),
    path('admin/sellers/<int:pk>/approve/', views.AdminSellerApproveView.as_view(), name='admin-seller-approve'),
    path('admin/sellers/<int:pk>/reject/',  views.AdminSellerRejectView.as_view(),  name='admin-seller-reject'),
]
