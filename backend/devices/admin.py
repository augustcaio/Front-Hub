from django.contrib import admin
from .models import Category, Device, Measurement, Alert


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin configuration for Category model.
    """
    list_display: list[str] = ['id', 'name', 'created_at', 'updated_at']
    list_filter: list[str] = ['created_at']
    search_fields: list[str] = ['name', 'description']
    readonly_fields: list[str] = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'description')
        }),
        ('Identificador', {
            'fields': ('id',)
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    """
    Admin configuration for Device model.
    """
    list_display: list[str] = ['public_id', 'name', 'category', 'status', 'created_at', 'updated_at']
    list_filter: list[str] = ['status', 'category', 'created_at']
    search_fields: list[str] = ['name', 'public_id', 'category__name']
    readonly_fields: list[str] = ['public_id', 'id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'category', 'status', 'description')
        }),
        ('Identificadores', {
            'fields': ('id', 'public_id')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related to avoid N+1 queries."""
        qs = super().get_queryset(request)
        return qs.select_related('category')


@admin.register(Measurement)
class MeasurementAdmin(admin.ModelAdmin):
    """
    Admin configuration for Measurement model.
    """
    list_display: list[str] = ['id', 'device', 'metric', 'value', 'unit', 'timestamp']
    list_filter: list[str] = ['metric', 'unit', 'timestamp', 'device']
    search_fields: list[str] = ['metric', 'device__name', 'device__public_id']
    readonly_fields: list[str] = ['id']
    date_hierarchy: str = 'timestamp'
    
    fieldsets = (
        ('Medição', {
            'fields': ('device', 'metric', 'value', 'unit', 'timestamp')
        }),
        ('Identificador', {
            'fields': ('id',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related to avoid N+1 queries."""
        qs = super().get_queryset(request)
        return qs.select_related('device')


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    """
    Admin configuration for Alert model.
    """
    list_display: list[str] = ['id', 'title', 'device', 'severity', 'status', 'created_at', 'resolved_at']
    list_filter: list[str] = ['status', 'severity', 'created_at', 'device']
    search_fields: list[str] = ['title', 'message', 'device__name', 'device__public_id']
    readonly_fields: list[str] = ['id', 'created_at', 'updated_at']
    date_hierarchy: str = 'created_at'
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('device', 'title', 'message')
        }),
        ('Status e Severidade', {
            'fields': ('severity', 'status', 'resolved_at')
        }),
        ('Identificador', {
            'fields': ('id',)
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related to avoid N+1 queries."""
        qs = super().get_queryset(request)
        return qs.select_related('device')

