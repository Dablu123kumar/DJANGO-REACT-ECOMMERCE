from django.urls import path
from . import views

urlpatterns = [
    path('create-order/', views.CreateRazorpayOrderView.as_view(), name='payment-create-order'),
    path('verify/', views.VerifyPaymentView.as_view(), name='payment-verify'),
    path('webhook/', views.RazorpayWebhookView.as_view(), name='payment-webhook'),
]
