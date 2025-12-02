"""
Django management command to make a user a superuser.
Usage: python manage.py make_superuser <email>
"""
from django.core.management.base import BaseCommand
from core.models import User


class Command(BaseCommand):
    help = 'Make a user a superuser by email'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address of the user to make superuser')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
            user.is_superuser = True
            user.is_staff = True
            user.role = 'admin'  # Also set role to admin
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully made {email} a superuser and admin')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} does not exist')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )

