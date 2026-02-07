import urllib.request, time, json

url = 'https://airbcar-backend.onrender.com/listings/'
print(f"Testing {url} ...")

s = time.time()
try:
    r = urllib.request.urlopen(url, timeout=120)
    body = r.read().decode()
    elapsed = time.time() - s
    d = json.loads(body)
    first = d.get('data', [{}])[0] if d.get('data') else {}
    keys = sorted(first.keys())
    
    print(f"Response time: {elapsed:.1f}s")
    print(f"Count: {d.get('count')}")
    print(f"Keys: {keys}")
    
    has_compact = 'partner_name' in first
    has_nested = isinstance(first.get('partner'), dict)
    print(f"Using compact serializer: {has_compact}")
    print(f"Using old nested serializer: {has_nested}")
    
    if has_compact:
        print("SUCCESS - New code is deployed!")
    else:
        print("OLD CODE still running - Render has not deployed yet")
except Exception as e:
    elapsed = time.time() - s
    print(f"Error after {elapsed:.1f}s: {e}")
