#!/bin/bash
# Reset SQLite database and run fresh migrations

cd "$(dirname "$0")"

echo "🗑️  Resetting SQLite database..."
echo ""

# Find SQLite database
DB_FILE="db.sqlite3"

if [ -f "$DB_FILE" ]; then
    echo "   Found: $DB_FILE"
    read -p "   Delete it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$DB_FILE"
        echo "   ✅ Deleted $DB_FILE"
    else
        echo "   ⏭️  Skipped"
        exit 0
    fi
else
    echo "   ℹ️  Database file doesn't exist"
fi

echo ""
echo "🔄 Running fresh migrations..."
echo ""

# Fake core migrations first
python3 manage.py migrate core --fake

# Then run all migrations
python3 manage.py migrate

echo ""
echo "✅ Done! Database reset and migrations applied."
echo ""
echo "Next: python3 manage.py runserver"
echo ""

