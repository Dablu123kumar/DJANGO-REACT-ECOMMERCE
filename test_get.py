import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from accounts.models import User
from accounts.views import SavedAddressListCreateView
from rest_framework.test import force_authenticate

user = User.objects.first()
factory = RequestFactory()
request = factory.get('/api/auth/addresses/')

force_authenticate(request, user=user)

view = SavedAddressListCreateView.as_view()
response = view(request)
print("STATUS:", response.status_code)
if hasattr(response, 'data'):
    print("DATA:", response.data)
