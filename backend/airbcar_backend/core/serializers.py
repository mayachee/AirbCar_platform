"""
DRF serializers for core app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import User, Partner, Listing, Booking, Favorite, Review

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer."""
    profile_picture_url = serializers.SerializerMethodField()
    id_front_document_url = serializers.SerializerMethodField()
    id_back_document_url = serializers.SerializerMethodField()
    license_front_document_url = serializers.SerializerMethodField()
    license_back_document_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 
            'phone_number', 'profile_picture', 'profile_picture_url', 'profile_picture_base64',
            'id_front_document', 'id_front_document_url',
            'id_back_document', 'id_back_document_url',
            'license_front_document', 'license_front_document_url',
            'license_back_document', 'license_back_document_url',
            'is_verified', 'date_joined',
            # Personal Information
            'date_of_birth', 'nationality',
            # Address Information
            'address', 'city', 'country', 'country_of_residence', 'postal_code',
            # License Information
            'license_number', 'license_origin_country', 'issue_date', 'expiry_date'
        ]
        read_only_fields = ['id', 'date_joined', 'role', 'is_verified', 'username', 'profile_picture_base64']
        extra_kwargs = {
            'id_front_document': {'write_only': True},  # Don't return in API, use URL instead
            'id_back_document': {'write_only': True},    # Don't return in API, use URL instead
            'license_front_document': {'write_only': True},  # Don't return in API, use URL instead
            'license_back_document': {'write_only': True},    # Don't return in API, use URL instead
        }
    
    def get_profile_picture_url(self, obj):
        """Return full URL for profile picture. Priority: base64 > Supabase/external URLs > None."""
        try:
            # First check if there's a base64 data URL (stored directly in database)
            if hasattr(obj, 'profile_picture_base64') and obj.profile_picture_base64:
                # Return base64 data URL if it exists (format: data:image/jpeg;base64,...)
                base64_data = obj.profile_picture_base64
                if base64_data and isinstance(base64_data, str) and base64_data.startswith('data:image/'):
                    return base64_data
            
            # Then check if there's a profile_picture_url (e.g., from Google Sign-In or Supabase)
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
    
    def get_id_front_document_url(self, obj):
        """Return full URL for front identity document. Only returns Supabase URLs."""
        try:
            # Only return Supabase URL - local files are not accessible on production (Render)
            # Filter out any URLs that point to local media (even if stored in _url field)
            if hasattr(obj, 'id_front_document_url') and obj.id_front_document_url:
                url = str(obj.id_front_document_url)
                # Filter out local media URLs
                if (
                    '/media/' in url or
                    '/profiles/' in url or
                    'airbcar-backend.onrender.com/media/' in url or
                    'localhost/media/' in url or
                    '127.0.0.1/media/' in url
                ):
                    # This is a local file URL, don't return it
                    return None
                # Only return Supabase or external URLs
                if 'supabase.co' in url and '/storage/v1/object/public/' in url:
                    return url
                # Allow other external URLs (Google, CDNs, etc.)
                if url.startswith('http://') or url.startswith('https://'):
                    return url
            
            # Don't return local file URLs - they're not accessible on Render
            return None
        except Exception:
            return None
    
    def get_id_back_document_url(self, obj):
        """Return full URL for back identity document. Only returns Supabase URLs."""
        try:
            # Only return Supabase URL - local files are not accessible on production (Render)
            # Filter out any URLs that point to local media (even if stored in _url field)
            if hasattr(obj, 'id_back_document_url') and obj.id_back_document_url:
                url = str(obj.id_back_document_url)
                # Filter out local media URLs
                if (
                    '/media/' in url or
                    '/profiles/' in url or
                    'airbcar-backend.onrender.com/media/' in url or
                    'localhost/media/' in url or
                    '127.0.0.1/media/' in url
                ):
                    # This is a local file URL, don't return it
                    return None
                # Only return Supabase or external URLs
                if 'supabase.co' in url and '/storage/v1/object/public/' in url:
                    return url
                # Allow other external URLs (Google, CDNs, etc.)
                if url.startswith('http://') or url.startswith('https://'):
                    return url
            
            # Don't return local file URLs - they're not accessible on Render
            return None
        except Exception:
            return None
    
    def get_license_front_document_url(self, obj):
        """Return full URL for front license document."""
        try:
            # Only return Supabase URL - local files are not accessible on production (Render)
            # Filter out any URLs that point to local media (even if stored in _url field)
            if hasattr(obj, 'license_front_document_url') and obj.license_front_document_url:
                url = str(obj.license_front_document_url)
                # Filter out local media URLs
                if (
                    '/media/' in url or
                    '/profiles/' in url or
                    'airbcar-backend.onrender.com/media/' in url or
                    'localhost/media/' in url or
                    '127.0.0.1/media/' in url
                ):
                    # This is a local file URL, don't return it
                    return None
                # Only return Supabase or external URLs
                if 'supabase.co' in url and '/storage/v1/object/public/' in url:
                    return url
                # Allow other external URLs (Google, CDNs, etc.)
                if url.startswith('http://') or url.startswith('https://'):
                    return url
            
            # Don't return local file URLs - they're not accessible on Render
            # If user has local file but no Supabase URL, they need to re-upload
            return None
        except Exception:
            return None
    
    def get_license_back_document_url(self, obj):
        """Return full URL for back license document."""
        try:
            # Only return Supabase URL - local files are not accessible on production (Render)
            # Filter out any URLs that point to local media (even if stored in _url field)
            if hasattr(obj, 'license_back_document_url') and obj.license_back_document_url:
                url = str(obj.license_back_document_url)
                # Filter out local media URLs
                if (
                    '/media/' in url or
                    '/profiles/' in url or
                    'airbcar-backend.onrender.com/media/' in url or
                    'localhost/media/' in url or
                    '127.0.0.1/media/' in url
                ):
                    # This is a local file URL, don't return it
                    return None
                # Only return Supabase or external URLs
                if 'supabase.co' in url and '/storage/v1/object/public/' in url:
                    return url
                # Allow other external URLs (Google, CDNs, etc.)
                if url.startswith('http://') or url.startswith('https://'):
                    return url
            
            # Don't return local file URLs - they're not accessible on Render
            # If user has local file but no Supabase URL, they need to re-upload
            return None
        except Exception:
            return None
    
    def update(self, instance, validated_data):
        """Update user profile and handle document uploads to Supabase Storage."""
        request = self.context.get('request')
        
        # Handle document uploads to Supabase Storage
        # Process files from request.FILES and upload to Supabase
        if request and request.FILES:
            # Use absolute import to avoid relative import issues
            try:
                from core.utils.image_utils import upload_file_to_supabase_storage
            except ImportError:
                from ..utils.image_utils import upload_file_to_supabase_storage
            
            # Handle ID front document
            if 'id_front_document' in request.FILES:
                try:
                    doc_file = request.FILES['id_front_document']
                    supabase_url = upload_file_to_supabase_storage(
                        file=doc_file,
                        bucket_name='listings',  # Use listings bucket (or create 'user_documents' bucket)
                        folder='user_documents/identity',
                        user_id=instance.id
                    )
                    instance.id_front_document_url = supabase_url
                    instance.id_front_document = None  # Clear local file field
                    if settings.DEBUG:
                        print(f"✅ ID front document uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload ID front document: {str(e)}")
                    raise ValueError(f"Failed to upload ID front document: {str(e)}")
            
            # Handle ID back document
            if 'id_back_document' in request.FILES:
                try:
                    doc_file = request.FILES['id_back_document']
                    supabase_url = upload_file_to_supabase_storage(
                        file=doc_file,
                        bucket_name='listings',
                        folder='user_documents/identity',
                        user_id=instance.id
                    )
                    instance.id_back_document_url = supabase_url
                    instance.id_back_document = None  # Clear local file field
                    if settings.DEBUG:
                        print(f"✅ ID back document uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload ID back document: {str(e)}")
                    raise ValueError(f"Failed to upload ID back document: {str(e)}")
            
            # Handle license front document
            if 'license_front_document' in request.FILES:
                try:
                    doc_file = request.FILES['license_front_document']
                    supabase_url = upload_file_to_supabase_storage(
                        file=doc_file,
                        bucket_name='listings',
                        folder='user_documents/license',
                        user_id=instance.id
                    )
                    instance.license_front_document_url = supabase_url
                    instance.license_front_document = None  # Clear local file field
                    if settings.DEBUG:
                        print(f"✅ License front document uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload license front document: {str(e)}")
                    raise ValueError(f"Failed to upload license front document: {str(e)}")
            
            # Handle license back document
            if 'license_back_document' in request.FILES:
                try:
                    doc_file = request.FILES['license_back_document']
                    supabase_url = upload_file_to_supabase_storage(
                        file=doc_file,
                        bucket_name='listings',
                        folder='user_documents/license',
                        user_id=instance.id
                    )
                    instance.license_back_document_url = supabase_url
                    instance.license_back_document = None  # Clear local file field
                    if settings.DEBUG:
                        print(f"✅ License back document uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload license back document: {str(e)}")
                    raise ValueError(f"Failed to upload license back document: {str(e)}")
            
            # Handle profile picture upload
            if 'profile_picture' in request.FILES:
                try:
                    pic_file = request.FILES['profile_picture']
                    supabase_url = upload_file_to_supabase_storage(
                        file=pic_file,
                        bucket_name='listings',
                        folder='user_documents/profiles',
                        user_id=instance.id
                    )
                    instance.profile_picture_url = supabase_url
                    instance.profile_picture = None  # Clear local file field
                    if settings.DEBUG:
                        print(f"✅ Profile picture uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload profile picture: {str(e)}")
                    raise ValueError(f"Failed to upload profile picture: {str(e)}")
        
        # Handle document removal (if explicitly set to None or empty string)
        if 'id_front_document' in validated_data and validated_data['id_front_document'] is None:
            instance.id_front_document = None
            instance.id_front_document_url = None
            validated_data.pop('id_front_document')
        
        if 'id_back_document' in validated_data and validated_data['id_back_document'] is None:
            instance.id_back_document = None
            instance.id_back_document_url = None
            validated_data.pop('id_back_document')
        
        if 'license_front_document' in validated_data and validated_data['license_front_document'] is None:
            instance.license_front_document = None
            instance.license_front_document_url = None
            validated_data.pop('license_front_document')
        
        if 'license_back_document' in validated_data and validated_data['license_back_document'] is None:
            instance.license_back_document = None
            instance.license_back_document_url = None
            validated_data.pop('license_back_document')
        
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


class PartnerSerializer(serializers.ModelSerializer):
    """Partner serializer."""
    user = UserSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()
    companyName = serializers.CharField(source='business_name', read_only=True)
    businessName = serializers.CharField(source='business_name', read_only=True)
    
    # Address fields from related User model
    # These are writable fields that will be handled in update method
    address = serializers.CharField(required=False, allow_blank=True, write_only=False)
    city = serializers.CharField(required=False, allow_blank=True, write_only=False)
    state = serializers.CharField(required=False, allow_blank=True, write_only=False)
    
    def to_representation(self, instance):
        """Override to include address fields from user model."""
        ret = super().to_representation(instance)
        # Get address fields from user model
        if instance.user:
            ret['address'] = instance.user.address or ''
            ret['city'] = instance.user.city or ''
            ret['state'] = instance.user.country or ''  # state maps to country
        else:
            ret['address'] = ''
            ret['city'] = ''
            ret['state'] = ''
        return ret
    
    class Meta:
        model = Partner
        fields = ['id', 'user', 'business_name', 'business_type', 'business_license',
                  'tax_id', 'bank_account', 'description', 'logo', 'logo_url', 'is_verified', 'rating', 'review_count',
                  'total_bookings', 'total_earnings', 'created_at', 'companyName', 'businessName',
                  'address', 'city', 'state']
        read_only_fields = ['id', 'created_at', 'logo_url']
    
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
    
    def update(self, instance, validated_data):
        """Update partner and related user address fields."""
        # Extract address fields from validated_data (use _MARKER to distinguish None from not provided)
        _MARKER = object()
        address = validated_data.pop('address', _MARKER)
        city = validated_data.pop('city', _MARKER)
        state = validated_data.pop('state', _MARKER)
        
        # Also check if 'user' key exists (from nested data structure from view)
        if 'user' in validated_data:
            user_data = validated_data.pop('user', {})
            # Use nested data if flat fields weren't provided
            if address is _MARKER and 'address' in user_data:
                address = user_data['address']
            if city is _MARKER and 'city' in user_data:
                city = user_data['city']
            if state is _MARKER:
                # Check both 'state' and 'country' in nested data
                state = user_data.get('state') or user_data.get('country')
        
        # Update user address fields if provided (convert empty strings to None)
        user_updated = False
        if address is not _MARKER:
            user_updated = True
            instance.user.address = address.strip() if address and address.strip() else None
        if city is not _MARKER:
            user_updated = True
            instance.user.city = city.strip() if city and city.strip() else None
        if state is not _MARKER:
            user_updated = True
            instance.user.country = state.strip() if state and state.strip() else None  # state maps to country
        
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
                # Upload logo to Supabase Storage in 'listings' bucket (or create 'partner_logos' bucket)
                supabase_url = upload_file_to_supabase_storage(
                    file=logo_file,
                    bucket_name='listings',  # Use listings bucket (or create separate 'partner_logos' bucket)
                    folder='partner_logos',
                    user_id=instance.user.id if instance.user else None
                )
                # Store Supabase URL in logo_url field
                instance.logo_url = supabase_url
                # Clear local logo field (we're using Supabase now)
                instance.logo = None
                if settings.DEBUG:
                    print(f"✅ Partner logo uploaded to Supabase: {supabase_url}")
            except Exception as e:
                error_msg = str(e)
                if settings.DEBUG:
                    print(f"❌ Failed to upload partner logo to Supabase: {error_msg}")
                # Don't fail the entire update, but log the error
                # The logo won't be updated if Supabase upload fails
                raise ValueError(f"Failed to upload logo to Supabase Storage: {error_msg}")
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
    vehicle_style = serializers.ChoiceField(choices=Listing.STYLE_CHOICES, required=False)
    price_per_day = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    location = serializers.CharField(required=False, allow_blank=False)
    vehicle_description = serializers.CharField(required=False, allow_blank=True)
    available_features = serializers.JSONField(required=False)
    images = serializers.JSONField(required=False)
    is_available = serializers.BooleanField(required=False)
    instant_booking = serializers.BooleanField(required=False)
    
    class Meta:
        model = Listing
        fields = [
            'id', 'partner', 'partner_id', 'make', 'brand', 'model', 'model_name',
            'year', 'color', 'transmission', 'fuel_type', 'fuelType',
            'seating_capacity', 'seats', 'vehicle_style', 'style',
            'price_per_day', 'dailyRate', 'price', 'location',
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
        """Custom validation for listing data."""
        # When doing partial updates, only validate fields that are present
        # This allows partial updates without requiring all fields
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
            
            # Process images (optimized loop)
            for img in data['images']:
                if isinstance(img, str):
                    fixed_url = fix_image_url(img)
                    if fixed_url:
                        processed_images.append(fixed_url)
                elif isinstance(img, dict) and 'url' in img:
                    fixed_url = fix_image_url(img['url'])
                    if fixed_url:
                        processed_images.append({**img, 'url': fixed_url})
                elif isinstance(img, dict):
                    # Dict without url, keep as-is
                    processed_images.append(img)
                else:
                    # Other types, keep as-is
                    processed_images.append(img)
            
            # Only add fallback if truly empty
            if not processed_images:
                processed_images = ['/carsymbol.jpg']
            
            data['images'] = processed_images
        
        return data


class BookingSerializer(serializers.ModelSerializer):
    """Booking serializer."""
    listing = ListingSerializer(read_only=True)
    customer = UserSerializer(read_only=True)
    partner = PartnerSerializer(read_only=True)
    id_front_document_url = serializers.SerializerMethodField()
    id_back_document_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'listing', 'customer', 'partner', 'pickup_date', 'return_date',
            'pickup_time', 'return_time', 'pickup_location', 'return_location',
            'total_amount', 'status', 'payment_status', 'payment_method', 'special_requests',
            'id_front_document', 'id_front_document_url',
            'id_back_document', 'id_back_document_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'id_front_document': {'write_only': True},  # Don't return in API, use URL instead
            'id_back_document': {'write_only': True},    # Don't return in API, use URL instead
        }
    
    def get_id_front_document_url(self, obj):
        """Return full URL for front identity document. Only returns Supabase URLs."""
        # Only return Supabase URL - local files are not accessible on production (Render)
        if obj.id_front_document_url:
            url = str(obj.id_front_document_url)
            # Filter out local media URLs
            if '/media/' in url.lower() or 'airbcar-backend.onrender.com/media' in url.lower():
                return None
            return url
        
        # Don't return local file URLs - they're not accessible on Render
        return None
    
    def get_id_back_document_url(self, obj):
        """Return full URL for back identity document. Only returns Supabase URLs."""
        # Only return Supabase URL - local files are not accessible on production (Render)
        if obj.id_back_document_url:
            url = str(obj.id_back_document_url)
            # Filter out local media URLs
            if '/media/' in url.lower() or 'airbcar-backend.onrender.com/media' in url.lower():
                return None
            return url
        
        # Don't return local file URLs - they're not accessible on Render
        return None
    
    def create(self, validated_data):
        """Create booking and handle document uploads to Supabase Storage."""
        request = self.context.get('request')
        
        # Get customer ID (could be object or ID)
        customer = validated_data.get('customer')
        customer_id = customer.id if hasattr(customer, 'id') else customer if isinstance(customer, int) else None
        
        # Handle document uploads to Supabase Storage
        if request and request.FILES:
            # Use absolute import to avoid relative import issues
            try:
                from core.utils.image_utils import upload_file_to_supabase_storage
            except ImportError:
                from ..utils.image_utils import upload_file_to_supabase_storage
            
            # Handle ID front document
            if 'id_front_document' in request.FILES:
                try:
                    doc_file = request.FILES['id_front_document']
                    supabase_url = upload_file_to_supabase_storage(
                        file=doc_file,
                        bucket_name='listings',
                        folder='booking_documents/identity',
                        user_id=customer_id
                    )
                    validated_data['id_front_document_url'] = supabase_url
                    validated_data['id_front_document'] = None  # Don't save local file
                    if settings.DEBUG:
                        print(f"✅ Booking ID front document uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload booking ID front document: {str(e)}")
                    raise ValueError(f"Failed to upload ID front document: {str(e)}")
            
            # Handle ID back document
            if 'id_back_document' in request.FILES:
                try:
                    doc_file = request.FILES['id_back_document']
                    supabase_url = upload_file_to_supabase_storage(
                        file=doc_file,
                        bucket_name='listings',
                        folder='booking_documents/identity',
                        user_id=customer_id
                    )
                    validated_data['id_back_document_url'] = supabase_url
                    validated_data['id_back_document'] = None  # Don't save local file
                    if settings.DEBUG:
                        print(f"✅ Booking ID back document uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload booking ID back document: {str(e)}")
                    raise ValueError(f"Failed to upload ID back document: {str(e)}")
        
        # Create booking
        booking = super().create(validated_data)
        return booking
    
    def update(self, instance, validated_data):
        """Update booking and handle document uploads to Supabase Storage."""
        request = self.context.get('request')
        
        # Handle document uploads to Supabase Storage
        if request and request.FILES:
            # Use absolute import to avoid relative import issues
            try:
                from core.utils.image_utils import upload_file_to_supabase_storage
            except ImportError:
                from ..utils.image_utils import upload_file_to_supabase_storage
            
            # Handle ID front document
            if 'id_front_document' in request.FILES:
                try:
                    doc_file = request.FILES['id_front_document']
                    customer_id = instance.customer.id if instance.customer else None
                    supabase_url = upload_file_to_supabase_storage(
                        file=doc_file,
                        bucket_name='listings',
                        folder='booking_documents/identity',
                        user_id=customer_id
                    )
                    instance.id_front_document_url = supabase_url
                    instance.id_front_document = None  # Clear local file field
                    if settings.DEBUG:
                        print(f"✅ Booking ID front document uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload booking ID front document: {str(e)}")
                    raise ValueError(f"Failed to upload ID front document: {str(e)}")
            
            # Handle ID back document
            if 'id_back_document' in request.FILES:
                try:
                    doc_file = request.FILES['id_back_document']
                    customer_id = instance.customer.id if instance.customer else None
                    supabase_url = upload_file_to_supabase_storage(
                        file=doc_file,
                        bucket_name='listings',
                        folder='booking_documents/identity',
                        user_id=customer_id
                    )
                    instance.id_back_document_url = supabase_url
                    instance.id_back_document = None  # Clear local file field
                    if settings.DEBUG:
                        print(f"✅ Booking ID back document uploaded to Supabase: {supabase_url}")
                except Exception as e:
                    if settings.DEBUG:
                        print(f"❌ Failed to upload booking ID back document: {str(e)}")
                    raise ValueError(f"Failed to upload ID back document: {str(e)}")
        
        # Handle document removal
        if 'id_front_document' in validated_data and validated_data['id_front_document'] is None:
            instance.id_front_document = None
            instance.id_front_document_url = None
            validated_data.pop('id_front_document')
        
        if 'id_back_document' in validated_data and validated_data['id_back_document'] is None:
            instance.id_back_document = None
            instance.id_back_document_url = None
            validated_data.pop('id_back_document')
        
        # Update other fields
        for attr, value in validated_data.items():
            if hasattr(instance, attr):
                setattr(instance, attr, value)
        
        instance.save()
        return instance


class FavoriteSerializer(serializers.ModelSerializer):
    """Favorite serializer."""
    listing = ListingSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'listing', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Review serializer."""
    listing = ListingSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'listing', 'user', 'rating', 'comment', 'is_published',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

