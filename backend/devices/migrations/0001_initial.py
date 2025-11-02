# Generated manually for initial Device model

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Device',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Public unique identifier for the device', unique=True)),
                ('name', models.CharField(help_text='Device name', max_length=255)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('maintenance', 'Maintenance'), ('error', 'Error')], db_index=True, default='inactive', help_text='Current device status', max_length=20)),
                ('description', models.TextField(blank=True, help_text='Optional device description', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Device creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, db_index=True, help_text='Last update timestamp')),
            ],
            options={
                'verbose_name': 'Device',
                'verbose_name_plural': 'Devices',
                'db_table': 'devices',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='device',
            index=models.Index(fields=['public_id'], name='device_public_id_idx'),
        ),
        migrations.AddIndex(
            model_name='device',
            index=models.Index(fields=['status'], name='device_status_idx'),
        ),
        migrations.AddIndex(
            model_name='device',
            index=models.Index(fields=['created_at'], name='device_created_at_idx'),
        ),
    ]

