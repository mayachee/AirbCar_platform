#!/usr/bin/env python
"""Force fix .env.local to use SQLite - no questions asked"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
env_local_path = BASE_DIR / '.env.local'

print("🔧 FORCE FIXING .env.local FOR SQLITE")
print("=" * 60)
print()

# Read existing content
existing_content = ""
if env_local_path.exists():
    existing_content = env_local_path.read_text()
    print(f"✅ Found .env.local at: {env_local_path}")
else:
    print("📝 Creating new .env.local file")

# Parse and fix
lines = existing_content.split('\n') if existing_content else []
new_lines = []
use_sqlite_found = False
use_sqlite_set = False

# Process each line
for line in lines:
    stripped = line.strip()
    
    # Skip empty lines at the start
    if not stripped and not new_lines:
        continue
    
    # Handle USE_SQLITE
    if stripped.startswith('USE_SQLITE'):
        if 'true' in stripped.lower():
            new_lines.append("USE_SQLITE=true")
            use_sqlite_set = True
            print("   ✅ USE_SQLITE already set to true")
        else:
            new_lines.append("USE_SQLITE=true")
            use_sqlite_set = True
            print("   🔄 Changed USE_SQLITE to true")
        use_sqlite_found = True
        continue
    
    # Skip comments about USE_SQLITE if we're adding it
    if stripped.startswith('#') and 'USE_SQLITE' in stripped.upper():
        continue
    
    new_lines.append(line)

# Add USE_SQLITE at the very top if not found
if not use_sqlite_found:
    new_lines.insert(0, "")
    new_lines.insert(0, "USE_SQLITE=true")
    new_lines.insert(0, "# Use SQLite for local development (no PostgreSQL needed!)")
    print("   ➕ Added USE_SQLITE=true at the top")

# Ensure it's set to true
if not use_sqlite_set:
    # Find and replace any USE_SQLITE line
    for i, line in enumerate(new_lines):
        if line.strip().startswith('USE_SQLITE'):
            new_lines[i] = "USE_SQLITE=true"
            print("   🔄 Forced USE_SQLITE=true")
            break

# Write the file
final_content = '\n'.join(new_lines)
env_local_path.write_text(final_content)

print()
print(f"✅ Fixed {env_local_path}")
print()

# Verify
print("📋 Current configuration:")
with open(env_local_path, 'r') as f:
    for line in f:
        if 'USE_SQLITE' in line or 'DATABASE_HOST' in line:
            print(f"   {line.strip()}")

print()
print("=" * 60)
print("✅ DONE! Your .env.local is now configured for SQLite")
print("=" * 60)
print()
print("Now try:")
print("  python3 manage.py migrate --fake-initial")
print("  python3 manage.py runserver")
print()

