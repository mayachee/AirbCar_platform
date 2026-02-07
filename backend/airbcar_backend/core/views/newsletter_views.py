"""Newsletter subscription views."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

from ..models import NewsletterSubscriber


class NewsletterSubscribeView(APIView):
    """Subscribe an email to the newsletter."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {'error': 'Please enter a valid email address'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={'is_active': True},
        )

        if not created:
            if subscriber.is_active:
                return Response(
                    {'message': 'You are already subscribed!'},
                    status=status.HTTP_200_OK,
                )
            # Re-subscribe
            subscriber.is_active = True
            subscriber.save(update_fields=['is_active'])

        return Response(
            {'message': 'Successfully subscribed to our newsletter!'},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
