"""
URL configuration for config project.

Following Django best practices with clean URL patterns.
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from typing import List

urlpatterns: List = [
    path('admin/', admin.site.urls),
]

# Servir arquivos estáticos e media em desenvolvimento
# Em produção, isso deve ser feito pelo servidor web (Nginx, etc.)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
