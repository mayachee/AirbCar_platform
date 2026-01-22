from rest_framework import serializers
from .models import Partner
from users.serializers import UserSerializer


class PartnerSerializer(serializers.ModelSerializer):
    # Use a nested serializer to avoid circular import
    class ListingBriefSerializer(serializers.ModelSerializer):
        class Meta:
            from listings.models import Listing
            model = Listing
            fields = ['id', 'make', 'model', 'year', 'location', 'price_per_day', 'pictures']
    
    listings = ListingBriefSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    
    # Make phone and city required fields
    phone = serializers.CharField(required=True, allow_blank=False, max_length=20)
    city = serializers.CharField(required=True, allow_blank=False, max_length=100)
    
    class Meta:
        model = Partner
        fields = ['id', 'company_name', 'tax_id', 'user', 'verification_status', 'created_at', 
            'agree_on_terms', 'verification_document', 'listings', 'slug', 'description', 
            'logo', 'website', 'phone', 'business_type', 'address', 'city', 'state', 'zip_code']
        read_only_fields = ['logo']  # Logo is handled in perform_update, not via serializer
    
    def validate_phone(self, value):
        """Validate phone number format"""
        import re
        
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required.")
        
        # Remove spaces, dashes, and parentheses for validation
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        
        # Moroccan phone number patterns
        moroccan_pattern = r'^(\+?212|0)?[5-7]\d{8}$'
        # International format (E.164): + followed by 1-15 digits
        international_pattern = r'^\+?[1-9]\d{1,14}$'
        
        # Check Moroccan format
        if re.match(moroccan_pattern, cleaned):
            return value
        
        # Check international format (must be at least 10 digits)
        if re.match(international_pattern, cleaned) and len(cleaned.replace('+', '')) >= 10:
            return value
        
        raise serializers.ValidationError(
            "Please enter a valid phone number. Examples: +212 6XX-XXXXXX, 0X-XXXXXXX, or international format."
        )
    
    def to_internal_value(self, data):
        """Convert phone_number from frontend to phone for backend"""
        # Handle phone_number -> phone mapping for both dict and QueryDict
        if hasattr(data, 'get'):
            # Create a mutable copy if it's a QueryDict
            if hasattr(data, '_mutable'):
                data = data.copy()
            else:
                data = dict(data) if not isinstance(data, dict) else data.copy()
            
            # Map phone_number to phone if phone_number exists and phone doesn't
            if 'phone_number' in data and 'phone' not in data:
                phone_number_value = data.pop('phone_number')
                data['phone'] = phone_number_value
        
        return super().to_internal_value(data)
    
    def to_representation(self, instance):
        """Convert phone from backend to phone_number for frontend"""
        ret = super().to_representation(instance)
        # Map phone to phone_number for frontend compatibility
        if 'phone' in ret:
            ret['phone_number'] = ret.get('phone', '')
        return ret


class PublicPartnerSerializer(serializers.ModelSerializer):
    """Public serializer for partner profiles - excludes sensitive information"""
    
    class ListingBriefSerializer(serializers.ModelSerializer):
        class Meta:
            from listings.models import Listing
            model = Listing
            fields = ['id', 'make', 'model', 'year', 'location', 'price_per_day', 'pictures', 'rating']
    
    class UserBriefSerializer(serializers.ModelSerializer):
        """Limited user info for public profile"""
        class Meta:
            from users.models import User
            model = User
            fields = ['first_name', 'last_name', 'profile_picture']
    
    listings = ListingBriefSerializer(many=True, read_only=True)
    user = UserBriefSerializer(read_only=True)
    total_listings = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Partner
        fields = ['id', 'company_name', 'slug', 'description', 'logo', 'website', 'phone', 
            'address', 'city', 'business_type', 'verification_status', 'created_at', 'listings', 'user', 
            'total_listings', 'average_rating']
        read_only_fields = ['id', 'verification_status', 'created_at']
    
    def get_total_listings(self, obj):
        """Get total number of available listings"""
        return obj.listings.filter(availability=True).count()
    
    def get_average_rating(self, obj):
        """Get average rating across all listings"""
        from django.db.models import Avg
        ratings = obj.listings.filter(rating__isnull=False).aggregate(Avg('rating'))['rating__avg']
        return round(ratings, 1) if ratings else 0.0

