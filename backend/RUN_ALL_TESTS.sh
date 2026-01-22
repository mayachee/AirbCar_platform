#!/bin/bash
# Run all tests automatically

cd /home/amine/projects/carrental/backend

echo "========================================================================"
echo "🧪 RUNNING ALL TESTS"
echo "========================================================================"
echo ""

# Test 1: Full database setup and test
echo "TEST 1: Full Setup and Database Test"
echo "------------------------------------------------------------------------"
python3 FULL_TEST.py
echo ""

# Test 2: Check migration status
echo "========================================================================"
echo "TEST 2: Migration Status Check"
echo "------------------------------------------------------------------------"
python3 CHECK_MIGRATIONS_STATUS.py
echo ""

# Test 3: Test makemigrations
echo "========================================================================"
echo "TEST 3: Test makemigrations"
echo "------------------------------------------------------------------------"
python3 manage.py makemigrations
echo ""

# Test 4: Test migrate
echo "========================================================================"
echo "TEST 4: Test migrate"
echo "------------------------------------------------------------------------"
python3 manage.py migrate
echo ""

# Test 5: Show migration status
echo "========================================================================"
echo "TEST 5: Show Migrations"
echo "------------------------------------------------------------------------"
python3 manage.py showmigrations
echo ""

# Test 6: Check for any issues
echo "========================================================================"
echo "TEST 6: Django System Check"
echo "------------------------------------------------------------------------"
python3 manage.py check
echo ""

echo "========================================================================"
echo "✅ ALL TESTS COMPLETE"
echo "========================================================================"
echo ""

