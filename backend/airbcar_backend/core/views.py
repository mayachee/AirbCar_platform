from django.http import HttpResponse
from .models import User, Booking, Partner, Listing, Favorite, Review, ReviewVote, ReviewReport
from django.db.models import Prefetch, Count, Avg, Sum
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
import uuid
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework import status
from rest_framework.response import Response
from .utils import upload_file_to_supabase
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (UserSerializer, BookingSerializer, PartnerSerializer, 
    ListingSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer,
    CustomTokenObtainPairSerializer, FavoriteSerializer, ReviewSerializer, ReviewVoteSerializer, 
    ReviewReportSerializer, PublicPartnerSerializer)

User = get_user_model()

# NOTE: This file was corrupted. You need to restore the full views.py from git!
# This is a TEMPORARY fix with minimal stubs to get the public endpoint working.
# TODO: Restore full views.py from git!

# Minimal stubs so urls.py imports don't fail
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer

class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    def post(self, request):
        return Response({'message': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    def post(self, request, uidb64, token):
        return Response({'message': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

def verify_email(request):
    return HttpResponse("Not implemented")

class CustomTokenObtainPairView(TokenObtainPairView):
    pass

class UserStatusView(generics.GenericAPIView):
    def get(self, request):
        return Response({'message': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class AdminStatusView(generics.GenericAPIView):
    def get(self, request):
        return Response({'message': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class UserVerificationView(generics.GenericAPIView):
    def post(self, request):
        return Response({'message': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

def home_view(request):
    return HttpResponse("API Root - views.py needs to be restored from git!")

# CRITICAL: This function must work for the public endpoint
@api_view(['GET'])
@permission_classes([AllowAny])
def public_partner_profile_view(request, slug):
    """Standalone view for public partner profile"""
    print(f"\n{'='*60}")
    print(f"🔍 public_partner_profile_view CALLED!")
    print(f"   Slug: {slug}")
    print(f"   Path: {request.path}")
    print(f"   Method: {request.method}")
    print(f"{'='*60}\n")
    
    try:
        # Try to find by slug first
        partner = None
        try:
            partner = Partner.objects.select_related('user').prefetch_related('listings').get(slug=slug)
            print(f"✅ Found partner by slug: {partner.id} - {partner.company_name}")
        except Partner.DoesNotExist:
            print(f"⚠️ Partner not found by slug: {slug}")
            # If slug doesn't work, try to find by ID (if slug is numeric)
            if slug and slug.isdigit():
                try:
                    partner = Partner.objects.select_related('user').prefetch_related('listings').get(id=int(slug))
                    print(f"✅ Found partner by ID: {partner.id} - {partner.company_name}")
                except Partner.DoesNotExist:
                    print(f"❌ Partner not found by ID: {slug}")
                    pass
        
        if not partner:
            print(f"❌ No partner found for slug/ID: {slug}")
            return Response(
                {'error': 'Partner not found', 'slug_or_id': slug}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Only show approved partners in public view
        if partner.verification_status != 'approved':
            print(f"⚠️ Partner {partner.id} not approved (status: {partner.verification_status})")
            return Response(
                {'error': 'Partner profile not available', 'reason': f'Verification status is {partner.verification_status}, must be approved'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = PublicPartnerSerializer(partner, context={'request': request})
        print(f"✅ Successfully returning partner profile: {partner.id}")
        return Response(serializer.data)
        
    except Exception as e:
        print(f"💥 Exception in public_partner_profile_view: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': 'Failed to load partner profile', 'detail': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
