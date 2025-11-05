"""
Script to check and fix partner profile issues
Run: python check_partner.py 38
"""

import os
import sys
import django

# Setup Django
sys.path.append('backend/airbcar_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()

from core.models import Partner

def check_and_fix_partner(partner_id):
    """Check partner and fix any issues"""
    
    try:
        partner = Partner.objects.get(id=partner_id)
        
        print(f"\n{'='*60}")
        print(f"Partner ID: {partner.id}")
        print(f"Company Name: {partner.company_name}")
        print(f"Verification Status: {partner.verification_status}")
        print(f"Slug: {partner.slug or 'NOT SET'}")
        print(f"User: {partner.user.email if partner.user else 'N/A'}")
        print(f"Listings Count: {partner.listings.count()}")
        print(f"{'='*60}\n")
        
        # Check issues
        issues = []
        
        if partner.verification_status != 'approved':
            issues.append(f"❌ Verification status is '{partner.verification_status}', not 'approved'")
            print("🔧 Fixing verification status...")
            partner.verification_status = 'approved'
            partner.save()
            print("✅ Set verification_status to 'approved'")
        
        if not partner.slug:
            issues.append("❌ Slug is missing")
            print("🔧 Generating slug...")
            partner.slug = None  # Clear to trigger auto-generation
            partner.save()
            print(f"✅ Generated slug: {partner.slug}")
        
        if issues:
            print("\n⚠️  Issues found and fixed:")
            for issue in issues:
                print(f"  {issue}")
        else:
            print("✅ No issues found!")
        
        # Show final info
        print(f"\n📋 Final Status:")
        print(f"  Slug: {partner.slug}")
        print(f"  Status: {partner.verification_status}")
        print(f"\n🌐 Access URLs:")
        print(f"  Frontend: http://localhost:3000/partner/{partner.slug}")
        print(f"  API: http://localhost:8000/partners/public/{partner.slug}/")
        print(f"  API (by ID): http://localhost:8000/partners/public/{partner.id}/")
        
        return partner
        
    except Partner.DoesNotExist:
        print(f"❌ Partner with ID {partner_id} does not exist!")
        print("\nAvailable partners:")
        for p in Partner.objects.all()[:10]:
            print(f"  ID {p.id}: {p.company_name} (status: {p.verification_status}, slug: {p.slug or 'N/A'})")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    partner_id = sys.argv[1] if len(sys.argv) > 1 else "38"
    
    try:
        partner_id = int(partner_id)
    except ValueError:
        print(f"❌ Invalid partner ID: {partner_id}")
        sys.exit(1)
    
    print(f"🔍 Checking partner ID: {partner_id}")
    check_and_fix_partner(partner_id)


