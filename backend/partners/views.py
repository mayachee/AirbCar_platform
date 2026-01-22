from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from common.utils import upload_file_to_supabase
import logging

logger = logging.getLogger(__name__)

from .models import Partner
from .serializers import PartnerSerializer, PublicPartnerSerializer


class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all().select_related('user').prefetch_related('listings')
    serializer_class = PartnerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']
    
    def get_queryset(self):
        """
        Get queryset based on user permissions.
        - Staff: Can see all partners
        - Authenticated partners: Can see all partners (for browsing) but can only modify their own
        - Unauthenticated: Can see all partners (public viewing)
        """
        user = self.request.user
        
        # Staff can see everything
        if user.is_staff:
            return Partner.objects.all().select_related('user').prefetch_related('listings')
        
        # For unauthenticated users, allow public viewing
        if not user.is_authenticated:
            return Partner.objects.all().select_related('user').prefetch_related('listings')
        
        # For authenticated users (partner or not), allow viewing all partners
        return Partner.objects.all().select_related('user').prefetch_related('listings')
    
    def get_object(self):
        """
        Override get_object to check permissions for write operations.
        Non-partners can view but not modify partners.
        Partners can only modify their own partner profile.
        """
        obj = super().get_object()
        user = self.request.user
        
        # Allow read operations for all (handled by permission_classes)
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return obj
        
        # For write operations, check if user is the owner
        if not user.is_authenticated:
            raise PermissionDenied("You must be authenticated to perform this action.")
        
        # Partners can only modify their own profile
        if user.is_partner:
            if obj.user != user:
                raise PermissionDenied("You can only modify your own partner profile.")
        # Non-partners cannot create/modify partners (only staff can)
        elif not user.is_staff:
            raise PermissionDenied("You must be a partner to perform this action.")
        
        return obj

    def perform_create(self, serializer):
        if self.request.user.is_partner:
           raise ValidationError({"detail": "You are already registered as a partner."})

        serializer.save(user=self.request.user)
        if not self.request.user.is_partner:
            self.request.user.is_partner = True
            self.request.user.save(update_fields=['is_partner'])

    def perform_update(self, serializer):
        partner = serializer.save()
        
        # Handle logo file upload
        logo_file = self.request.FILES.get('logo')
        if logo_file:
            try:
                url = upload_file_to_supabase(logo_file, folder=f"partners/{partner.id}")
                partner.logo = url
                partner.save(update_fields=['logo'])
                logger.info(f"✓ Successfully uploaded logo for partner {partner.id}")
            except Exception as e:
                logger.error(f"❌ Failed to upload logo for partner {partner.id}: {str(e)}")
                # Note: We could raise an exception here or just log a warning
                # For now, we'll let the partner update succeed without logo
                pass
        # Handle logo removal (empty string in request data)
        elif 'logo' in self.request.data:
            logo_value = self.request.data.get('logo')
            if logo_value == '' or logo_value is None:
                partner.logo = None
                partner.save(update_fields=['logo'])

    # Get or create partner for current user
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticatedOrReadOnly])
    def me(self, request):
        """Get or update the current user's partner record"""
        user = request.user
        
        if not user.is_partner:
            raise ValidationError({"detail": "You are not a partner."})
        
        partner, created = Partner.objects.get_or_create(
            user=user,
            defaults={
                'company_name': f"{user.first_name or user.username}'s Company",
                'tax_id': 'PENDING',
                'verification_status': 'pending',
                'agree_on_terms': True
            }
        )
        
        if request.method == 'GET':
            serializer = self.get_serializer(partner)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Normalize request data for FormData and JSON
            if hasattr(request.data, 'copy'):
                data = request.data.copy()
                if hasattr(data, '_mutable'):
                    data._mutable = True
            else:
                data = dict(request.data)
            
            # Map phone_number to phone for frontend compatibility
            if 'phone_number' in data:
                phone_value = data.get('phone_number')
                if phone_value:
                    data['phone'] = phone_value
                if 'phone_number' in data:
                    del data['phone_number']
            
            serializer = self.get_serializer(partner, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            # Refresh partner data to get updated logo URL if it was uploaded
            partner.refresh_from_db()
        serializer = self.get_serializer(partner)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_partner_profile_view(request, slug):
    """
    Public endpoint to fetch partner profile data by slug or numeric ID.
    Returns limited partner information along with associated listings.
    """
    queryset = Partner.objects.select_related('user').prefetch_related('listings')

    if slug.isdigit():
        partner = get_object_or_404(queryset, pk=int(slug))
    else:
        partner = get_object_or_404(queryset, slug=slug)

    serializer = PublicPartnerSerializer(partner, context={'request': request})
    return Response(serializer.data)

