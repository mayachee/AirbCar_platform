from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.exceptions import ValidationError
import logging
from common.utils import upload_file_to_supabase

from .models import Listing
from .serializers import ListingSerializer
from partners.models import Partner

logger = logging.getLogger(__name__)


class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _normalize_listing_payload(self, request):
        import json

        is_multipart = bool(request.content_type and request.content_type.startswith('multipart/form-data'))
        raw_data = request.data.copy()
        normalized = {}

        for key in raw_data.keys():
            values = raw_data.getlist(key)

            if key == 'features':
                if is_multipart:
                    if len(values) == 1:
                        single_value = values[0]
                        if isinstance(single_value, str):
                            single_value = single_value.strip()
                        if not single_value:
                            normalized[key] = []
                        else:
                            try:
                                normalized[key] = json.loads(single_value)
                                if not isinstance(normalized[key], list):
                                    normalized[key] = [normalized[key]]
                            except (json.JSONDecodeError, TypeError):
                                normalized[key] = [single_value]
                    else:
                        normalized[key] = [v for v in values if v]
                else:
                    feature_value = raw_data.get(key)
                    if isinstance(feature_value, str):
                        feature_value = feature_value.strip()
                        if not feature_value:
                            normalized[key] = []
                        else:
                            try:
                                parsed = json.loads(feature_value)
                                normalized[key] = parsed if isinstance(parsed, list) else [parsed]
                            except (json.JSONDecodeError, TypeError):
                                normalized[key] = [feature_value]
                    elif feature_value is None:
                        normalized[key] = []
                    else:
                        normalized[key] = feature_value
                continue

            if len(values) == 0:
                value = raw_data.get(key)
            elif len(values) == 1:
                value = values[0]
            else:
                value = values

            if value is None:
                value = ''
            normalized[key] = value

        if 'features' not in normalized:
            normalized['features'] = []
        elif not isinstance(normalized['features'], list):
            normalized['features'] = [normalized['features']] if normalized['features'] else []

        return normalized, is_multipart

    def get_queryset(self):
        qs = super().get_queryset()
        partner_id = self.request.query_params.get('partner_id')
        if partner_id:
            qs = qs.filter(partner_id=partner_id)
        return qs

    def create(self, request, *args, **kwargs):
        """Override create to add better error logging and handle FormData features"""
        import json
        
        data, is_multipart = self._normalize_listing_payload(request)

        logger.warning("=" * 50)
        logger.warning(
            "ListingViewSet.create called method=%s content_type=%s user=%s is_multipart=%s payload_bytes=%s",
            request.method,
            request.content_type,
            request.user,
            is_multipart,
            getattr(request, 'content_length', 'unknown')
        )
        
        logger.warning("Request data keys: %s", list(data.keys()))
        logger.warning("Request POST keys: %s", list(request.POST.keys()))
        logger.warning("Request FILES keys: %s", list(request.FILES.keys()))
        
        # Log all data values (but truncate long values)
        logger.warning("Request.data contents:")
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 100:
                logger.warning("  %s: %s... (truncated)", key, value[:100])
            elif isinstance(value, list):
                logger.warning("  %s: %s (type: list, length: %d)", key, value, len(value))
            else:
                logger.warning("  %s: %s (type: %s)", key, value, type(value).__name__)
        
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            logger.error("Serializer validation failed! errors=%s", serializer.errors)
            logger.warning("=" * 50)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        logger.warning("Serializer is valid, calling perform_create")
        logger.warning("=" * 50)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """Normalize payload for PUT/PATCH requests and provide detailed logging"""
        partial = kwargs.pop('partial', False)
        data, is_multipart = self._normalize_listing_payload(request)

        logger.warning("=" * 50)
        logger.warning(
            "ListingViewSet.update called method=%s content_type=%s user=%s is_multipart=%s payload_bytes=%s partial=%s",
            request.method,
            request.content_type,
            request.user,
            is_multipart,
            getattr(request, 'content_length', 'unknown'),
            partial
        )
        logger.warning("Request data keys: %s", list(data.keys()))
        logger.warning("Request POST keys: %s", list(request.POST.keys()))
        logger.warning("Request FILES keys: %s", list(request.FILES.keys()))
        logger.warning("Request.data contents:")
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 100:
                logger.warning("  %s: %s... (truncated)", key, value[:100])
            elif isinstance(value, list):
                logger.warning("  %s: %s (type: list, length: %d)", key, value, len(value))
            else:
                logger.warning("  %s: %s (type: %s)", key, value, type(value).__name__)

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        if not serializer.is_valid():
            logger.error("Serializer validation failed during update! errors=%s", serializer.errors)
            logger.warning("=" * 50)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        logger.warning("Serializer valid, performing update")
        logger.warning("=" * 50)
        self.perform_update(serializer)

        return Response(serializer.data)

    def perform_create(self, serializer):
        request = self.request
        pictures = request.FILES.getlist("pictures")
        partner, created = Partner.objects.get_or_create(
            user=request.user,
            defaults={
                'company_name': f"{request.user.username}'s Company",
                'tax_id': 'PENDING',
                'phone': '0000000000',  # Required field
                'city': 'Unknown',  # Required field
            }
        )
        if not request.user.is_partner:
            request.user.is_partner = True
            request.user.save(update_fields=['is_partner'])
        listing = serializer.save(partner=partner)
        if pictures:
            urls = []
            failed_uploads = []
            for pic in pictures:
                try:
                    url = upload_file_to_supabase(pic, folder=f"listings/{listing.id}")
                    urls.append(url)
                    logger.info(f"✓ Successfully uploaded picture for listing {listing.id}")
                except Exception as e:
                    logger.error(f"❌ Failed to upload picture for listing {listing.id}: {str(e)}")
                    failed_uploads.append(pic.name if hasattr(pic, 'name') else str(pic))
            
            if urls:
                listing.images = urls
                listing.save(update_fields=["images"])
                logger.info(f"✓ Listing {listing.id} saved with {len(urls)} pictures")
            
            if failed_uploads:
                logger.warning(f"⚠ Some pictures failed to upload for listing {listing.id}: {failed_uploads}")

    def perform_update(self, serializer):
        listing = serializer.save()
        
        pictures = self.request.FILES.getlist("pictures")
        if pictures:
            uploaded_urls = []
            failed_uploads = []
            for picture in pictures:
                try:
                    url = upload_file_to_supabase(picture, folder=f"listings/{listing.id}")
                    uploaded_urls.append(url)
                    logger.info(f"✓ Successfully uploaded picture for listing {listing.id}")
                except Exception as e:
                    logger.error(f"❌ Failed to upload picture for listing {listing.id}: {str(e)}")
                    failed_uploads.append(picture.name if hasattr(picture, 'name') else str(picture))
            
            if uploaded_urls:
                # Preserve existing images and add new ones
                existing_pics = listing.images if listing.images else []
                listing.images = existing_pics + uploaded_urls
                listing.save(update_fields=["images"])
                logger.info(f"✓ Listing {listing.id} updated with {len(uploaded_urls)} new pictures")
            
            if failed_uploads:
                logger.warning(f"⚠ Some pictures failed to upload for listing {listing.id}: {failed_uploads}")

