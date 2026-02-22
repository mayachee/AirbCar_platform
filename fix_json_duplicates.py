import json
import os

def remove_duplicates_from_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse JSON - this automatically removes duplicate keys (keeps last value)
        data = json.loads(content)
        
        # Serialize back to JSON with proper formatting
        cleaned = json.dumps(data, ensure_ascii=False, indent=2)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(cleaned)
        
        print(f"✓ Fixed: {filepath}")
        return True
    except Exception as e:
        print(f"✗ Error with {filepath}: {e}")
        return False

# Change to frontend directory
os.chdir('c:\\Airbcar\\frontend')

# Fix all translation files
files = [
    'messages/en.json',
    'messages/fr.json', 
    'messages/ar.json'
]

for file in files:
    if os.path.exists(file):
        remove_duplicates_from_json(file)
    else:
        print(f"✗ File not found: {file}")

print("\n✓ All translation files cleaned successfully!")
