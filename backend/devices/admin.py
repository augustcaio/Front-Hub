from django.contrib import admin
from .models import Device, Measurement


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    """
    Admin configuration for Device model.
    """
    list_display: list[str] = ['public_id', 'name', 'status', 'created_at', 'updated_at']
    list_filter: list[str] = ['status', 'created_at']
    search_fields: list[str] = ['name', 'public_id']
    readonly_fields: list[str] = ['public_id', 'id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'status', 'description')
        }),
        ('Identificadores', {
            'fields': ('id', 'public_id')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at')
        }),
    )


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

