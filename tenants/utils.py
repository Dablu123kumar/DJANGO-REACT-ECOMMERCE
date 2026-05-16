import contextvars

_current_tenant = contextvars.ContextVar('current_tenant', default=None)

def get_current_tenant():
    """Get the current tenant instance for this request context."""
    return _current_tenant.get()

def set_current_tenant(tenant):
    """Set the current tenant instance for this request context."""
    _current_tenant.set(tenant)
