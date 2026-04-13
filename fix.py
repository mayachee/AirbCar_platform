import re, glob
# 1. Models related names
fp = r'c:\Airbcar\backend\airbcar_backend\core\models.py'
txt = open(fp, encoding='utf-8').read()
txt = txt.replace('related_name=\'reactions\'', 'related_name=\'community_reactions\'')
txt = txt.replace('related_name=\'comments\'', 'related_name=\'community_comments\'')
with open(fp, 'w', encoding='utf-8') as f: f.write(txt)

# 2. serializers related names update
fp = r'c:\Airbcar\backend\airbcar_backend\core\serializers.py'
txt = open(fp, encoding='utf-8').read()
txt = txt.replace('obj.reactions.', 'obj.community_reactions.')
txt = txt.replace('obj.comments.', 'obj.community_comments.')
with open(fp, 'w', encoding='utf-8') as f: f.write(txt)

# 3. views related names update
fp = r'c:\Airbcar\backend\airbcar_backend\core\views\social_views.py'
txt = open(fp, encoding='utf-8').read()
txt = txt.replace('from core.models import PartnerPost', 'from ..models import PartnerPost')
with open(fp, 'w', encoding='utf-8') as f: f.write(txt)

fp = r'c:\Airbcar\backend\airbcar_backend\core\views\listing_views.py'
txt = open(fp, encoding='utf-8').read()
txt = txt.replace('from core.models import PartnerPost', 'from ..models import PartnerPost')
with open(fp, 'w', encoding='utf-8') as f: f.write(txt)

# 4. Frontend stylistic misses
for f in glob.glob(r'c:\Airbcar\frontend\src\app\**\*.js', recursive=True):
    if 'car' in f or 'community' in f:
        txt = open(f, encoding='utf-8').read()
        new_txt = re.sub(r'\bdark:[a-z0-9:-]+\b\s*', '', txt)
        new_txt = re.sub(r'\brounded-(?!none\b)[a-z0-9]+\b', 'rounded-none', new_txt)
        if txt != new_txt:
            with open(f, 'w', encoding='utf-8') as file: file.write(new_txt)
