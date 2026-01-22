#!/bin/bash
# Test script for the project

cd "$(dirname "$0")"

echo "🧪 Testing Project Configuration..."
echo ""

# Test 1: Environment
echo "1️⃣  Checking environment..."
if [ -f .env.local ]; then
    echo "   ✅ .env.local found"
    if grep -q "USE_SQLITE=true" .env.local; then
        echo "   ✅ USE_SQLITE=true is set"
    else
        echo "   ⚠️  USE_SQLITE not set to true"
    fi
else
    echo "   ⚠️  .env.local not found"
fi
echo ""

# Test 2: Django Check
echo "2️⃣  Running Django system check..."
python3 manage.py check 2>&1 | head -30
CHECK_EXIT=$?
if [ $CHECK_EXIT -eq 0 ]; then
    echo "   ✅ System check passed"
else
    echo "   ❌ System check failed"
fi
echo ""

# Test 3: Show migrations status
echo "3️⃣  Checking migrations..."
python3 manage.py showmigrations 2>&1 | head -20
echo ""

# Test 4: Test imports
echo "4️⃣  Testing Python imports..."
python3 -c "
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from users.models import User
from partners.models import Partner
from listings.models import Listing
from bookings.models import Booking

print('   ✅ All models imported successfully')
" 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Model imports successful"
else
    echo "   ❌ Model imports failed"
fi
echo ""

echo "✅ Testing complete!"
echo ""
echo "To run migrations: python3 manage.py migrate --fake-initial"
echo "To start server: python3 manage.py runserver"

