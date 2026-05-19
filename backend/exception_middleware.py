import traceback
from django.http import HttpResponse
from django.conf import settings

class ExceptionLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        # Expose the traceback as HTML response to help debug
        tb = traceback.format_exc()
        return HttpResponse(f"<h1>Debug Exception Traceback</h1><pre>{tb}</pre>", status=500)
