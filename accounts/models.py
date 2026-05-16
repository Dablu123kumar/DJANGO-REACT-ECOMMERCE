from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from tenants.models import TenantAwareModel



class UserManager(BaseUserManager):
    def get_queryset(self):
        from tenants.utils import get_current_tenant
        tenant = get_current_tenant()
        queryset = super().get_queryset()
        if tenant:
            return queryset.filter(tenant=tenant)
        return queryset

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        
        # Automatically assign tenant on creation from thread local if available
        from tenants.utils import get_current_tenant
        tenant = get_current_tenant()
        if tenant and 'tenant' not in extra_fields:
            extra_fields['tenant'] = tenant
            
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('seller',   'Seller'),
        ('admin',    'Admin'),
    )

    # email is not globally unique, but unique per tenant
    email = models.EmailField()
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True
    )
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()
    # Manager that bypasses tenant filtering if we ever need to query across all tenants
    all_objects = BaseUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
        constraints = [
            models.UniqueConstraint(fields=['email', 'tenant'], name='unique_email_per_tenant')
        ]

    def __str__(self):
        tenant_name = self.tenant.tenant_id if self.tenant else "Global"
        return f'{self.email} ({self.role}) [{tenant_name}]'

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_seller(self):
        return self.role == 'seller'

    def save(self, *args, **kwargs):
        from tenants.utils import get_current_tenant
        # If registering via web, auto-populate tenant if null
        if not self.tenant_id:
            tenant = get_current_tenant()
            if tenant:
                self.tenant = tenant
        super().save(*args, **kwargs)



class SavedAddress(TenantAwareModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_addresses')

    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    country = models.CharField(max_length=100, default='India')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.full_name} - {self.city} ({self.user.email})"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Unset other default addresses for this user
            SavedAddress.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)
