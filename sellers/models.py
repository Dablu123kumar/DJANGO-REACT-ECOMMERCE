from django.db import models
from django.utils.text import slugify
import uuid


from tenants.models import TenantAwareModel

class Store(TenantAwareModel):
    STATUS_CHOICES = (
        ('pending',  'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='store',
    )
    store_name       = models.CharField(max_length=150)
    slug             = models.SlugField(blank=True)
    description      = models.TextField(blank=True)
    logo             = models.ImageField(upload_to='store_logos/', blank=True, null=True)
    phone            = models.CharField(max_length=20, blank=True)
    address          = models.TextField(blank=True)
    website          = models.URLField(blank=True)
    gstin            = models.CharField(max_length=20, blank=True, help_text='GST Identification Number')
    status           = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)
    approved_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Store'
        verbose_name_plural = 'Stores'
        constraints = [
            models.UniqueConstraint(fields=['slug', 'tenant'], name='unique_store_slug_per_tenant')
        ]

    def __str__(self):
        return f'{self.store_name} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.store_name)
            self.slug = base
            n = 1
            while Store.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f'{base}-{n}'
                n += 1
        super().save(*args, **kwargs)

    @property
    def is_approved(self):
        return self.status == 'approved'
