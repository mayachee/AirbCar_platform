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
            'phone_number', 'profile_picture', 'profile_picture_url',
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
        read_only_fields = ['id', 'date_joined', 'role', 'is_verified', 'username']
        extra_kwargs = {
            'id_front_document': {'write_only': True},  # Don't return in API, use URL instead
            'id_back_document': {'write_only': True},    # Don't return in API, use URL instead
            'license_front_document': {'write_only': True},  # Don't return in API, use URL instead
            'license_back_document': {'write_only': True},    # Don't return in API, use URL instead
        }
    
    def get_profile_picture_url(self, obj):
        """Return full URL for profile picture. Prioritizes URL field (e.g., Google profile) over uploaded file."""
        # First check if there's a profile_picture_url (e.g., from Google Sign-In)
        if hasattr(obj, 'profile_picture_url') and obj.profile_picture_url:
            return obj.profile_picture_url
        
        # Fallback to uploaded profile_picture file
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def get_id_front_document_url(self, obj):
        """Return full URL for front identity document."""
        # Priority: Supabase URL > Local file URL
        if obj.id_front_document_url:
            return obj.id_front_document_url
        
        if obj.id_front_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.id_front_document.url)
            return obj.id_front_document.url
        return None
    
    def get_id_back_document_url(self, obj):
        """Return full URL for back identity document."""
        # Priority: Supabase URL > Local file URL
        if obj.id_back_document_url:
            return obj.id_back_document_url
        
        if obj.id_back_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.id_back_document.url)
            return obj.id_back_document.url
        return None
    
    def get_license_front_document_url(self, obj):
        """Return full URL for front license document."""
        # Only return Supabase URL - local files are not accessible on production (Render)
        # If only local file exists, return None (file needs to be re-uploaded to Supabase)
        if obj.license_front_document_url:
            return obj.license_front_document_url
        
        # Don't return local file URLs - they're not accessible on Render
        # If user has local file but no Supabase URL, they need to re-upload
        return None
    
    def get_license_back_document_url(self, obj):
        """Return full URL for back license document."""
        # Only return Supabase URL - local files are not accessible on production (Render)
        # If only local file exists, return None (file needs to be re-uploaded to Supabase)
        if obj.license_back_document_url:
            return obj.license_back_document_url
        
        # Don't return local file URLs - they're not accessible on Render
        # If user has local file but no Supabase URL, they need to re-upload
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
        """Return full URL for partner logo."""
        # Priority: Supabase URL > Local file URL > User profile picture
        if obj.logo_url:
            return obj.logo_url
        
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        
        # Fallback to user's profile picture
        if obj.user and obj.user.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_picture.url)
            return obj.user.profile_picture.url
        
        # Fallback to user's profile_picture_url if available
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
                """Fix image URL to use correct backend URL."""
                if not url:
                    return url
                
                # If it's already a full URL (http/https), return as is
                if url.startswith('http://') or url.startswith('https://'):
                    # Check if it's an external URL (Google, Supabase, etc.)
                    if 'supabase.co' in url or 'googleusercontent.com' in url or 'lh3.googleusercontent.com' in url:
                        return url
                    # For other external URLs, return as is
                    return url
                
                # If it's a Supabase Storage URL, return as is (don't modify)
                if 'supabase.co' in url and '/storage/v1/object/public/' in url:
                    return url
                
                # If it's a relative path starting with /media/, make it absolute
                if url.startswith('/media/'):
                    return f"{backend_url}{url}"
                
                # If it's already an absolute URL
                if url.startswith('http://') or url.startswith('https://'):
                    # Check for malformed URLs with /partner/airbcar-backend/ or similar patterns
                    if '/partner/' in url or '/airbcar-backend/' in url:
                        # Extract the media path if it exists
                        if '/media/' in url:
                            media_index = url.find('/media/')
                            media_path = url[media_index:]
                            # Remove query parameters and fragments
                            if '?' in media_path:
                                media_path = media_path.split('?')[0]
                            if '#' in media_path:
                                media_path = media_path.split('#')[0]
                            return f"{backend_url}{media_path}"
                    
                    # Check if it contains /media/ - extract the media path and reconstruct
                    if '/media/' in url:
                        # Check if it's pointing to wrong domain (frontend domain instead of backend)
                        if 'www.airbcar.com' in url or 'airbcar.com' in url:
                            # Extract everything after /media/ including /media/ itself
                            media_index = url.find('/media/')
                            media_path = url[media_index:]  # Get /media/... onwards
                            # Remove any query parameters or fragments
                            if '?' in media_path:
                                media_path = media_path.split('?')[0]
                            if '#' in media_path:
                                media_path = media_path.split('#')[0]
                            return f"{backend_url}{media_path}"
                        # If it already points to correct backend, return as is
                        elif backend_url in url:
                            return url
                        # Otherwise extract media path and use backend URL
                        else:
                            media_index = url.find('/media/')
                            media_path = url[media_index:]
                            if '?' in media_path:
                                media_path = media_path.split('?')[0]
                            if '#' in media_path:
                                media_path = media_path.split('#')[0]
                            return f"{backend_url}{media_path}"
                
                return url
            
            for img in data['images']:
                if isinstance(img, str):
                    processed_images.append(fix_image_url(img))
                elif isinstance(img, dict):
                    # If it's an object, process the url field
                    if 'url' in img:
                        img['url'] = fix_image_url(img['url'])
                    processed_images.append(img)
                else:
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
        """Return full URL for front identity document."""
        # Priority: Supabase URL > Local file URL
        if obj.id_front_document_url:
            return obj.id_front_document_url
        
        if obj.id_front_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.id_front_document.url)
            return obj.id_front_document.url
        return None
    
    def get_id_back_document_url(self, obj):
        """Return full URL for back identity document."""
        # Priority: Supabase URL > Local file URL
        if obj.id_back_document_url:
            return obj.id_back_document_url
        
        if obj.id_back_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.id_back_document.url)
            return obj.id_back_document.url
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

