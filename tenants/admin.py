from django.contrib import admin
from .models import Tenant

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant_id', 'is_active', 'email_host_user', 'created_at')
    search_fields = ('name', 'tenant_id')
    list_filter = ('is_active', 'created_at')
    ordering = ('created_at',)

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'tenant_id', 'is_active')
        }),
        ('SMTP Configuration (Tenant-Specific)', {
            'fields': (
                'email_host',
                'email_port',
                'email_use_tls',
                'email_host_user',
                'email_host_password',
                'default_from_email'
            ),
            'description': 'Configure SMTP details unique to this tenant. If left blank, settings from the global .env file will be used.'
        }),
    )
