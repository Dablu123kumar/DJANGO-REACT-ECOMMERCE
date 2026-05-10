import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from accounts.models import User
from accounts.views import SavedAddressListCreateView
from rest_framework.test import force_authenticate

user = User.objects.first()
factory = RequestFactory()
request = factory.post('/api/auth/addresses/', {
    'full_name': 'Test User', 
    'phone': '1234567890', 
    'address_line1': '123 Test St',
    'city': 'Mumbai', 
    'state': 'MH', 
    'pincode': '400001', 
    'country': 'India', 
    'is_default': True
}, content_type='application/json')

force_authenticate(request, user=user)

view = SavedAddressListCreateView.as_view()
response = view(request)
print("STATUS:", response.status_code)
if hasattr(response, 'data'):
    print("DATA:", response.data)
