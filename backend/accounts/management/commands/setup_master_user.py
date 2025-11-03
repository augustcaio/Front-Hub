from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from accounts.models import User


class Command(BaseCommand):
    help = _(
        "Apaga todos os usuários e cria um usuário master com acesso total (admin/superuser).\n"
        "Uso: python manage.py setup_master_user --username master --email master@example.com --password <senha> [--wipe]"
    )

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True, help="Username do usuário master")
        parser.add_argument("--email", required=True, help="Email do usuário master")
        parser.add_argument("--password", required=True, help="Senha do usuário master")
        parser.add_argument(
            "--wipe",
            action="store_true",
            help="Apaga TODOS os usuários antes de criar o master",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        username: str = options["username"]
        email: str = options["email"]
        password: str = options["password"]
        wipe: bool = options["wipe"]

        if len(password) < 8:
            raise CommandError("A senha deve ter pelo menos 8 caracteres.")

        if wipe:
            self.stdout.write(self.style.WARNING("Apagando todos os usuários..."))
            # Usa delete em queryset para eficiência
            User.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Todos os usuários foram removidos."))

        self.stdout.write("Criando/atualizando usuário master...")
        # Se já existir, atualiza para garantir privilégios máximos
        user, created = User.objects.get_or_create(username=username, defaults={
            "email": email,
            "first_name": "Admin",
            "last_name": "User",
        })

        # Garante privilégios e papel admin
        user.email = email
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.role = User.Role.ADMIN  # type: ignore[attr-defined]
        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS("Usuário master criado com sucesso."))
        else:
            self.stdout.write(self.style.SUCCESS("Usuário master atualizado com sucesso."))

        self.stdout.write(self.style.SUCCESS(f"Username: {username} | Email: {email}"))


