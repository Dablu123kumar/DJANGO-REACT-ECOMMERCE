from django.contrib import admin
from .models import Tenant

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant_id', 'is_active', 'created_at')
    search_fields = ('name', 'tenant_id')
    list_filter = ('is_active', 'created_at')
    ordering = ('created_at',)
