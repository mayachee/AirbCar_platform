from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User, Booking, Partner, Listing, Favorite, Review, ReviewVote, ReviewReport


# The default TokenObtainPairSerializer provided by rest_framework_simplejwt
#  generates JWT tokens with minimal user data (typically just the user ID). 
#  By customizing it, you’ll enhance the token and response to include key fields
#  from the User model, making the login process more informative for the frontend.


#  This serializer class contains the logic for how to take the incoming 
#  data from the request and convert it into a model instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(required=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.username_field = 'email'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['is_partner'] = user.is_partner
        token['is_verified'] = user.is_verified
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['role'] = getattr(user, 'role', 'user')
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token

    def validate(self, attrs):
        if 'email' in attrs:
            attrs['username'] = attrs['email']
            
        return super().validate(attrs)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'phone_number', 'default_currency',
            'is_partner', 'is_verified', 'password', 'profile_picture', 'email_verified',
            'license_number', 'address', 'role', 'first_name', 'last_name', 'issue_date', 
            'license_origin_country', 'nationality', 'country_of_residence', 'city', 'postal_code',
            'date_of_birth', 'id_verification_status', 'id_front_document_url', 'id_back_document_url', 'is_staff']
        read_only_fields = ['id', 'is_partner', 'is_verified', 'email_verified', 
            'id_front_document_url', 'id_back_document_url', 'profile_picture']

    def create(self, validated_data):
        print("🔧 User create serializer called")
        print(f"🔧 Validated data keys: {list(validated_data.keys())}")
        password = validated_data.pop('password')
        if 'username' not in validated_data or not validated_data['username']:
            validated_data['username'] = validated_data['email']
        
        # Create user
        user = User.objects.create(**validated_data)
        print(f"✅ User object created: ID={user.id}, Email={user.email}")
        
        # Set password and save
        user.set_password(password)
        user.save()
        print(f"✅ User password set and saved: ID={user.id}")
        
        # Verify user exists in database
        from .models import User as UserModel
        user_check = UserModel.objects.filter(id=user.id).first()
        if user_check:
            print(f"✅ User verified in database: ID={user_check.id}, Email={user_check.email}")
        else:
            print(f"❌ ERROR: User not found in database after save!")
        
        return user

class PartnerSerializer(serializers.ModelSerializer):
    
    class ListingBriefSerializer(serializers.ModelSerializer):
        class Meta:
            model = Listing
            fields = ['id', 'make', 'model', 'year', 'location', 'price_per_day', 'pictures']

    listings = ListingBriefSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    class Meta:
        model = Partner
        fields = ['id', 'company_name', 'tax_id', 'user', 'verification_status', 'created_at', 
            'agree_on_terms', 'verification_document', 'listings', 'slug', 'description', 
            'logo', 'website', 'phone', 'address']

class PublicPartnerSerializer(serializers.ModelSerializer):
    """Public serializer for partner profiles - excludes sensitive information"""
    
    class ListingBriefSerializer(serializers.ModelSerializer):
        class Meta:
            model = Listing
            fields = ['id', 'make', 'model', 'year', 'location', 'price_per_day', 'pictures', 'rating']
    
    class UserBriefSerializer(serializers.ModelSerializer):
        """Limited user info for public profile"""
        class Meta:
            model = User
            fields = ['first_name', 'last_name', 'profile_picture']
    
    listings = ListingBriefSerializer(many=True, read_only=True)
    user = UserBriefSerializer(read_only=True)
    total_listings = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Partner
        fields = ['id', 'company_name', 'slug', 'description', 'logo', 'website', 'phone', 
            'address', 'verification_status', 'created_at', 'listings', 'user', 
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

class ListingSerializer(serializers.ModelSerializer):
    partner = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Listing
        fields = ['id', 'partner', 'make', 'model', 'year', 'location', 'features', 
            'price_per_day', 'availability', 'rating', 'created_at', 'fuel_type', 
            'transmission', 'seating_capacity', 'vehicle_condition', 'pictures', 'vehicle_description']
        read_only_fields = ['partner', 'created_at', 'rating']

    def to_internal_value(self, data):
        # Remove pictures from data (it's handled separately in views)
        if 'pictures' in data:
            data = data.copy()
            data.pop('pictures')
        
        # Handle FormData - convert string numbers to proper types
        # DRF should handle this, but let's ensure it works
        processed_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # Convert string numbers to integers for year and seating_capacity
        if 'year' in processed_data and isinstance(processed_data['year'], str):
            try:
                processed_data['year'] = int(processed_data['year'])
            except (ValueError, TypeError):
                pass  # Let DRF handle the error
        
        if 'seating_capacity' in processed_data and isinstance(processed_data['seating_capacity'], str):
            try:
                processed_data['seating_capacity'] = int(processed_data['seating_capacity'])
            except (ValueError, TypeError):
                pass  # Let DRF handle the error
        
        # Convert string decimal to Decimal for price_per_day
        if 'price_per_day' in processed_data and isinstance(processed_data['price_per_day'], str):
            try:
                from decimal import Decimal
                processed_data['price_per_day'] = str(Decimal(processed_data['price_per_day']))
            except (ValueError, TypeError, Exception):
                pass  # Let DRF handle the error
        
        # Handle features - JSONField expects a list or JSON string
        if 'features' in processed_data:
            if isinstance(processed_data['features'], str):
                # If it's a string, try to parse as JSON
                try:
                    import json
                    parsed_features = json.loads(processed_data['features'])
                    if isinstance(parsed_features, list):
                        processed_data['features'] = parsed_features
                    else:
                        # If it's not a list after parsing, wrap it in a list
                        processed_data['features'] = [parsed_features] if parsed_features else []
                except (json.JSONDecodeError, ValueError):
                    # If it's not valid JSON, try to treat as a single feature value
                    # This handles cases where a single string was sent instead of JSON
                    processed_data['features'] = [processed_data['features']] if processed_data['features'].strip() else []
        
        return super().to_internal_value(processed_data)

class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)
    car_owner = UserSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'listing', 'start_time', 'end_time', 'price', 'status', 'date',
            'requested_at', 'accepted_at', 'rejected_at', 'cancelled_at',
            'request_message', 'rejection_reason', 'car_owner'
        ]
        read_only_fields = ['user', 'date', 'requested_at', 'accepted_at', 'rejected_at', 'cancelled_at', 'car_owner']

class FavoriteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'listing', 'created_at']
        read_only_fields = ['user', 'created_at']

class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6, required=True)
    
    def validate_password(self, value):
        return value

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    listing = serializers.PrimaryKeyRelatedField(read_only=True)
    user_has_voted = serializers.SerializerMethodField()
    user_vote_helpful = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'booking', 'listing', 'user', 'rating', 'comment',
            'created_at', 'updated_at', 'is_verified', 'is_published',
            'helpful_count', 'owner_response', 'owner_response_at',
            'user_has_voted', 'user_vote_helpful'
        ]
        read_only_fields = ['user', 'listing', 'created_at', 'updated_at', 'is_verified', 'helpful_count', 'owner_response_at']
    
    def get_user_has_voted(self, obj):
        """Check if current user has voted on this review"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Use prefetched votes if available (from prefetch_related)
            if hasattr(obj, 'user_votes') and obj.user_votes:
                return True
            # Fallback to query if not prefetched
            return ReviewVote.objects.filter(review=obj, user=request.user).exists()
        return False
    
    def get_user_vote_helpful(self, obj):
        """Get if user voted helpful"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Use prefetched votes if available
            if hasattr(obj, 'user_votes') and obj.user_votes:
                return obj.user_votes[0].is_helpful
            # Fallback to query if not prefetched
            vote = ReviewVote.objects.filter(review=obj, user=request.user).first()
            return vote.is_helpful if vote else None
        return None
    
    def validate_rating(self, value):
        """Ensure rating is between 1 and 5"""
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_booking(self, value):
        """Ensure user can only review their own completed bookings"""
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only review your own bookings")
        if value and value.status != 'completed':
            raise serializers.ValidationError("You can only review completed bookings")
        return value

class ReviewVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewVote
        fields = ['id', 'review', 'user', 'is_helpful', 'created_at']
        read_only_fields = ['user', 'created_at']

class ReviewReportSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    review = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ReviewReport
        fields = ['id', 'review', 'user', 'reason', 'description', 'created_at', 'resolved', 'resolved_at', 'resolved_by']
        read_only_fields = ['user', 'review', 'created_at', 'resolved', 'resolved_at', 'resolved_by']
