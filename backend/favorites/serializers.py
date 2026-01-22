from rest_framework import serializers
from .models import Favorite
from users.serializers import UserSerializer
from listings.serializers import ListingSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'listing', 'created_at']
        read_only_fields = ['user', 'created_at']

