"""
Social layer views: listing comments, listing reactions, partner follows, partner posts.
"""
from rest_framework import status, viewsets, exceptions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from urllib.parse import urlparse

from ..models import (
    Listing, ListingComment, ListingReaction,
    Partner, PartnerFollow, PartnerPost,
    User, UserFollow,
    Booking, TripPost, TripPostReaction, TripPostComment,
    CommunityPost, CommunityPostReaction, CommunityPostComment,
)
from ..serializers import ListingCommentSerializer, PartnerPostSerializer, TripPostSerializer, TripPostCommentSerializer, CommunityPostSerializer, CommunityPostCommentSerializer


def _paginate(queryset, request):
    try:
        page = max(int(request.query_params.get('page', 1)), 1)
    except (ValueError, TypeError):
        page = 1
    try:
        page_size = min(max(int(request.query_params.get('page_size', 20)), 1), 100)
    except (ValueError, TypeError):
        page_size = 20
    total_count = queryset.count()
    start = (page - 1) * page_size
    return queryset[start:start + page_size], {
        'page': page,
        'page_size': page_size,
        'total_count': total_count,
        'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
    }


class ListingCommentListView(APIView):
    """
    GET  listings/<id>/comments/  — public, paginated, top-level only (replies nested)
    POST listings/<id>/comments/  — authenticated, creates a comment or reply
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, listing_id):
        listing = get_object_or_404(Listing, pk=listing_id)
        qs = (
            ListingComment.objects
            .filter(listing=listing, is_active=True, parent__isnull=True)
            .select_related('user')
            .prefetch_related('replies__user')
            .order_by('created_at')
        )
        page_qs, meta = _paginate(qs, request)
        serializer = ListingCommentSerializer(page_qs, many=True)
        return Response({'results': serializer.data, **meta})

    def post(self, request, listing_id):
        listing = get_object_or_404(Listing, pk=listing_id)

        content = request.data.get('content', '').strip()
        raw_images = request.data.get('images') or []
        if not content and not raw_images:
            return Response({'error': 'Content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 1000:
            return Response({'error': 'Comment cannot exceed 1000 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from ..serializers import _validate_comment_images
            images = _validate_comment_images(raw_images)
        except Exception as exc:  # DRF ValidationError or ValueError
            detail = getattr(exc, 'detail', None) or str(exc)
            return Response({'error': detail}, status=status.HTTP_400_BAD_REQUEST)

        parent = None
        parent_id = request.data.get('parent_id')
        if parent_id:
            parent = ListingComment.objects.filter(pk=parent_id, listing=listing, is_active=True).first()
            if not parent:
                return Response({'error': 'Parent comment not found.'}, status=status.HTTP_404_NOT_FOUND)
            if parent.parent_id is not None:
                return Response({'error': 'Replies to replies are not allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = ListingComment.objects.create(
            listing=listing,
            user=request.user,
            parent=parent,
            content=content,
            images=images,
        )
        serializer = ListingCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ListingCommentDetailView(APIView):
    """
    DELETE listings/<id>/comments/<comment_id>/  — soft-deletes own comment (admin/ceo can delete any)
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, listing_id, comment_id):
        comment = get_object_or_404(ListingComment.objects.select_related('user'), pk=comment_id, listing_id=listing_id)
        if comment.user_id != request.user.id and getattr(request.user, 'role', None) not in ('admin', 'ceo'):
            return Response({'error': 'You can only delete your own comments.'}, status=status.HTTP_403_FORBIDDEN)
        comment.is_active = False
        comment.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ListingReactionView(APIView):
    """
    GET    listings/<id>/reactions/  — public: summary counts + current user's reaction
    POST   listings/<id>/reactions/  — authenticated: add or change reaction  { "reaction": "like" }
    DELETE listings/<id>/reactions/  — authenticated: remove reaction
    """

    def get_permissions(self):
        if self.request.method in ('POST', 'DELETE'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, listing_id):
        get_object_or_404(Listing, pk=listing_id)
        summary = list(
            ListingReaction.objects
            .filter(listing_id=listing_id)
            .values('reaction')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        user_reaction = None
        if request.user.is_authenticated:
            try:
                r = ListingReaction.objects.get(listing_id=listing_id, user=request.user)
                user_reaction = r.reaction
            except ListingReaction.DoesNotExist:
                pass
        return Response({'summary': summary, 'user_reaction': user_reaction})

    def post(self, request, listing_id):
        listing = get_object_or_404(Listing, pk=listing_id)
        reaction_type = request.data.get('reaction')
        valid = [r[0] for r in ListingReaction.REACTION_CHOICES]
        if reaction_type not in valid:
            return Response(
                {'error': f'Invalid reaction. Valid choices: {valid}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj, created = ListingReaction.objects.update_or_create(
            listing=listing,
            user=request.user,
            defaults={'reaction': reaction_type},
        )
        return Response(
            {'reaction': obj.reaction, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, listing_id):
        get_object_or_404(Listing, pk=listing_id)
        deleted, _ = ListingReaction.objects.filter(listing_id=listing_id, user=request.user).delete()
        if not deleted:
            return Response({'error': 'No reaction to remove.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Partner follow
# ---------------------------------------------------------------------------

class PartnerFollowView(APIView):
    """
    GET    partners/<id>/follow/  — check if current user follows this partner
    POST   partners/<id>/follow/  — follow the partner
    DELETE partners/<id>/follow/  — unfollow the partner
    """

    def get_permissions(self):
        if self.request.method in ('POST', 'DELETE'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, partner_id):
        get_object_or_404(Partner, pk=partner_id)
        follower_count = PartnerFollow.objects.filter(partner_id=partner_id).count()
        is_following = (
            request.user.is_authenticated and
            PartnerFollow.objects.filter(partner_id=partner_id, user=request.user).exists()
        )
        return Response({'follower_count': follower_count, 'is_following': is_following})

    def post(self, request, partner_id):
        partner = get_object_or_404(Partner, pk=partner_id)
        if partner.user_id == request.user.id:
            return Response({'error': 'You cannot follow your own agency.'}, status=status.HTTP_400_BAD_REQUEST)
        _, created = PartnerFollow.objects.get_or_create(user=request.user, partner=partner)
        follower_count = PartnerFollow.objects.filter(partner=partner).count()
        return Response(
            {'is_following': True, 'follower_count': follower_count},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, partner_id):
        get_object_or_404(Partner, pk=partner_id)
        deleted, _ = PartnerFollow.objects.filter(partner_id=partner_id, user=request.user).delete()
        if not deleted:
            return Response({'error': 'You are not following this agency.'}, status=status.HTTP_404_NOT_FOUND)
        follower_count = PartnerFollow.objects.filter(partner_id=partner_id).count()
        return Response({'is_following': False, 'follower_count': follower_count})


# ---------------------------------------------------------------------------
# Partner posts
# ---------------------------------------------------------------------------

class PartnerPostListView(APIView):
    """
    GET  partners/<id>/posts/  — public, paginated list of agency posts
    POST partners/<id>/posts/  — create a post (partner owner only)

    Body for POST:
        { "content": "...", "post_type": "update|promotion|new_car",
          "image_url": "...", "linked_listing": <id> }
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, partner_id):
        partner = get_object_or_404(Partner, pk=partner_id)
        qs = PartnerPost.objects.filter(partner=partner, is_active=True).select_related('linked_listing')
        page_qs, meta = _paginate(qs, request)
        serializer = PartnerPostSerializer(page_qs, many=True)
        return Response({'results': serializer.data, **meta})

    def post(self, request, partner_id):
        partner = get_object_or_404(Partner, pk=partner_id)

        # Only the partner owner can post
        if not hasattr(request.user, 'partner_profile') or request.user.partner_profile.id != partner.id:
            return Response({'error': 'Only the agency owner can create posts.'}, status=status.HTTP_403_FORBIDDEN)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 2000:
            return Response({'error': 'Post cannot exceed 2000 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_types = [t[0] for t in PartnerPost.POST_TYPE_CHOICES]
        post_type = request.data.get('post_type', 'update')
        if post_type not in valid_types:
            return Response({'error': f'Invalid post_type. Choose from: {valid_types}'}, status=status.HTTP_400_BAD_REQUEST)

        linked_listing_id = request.data.get('linked_listing')
        linked_listing = None
        if linked_listing_id:
            linked_listing = get_object_or_404(Listing, pk=linked_listing_id, partner=partner, is_available=True)

        image_url = request.data.get('image_url') or None
        if image_url:
            parsed = urlparse(image_url)
            if parsed.scheme not in ('http', 'https') or not parsed.netloc:
                return Response({'error': 'image_url must be a valid http/https URL.'}, status=status.HTTP_400_BAD_REQUEST)

        post = PartnerPost.objects.create(
            partner=partner,
            content=content,
            post_type=post_type,
            image_url=image_url,
            linked_listing=linked_listing,
        )
        serializer = PartnerPostSerializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PartnerPostDetailView(APIView):
    """
    DELETE partners/<id>/posts/<post_id>/  — soft-delete (owner or admin)
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, partner_id, post_id):
        post = get_object_or_404(PartnerPost, pk=post_id, partner_id=partner_id)
        is_owner = hasattr(request.user, 'partner_profile') and request.user.partner_profile.id == post.partner_id
        is_admin = request.user.role in ('admin', 'ceo')
        if not (is_owner or is_admin):
            return Response({'error': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        post.is_active = False
        post.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Social feed
# ---------------------------------------------------------------------------

class SocialFeedView(APIView):
    """
    GET /feed/

    Returns a mixed, time-sorted feed of:
      - Partner posts  (type: "post")
      - New listings   (type: "listing")

    Query params:
      mode=following   — only from partners the authenticated user follows (default when logged in)
      mode=discover    — from all partners (default for anonymous / discovery)
      page, page_size
    """

    def get_permissions(self):
        return [AllowAny()]

    def get(self, request):
        from ..models import Listing as _Listing

        mode = request.query_params.get('mode', 'following' if request.user.is_authenticated else 'discover')
        try:
            page = max(int(request.query_params.get('page', 1)), 1)
        except (ValueError, TypeError):
            page = 1
        try:
            page_size = min(max(int(request.query_params.get('page_size', 20)), 1), 50)
        except (ValueError, TypeError):
            page_size = 20

        # Determine partner scope
        if mode == 'following' and request.user.is_authenticated:
            followed_partner_ids = list(
                PartnerFollow.objects.filter(user=request.user).values_list('partner_id', flat=True)
            )
            if not followed_partner_ids:
                # Fall back to discover if user follows nobody yet
                mode = 'discover'
                partner_filter = {}
            else:
                partner_filter = {'partner_id__in': followed_partner_ids}
        else:
            partner_filter = {}

        # Build base querysets (unsliced) so we can count accurately.
        posts_base = PartnerPost.objects.filter(is_active=True, **partner_filter)
        listings_base = _Listing.objects.filter(is_available=True, is_verified=True, **partner_filter)
        trips_base = TripPost.objects.filter(is_active=True)
        community_base = CommunityPost.objects.filter(is_active=True)

        # Accurate total across all sources (4 cheap COUNT queries).
        total_count = posts_base.count() + listings_base.count() + trips_base.count() + community_base.count()

        # Fetch enough rows from each source to cover the current page after merge-sort.
        fetch_limit = page * page_size

        posts_qs = (
            posts_base
            .select_related('partner', 'linked_listing')
            .order_by('-created_at')[:fetch_limit]
        )

        listings_qs = (
            listings_base
            .select_related('partner')
            .order_by('-created_at')[:fetch_limit]
        )

        # Trip posts — always global (not scoped to follows)
        trips_qs = (
            trips_base
            .select_related('user', 'booking__listing__partner')
            .order_by('-created_at')[:fetch_limit]
        )

        community_qs = (
            community_base
            .select_related('author', 'listing__partner')
            .order_by('-created_at')[:fetch_limit]
        )

        post_items = [
            {'type': 'post', 'created_at': p.created_at, 'data': PartnerPostSerializer(p).data}
            for p in posts_qs
        ]

        listing_items = [
            {
                'type': 'listing',
                'created_at': l.created_at,
                'data': {
                    'id': l.id,
                    'name': l.name,
                    'make': l.make,
                    'model': l.model,
                    'year': l.year,
                    'location': l.location,
                    'price_per_day': float(l.price_per_day),
                    'images': l.images[:1] if l.images else [],
                    'rating': l.rating,
                    'partner_name': l.partner.business_name,
                    'partner_id': l.partner_id,
                    'partner_logo_url': l.partner.logo_url,
                },
            }
            for l in listings_qs
        ]

        trip_items = [
            {'type': 'trip', 'created_at': t.created_at, 'data': TripPostSerializer(t).data}
            for t in trips_qs
        ]

        community_items = [
            {'type': 'community', 'created_at': c.created_at, 'data': CommunityPostSerializer(c).data}
            for c in community_qs
        ]

        # Merge and sort by created_at descending, then paginate
        merged = sorted(post_items + listing_items + trip_items + community_items, key=lambda x: x['created_at'], reverse=True)
        start = (page - 1) * page_size
        page_items = merged[start:start + page_size]

        results = [{'type': item['type'], **item['data']} for item in page_items]

        return Response({
            'mode': mode,
            'results': results,
            'page': page,
            'page_size': page_size,
            'total_count': total_count,
            'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 0,
        })


# ---------------------------------------------------------------------------
# User follows (user ↔ user)
# ---------------------------------------------------------------------------

class UserFollowView(APIView):
    """
    GET    users/<id>/follow/   — follower/following counts + is_following status
    POST   users/<id>/follow/   — follow the user (authenticated)
    DELETE users/<id>/follow/   — unfollow the user (authenticated)
    """

    def get_permissions(self):
        if self.request.method in ('POST', 'DELETE'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        follower_count = UserFollow.objects.filter(following=target).count()
        following_count = UserFollow.objects.filter(follower=target).count()
        is_following = (
            request.user.is_authenticated and
            UserFollow.objects.filter(follower=request.user, following=target).exists()
        )
        return Response({
            'follower_count': follower_count,
            'following_count': following_count,
            'is_following': is_following,
        })

    def post(self, request, user_id):
        if request.user.id == user_id:
            return Response({'error': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        target = get_object_or_404(User, pk=user_id)
        _, created = UserFollow.objects.get_or_create(follower=request.user, following=target)
        follower_count = UserFollow.objects.filter(following=target).count()
        return Response(
            {'is_following': True, 'follower_count': follower_count},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, user_id):
        get_object_or_404(User, pk=user_id)
        deleted, _ = UserFollow.objects.filter(follower=request.user, following_id=user_id).delete()
        if not deleted:
            return Response({'error': 'You are not following this user.'}, status=status.HTTP_404_NOT_FOUND)
        follower_count = UserFollow.objects.filter(following_id=user_id).count()
        return Response({'is_following': False, 'follower_count': follower_count})


# ---------------------------------------------------------------------------
# Trip posts
# ---------------------------------------------------------------------------

class TripPostListView(APIView):
    """
    GET  /trips/            — public feed of all trip posts (paginated)
    GET  /trips/?user=<id>  — trip posts by a specific user
    POST /trips/            — create a trip post (authenticated, requires completed booking)

    POST body: { "booking": <id>, "caption": "...", "images": ["url1", "url2"] }
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        qs = TripPost.objects.filter(is_active=True).select_related(
            'user', 'booking__listing__partner'
        )
        user_id = request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        page_qs, meta = _paginate(qs, request)
        serializer = TripPostSerializer(page_qs, many=True)
        return Response({'results': serializer.data, **meta})

    def post(self, request):
        booking_id = request.data.get('booking')
        if not booking_id:
            return Response({'error': 'booking is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Booking must be completed and belong to the requesting user
        booking = get_object_or_404(Booking, pk=booking_id, customer=request.user, status='completed')

        caption = request.data.get('caption', '').strip()
        if len(caption) > 2000:
            return Response({'error': 'Caption cannot exceed 2000 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        images = request.data.get('images', [])
        if not isinstance(images, list):
            return Response({'error': 'images must be a list of URLs.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(images) > 10:
            return Response({'error': 'Maximum 10 images per trip post.'}, status=status.HTTP_400_BAD_REQUEST)
        for img_url in images:
            if not isinstance(img_url, str):
                return Response({'error': 'Each image must be a URL string.'}, status=status.HTTP_400_BAD_REQUEST)
            parsed = urlparse(img_url)
            if parsed.scheme not in ('http', 'https'):
                return Response({'error': 'Image URLs must use http or https.'}, status=status.HTTP_400_BAD_REQUEST)

        # Use atomic get_or_create to prevent duplicate trip posts from concurrent requests
        with transaction.atomic():
            trip_post, created = TripPost.objects.get_or_create(
                booking=booking,
                defaults={'user': request.user, 'caption': caption, 'images': images},
            )
            if not created:
                return Response({'error': 'A trip post already exists for this booking.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TripPostSerializer(trip_post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TripPostDetailView(APIView):
    """
    GET    /trips/<id>/   — trip post detail
    DELETE /trips/<id>/   — soft-delete (owner or admin)
    """

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, trip_id):
        post = get_object_or_404(TripPost, pk=trip_id, is_active=True)
        serializer = TripPostSerializer(post)
        return Response(serializer.data)

    def delete(self, request, trip_id):
        post = get_object_or_404(TripPost, pk=trip_id)
        if post.user_id != request.user.id and request.user.role not in ('admin', 'ceo'):
            return Response({'error': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        post.is_active = False
        post.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class TripPostReactionView(APIView):
    """
    GET    /trips/<id>/reactions/   — reaction summary + current user's reaction
    POST   /trips/<id>/reactions/   — add or change reaction  { "reaction": "like" }
    DELETE /trips/<id>/reactions/   — remove reaction
    """

    def get_permissions(self):
        if self.request.method in ('POST', 'DELETE'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, trip_id):
        get_object_or_404(TripPost, pk=trip_id, is_active=True)
        summary = list(
            TripPostReaction.objects.filter(trip_post_id=trip_id)
            .values('reaction')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        user_reaction = None
        if request.user.is_authenticated:
            try:
                r = TripPostReaction.objects.get(trip_post_id=trip_id, user=request.user)
                user_reaction = r.reaction
            except TripPostReaction.DoesNotExist:
                pass
        return Response({'summary': summary, 'user_reaction': user_reaction})

    def post(self, request, trip_id):
        trip_post = get_object_or_404(TripPost, pk=trip_id, is_active=True)
        reaction_type = request.data.get('reaction')
        valid = [r[0] for r in TripPostReaction.REACTION_CHOICES]
        if reaction_type not in valid:
            return Response({'error': f'Invalid reaction. Valid choices: {valid}'}, status=status.HTTP_400_BAD_REQUEST)
        obj, created = TripPostReaction.objects.update_or_create(
            trip_post=trip_post, user=request.user,
            defaults={'reaction': reaction_type},
        )
        return Response(
            {'reaction': obj.reaction, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, trip_id):
        get_object_or_404(TripPost, pk=trip_id, is_active=True)
        deleted, _ = TripPostReaction.objects.filter(trip_post_id=trip_id, user=request.user).delete()
        if not deleted:
            return Response({'error': 'No reaction to remove.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TripPostCommentListView(APIView):
    """
    GET  /trips/<id>/comments/   — public paginated comments
    POST /trips/<id>/comments/   — add comment (authenticated)

    POST body: { "content": "...", "parent_id": <optional> }
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, trip_id):
        trip_post = get_object_or_404(TripPost, pk=trip_id, is_active=True)
        qs = (
            TripPostComment.objects.filter(trip_post=trip_post, is_active=True, parent__isnull=True)
            .select_related('user')
            .prefetch_related('replies__user')
        )
        page_qs, meta = _paginate(qs, request)
        serializer = TripPostCommentSerializer(page_qs, many=True)
        return Response({'results': serializer.data, **meta})

    def post(self, request, trip_id):
        trip_post = get_object_or_404(TripPost, pk=trip_id, is_active=True)
        content = request.data.get('content', '').strip()
        raw_images = request.data.get('images') or []
        if not content and not raw_images:
            return Response({'error': 'Content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 1000:
            return Response({'error': 'Comment cannot exceed 1000 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from ..serializers import _validate_comment_images
            images = _validate_comment_images(raw_images)
        except Exception as exc:
            detail = getattr(exc, 'detail', None) or str(exc)
            return Response({'error': detail}, status=status.HTTP_400_BAD_REQUEST)

        parent = None
        parent_id = request.data.get('parent_id')
        if parent_id:
            parent = TripPostComment.objects.filter(pk=parent_id, trip_post=trip_post, is_active=True).first()
            if not parent:
                return Response({'error': 'Parent comment not found.'}, status=status.HTTP_404_NOT_FOUND)
            if parent.parent_id is not None:
                return Response({'error': 'Replies to replies are not allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = TripPostComment.objects.create(
            trip_post=trip_post, user=request.user, parent=parent, content=content, images=images,
        )
        return Response(TripPostCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class TripPostCommentDetailView(APIView):
    """DELETE /trips/<id>/comments/<comment_id>/ — soft-delete (owner or admin)"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, trip_id, comment_id):
        comment = get_object_or_404(TripPostComment.objects.select_related('user'), pk=comment_id, trip_post_id=trip_id)
        if comment.user_id != request.user.id and getattr(request.user, 'role', None) not in ('admin', 'ceo'):
            return Response({'error': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        comment.is_active = False
        comment.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Image upload for community posts
# ---------------------------------------------------------------------------

class CommunityImageUploadView(APIView):
    """
    POST /api/community/upload-image/
    Accepts a single image file, uploads it to Supabase Storage,
    and returns the public URL.

    Body: multipart/form-data with field name 'image'
    Response: { "url": "https://...supabase.co/.../image.jpg" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': f'Invalid file type. Allowed: {", ".join(allowed_types)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (5MB max)
        if image_file.size > 5 * 1024 * 1024:
            return Response({'error': 'File size must be under 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from ..utils.image_utils import upload_file_to_supabase_storage
            from django.conf import settings

            supabase_url = upload_file_to_supabase_storage(
                image_file,
                bucket_name=getattr(settings, 'SUPABASE_STORAGE_BUCKET_PICS', 'Pics'),
                folder='community',
                user_id=request.user.id,
            )

            return Response({'url': supabase_url}, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response(
                {'error': f'Image upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class CommunityPostViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoint for CommunityPosts.
    Accessible at /community-posts/
    """
    serializer_class = CommunityPostSerializer
    queryset = CommunityPost.objects.filter(is_active=True).select_related('author', 'listing')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_destroy(self, instance):
        if instance.author != self.request.user and getattr(self.request.user, 'role', None) not in ('admin', 'ceo'):
            raise exceptions.PermissionDenied('You may not delete this post.')
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsAuthenticated], url_path='reactions')
    def toggle_reaction(self, request, pk=None):
        post = self.get_object()
        
        if request.method == 'POST':
            reaction_type = request.data.get('reaction_type', 'like').strip().lower()
            valid_types = [typ[0] for typ in CommunityPostReaction.REACTION_TYPES]
            if reaction_type not in valid_types:
                return Response({'error': 'Invalid reaction type.'}, status=status.HTTP_400_BAD_REQUEST)
            
            reaction, created = CommunityPostReaction.objects.update_or_create(
                post=post, user=request.user,
                defaults={'reaction_type': reaction_type}
            )
            return Response({'status': 'reacted', 'type': reaction.reaction_type}, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
            
        elif request.method == 'DELETE':
            deleted, _ = CommunityPostReaction.objects.filter(post=post, user=request.user).delete()
            if deleted:
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response({'error': 'Reaction not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get', 'post'], permission_classes=[], url_path='comments')
    def comments(self, request, pk=None):
        post = self.get_object()
        
        if request.method == 'GET':
            comments_qs = CommunityPostComment.objects.filter(
                post=post, parent__isnull=True, is_active=True
            ).select_related('user').order_by('created_at')
            return Response(CommunityPostCommentSerializer(comments_qs, many=True).data)

        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
            
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        
        parent_id = request.data.get('parent_id')
        parent = None
        if parent_id:
            parent = CommunityPostComment.objects.filter(pk=parent_id, post=post, is_active=True).first()
            if not parent:
                return Response({'error': 'Parent not found.'}, status=status.HTTP_404_NOT_FOUND)
            if parent.parent_id is not None:
                return Response({'error': 'Nested replies disallowed.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = CommunityPostComment.objects.create(
            post=post, user=request.user, parent=parent, content=content
        )
        return Response(CommunityPostCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated], url_path='comments/(?P<comment_id>[^/.]+)')
    def delete_comment(self, request, pk=None, comment_id=None):
        comment = get_object_or_404(CommunityPostComment, pk=comment_id, post_id=pk)
        if comment.user != request.user and getattr(request.user, 'role', None) not in ('admin', 'ceo'):
            return Response({'error': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        comment.is_active = False
        comment.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)

