from django.db import models
from django.core.exceptions import ValidationError

class Tenant(models.Model):
    name = models.CharField(max_length=100)
    tenant_id = models.CharField(max_length=100, unique=True)  # alphanumeric id
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # SMTP Configuration
    email_host = models.CharField(max_length=255, blank=True, null=True, default='smtp.gmail.com')
    email_port = models.IntegerField(blank=True, null=True, default=587)
    email_use_tls = models.BooleanField(default=True)
    email_host_user = models.CharField(max_length=255, blank=True, null=True)
    email_host_password = models.CharField(max_length=255, blank=True, null=True)
    default_from_email = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.tenant_id})"


class TenantManager(models.Manager):
    def get_queryset(self):
        from .utils import get_current_tenant
        tenant = get_current_tenant()
        queryset = super().get_queryset()
        
        if tenant:
            return queryset.filter(tenant=tenant)
        return queryset


class TenantAwareModel(models.Model):
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name="%(class)ss",  # dynamically generate related name, e.g. tenant.products
        null=True,
        blank=True
    )

    objects = TenantManager()
    # Keep base_objects if we ever need to query across all tenants in code
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        from .utils import get_current_tenant
        
        # Automatically assign tenant if it's not set and we have a current tenant in context
        if not hasattr(self, 'tenant') or self.tenant_id is None:
            tenant = get_current_tenant()
            if tenant:
                self.tenant = tenant
            else:
                # Only raise error if saving from a context that should have a tenant
                pass
        
        super().save(*args, **kwargs)

