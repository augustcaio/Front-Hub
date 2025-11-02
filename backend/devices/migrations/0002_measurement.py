# Generated manually for initial Measurement model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('devices', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Measurement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('metric', models.CharField(db_index=True, help_text='Type of measurement/metric (e.g., temperature, humidity, pressure)', max_length=100)),
                ('value', models.DecimalField(decimal_places=10, help_text='Measurement value with precision', max_digits=20)),
                ('unit', models.CharField(help_text='Unit of measurement (e.g., °C, %, hPa, m/s)', max_length=50)),
                ('timestamp', models.DateTimeField(db_index=True, help_text='When the measurement was taken')),
                ('device', models.ForeignKey(db_index=True, help_text='Device that generated this measurement', on_delete=django.db.models.deletion.CASCADE, related_name='measurements', to='devices.device')),
            ],
            options={
                'verbose_name': 'Measurement',
                'verbose_name_plural': 'Measurements',
                'db_table': 'measurements',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='measurement',
            index=models.Index(fields=['device', 'timestamp'], name='meas_device_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='measurement',
            index=models.Index(fields=['metric'], name='meas_metric_idx'),
        ),
        migrations.AddIndex(
            model_name='measurement',
            index=models.Index(fields=['timestamp'], name='meas_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='measurement',
            index=models.Index(fields=['device', 'metric'], name='meas_device_metric_idx'),
        ),
    ]

