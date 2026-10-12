from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Crée les utilisateurs de test pour ComptaGe"

    def handle(self, *args, **options):
        User = get_user_model()

        users = [
            {
                "username": "admin01",
                "password": "12345",
                "role": "ADMIN",
                "syst_fonc": "00",
                "bureau_code": None,
                "is_staff": True,
            },
            {
                "username": "receveur01",
                "password": "12345",
                "role": "RECEVEUR",
                "syst_fonc": "01",
                "bureau_code": 101,
                "is_staff": False,
            },
            {
                "username": "agent01",
                "password": "12345",
                "role": "AGENT_SAISIE",
                "syst_fonc": "02",
                "bureau_code": 101,
                "is_staff": False,
            },
            {
                "username": "inspecteur01",
                "password": "12345",
                "role": "INSPECTEUR",
                "syst_fonc": "03",
                "bureau_code": 999,
                "is_staff": False,
            },
        ]

        for data in users:
            username = data["username"]

            User.objects.filter(username=username).delete()

            password = data.pop("password")

            user = User.objects.create_user(
                password=password,
                **data
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Créé : {user.username} / "
                    f"{user.role} / "
                    f"bureau={user.bureau_code}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Tous les utilisateurs ont été créés avec succès."
            )
        )