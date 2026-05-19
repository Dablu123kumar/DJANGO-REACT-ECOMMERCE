from django.core.mail.backends.smtp import EmailBackend
from django.conf import settings
from tenants.utils import get_current_tenant

class TenantEmailBackend(EmailBackend):
    def open(self):
        tenant = get_current_tenant()
        if tenant and tenant.email_host_user and tenant.email_host_password:
            self.host = tenant.email_host or 'smtp.gmail.com'
            self.port = tenant.email_port or 587
            self.use_tls = tenant.email_use_tls
            self.username = tenant.email_host_user
            self.password = tenant.email_host_password
        else:
            self.host = settings.EMAIL_HOST
            self.port = settings.EMAIL_PORT
            self.use_tls = settings.EMAIL_USE_TLS
            self.username = settings.EMAIL_HOST_USER
            self.password = settings.EMAIL_HOST_PASSWORD
            
        return super().open()

    def send_messages(self, email_messages):
        tenant = get_current_tenant()
        if tenant and tenant.email_host_user:
            from_email = tenant.default_from_email or tenant.email_host_user
            for message in email_messages:
                # If message is using default from email, change to tenant's email
                if message.from_email == settings.DEFAULT_FROM_EMAIL or not message.from_email:
                    message.from_email = from_email
        return super().send_messages(email_messages)
