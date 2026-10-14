-- Script de données de test pour le module d'authentification / RBAC
-- À exécuter dans la base du backend Django ou dans une base de dev dédiée.
-- Ce script sert à créer des utilisateurs de test correspondant aux profils métier du projet.

-- 1. Nettoyage optionnel (décommenter si besoin)
-- DELETE FROM auth_user WHERE username IN ('admin01', 'receveur01', 'agent01', 'inspecteur01');

-- 2. Utilisateurs de test
-- Les mots de passe de test sont déjà hashés pour Django.
-- Cf. génération avec : make_password('StrongPass123!')

INSERT INTO accounts_user (
    password,
    last_login,
    is_superuser,
    username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    role,
    syst_fonc,
    bureau_code
) VALUES (
    'pbkdf2_sha256$100000$2N7xVx9G8V8L$L8YbeJ+F9xWylYQz0h7YF3lU+v8zI3yO+Qv0m6Q0yXQ=',
    NULL,
    TRUE,
    'admin01',
    'Admin',
    'Central',
    'admin01@comptage.local',
    TRUE,
    TRUE,
    '2026-10-08 08:00:00+00:00',
    'ADMIN',
    '00',
    NULL
);

INSERT INTO accounts_user (
    password,
    last_login,
    is_superuser,
    username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    role,
    syst_fonc,
    bureau_code
) VALUES (
    'pbkdf2_sha256$100000$2N7xVx9G8V8L$L8YbeJ+F9xWylYQz0h7YF3lU+v8zI3yO+Qv0m6Q0yXQ=',
    NULL,
    FALSE,
    'receveur01',
    'Receveur',
    'Bureau',
    'receveur01@comptage.local',
    FALSE,
    TRUE,
    '2026-10-08 08:05:00+00:00',
    'RECEVEUR',
    '01',
    101
);

INSERT INTO accounts_user (
    password,
    last_login,
    is_superuser,
    username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    role,
    syst_fonc,
    bureau_code
) VALUES (
    'pbkdf2_sha256$100000$2N7xVx9G8V8L$L8YbeJ+F9xWylYQz0h7YF3lU+v8zI3yO+Qv0m6Q0yXQ=',
    NULL,
    FALSE,
    'agent01',
    'Agent',
    'Saisie',
    'agent01@comptage.local',
    FALSE,
    TRUE,
    '2026-10-08 08:10:00+00:00',
    'AGENT_SAISIE',
    '02',
    101
);

INSERT INTO accounts_user (
    password,
    last_login,
    is_superuser,
    username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    role,
    syst_fonc,
    bureau_code
) VALUES (
    'pbkdf2_sha256$100000$2N7xVx9G8V8L$L8YbeJ+F9xWylYQz0h7YF3lU+v8zI3yO+Qv0m6Q0yXQ=',
    NULL,
    FALSE,
    'inspecteur01',
    'Inspecteur',
    'Audit',
    'inspecteur01@comptage.local',
    FALSE,
    TRUE,
    '2026-10-08 08:15:00+00:00',
    'INSPECTEUR',
    '03',
    999
);

-- 3. Vérification rapide
-- SELECT id, username, role, bureau_code, syst_fonc FROM accounts_user ORDER BY id;
python manage.py shell

from django.contrib.auth import get_user_model

User = get_user_model()

users = [
    ("admin01", "ADMIN", "00", None),
    ("receveur01", "RECEVEUR", "01", 101),
    ("agent01", "AGENT_SAISIE", "02", 101),
    ("inspecteur01", "INSPECTEUR", "03", 999),
]

for username, role, syst_fonc, bureau_code in users:
    if User.objects.filter(username=username).exists():
        User.objects.filter(username=username).delete()

    User.objects.create_user(
        username=username,
        password="12345",
        role=role,
        syst_fonc=syst_fonc,
        bureau_code=bureau_code,
        is_staff=(role == "ADMIN"),
        is_active=True,
    )
    print(f"Créé : {username} / {role} / bureau={bureau_code}")

print("OK")