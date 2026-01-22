from rest_framework import serializers
from .models import Review, ReviewVote, ReviewReport
from users.serializers import UserSerializer


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

