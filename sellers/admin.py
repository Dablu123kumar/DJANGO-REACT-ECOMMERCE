from django.contrib import admin
from .models import Store


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display  = ('store_name', 'user', 'status', 'created_at', 'approved_at')
    list_filter   = ('status',)
    search_fields = ('store_name', 'user__email', 'user__full_name')
    readonly_fields = ('slug', 'created_at', 'updated_at', 'approved_at')
    ordering = ('-created_at',)
    actions = ['approve_stores', 'reject_stores']

    def approve_stores(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='approved', approved_at=timezone.now())
        self.message_user(request, f'{queryset.count()} stores approved.')
    approve_stores.short_description = '✅ Approve selected stores'

    def reject_stores(self, request, queryset):
        queryset.update(status='rejected', rejection_reason='Rejected by admin.')
        self.message_user(request, f'{queryset.count()} stores rejected.')
    reject_stores.short_description = '❌ Reject selected stores'
