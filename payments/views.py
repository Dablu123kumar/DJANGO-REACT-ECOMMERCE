import razorpay
import hmac
import hashlib
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from orders.models import Order


def get_razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=404)

        if not settings.RAZORPAY_KEY_ID:
            return Response({'error': 'Razorpay not configured.'}, status=500)

        client = get_razorpay_client()
        amount_paise = int(order.total_price * 100)
        try:
            razorpay_order = client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': order.order_number,
                'notes': {'order_id': str(order.id)},
            })
        except Exception as e:
            return Response({'error': f'Payment gateway error: {str(e)}'}, status=500)
        order.razorpay_order_id = razorpay_order['id']
        order.save()

        return Response({
            'razorpay_order_id': razorpay_order['id'],
            'amount': amount_paise,
            'currency': 'INR',
            'order_number': order.order_number,
            'user_name': request.user.full_name,
            'user_email': request.user.email,
            'user_phone': request.user.phone or '',
        })


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        # HMAC verification
        body = f'{razorpay_order_id}|{razorpay_payment_id}'
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            body.encode(),
            hashlib.sha256,
        ).hexdigest()

        if expected_signature != razorpay_signature:
            return Response({'error': 'Invalid payment signature.'}, status=400)

        try:
            order = Order.objects.get(razorpay_order_id=razorpay_order_id, user=request.user)
            order.razorpay_payment_id = razorpay_payment_id
            order.payment_status = 'paid'
            order.order_status = 'confirmed'
            order.save()
            return Response({'message': 'Payment verified successfully.', 'order_id': order.id})
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=404)


@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        webhook_secret = settings.RAZORPAY_KEY_SECRET
        signature = request.headers.get('X-Razorpay-Signature', '')
        body = request.body

        expected = hmac.new(webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return Response({'error': 'Invalid signature'}, status=400)

        payload = request.data
        event = payload.get('event')

        if event == 'payment.captured':
            payment = payload.get('payload', {}).get('payment', {}).get('entity', {})
            razorpay_order_id = payment.get('order_id')
            try:
                order = Order.objects.get(razorpay_order_id=razorpay_order_id)
                order.payment_status = 'paid'
                order.order_status = 'confirmed'
                order.save()
            except Order.DoesNotExist:
                pass

        return Response({'status': 'ok'})
