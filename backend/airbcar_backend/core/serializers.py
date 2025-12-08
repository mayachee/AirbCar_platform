"""
DRF serializers for core app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
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


class PartnerSerializer(serializers.ModelSerializer):
    """Partner serializer."""
    user = UserSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()
    companyName = serializers.CharField(source='business_name', read_only=True)
    businessName = serializers.CharField(source='business_name', read_only=True)
    
    class Meta:
        model = Partner
        fields = ['id', 'user', 'business_name', 'business_type', 'business_license',
                  'tax_id', 'bank_account', 'description', 'logo', 'logo_url', 'is_verified', 'rating', 'review_count',
                  'total_bookings', 'total_earnings', 'created_at', 'companyName', 'businessName']
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
        
        # Process images to ensure full URLs
        if 'images' in data and data['images']:
            request = self.context.get('request')
            processed_images = []
            from django.conf import settings
            backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
            
            def fix_image_url(url):
                """Fix image URL - only return Supabase or external URLs, not local media files."""
                if not url:
                    return None
                
                # If it's a Supabase Storage URL, return as is
                if 'supabase.co' in url and '/storage/v1/object/public/' in url:
                    return url
                
                # If it's a local media path (/media/) or backend URL pointing to media, return None
                # Local files are not accessible on Render - must be hosted in Supabase
                if url.startswith('/media/') or '/media/' in url:
                    return None
                
                # If it's pointing to backend media server, return None
                if 'airbcar-backend.onrender.com' in url and '/media/' in url:
                    return None
                if 'localhost' in url and '/media/' in url:
                    return None
                if '127.0.0.1' in url and '/media/' in url:
                    return None
                
                # If it's an external URL (http/https), allow it (Supabase, Google, CDNs, etc.)
                if url.startswith('http://') or url.startswith('https://'):
                    return url
                
                # If it's a relative path or local file reference, return None
                return None
            
            for img in data['images']:
                if isinstance(img, str):
                    fixed_url = fix_image_url(img)
                    # Only include if URL is valid (not None - which means local file)
                    if fixed_url:
                        processed_images.append(fixed_url)
                elif isinstance(img, dict):
                    # If it's an object, process the url field
                    if 'url' in img:
                        fixed_url = fix_image_url(img['url'])
                        # Only include if URL is valid (not None - which means local file)
                        if fixed_url:
                            img['url'] = fixed_url
                            processed_images.append(img)
                    else:
                        processed_images.append(img)
                else:
                    # For any other type, append as-is
                    processed_images.append(img)
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
            return obj.id_front_document_url
        
        # Don't return local file URLs - they're not accessible on Render
        return None
    
    def get_id_back_document_url(self, obj):
        """Return full URL for back identity document. Only returns Supabase URLs."""
        # Only return Supabase URL - local files are not accessible on production (Render)
        if obj.id_back_document_url:
            return obj.id_back_document_url
        
        # Don't return local file URLs - they're not accessible on Render
        return None


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

