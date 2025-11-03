from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('devices', '0004_add_category_to_device'),
    ]

    operations = [
        migrations.CreateModel(
            name='MeasurementThreshold',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('metric_name', models.CharField(db_index=True, help_text='Metric name this threshold applies to (e.g., temperature)', max_length=100)),
                ('min_limit', models.DecimalField(decimal_places=10, help_text='Minimum allowed value for the metric', max_digits=20)),
                ('max_limit', models.DecimalField(decimal_places=10, help_text='Maximum allowed value for the metric', max_digits=20)),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Whether this threshold is active')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Threshold creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, db_index=True, help_text='Last update timestamp')),
                ('device', models.ForeignKey(db_index=True, help_text='Device this threshold belongs to', on_delete=models.deletion.CASCADE, related_name='thresholds', to='devices.device')),
            ],
            options={
                'verbose_name': 'Measurement Threshold',
                'verbose_name_plural': 'Measurement Thresholds',
                'db_table': 'measurement_thresholds',
                'ordering': ['metric_name'],
            },
        ),
        migrations.AddIndex(
            model_name='measurementthreshold',
            index=models.Index(fields=['device', 'metric_name'], name='thresh_device_metric_idx'),
        ),
        migrations.AddIndex(
            model_name='measurementthreshold',
            index=models.Index(fields=['is_active'], name='thresh_is_active_idx'),
        ),
        migrations.AddIndex(
            model_name='measurementthreshold',
            index=models.Index(fields=['created_at'], name='thresh_created_at_idx'),
        ),
        migrations.AddConstraint(
            model_name='measurementthreshold',
            constraint=models.UniqueConstraint(
                condition=models.Q(('is_active', True)),
                fields=('device', 'metric_name'),
                name='unique_active_threshold_per_device_metric',
            ),
        ),
    ]


