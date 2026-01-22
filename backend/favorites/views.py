from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from listings.models import Listing
from listings.serializers import ListingSerializer

from .models import Favorite
from .serializers import FavoriteSerializer


class FavoriteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user favorites"""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return favorites for the current user"""
        user = self.request.user
        if user.is_staff:
            # Staff can see all favorites
            return Favorite.objects.select_related('user', 'listing', 'listing__partner').all()
        
        # Regular users can only see their own favorites
        return Favorite.objects.select_related('user', 'listing', 'listing__partner').filter(user=user)
    
    def perform_create(self, serializer):
        """Create a favorite - ensure user can only favorite for themselves"""
        listing_id = self.request.data.get('listing')
        if not listing_id:
            raise ValidationError({'listing': 'Listing ID is required'})
        
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            raise ValidationError({'listing': 'Listing not found'})
        
        # Check if already favorited
        favorite_exists = Favorite.objects.filter(user=self.request.user, listing=listing).exists()
        if favorite_exists:
            raise ValidationError({'detail': 'This listing is already in your favorites'})
        
        serializer.save(user=self.request.user, listing=listing)
    
    @action(detail=False, methods=['get'], url_path='my-favorites')
    def my_favorites(self, request):
        """Get current user's favorites with full listing details"""
        favorites = self.get_queryset()
        
        # Apply pagination
        page = self.paginate_queryset(favorites)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            # Return listings data directly (more convenient for frontend)
            listings_data = [fav.listing for fav in page]
            listing_serializer = ListingSerializer(listings_data, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            # Add listings to paginated response
            paginated_response.data['listings'] = listing_serializer.data
            return paginated_response
        
        serializer = self.get_serializer(favorites, many=True)
        # Return listings data directly (more convenient for frontend)
        listings_data = [fav.listing for fav in favorites]
        listing_serializer = ListingSerializer(listings_data, many=True)
        
        return Response({
            'favorites': serializer.data,
            'listings': listing_serializer.data
        })

