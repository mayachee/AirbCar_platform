#!/bin/bash
# Test and fix the environment configuration

cd "$(dirname "$0")"

echo "🔍 Testing environment configuration..."
echo ""

# Run the fix script
python3 fix_env_local.py

echo ""
echo "🧪 Testing Django configuration..."
python3 -c "
import os
import sys
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Load environment
from dotenv import load_dotenv
env_local_path = BASE_DIR / '.env.local'
if env_local_path.exists():
    load_dotenv(dotenv_path=env_local_path, override=False)

# Check configuration
use_sqlite = os.environ.get('USE_SQLITE', 'False').lower() == 'true'
database_host = os.environ.get('DATABASE_HOST', 'NOT SET')

print(f'USE_SQLITE: {use_sqlite}')
print(f'DATABASE_HOST: {database_host}')

if use_sqlite:
    print('✅ SQLite is enabled!')
    sys.exit(0)
else:
    print('❌ SQLite is NOT enabled')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuration looks good!"
    echo ""
    echo "Testing Django system check..."
    python3 manage.py check --deploy 2>&1 | head -20
else
    echo ""
    echo "❌ Configuration issue detected"
    exit 1
fi

