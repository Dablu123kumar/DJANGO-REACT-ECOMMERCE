from django.http import JsonResponse
from .models import Tenant
from .utils import set_current_tenant

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'OPTIONS':
            return self.get_response(request)

        tenant_id = request.headers.get('X-Tenant-ID')
        path = request.path

        # List of public paths that do NOT require a tenant
        is_exempt = (
            not path.startswith('/api/') or
            path.startswith('/api/schema/') or
            path.startswith('/api/docs/') or
            path.startswith('/api/redoc/')
        )

        if tenant_id:
            try:
                tenant = Tenant.objects.get(tenant_id=tenant_id, is_active=True)
                request.tenant = tenant
                set_current_tenant(tenant)
                # print(f"DEBUG: Tenant set to {tenant_id}")
            except Tenant.DoesNotExist:
                # print(f"DEBUG: Tenant {tenant_id} NOT FOUND")
                return JsonResponse({'error': f'Tenant "{tenant_id}" not found or inactive.'}, status=404)
        else:
            # print("DEBUG: No X-Tenant-ID header found")
            if not is_exempt:
                return JsonResponse({'error': 'X-Tenant-ID header is required.'}, status=400)
            request.tenant = None
            set_current_tenant(None)

        response = self.get_response(request)
        
        # Clean up to avoid cross-pollination of data in subsequent requests (if any)
        set_current_tenant(None)
        
        return response
