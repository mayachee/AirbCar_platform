from rest_framework import serializers
from .models import Booking
from users.serializers import UserSerializer
from listings.serializers import ListingSerializer


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

