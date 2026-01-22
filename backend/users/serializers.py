from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(required=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.username_field = 'email'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['is_partner'] = user.is_partner
        token['is_verified'] = user.is_verified
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['role'] = getattr(user, 'role', 'user')
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token

    def validate(self, attrs):
        if 'email' in attrs:
            attrs['username'] = attrs['email']
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'phone_number', 'default_currency',
            'is_partner', 'is_verified', 'password', 'profile_picture', 'email_verified',
            'license_number', 'address', 'role', 'first_name', 'last_name', 'issue_date', 
            'license_origin_country', 'nationality', 'country_of_residence', 'city', 'postal_code',
            'date_of_birth', 'id_verification_status', 'id_front_document_url', 'id_back_document_url', 'is_staff']
        read_only_fields = ['id', 'is_partner', 'is_verified', 'email_verified', 
            'id_front_document_url', 'id_back_document_url', 'profile_picture']

    def create(self, validated_data):
        password = validated_data.pop('password')
        if 'username' not in validated_data or not validated_data['username']:
            validated_data['username'] = validated_data['email']
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6, required=True)
    
    def validate_password(self, value):
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

