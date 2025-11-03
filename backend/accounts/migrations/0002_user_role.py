from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('admin', 'Admin'), ('operator', 'Operator'), ('visitor', 'Visitor')], db_index=True, default='operator', help_text='User role for permission checks (admin, operator, visitor).', max_length=20),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role'], name='user_role_idx'),
        ),
    ]


