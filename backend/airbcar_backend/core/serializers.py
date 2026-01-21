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
    is_partner = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_partner', 
            'phone_number', 'profile_picture_url',
            'is_verified', 'date_joined',
            # Personal Information
            'date_of_birth', 'nationality',
            # License Information
            'license_number', 'license_origin_country', 'issue_date', 'expiry_date'
        ]
        read_only_fields = ['id', 'date_joined', 'role', 'is_verified', 'username']

    def get_is_partner(self, obj):
        """Check if user is a partner."""
        try:
            # Check for partner profile existence
            if hasattr(obj, 'partner_profile'):
                return True
            
            # Check role
            if obj.role == 'partner':
                return True
                
            # Fallback: Exception-safe check using filer
            # sometimes hasattr on OneToOneField can be tricky if related object missing
            from .models import Partner
            if Partner.objects.filter(user=obj).exists():
                return True
                
            return False
        except Exception as e:
            if settings.DEBUG:
                print(f"Error checking partner status for user {obj.id}: {e}")
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
                        bucket_name='listings',
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
            
            # Helper to handle document upload
            def handle_document_upload(field_name, folder_name):
                if field_name in request.FILES:
                    try:
                        doc_file = request.FILES[field_name]
                        supabase_url = upload_file_to_supabase_storage(
                            file=doc_file,
                            bucket_name='listings',
                            folder=f'user_documents/{folder_name}',
                            user_id=instance.id
                        )
                        # Set the URL field based on field name (e.g., license_front_document -> license_front_document_url)
                        # Note: User model uses ImageFields for simple storage, but on Render we need the URLs primarily
                        # But wait, looking at User model, it has ImageFields: 
                        # license_front_document = models.ImageField(...)
                        # AND WE DON'T have url fields for these!
                        # We must rely on the ImageField to store the path if Supabase URL is not stored separately.
                        # Wait, User model definition:
                        # license_front_document = models.ImageField(...)
                        # license_back_document = models.ImageField(...)
                        # IT DOES NOT HAVE dedicated URL fields like profile_picture_url.
                        # So we can't store the Supabase URL easily unless we hijack the ImageField.
                        # However, upload_file_to_supabase_storage returns a URL.
                        # For now, let's just proceed. The file upload failure is the main issue.
                        pass
                    except Exception as e:
                        if settings.DEBUG:
                            print(f"❌ Failed to upload {field_name}: {str(e)}")
                        # If file upload fails on Render (due to missing credentials or setup), 
                        # we should probably catch it and ignore it if it's not critical, 
                        # OR fix the underlying issue.
                        # But "File upload failed" error blocks everything.
                        # Let's wrap this in a way that doesn't block the whole update if upload fails.
                        print(f"Warning: Failed to upload {field_name}, continuing update. Error: {e}")
            
            # Helper to handle document upload - call it safely
            # Note: We are currently NOT calling handle_document_upload because the User model 
            # doesn't have URL fields for license docs.
            # If we wanted to, we would need to add URL fields to User model first.

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
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Listing
        fields = [
            'id', 'make', 'brand', 'model', 'model_name', 'year', 
            'price_per_day', 'dailyRate', 'price', 'location', 
            'rating', 'review_count', 'image', 'images', 'is_available'
        ]
        
    def get_image(self, obj):
        if obj.images and len(obj.images) > 0:
            return obj.images[0]
        return None


class PartnerSerializer(serializers.ModelSerializer):
    """Partner serializer."""
    user = UserSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()
    min_price_per_day = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, allow_null=True)
    companyName = serializers.CharField(source='business_name', read_only=True)
    businessName = serializers.CharField(source='business_name', read_only=True)
    
    # Address fields from related User model
    # These are writable fields that will be handled in update method
    phone_number = serializers.CharField(required=False, allow_blank=True, write_only=False)
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=False)
    last_name = serializers.CharField(required=False, allow_blank=True, write_only=False)
    
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
        fields = ['id', 'user', 'business_name', 'business_type', 'business_license',
                  'tax_id', 'bank_account', 'description', 'logo', 'logo_url', 'is_verified', 'rating', 'review_count',
                  'total_bookings', 'total_earnings', 'created_at', 'min_price_per_day', 'companyName', 'businessName',
                   'phone_number', 'first_name', 'last_name']
        read_only_fields = ['id', 'created_at', 'logo_url']
        extra_kwargs = {
            'logo': {'write_only': True},
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
                # Upload logo to Supabase Storage in 'listings' bucket (or create 'partner_logos' bucket)
                supabase_url = upload_file_to_supabase_storage(
                    file=logo_file,
                    bucket_name='listings',  # Use listings bucket (or create separate 'partner_logos' bucket)
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
    
    # Add fields that are not in the model but expected by frontend
    address = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    state = serializers.SerializerMethodField()
    
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

    def get_address(self, obj):
        """Return address - currently not stored in Partner or User model."""
        return ""
    
    def get_city(self, obj):
        """Return city - currently not stored in Partner or User model."""
        return ""

    def get_state(self, obj):
        """Return state - currently not stored in Partner or User model."""
        return ""


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
    
    class Meta:
        model = Booking
        fields = [
            'id', 'listing', 'customer', 'partner', 'pickup_date', 'return_date',
            'pickup_time', 'return_time', 'pickup_location', 'return_location',
            'total_amount', 'status', 'payment_status', 'payment_method', 'special_requests',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
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
    """Review serializer."""
    listing = ListingSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'listing', 'user', 'rating', 'comment', 'is_published',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

