from django.db import migrations


def set_admin_role_for_superusers(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(is_superuser=True).update(role='admin')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_role'),
    ]

    operations = [
        migrations.RunPython(set_admin_role_for_superusers, migrations.RunPython.noop),
    ]


