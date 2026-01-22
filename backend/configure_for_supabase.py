#!/usr/bin/env python
"""Configure .env.local to use Supabase PostgreSQL instead of SQLite"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
env_local_path = BASE_DIR / '.env.local'

print("🔍 Configuring .env.local for Supabase PostgreSQL...")
print()

# Read existing .env.local if it exists
existing_content = ""
if env_local_path.exists():
    existing_content = env_local_path.read_text()
    print(f"✅ Found existing .env.local file")
else:
    print("📝 Creating new .env.local file")

# Check current configuration
has_use_sqlite = 'USE_SQLITE' in existing_content
has_database_config = any(key in existing_content for key in ['DATABASE_HOST', 'DATABASE_NAME'])

print("Current configuration:")
if has_use_sqlite:
    print("  - USE_SQLITE is set")
if has_database_config:
    print("  - Database configuration found")
print()

# Prepare new content
lines = existing_content.split('\n') if existing_content else []
new_lines = []
use_sqlite_updated = False
database_config_added = False

# Process existing lines
for line in lines:
    stripped = line.strip()
    
    # Update USE_SQLITE to false
    if stripped.startswith('USE_SQLITE'):
        new_lines.append("USE_SQLITE=false")
        use_sqlite_updated = True
        continue
    
    # Keep existing database config
    if any(stripped.startswith(key) for key in ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_PORT']):
        database_config_added = True
        new_lines.append(line)
        continue
    
    new_lines.append(line)

# Add USE_SQLITE=false at the top if not updated
if not use_sqlite_updated:
    new_lines.insert(0, "# Use Supabase PostgreSQL (matches production)")
    new_lines.insert(1, "USE_SQLITE=false")
    new_lines.insert(2, "")

# Add database configuration if not present
if not database_config_added:
    new_lines.append("")
    new_lines.append("# Supabase PostgreSQL Configuration")
    new_lines.append("DATABASE_HOST=aws-1-eu-north-1.pooler.supabase.com")
    new_lines.append("DATABASE_NAME=postgres")
    new_lines.append("DATABASE_USER=postgres.wtbmqtmmdobfvvecinif")
    new_lines.append("DATABASE_PASSWORD=Mayache+123455")
    new_lines.append("DATABASE_PORT=5432")
    print("➕ Added Supabase database configuration")
else:
    print("✅ Using existing database configuration")

# Write the file
env_local_path.write_text('\n'.join(new_lines))
print(f"✅ Updated {env_local_path}")
print()

# Test the configuration
print("🧪 Testing configuration...")
try:
    import sys
    sys.path.insert(0, str(BASE_DIR))
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=env_local_path, override=False)
    
    use_sqlite = os.environ.get('USE_SQLITE', 'False').lower() == 'true'
    database_host = os.environ.get('DATABASE_HOST', 'NOT SET')
    
    print(f"   USE_SQLITE: {use_sqlite}")
    print(f"   DATABASE_HOST: {database_host}")
    
    if not use_sqlite and database_host != 'NOT SET':
        print("✅ Configuration test passed!")
        print("   You're now configured to use Supabase PostgreSQL")
    else:
        print("⚠️  Configuration may need adjustment")
except Exception as e:
    print(f"⚠️  Could not test configuration: {e}")

print()
print("🎉 Done! Your .env.local is now configured for Supabase PostgreSQL.")
print()
print("Next steps:")
print("  1. Make sure your Supabase credentials are correct")
print("  2. Test connection: python3 manage.py check")
print("  3. Run migrations: python3 manage.py migrate --fake-initial")
print("  4. Start server: python3 manage.py runserver")
print()
print("Note: You need internet connection to use Supabase!")

