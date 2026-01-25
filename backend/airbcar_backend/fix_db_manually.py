# This file helps you manually apply the migration if it's stuck
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

def fix_database():
    with connection.cursor() as cursor:
        print("Checking for request_message column...")
        try:
            cursor.execute("SELECT request_message FROM core_booking LIMIT 1")
            print("Column request_message already exists.")
        except Exception as e:
            print("Column request_message missing. Attempting to add it...")
            cursor.connection.rollback()
            try:
                cursor.execute("ALTER TABLE core_booking ADD COLUMN request_message text NULL;")
                print("Added request_message column.")
            except Exception as e2:
                print(f"Failed to add request_message: {e2}")

        print("Checking for rejection_reason column...")
        try:
            cursor.execute("SELECT rejection_reason FROM core_booking LIMIT 1")
            print("Column rejection_reason already exists.")
        except Exception as e:
            print("Column rejection_reason missing. Attempting to add it...")
            cursor.connection.rollback()
            try:
                cursor.execute("ALTER TABLE core_booking ADD COLUMN rejection_reason text NULL;")
                print("Added rejection_reason column.")
            except Exception as e2:
                print(f"Failed to add rejection_reason: {e2}")

        print("Checking for license_front_document column...")
        try:
            cursor.execute("SELECT license_front_document FROM core_booking LIMIT 1")
            print("Column license_front_document already exists.")
        except Exception as e:
            print("Column license_front_document missing. Attempting to add it...")
            cursor.connection.rollback()
            try:
                cursor.execute("ALTER TABLE core_booking ADD COLUMN license_front_document varchar(500) NULL;")
                print("Added license_front_document column.")
            except Exception as e2:
                print(f"Failed to add license_front_document: {e2}")

        print("Checking for license_back_document column...")
        try:
            cursor.execute("SELECT license_back_document FROM core_booking LIMIT 1")
            print("Column license_back_document already exists.")
        except Exception as e:
            print("Column license_back_document missing. Attempting to add it...")
            cursor.connection.rollback()
            try:
                cursor.execute("ALTER TABLE core_booking ADD COLUMN license_back_document varchar(500) NULL;")
                print("Added license_back_document column.")
            except Exception as e2:
                print(f"Failed to add license_back_document: {e2}")

if __name__ == '__main__':
    fix_database()
