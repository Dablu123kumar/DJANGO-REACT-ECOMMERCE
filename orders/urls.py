from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/items/<int:item_id>/', views.CartItemView.as_view(), name='cart-item'),
    path('coupons/validate/', views.CouponValidateView.as_view(), name='coupon-validate'),
    path('orders/place/', views.OrderPlaceView.as_view(), name='order-place'),
    path('orders/admin/stats/', views.AdminOrderStatsView.as_view(), name='order-admin-stats'),
    path('orders/', views.OrderListView.as_view(), name='order-list'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/cancel/', views.OrderCancelView.as_view(), name='order-cancel'),
    path('orders/<int:pk>/update/', views.OrderUpdateView.as_view(), name='order-update'),
]
