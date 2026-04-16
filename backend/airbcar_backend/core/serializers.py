"""
DRF serializers for core app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from .models import User, Partner, Listing, Booking, Favorite, Review, ReviewReport, ReviewVote, Notification, LicenseVerificationRecord, ListingComment, PartnerPost, TripPost, TripPostComment, TripPostReaction, CommunityPost, CommunityPostComment, CommunityPostReaction, CarShareRequest, B2BMessage, VehicleInspection
from .utils.license_verification import verify_driving_license_images
from .utils.license_verification_persistence import store_license_verification_result

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer."""
    profile_picture_url = serializers.SerializerMethodField()
    is_partner = serializers.SerializerMethodField()
    latest_license_verification = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.context.get('include_latest_license_verification', False):
            self.fields.pop('latest_license_verification', None)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_partner',
            'is_staff', 'is_superuser',
            'phone_number', 'profile_picture_url',
            'is_verified', 'date_joined',
            # Personal Information
            'date_of_birth', 'nationality',
            # License Information
            'license_number', 'license_origin_country', 'issue_date', 'expiry_date',
            # License Documents
            'license_front_document_url', 'license_back_document_url',
            'latest_license_verification'
        ]
        read_only_fields = ['id', 'date_joined', 'role', 'is_verified', 'username', 'is_staff', 'is_superuser']

    def get_latest_license_verification(self, obj):
        record = LicenseVerificationRecord.objects.filter(user=obj).order_by('-created_at').first()
        if not record:
            return None
        return {
            'id': record.id,
            'context': record.context,
            'is_valid': record.is_valid,
            'score': record.score,
            'detected_country': record.detected_country,
            'issue_date': record.issue_date.isoformat() if record.issue_date else None,
            'expiry_date': record.expiry_date.isoformat() if record.expiry_date else None,
            'is_expired': record.is_expired,
            'errors': record.errors,
            'warnings': record.warnings,
            'created_at': record.created_at.isoformat(),
        }

    def get_is_partner(self, obj):
        """Check if user is a partner (no extra DB queries)."""
        try:
            # Check role field first (always available, no query)
            if obj.role == 'partner':
                return True
            # Check cached reverse relation (loaded via select_related)
            try:
                return obj.partner_profile is not None
            except Exception:
                return False
        except Exception:
            return False
    
    def get_profile_picture_url(self, obj):
        """Return full URL for profile picture. Priority: Supabase/external URLs > None."""
        try:
            # Check if there's a profile_picture_url (e.g., from Google Sign-In or Supabase)
            if hasattr(obj, 'profile_picture_url') and obj.profile_picture_url:
                url = str(obj.profile_picture_url).strip()
                
                # Filter out local file URLs - be very strict about this
                if url:
                    # Check for local media patterns (case-insensitive)
                    url_lower = url.lower()
                    if (
                        '/media/' in url_lower or
                        '/profiles/' in url_lower or
                        'airbcar-backend.onrender.com/media/' in url_lower or
                        'airbcar-backend.onrender.com/profiles/' in url_lower or
                        'localhost/media/' in url_lower or
                        'localhost/profiles/' in url_lower or
                        '127.0.0.1/media/' in url_lower or
                        '127.0.0.1/profiles/' in url_lower or
                        url_lower.startswith('/media/') or
                        url_lower.startswith('/profiles/')
                    ):
                        # This is a local file URL, don't return it
                        return None
                    
                    # Only return Supabase URLs or other external URLs (Google, CDNs, etc.)
                    # Allow base64 data URLs
                    if url.startswith('data:image/'):
                        return url
                    # Allow Supabase URLs
                    if 'supabase.co' in url and '/storage/v1/object/public/' in url:
                        return url
                    # Allow other external URLs (Google, CDNs, etc.) but not local ones
                    if url.startswith('http://') or url.startswith('https://'):
                        # Double-check it's not a local URL
                        if not any(local_pattern in url_lower for local_pattern in [
                            'localhost', '127.0.0.1', 'airbcar-backend.onrender.com/media',
                            'airbcar-backend.onrender.com/profiles'
                        ]):
                            return url
            
            # Don't return local file URLs - they're not accessible on Render
            # If user has local file but no Supabase URL, they need to re-upload
            return None
        except Exception as e:
            # If anything goes wrong, return None instead of crashing
            import traceback
            import sys
            print(f"Error in get_profile_picture_url: {e}", file=sys.stderr)
            if hasattr(sys, '_getframe'):
                traceback.print_exc()
            return None
    
    def update(self, instance, validated_data):
        """Update user profile and handle document uploads to Supabase Storage."""
        request = self.context.get('request')
        verification = None

        # Enforce pair validation: if one side is uploaded, both sides must be uploaded together.
        if request and request.FILES:
            has_front = 'license_front_document' in request.FILES
            has_back = 'license_back_document' in request.FILES

            if has_front != has_back:
                raise serializers.ValidationError({
                    'license_documents': 'Please upload both front and back license images together for verification.'
                })

            if has_front and has_back:
                verification = verify_driving_license_images(
                    front_image=request.FILES['license_front_document'],
                    back_image=request.FILES['license_back_document'],
                )
                if not verification.get('is_valid'):
                    store_license_verification_result(
                        user=instance,
                        verification=verification,
                        context='profile_update',
                    )
                    raise serializers.ValidationError({
                        'license_documents': verification.get('errors', ['License verification failed']),
                        'license_verification': verification,
                    })
        
        # Handle document uploads to Supabase Storage
        # Process files from request.FILES and upload to Supabase
        if request and request.FILES:
            # Use absolute import to avoid relative import issues
            try:
                from core.utils.image_utils import upload_file_to_supabase_storage
            except ImportError:
                from ..utils.image_utils import upload_file_to_supabase_storage
            
            # Handle profile picture upload
            if 'profile_picture' in request.FILES:
                try:
                    pic_file = request.FILES['profile_picture']
                    supabase_url = upload_file_to_supabase_storage(
                        file=pic_file,
                        bucket_name=settings.SUPABASE_STORAGE_BUCKET_PICS,
                        folder='user_documents/profiles',
                        user_id=instance.id
                    )
                    instance.profile_picture_url = supabase_url
                    instance.profile_picture = None  # Clear local file field
                    
                    # Also remove from validated_data to prevent double save attempt
                    if 'profile_picture' in validated_data:
                        validated_data.pop('profile_picture')

                    if settings.DEBUG:
                        print(f"✅ Profile picture uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload profile picture: {str(e)}")
                    # Don't raise blocking error, just log it
                    print(f"Warning: Failed to upload profile picture, continuing update. Error: {e}")
                    
                    # Ensure we don't try to save the file locally if upload failed
                    # This prevents further errors down the line
                    if 'profile_picture' in validated_data:
                        validated_data.pop('profile_picture')
            
            # Handle license document uploads to Supabase
            if 'license_front_document' in request.FILES:
                try:
                    license_front_file = request.FILES['license_front_document']
                    supabase_url = upload_file_to_supabase_storage(
                        file=license_front_file,
                        bucket_name=settings.SUPABASE_STORAGE_BUCKET_PICS,
                        folder='user_documents/license_documents',
                        user_id=instance.id
                    )
                    instance.license_front_document_url = supabase_url
                    if settings.DEBUG:
                        print(f"✅ License front uploaded to: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ License front upload failed: {e}")
                    print(f"Warning: Failed to upload license front document. Error: {e}")

            if 'license_back_document' in request.FILES:
                try:
                    license_back_file = request.FILES['license_back_document']
                    supabase_url = upload_file_to_supabase_storage(
                        file=license_back_file,
                        bucket_name=settings.SUPABASE_STORAGE_BUCKET_PICS,
                        folder='user_documents/license_documents',
                        user_id=instance.id
                    )
                    instance.license_back_document_url = supabase_url
                    if settings.DEBUG:
                        print(f"✅ License back uploaded to: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ License back upload failed: {e}")
                    print(f"Warning: Failed to upload license back document. Error: {e}")

            if verification is not None:
                store_license_verification_result(
                    user=instance,
                    verification=verification,
                    context='profile_update',
                    front_document_url=instance.license_front_document_url,
                    back_document_url=instance.license_back_document_url,
                )

        # Handle profile picture deletion manually (as field is not in serializer)
        if request and 'profile_picture' in request.data:
            val = request.data.get('profile_picture')
            if val is None or val == '' or val == 'null':
                instance.profile_picture = None
                # Don't clear profile_picture_url automatically as it might be from external source
                # Unless explicit deletion intended?
                # For now just clear local picture.

        if 'profile_picture' in validated_data and validated_data['profile_picture'] is None:
            instance.profile_picture = None
            # Don't clear profile_picture_url as it might be from Google Sign-In
            validated_data.pop('profile_picture')
        
        # Update other fields
        for attr, value in validated_data.items():
            if hasattr(instance, attr):
                setattr(instance, attr, value)
        
        instance.save()
        return instance


class SimpleListingSerializer(serializers.ModelSerializer):
    """Simplified listing serializer for embedding in partner profile."""
    brand = serializers.CharField(source='make', read_only=True)
    model_name = serializers.CharField(source='model', read_only=True)
    dailyRate = serializers.DecimalField(source='price_per_day', max_digits=10, decimal_places=2, read_only=True)
    price = serializers.DecimalField(source='price_per_day', max_digits=10, decimal_places=2, read_only=True)
    securityDeposit = serializers.DecimalField(source='security_deposit', max_digits=10, decimal_places=2, read_only=True)
    image = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    seats = serializers.IntegerField(source='seating_capacity', read_only=True)
    
    class Meta:
        model = Listing
        fields = [
            'id', 'title', 'name', 'make', 'brand', 'model', 'model_name', 'year', 
            'price_per_day', 'dailyRate', 'price', 'security_deposit', 'securityDeposit', 'location', 
            'rating', 'review_count', 'image', 'images', 'is_available', 'is_verified',
            'fuel_type', 'transmission', 'seats',
        ]
        
    def get_image(self, obj):
        if obj.images and len(obj.images) > 0:
            return obj.images[0]
        return None

    def get_title(self, obj):
        return f"{obj.make} {obj.model} {obj.year}".strip()

    def get_name(self, obj):
        return f"{obj.make} {obj.model} {obj.year}".strip()


class PartnerSerializer(serializers.ModelSerializer):
    """Partner serializer."""
    user = UserSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()
    min_price_per_day = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, allow_null=True)
    companyName = serializers.CharField(source='business_name', read_only=True)
    businessName = serializers.CharField(source='business_name', read_only=True)
    company_name = serializers.CharField(required=False, write_only=True, allow_blank=True)
    
    # Address fields from related User model
    # These are writable fields that will be handled in update method
    phone_number = serializers.CharField(required=False, allow_blank=True, write_only=False)
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=False)
    last_name = serializers.CharField(required=False, allow_blank=True, write_only=False)
    
    # Address fields stored on Partner model
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    state = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def to_representation(self, instance):
        """Override to include address fields from user model."""
        ret = super().to_representation(instance)
        # Get address fields from user model
        if instance.user:
            ret['phone_number'] = instance.user.phone_number or ''
            ret['first_name'] = instance.user.first_name or ''
            ret['last_name'] = instance.user.last_name or ''
        else:
            ret['phone_number'] = ''
            ret['first_name'] = ''
            ret['last_name'] = ''
        return ret
    
    class Meta:
        model = Partner
        fields = ['id', 'user', 'username', 'business_name', 'business_type', 'business_license',
                  'tax_id', 'bank_account', 'description', 'logo', 'logo_url', 'is_verified', 'rating', 'review_count',
                  'total_bookings', 'total_earnings', 'created_at', 'min_price_per_day', 'companyName', 'businessName',
                   'phone_number', 'first_name', 'last_name', 'company_name',
                   'address', 'city', 'state', 'elite_status', 'response_time', 'experience_years']
        read_only_fields = ['id', 'created_at', 'logo_url']
        extra_kwargs = {
            'logo': {'write_only': True},
            'business_name': {'required': False},
        }
    
    def get_logo_url(self, obj):
        """Return full URL for partner logo. Only returns Supabase/external URLs."""
        # Priority: Supabase URL > User profile picture URL
        if obj.logo_url:
            return obj.logo_url
        
        # Don't return local file URLs - they're not accessible on Render
        # Fallback to user's profile_picture_url if available (Supabase/external URL)
        if obj.user and hasattr(obj.user, 'profile_picture_url') and obj.user.profile_picture_url:
            return obj.user.profile_picture_url
        
        return None
    
    def to_internal_value(self, data):
        """Map alternative field names to canonical names and validate."""
        # Create a mutable copy of data
        if hasattr(data, '_mutable'):
            data._mutable = True
        
        data = dict(data) if not isinstance(data, dict) else data
        
        # Map company_name to business_name if provided  
        if 'company_name' in data and data['company_name']:
            if 'business_name' not in data or not data['business_name']:
                data['business_name'] = data.pop('company_name')
            else:
                data.pop('company_name')  # Remove company_name if business_name is also provided
        elif 'company_name' in data:
            data.pop('company_name')  # Remove empty company_name
        
        return super().to_internal_value(data)
    
    def update(self, instance, validated_data):
        """Update partner and related user address fields."""
        # Extract address fields from validated_data (use _MARKER to distinguish None from not provided)
        _MARKER = object()
        phone_number = validated_data.pop('phone_number', _MARKER)
        first_name = validated_data.pop('first_name', _MARKER)
        last_name = validated_data.pop('last_name', _MARKER)
        
        # Also check if 'user' key exists (from nested data structure from view)
        if 'user' in validated_data:
            user_data = validated_data.pop('user', {})
            # Use nested data if flat fields weren't provided
            if phone_number is _MARKER and 'phone_number' in user_data:
                phone_number = user_data['phone_number']
            if first_name is _MARKER and 'first_name' in user_data:
                first_name = user_data['first_name']
            if last_name is _MARKER and 'last_name' in user_data:
                last_name = user_data['last_name']
        
        # Update user address fields if provided (convert empty strings to None)
        user_updated = False
        if phone_number is not _MARKER:
            user_updated = True
            instance.user.phone_number = phone_number.strip() if phone_number and phone_number.strip() else None
        
        if first_name is not _MARKER:
            user_updated = True
            instance.user.first_name = first_name.strip() if first_name else ''
        if last_name is not _MARKER:
            user_updated = True
            instance.user.last_name = last_name.strip() if last_name else ''
        
        if user_updated:
            instance.user.save()
        
        # Handle logo file upload explicitly - upload to Supabase Storage
        # Check if logo is in request.FILES first (actual file upload)
        request = self.context.get('request')
        if request and 'logo' in request.FILES:
            # Logo file is being uploaded from FormData - upload to Supabase
            logo_file = request.FILES['logo']
            try:
                # Use absolute import to avoid relative import issues
                try:
                    from core.utils.image_utils import upload_file_to_supabase_storage
                except ImportError:
                    from ..utils.image_utils import upload_file_to_supabase_storage
                # Upload logo to Supabase Storage in 'pics' bucket (recommended for all media)
                supabase_url = upload_file_to_supabase_storage(
                    file=logo_file,
                    bucket_name=settings.SUPABASE_STORAGE_BUCKET_PICS,
                    folder='partner_logos',
                    user_id=instance.user.id if instance.user else None
                )
                # Store Supabase URL in logo_url field
                instance.logo_url = supabase_url
                # We don't need local file if we have Supabase URL, but keeping it empty is fine
                # instance.logo = None 
                if settings.DEBUG:
                    print(f"✅ Partner logo uploaded to Supabase: {supabase_url}")
            except Exception as e:
                error_msg = str(e)
                if settings.DEBUG:
                    print(f"❌ Failed to upload partner logo to Supabase: {error_msg}")
                    print("⚠️ Falling back to local storage for logo.")
                
                # Fallback to local storage (Django default behavior)
                # This ensures it works in development even if Supabase isn't configured
                try:
                    logo_file.seek(0)
                except:
                    pass
                
                # Assign the file to the model field directly - Django will handle local saving
                instance.logo = logo_file
                
                # Don't raise error, allow fallback to succeed
                # raise ValueError(f"Failed to upload logo to Supabase Storage: {error_msg}")
        elif 'logo' in validated_data:
            # Logo is in validated_data (could be None for removal, or filtered out earlier)
            logo_value = validated_data.pop('logo')
            # Set to None if explicitly provided as None (for removal)
            if logo_value is None:
                instance.logo = None
                instance.logo_url = None
            # If it was a file object that got filtered, it should have been in request.FILES above
        
        # Update partner fields
        for attr, value in validated_data.items():
            # Skip fields that don't exist on the model
            if hasattr(instance, attr):
                setattr(instance, attr, value)
        
        instance.save()
        return instance


class PartnerDetailSerializer(PartnerSerializer):
    """Partner serializer with listings."""
    listings = SimpleListingSerializer(many=True, read_only=True)
    
    class Meta:
        model = Partner
        fields = [
            'id', 'user', 'business_name', 'business_type', 'business_license',
            'tax_id', 'bank_account', 'description', 'logo', 'logo_url', 'is_verified', 'rating', 'review_count',
            'total_bookings', 'total_earnings', 'created_at', 'min_price_per_day', 'companyName', 'businessName',
             'phone_number', 'first_name', 'last_name',
            'address', 'city', 'state', 'listings'
        ]
        read_only_fields = ['id', 'created_at', 'logo_url']
        extra_kwargs = {
            'logo': {'write_only': True},
        }


class ListingCompactSerializer(serializers.ModelSerializer):
    """Lightweight listing serializer for list views — avoids N+1 from nested serializers."""
    brand = serializers.CharField(source='make', read_only=True)
    model_name = serializers.CharField(source='model', read_only=True)
    seats = serializers.IntegerField(source='seating_capacity', read_only=True)
    style = serializers.CharField(source='vehicle_style', read_only=True)
    dailyRate = serializers.DecimalField(source='price_per_day', max_digits=10, decimal_places=2, read_only=True)
    price = serializers.DecimalField(source='price_per_day', max_digits=10, decimal_places=2, read_only=True)
    securityDeposit = serializers.DecimalField(source='security_deposit', max_digits=10, decimal_places=2, read_only=True)
    fuelType = serializers.CharField(source='fuel_type', read_only=True)
    verified = serializers.BooleanField(source='is_verified', read_only=True)
    reviewCount = serializers.IntegerField(source='review_count', read_only=True)
    isAvailable = serializers.BooleanField(source='is_available', read_only=True)
    instantBooking = serializers.BooleanField(source='instant_booking', read_only=True)
    name = serializers.SerializerMethodField()
    partner_name = serializers.SerializerMethodField()
    partner_logo = serializers.SerializerMethodField()
    partner_verified = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'public_id', 'make', 'brand', 'model', 'model_name', 'year', 'color',
            'transmission', 'fuel_type', 'fuelType', 'seating_capacity', 'seats',
            'vehicle_style', 'style', 'luggage_capacity', 'range_km', 'price_per_day', 'dailyRate', 'price', 'security_deposit', 'securityDeposit',
            'location', 'images', 'is_available', 'isAvailable', 'is_verified', 'verified',
            'instant_booking', 'instantBooking', 'rating', 'review_count', 'reviewCount',
            'created_at', 'updated_at', 'name', 'partner_id',
            'partner_name', 'partner_logo', 'partner_verified',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at', 'rating', 'review_count', 'is_verified']

    def get_name(self, obj):
        return f"{obj.make} {obj.model} {obj.year}"

    def get_partner_name(self, obj):
        try:
            return obj.partner.business_name if obj.partner else None
        except Exception:
            return None

    def get_partner_logo(self, obj):
        try:
            p = obj.partner
            if not p:
                return None
            if p.logo_url:
                return p.logo_url
            if p.user and hasattr(p.user, 'profile_picture_url') and p.user.profile_picture_url:
                url = str(p.user.profile_picture_url).strip()
                if url.startswith(('http://', 'https://')) and '/media/' not in url:
                    return url
            return None
        except Exception:
            return None

    def get_partner_verified(self, obj):
        try:
            return obj.partner.is_verified if obj.partner else False
        except Exception:
            return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Process images — same logic as ListingSerializer but without re-importing each time
        if 'images' in data and data['images']:
            processed = []
            for img in data['images']:
                url = img if isinstance(img, str) else (img.get('url') if isinstance(img, dict) else None)
                if not url or not isinstance(url, str):
                    continue
                url = url.strip()
                url_lower = url.lower()
                if 'supabase.co' in url_lower and '/storage/v1/object/public/' in url_lower:
                    processed.append(url)
                elif url.startswith(('http://', 'https://')) and '/media/' not in url_lower and '/profiles/' not in url_lower:
                    processed.append(url)
            data['images'] = processed if processed else ['/carsymbol.jpg']
        return data


class ListingSerializer(serializers.ModelSerializer):
    """Listing serializer with all fields."""
    partner = PartnerSerializer(read_only=True)
    partner_id = serializers.PrimaryKeyRelatedField(
        queryset=Partner.objects.all(), 
        source='partner', 
        write_only=True,
        required=False
    )
    
    # Map backend fields to frontend expected fields (read-only aliases)
    brand = serializers.CharField(source='make', read_only=True)
    model_name = serializers.CharField(source='model', read_only=True)
    seats = serializers.IntegerField(source='seating_capacity', read_only=True)
    style = serializers.CharField(source='vehicle_style', read_only=True)
    dailyRate = serializers.DecimalField(source='price_per_day', max_digits=10, decimal_places=2, read_only=True)
    price = serializers.DecimalField(source='price_per_day', max_digits=10, decimal_places=2, read_only=True)
    securityDeposit = serializers.DecimalField(source='security_deposit', max_digits=10, decimal_places=2, read_only=True)
    description = serializers.CharField(source='vehicle_description', read_only=True)
    features = serializers.JSONField(source='available_features', read_only=True)
    instantBooking = serializers.BooleanField(source='instant_booking', read_only=True)
    isAvailable = serializers.BooleanField(source='is_available', read_only=True)
    fuelType = serializers.CharField(source='fuel_type', read_only=True)
    verified = serializers.BooleanField(source='is_verified', read_only=True)
    reviewCount = serializers.IntegerField(source='review_count', read_only=True)
    name = serializers.SerializerMethodField()
    
    # Make all model fields optional for partial updates
    make = serializers.CharField(required=False, allow_blank=False)
    model = serializers.CharField(required=False, allow_blank=False)
    year = serializers.IntegerField(required=False)
    color = serializers.CharField(required=False, allow_blank=False)
    transmission = serializers.ChoiceField(choices=Listing.TRANSMISSION_CHOICES, required=False)
    fuel_type = serializers.ChoiceField(choices=Listing.FUEL_TYPE_CHOICES, required=False)
    seating_capacity = serializers.IntegerField(required=False)
    luggage_capacity = serializers.CharField(required=False, allow_blank=True)
    range_km = serializers.CharField(required=False, allow_blank=True)
    vehicle_style = serializers.ChoiceField(choices=Listing.STYLE_CHOICES, required=False)
    price_per_day = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    security_deposit = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    location = serializers.CharField(required=False, allow_blank=False)
    vehicle_description = serializers.CharField(required=False, allow_blank=True)
    available_features = serializers.JSONField(required=False)
    images = serializers.JSONField(required=False)
    is_available = serializers.BooleanField(required=False)
    instant_booking = serializers.BooleanField(required=False)
    
    class Meta:
        model = Listing
        fields = [
            'id', 'public_id', 'partner', 'partner_id', 'make', 'brand', 'model', 'model_name',
            'year', 'color', 'transmission', 'fuel_type', 'fuelType',
            'seating_capacity', 'seats', 'vehicle_style', 'style',
            'luggage_capacity', 'range_km',
            'price_per_day', 'dailyRate', 'price', 'security_deposit', 'securityDeposit', 'location',
            'vehicle_description', 'description', 'available_features', 'features',
            'images', 'is_available', 'isAvailable', 'is_verified', 'verified',
            'instant_booking', 'instantBooking', 'rating', 'review_count', 'reviewCount',
            'created_at', 'updated_at', 'name'
        ]
        # Only include actual model fields, aliases are handled in to_representation
        read_only_fields = ['id', 'created_at', 'updated_at', 'rating', 'review_count', 'is_verified']
    
    def get_name(self, obj):
        """Return formatted vehicle name."""
        return f"{obj.make} {obj.model} {obj.year}"
    
    def validate(self, data):
        """Custom validation for listing quality and consistency."""
        current_year = timezone.now().year

        year = data.get('year', getattr(self.instance, 'year', None))
        if year is not None and (year < 1990 or year > current_year + 1):
            raise serializers.ValidationError({'year': f'Year must be between 1990 and {current_year + 1}.'})

        seating_capacity = data.get('seating_capacity', getattr(self.instance, 'seating_capacity', None))
        if seating_capacity is not None and (seating_capacity < 2 or seating_capacity > 9):
            raise serializers.ValidationError({'seating_capacity': 'Seating capacity must be between 2 and 9.'})

        price_per_day = data.get('price_per_day', getattr(self.instance, 'price_per_day', None))
        if price_per_day is not None and price_per_day <= 0:
            raise serializers.ValidationError({'price_per_day': 'Price per day must be greater than 0.'})

        security_deposit = data.get('security_deposit', getattr(self.instance, 'security_deposit', None))
        if security_deposit is not None and security_deposit < 0:
            raise serializers.ValidationError({'security_deposit': 'Security deposit cannot be negative.'})

        # Enforce minimum listing quality for active/public listings.
        is_available = data.get('is_available', getattr(self.instance, 'is_available', True))
        incoming_images = data.get('images', None)
        existing_images = getattr(self.instance, 'images', []) if self.instance else []
        images_source = incoming_images if incoming_images is not None else existing_images
        if images_source is None:
            images_source = []

        valid_image_count = 0
        for img in images_source:
            if isinstance(img, str):
                cleaned = img.strip()
                if cleaned and cleaned != '/carsymbol.jpg':
                    valid_image_count += 1
            elif isinstance(img, dict):
                cleaned = str(img.get('url', '')).strip()
                if cleaned and cleaned != '/carsymbol.jpg':
                    valid_image_count += 1

        should_enforce_image_quality = (
            self.instance is None or
            incoming_images is not None or
            ('is_available' in data and is_available)
        )
        if should_enforce_image_quality and is_available and valid_image_count < 3:
            raise serializers.ValidationError({'images': 'At least 3 real images are required for an active listing.'})

        return data
    
    def to_representation(self, instance):
        """Customize output to match frontend expectations."""
        data = super().to_representation(instance)
        # The aliases are already included from the field definitions above
        # Just ensure backward compatibility
        if 'fuelType' not in data:
            data['fuelType'] = data.get('fuel_type', '')
        if 'verified' not in data:
            data['verified'] = data.get('is_verified', False)
        if 'reviewCount' not in data:
            data['reviewCount'] = data.get('review_count', 0)
        
        # Process images to ensure full URLs (optimized for speed)
        if 'images' in data and data['images']:
            request = self.context.get('request')
            processed_images = []
            from django.conf import settings
            import os
            
            # Cache backend URL calculation (only compute once)
            if request:
                scheme = request.scheme
                host = request.get_host()
                if 'onrender.com' in host and scheme == 'http':
                    scheme = 'https'
                backend_url = f"{scheme}://{host}".rstrip('/')
            else:
                backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000').rstrip('/')
                if 'onrender.com' in backend_url and backend_url.startswith('http://'):
                    backend_url = backend_url.replace('http://', 'https://')
            
            # Optimized fix_image_url - filter out local media URLs, only return Supabase/external URLs
            def fix_image_url(url):
                """Fix image URL - filter out local media paths, only return Supabase/external URLs."""
                if not url or not isinstance(url, str):
                    return None
                
                url = url.strip()
                url_lower = url.lower()
                
                # Fast path: Already a Supabase URL - return as-is
                if 'supabase.co' in url_lower and '/storage/v1/object/public/' in url_lower:
                    return url
                
                # Filter out ALL local media URLs (including full URLs with domain)
                # Check for local media patterns in any form
                local_media_patterns = [
                    '/media/',
                    '/profiles/',
                    'localhost/media',
                    'localhost/profiles',
                    '127.0.0.1/media',
                    '127.0.0.1/profiles',
                    'airbcar-backend.onrender.com/media',
                    'airbcar-backend.onrender.com/profiles',
                    '.onrender.com/media',  # Catch any Render subdomain with /media
                    '.onrender.com/profiles',  # Catch any Render subdomain with /profiles
                ]
                
                # Check if URL contains any local media pattern
                if any(pattern in url_lower for pattern in local_media_patterns):
                    # This is a local media URL - filter it out (files don't exist on Render)
                    if settings.DEBUG:
                        print(f"⚠️ Filtering out local media URL: {url}")
                    return None
                
                # Check for paths starting with /media/ or /profiles/
                if url_lower.startswith('/media/') or url_lower.startswith('/profiles/'):
                    if settings.DEBUG:
                        print(f"⚠️ Filtering out local media path: {url}")
                    return None

                # Only return valid external URLs (not local)
                if url.startswith(('http://', 'https://')):
                    # Already checked for local patterns above, so this is a valid external URL
                    return url
                
                # Skip other cases (return None for invalid)
                return None
            
            # Process images - extract URL strings only (no dict wrappers)
            for img in data['images']:
                if isinstance(img, str):
                    fixed_url = fix_image_url(img)
                    if fixed_url:
                        processed_images.append(fixed_url)
                elif isinstance(img, dict) and 'url' in img:
                    # Extract URL from dict and add as string only
                    fixed_url = fix_image_url(img['url'])
                    if fixed_url:
                        processed_images.append(fixed_url)
                # Skip other types - we only want URL strings
            
            # Only add fallback if truly empty
            if not processed_images:
                processed_images = ['/carsymbol.jpg']
            
            data['images'] = processed_images
        
        return data


class BookingSerializer(serializers.ModelSerializer):
    """Booking serializer."""
    listing = ListingSerializer(read_only=True)
    customer = UserSerializer(read_only=True)
    user = UserSerializer(source='customer', read_only=True)
    partner = PartnerSerializer(read_only=True)
    
    # Alternative field names for start_date/end_date
    start_date = serializers.DateField(source='pickup_date', required=False, write_only=True)
    end_date = serializers.DateField(source='return_date', required=False, write_only=True)
    # Read aliases so frontend can use either name
    start_time = serializers.DateField(source='pickup_date', read_only=True)
    end_time = serializers.DateField(source='return_date', read_only=True)
    price = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2, read_only=True)
    requested_at = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'listing', 'customer', 'user', 'partner',
            'pickup_date', 'return_date',
            'pickup_time', 'return_time', 'pickup_location', 'return_location',
            'total_amount', 'price', 'status', 'payment_status', 'payment_method', 
            'request_message', 'rejection_reason',
            'license_front_document', 'license_back_document',
            'created_at', 'updated_at', 'requested_at',
            'start_date', 'end_date', 'start_time', 'end_time',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_internal_value(self, data):
        """Map alternative field names to canonical names."""
        # Create a mutable copy of data
        data = dict(data)
        
        # Map start_date to pickup_date if provided
        if 'start_date' in data and 'pickup_date' not in data:
            data['pickup_date'] = data.pop('start_date')
        
        # Map end_date to return_date if provided
        if 'end_date' in data and 'return_date' not in data:
            data['return_date'] = data.pop('end_date')
        
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        """Create booking."""
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update booking."""
        return super().update(instance, validated_data)


class FavoriteSerializer(serializers.ModelSerializer):
    """Favorite serializer."""
    listing = ListingSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'listing', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Review serializer with vote & response info."""
    user = UserSerializer(read_only=True)
    listing_id = serializers.IntegerField(source='listing.id', read_only=True)
    listing_name = serializers.SerializerMethodField()
    user_has_voted = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'listing_id', 'listing_name', 'user', 'rating', 'comment',
            'is_published', 'is_verified',
            'owner_response', 'owner_response_at',
            'helpful_count', 'user_has_voted',
            'replies', 'reply_count', 'reactions',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'helpful_count', 'is_verified']
    
    def get_listing_name(self, obj):
        try:
            return f"{obj.listing.make} {obj.listing.model} {obj.listing.year}"
        except Exception:
            return None

    def get_user_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if hasattr(obj, '_prefetched_objects_cache') and 'votes' in obj._prefetched_objects_cache:
                return any(v.user_id == request.user.id for v in obj.votes.all())
            return obj.votes.filter(user=request.user).exists()
        return False

    def get_replies(self, obj):
        # Only return top-level replies (children are nested inside)
        top_replies = obj.replies.filter(parent__isnull=True).select_related('user')[:10]
        return ReviewReplySerializer(top_replies, many=True, context=self.context).data

    def get_reply_count(self, obj):
        return obj.replies.count()

    def get_reactions(self, obj):
        from django.db.models import Count
        from .models import ReviewReaction
        counts_qs = obj.community_reactions.values('reaction').annotate(count=Count('id'))
        reaction_counts = {r['reaction']: r['count'] for r in counts_qs}
        total = sum(reaction_counts.values())
        user_reaction = None
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            ur = obj.community_reactions.filter(user=request.user).first()
            if ur:
                user_reaction = ur.reaction
        return {
            'reaction_counts': reaction_counts,
            'user_reaction': user_reaction,
            'total': total,
        }


class ReviewReplySerializer(serializers.ModelSerializer):
    """Serializer for review replies with nested children."""
    user = UserSerializer(read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        from .models import ReviewReply
        model = ReviewReply
        fields = ['id', 'review', 'user', 'parent', 'comment', 'children', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_children(self, obj):
        children = obj.children.select_related('user').all()
        return ReviewReplySerializer(children, many=True, context=self.context).data


class ReviewReactionSummarySerializer(serializers.Serializer):
    """Summarises reactions on a review: counts per type + user's own reaction."""
    reaction_counts = serializers.DictField(child=serializers.IntegerField())
    user_reaction = serializers.CharField(allow_null=True)
    total = serializers.IntegerField()


class ReviewReportSerializer(serializers.ModelSerializer):
    """Serializer for review reports."""
    class Meta:
        model = ReviewReport
        fields = ['id', 'review', 'reason', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer."""

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'is_read', 'created_at', 'related_object_id', 'related_object_type']
        read_only_fields = ['id', 'created_at']


class ListingCommentSerializer(serializers.ModelSerializer):
    """Serializer for social comments on listings."""
    user = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = ListingComment
        fields = ['id', 'listing', 'parent', 'user', 'content', 'replies', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
        extra_kwargs = {
            'listing': {'write_only': True},
            'parent': {'write_only': True},
        }

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'profile_picture_url': obj.user.profile_picture_url,
        }

    def get_replies(self, obj):
        # Only top-level comments carry replies; depth guard prevents runaway recursion
        if obj.parent_id is not None or self.context.get('_comment_depth', 0) >= 1:
            return []
        children = obj.replies.filter(is_active=True).order_by('created_at')
        ctx = {**self.context, '_comment_depth': self.context.get('_comment_depth', 0) + 1}
        return ListingCommentSerializer(children, many=True, context=ctx).data


class PartnerPostSerializer(serializers.ModelSerializer):
    """Serializer for partner social posts."""
    partner_name = serializers.CharField(source='partner.business_name', read_only=True)
    partner_logo_url = serializers.SerializerMethodField()
    linked_listing_name = serializers.SerializerMethodField()

    class Meta:
        model = PartnerPost
        fields = [
            'id', 'partner', 'partner_name', 'partner_logo_url',
            'content', 'post_type', 'image_url',
            'linked_listing', 'linked_listing_name',
            'created_at',
        ]
        read_only_fields = ['id', 'partner', 'partner_name', 'partner_logo_url', 'created_at']
        extra_kwargs = {
            'linked_listing': {'write_only': False, 'required': False, 'allow_null': True},
        }

    def get_partner_logo_url(self, obj):
        return obj.partner.logo_url if obj.partner else None

    def get_linked_listing_name(self, obj):
        if obj.linked_listing:
            return obj.linked_listing.name
        return None


class TripPostCommentSerializer(serializers.ModelSerializer):
    """Serializer for comments on trip posts."""
    user = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = TripPostComment
        fields = ['id', 'trip_post', 'parent', 'user', 'content', 'replies', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
        extra_kwargs = {
            'trip_post': {'write_only': True},
            'parent': {'write_only': True},
        }

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'profile_picture_url': obj.user.profile_picture_url,
        }

    def get_replies(self, obj):
        if obj.parent_id is not None or self.context.get('_comment_depth', 0) >= 1:
            return []
        children = obj.replies.filter(is_active=True).order_by('created_at')
        ctx = {**self.context, '_comment_depth': self.context.get('_comment_depth', 0) + 1}
        return TripPostCommentSerializer(children, many=True, context=ctx).data


class TripPostSerializer(serializers.ModelSerializer):
    """Serializer for customer trip posts."""
    user = serializers.SerializerMethodField()
    listing_name = serializers.SerializerMethodField()
    listing_id = serializers.SerializerMethodField()
    partner_name = serializers.SerializerMethodField()
    reaction_summary = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = TripPost
        fields = [
            'id', 'user', 'booking', 'caption', 'images',
            'listing_name', 'listing_id', 'partner_name',
            'reaction_summary', 'comment_count',
            'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']
        extra_kwargs = {
            'booking': {'write_only': True},
        }

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'profile_picture_url': obj.user.profile_picture_url,
        }

    def get_listing_name(self, obj):
        return obj.booking.listing.name if obj.booking and obj.booking.listing else None

    def get_listing_id(self, obj):
        return obj.booking.listing_id if obj.booking else None

    def get_partner_name(self, obj):
        try:
            return obj.booking.listing.partner.business_name
        except AttributeError:
            return None

    def get_reaction_summary(self, obj):
        from django.db.models import Count
        return list(
            obj.community_reactions.values('reaction').annotate(count=Count('id')).order_by('-count')
        )

    def get_comment_count(self, obj):
        return obj.community_comments.filter(is_active=True).count()


class CommunityPostCommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPostComment
        fields = ['id', 'user', 'content', 'created_at', 'parent', 'replies']
        read_only_fields = ['id', 'user', 'created_at', 'replies']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'profile_picture_url': obj.user.profile_picture_url,
        }

    def get_replies(self, obj):
        if obj.parent_id is not None or self.context.get('_comment_depth', 0) >= 1:
            return []
        children = obj.replies.filter(is_active=True).order_by('created_at')
        ctx = {**self.context, '_comment_depth': self.context.get('_comment_depth', 0) + 1}
        return CommunityPostCommentSerializer(children, many=True, context=ctx).data


class CommunityPostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    reaction_summary = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            'id', 'author', 'listing', 'content', 'images',
            'reaction_summary', 'comment_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author(self, obj):
        return {
            'id': obj.author.id,
            'username': obj.author.username,
            'first_name': obj.author.first_name,
            'last_name': obj.author.last_name,
            'profile_picture_url': obj.author.profile_picture_url,
        }

    def get_comment_count(self, obj):
        return obj.community_comments.filter(is_active=True).count()

class CarShareRequestSerializer(serializers.ModelSerializer):
    requester = PartnerSerializer(read_only=True)
    owner = PartnerSerializer(read_only=True)
    listing = ListingCompactSerializer(read_only=True)
    
    public_id = serializers.CharField(write_only=True)

    class Meta:
        model = CarShareRequest
        fields = [
            'id', 'listing_id', 'requester', 'owner', 'listing', 
            'public_id', 'start_date', 'end_date', 'status', 'total_price', 
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        public_id = validated_data.pop('public_id')
        try:
            listing = Listing.objects.get(public_id=public_id)
        except Listing.DoesNotExist:
            raise serializers.ValidationError({"public_id": "Listing not found."})
        
        request = self.context.get('request')
        requester = getattr(request.user, 'partner_profile', None)
        if not requester:
            raise serializers.ValidationError({"requester": "Only partners can request a car share."})
        
        if requester == listing.partner:
            raise serializers.ValidationError({"requester": "You cannot request your own car."})

        car_share_request = CarShareRequest.objects.create(
            requester=requester,
            owner=listing.partner,
            listing=listing,
            **validated_data
        )
        return car_share_request

class B2BMessageSerializer(serializers.ModelSerializer):
    sender = PartnerSerializer(read_only=True)

    class Meta:
        model = B2BMessage
        fields = ['id', 'car_share_request', 'sender', 'text', 'created_at']
        read_only_fields = ['id', 'car_share_request', 'sender', 'created_at']

class VehicleInspectionSerializer(serializers.ModelSerializer):
    recorded_by = PartnerSerializer(read_only=True)

    class Meta:
        model = VehicleInspection
        fields = ['id', 'car_share_request', 'stage', 'recorded_by', 'mileage', 'fuel_level', 'images', 'condition_notes', 'is_approved', 'created_at']
        read_only_fields = ['id', 'car_share_request', 'recorded_by', 'created_at']



