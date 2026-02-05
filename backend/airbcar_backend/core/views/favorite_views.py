"""
Favorite-related views.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, F, DecimalField, Avg, Sum
from django.utils import timezone
from django.db import transaction, OperationalError
from datetime import datetime, timedelta
from django.conf import settings
import traceback

from ..models import Listing, Booking, Favorite, Review, Partner, User, PasswordReset
from ..serializers import (
    ListingSerializer, BookingSerializer, FavoriteSerializer,
    ReviewSerializer, UserSerializer,
)


class FavoriteListView(APIView):
    """List all favorites."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List user's favorites."""
        try:
            favorites = Favorite.objects.filter(user=request.user).select_related(
                'listing', 'listing__partner'
            ).order_by('-created_at')
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            page_size = min(page_size, 100)
            
            total_count = favorites.count()
            start = (page - 1) * page_size
            end = start + page_size
            
            favorites = favorites[start:end]
            
            serializer = FavoriteSerializer(favorites, many=True, context={'request': request})
            return Response({
                'data': serializer.data,
                'count': len(serializer.data),
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in FavoriteListView.get: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Add a listing to favorites."""
        listing_id = request.data.get('listing_id') or request.data.get('listing')
        
        if not listing_id:
            return Response({
                'error': 'listing_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            listing = Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                listing=listing
            )
            
            if created:
                serializer = FavoriteSerializer(favorite, context={'request': request})
                return Response({
                    'data': serializer.data,
                    'message': 'Favorite added successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Listing already in favorites'
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in FavoriteListView.post: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MyFavoritesView(APIView):
    """Get current user's favorites."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's favorites with listing details."""
        try:
            # Optimize: Use select_related and prefetch_related to avoid N+1 queries
            favorites = Favorite.objects.filter(user=request.user).select_related(
                'listing', 'listing__partner', 'listing__partner__user'
            ).prefetch_related('listing__reviews').order_by('-created_at')
            
            # Pagination - important for performance with large favorite lists
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            page_size = min(page_size, 100)
            
            total_count = favorites.count()
            start = (page - 1) * page_size
            end = start + page_size
            
            favorites = favorites[start:end]
            
            # Batch serialize for better performance
            favorites_data = []
            for favorite in favorites:
                listing_serializer = ListingSerializer(
                    favorite.listing,
                    context={'request': request}
                )
                favorites_data.append({
                    'id': favorite.id,
                    'listing': listing_serializer.data,
                    'created_at': favorite.created_at
                })
            
            return Response({
                'data': favorites_data,
                'favorites': favorites_data,  # Alternative format
                'count': len(favorites_data),
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in MyFavoritesView.get: {error_msg}")
            return Response({
                'data': [],
                'favorites': [],
                'error': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Add listing to favorites."""
        listing_id = request.data.get('listing_id') or request.data.get('listing')
        
        if not listing_id:
            return Response({
                'error': 'listing_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            listing = Listing.objects.get(pk=listing_id)
            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                listing=listing
            )
            
            if created:
                serializer = FavoriteSerializer(favorite, context={'request': request})
                return Response({
                    'data': serializer.data,
                    'message': 'Favorite added successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Listing already in favorites'
                }, status=status.HTTP_200_OK)
                
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in MyFavoritesView.post: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FavoriteDetailView(APIView):
    """Get or delete a favorite."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get favorite detail."""
        try:
            favorite = Favorite.objects.get(pk=pk, user=request.user)
            serializer = FavoriteSerializer(favorite, context={'request': request})
            return Response({
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Favorite.DoesNotExist:
            return Response({
                'error': 'Favorite not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in FavoriteDetailView.get: {error_msg}")
            return Response({
                'error': 'An error occurred',
                'message': error_msg if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, pk):
        """Delete a favorite."""
        try:
            favorite = Favorite.objects.get(pk=pk, user=request.user)
            favorite_id = favorite.id
            favorite.delete()
            
            return Response({
                'message': 'Favorite removed successfully',
                'id': favorite_id
            }, status=status.HTTP_200_OK)
            
        except Favorite.DoesNotExist:
            return Response({
                'error': 'Favorite not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"Error in FavoriteDetailView.delete: {error_msg}")
            return Response({
                'error': 'Failed to delete favorite. Please try again later.',
                'message': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
