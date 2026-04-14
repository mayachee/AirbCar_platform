import os

src_dir = 'src'
files = []
for r, d, fs in os.walk(src_dir):
    for f in fs:
        if f.endswith(('.js', '.jsx')):
            files.append(os.path.join(r, f).replace('\\', '/'))

unused = []
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    if name in ('index', 'layout', 'page', 'error', 'loading', 'not-found', 'root', 'middleware', 'components', 'instrumentation', 'default'):
        continue
    
    out = os.popen(f"git grep -l \"{name}\" src").read().strip()
    lines = [l for l in out.split('\n') if l]
    
    if len(lines) == 1 and lines[0] == f:
        unused.append(f)
    elif len(lines) == 0:
        unused.append(f)

for u in unused:
    print(u)
