# Generated manually for Alert model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('devices', '0002_measurement'),
    ]

    operations = [
        migrations.CreateModel(
            name='Alert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Alert title', max_length=255)),
                ('message', models.TextField(help_text='Alert message/description')),
                ('severity', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], db_index=True, default='medium', help_text='Alert severity level', max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('resolved', 'Resolved')], db_index=True, default='pending', help_text='Alert status (pending or resolved)', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Alert creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, db_index=True, help_text='Last update timestamp')),
                ('resolved_at', models.DateTimeField(blank=True, db_index=True, help_text='Alert resolution timestamp', null=True)),
                ('device', models.ForeignKey(db_index=True, help_text='Device associated with this alert', on_delete=django.db.models.deletion.CASCADE, related_name='alerts', to='devices.device')),
            ],
            options={
                'verbose_name': 'Alert',
                'verbose_name_plural': 'Alerts',
                'db_table': 'alerts',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(fields=['device', 'status'], name='alert_device_status_idx'),
        ),
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(fields=['status'], name='alert_status_idx'),
        ),
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(fields=['severity'], name='alert_severity_idx'),
        ),
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(fields=['device', 'created_at'], name='alert_device_created_idx'),
        ),
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(fields=['created_at'], name='alert_created_at_idx'),
        ),
    ]

