from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrateur"
        RECEVEUR = "RECEVEUR", "Receveur"
        AGENT_SAISIE = "AGENT_SAISIE", "Agent de saisie"
        INSPECTEUR = "INSPECTEUR", "Inspecteur"

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.AGENT_SAISIE)
    syst_fonc = models.CharField(max_length=2, blank=True, default="")
    bureau_code = models.IntegerField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "accounts_user"

    def __str__(self):
        return self.get_username()
