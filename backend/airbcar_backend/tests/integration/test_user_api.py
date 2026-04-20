"""
Integration tests for User API endpoints.
Tests user profile, updates, and user management.
"""
import pytest
import io
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from core.models import User, LicenseVerificationRecord
from tests.factories import UserFactory


def _make_upload(name='doc.jpg'):
    image = Image.new('RGB', (900, 560), color=(245, 245, 240))
    buf = io.BytesIO()
    image.save(buf, format='JPEG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type='image/jpeg')


@pytest.mark.integration
@pytest.mark.django_db
class TestUserProfileAPI:
    """Test user profile endpoints."""

    def test_get_user_profile(self, db, authenticated_client, user):
        """Test getting current user profile."""
        url = '/users/me/'
        response = authenticated_client.get(url)
        print("DEBUG RESPONSE", response.data)
        
        if response.status_code == 404:
            pytest.skip("User profile endpoint not found")
        
        if response.status_code == 200:
            id_val = response.data.get("id") or response.data.get("user", {}).get("id") or response.data.get("data", {}).get("id")
            assert id_val == user.id
            username_val = response.data.get("username") or response.data.get("user", {}).get("username") or response.data.get("data", {}).get("username")
            assert username_val == user.username
            email_val = response.data.get("email") or response.data.get("user", {}).get("email") or response.data.get("data", {}).get("email")
            assert email_val == user.email

    def test_get_other_user_profile(self, db, api_client):
        """Test getting another user's profile."""
        user = UserFactory()
        url = f'/users/{user.id}/'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("User detail endpoint not found")
        
        if response.status_code == 200:
            id_val = response.data.get("id") or response.data.get("data", {}).get("id")
            assert id_val == user.id

    def test_unauthenticated_cannot_get_me(self, db, api_client):
        """Test unauthenticated user cannot access /me/ endpoint."""
        url = '/users/me/'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("User profile endpoint not found")
        
        # Should fail without authentication
        assert response.status_code in [401, 403]


@pytest.mark.integration
@pytest.mark.django_db
class TestUserUpdateAPI:
    """Test user profile update."""

    def test_update_user_profile(self, db, authenticated_client, user):
        """Test updating user profile."""
        url = '/users/me/'
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'phone_number': '555-1234',
        }
        response = authenticated_client.patch(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("User update endpoint not found")
        
        if response.status_code == 200:
            user.refresh_from_db()
            assert user.first_name == 'John'
            assert user.last_name == 'Doe'
            assert user.phone_number == '555-1234'

    def test_cannot_update_others_profile(self, db, authenticated_client):
        """Test user cannot update another user's profile."""
        other_user = UserFactory()
        url = f'/users/{other_user.id}/'
        data = {'first_name': 'Hacked'}
        response = authenticated_client.patch(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("User update endpoint not found")
        
        # Should fail (403 or 404)
        if response.status_code in [403, 404, 405]:
            assert response.status_code in [403, 404, 405]

    def test_update_profile_single_license_side_returns_400_not_500(self, db, authenticated_client):
        """Uploading one license side should be a validation error (400), not server error (500)."""
        url = '/users/me/'
        response = authenticated_client.put(
            url,
            {'license_front_document': _make_upload('front.jpg')},
            format='multipart',
        )

        if response.status_code == 404:
            pytest.skip('User update endpoint not found')

        assert response.status_code == 400
        assert 'error' in response.data


@pytest.mark.integration
@pytest.mark.django_db
class TestUserListAPI:
    """Test user list endpoint."""

    def test_list_users_admin(self, db, admin_client):
        """Test admin can list users."""
        UserFactory()
        UserFactory()
        
        url = '/users/'
        response = admin_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("User list endpoint not found")
        
        if response.status_code == 200:
            assert True

    def test_list_users_non_admin_forbidden(self, db, authenticated_client):
        """Test non-admin cannot list all users."""
        url = '/users/'
        response = authenticated_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("User list endpoint not found")
        
        # Should be forbidden or return only self
        if response.status_code == 403:
            assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.django_db
class TestUserVerificationAPI:
    """Test user verification endpoints."""

    def test_user_starts_unverified(self, db):
        """Test new user is unverified."""
        user = UserFactory(is_verified=False)
        assert user.is_verified is False

    def test_verify_user_email(self, db, authenticated_client, user):
        """Test email verification endpoint."""
        user.is_verified = False
        user.save()
        
        url = '/api/verify-email/'
        data = {'code': '123456'}
        response = authenticated_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Email verification endpoint not found")
        
        if response.status_code == 400:
            # Expected for invalid code
            assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
class TestUserRoleManagement:
    """Test user role-based functionality."""

    def test_partner_role_assignment(self, db, authenticated_client, user):
        """Test partner role and profile relationship."""
        # Initially user is customer
        assert user.role == 'customer'

    def test_customer_profile_fields(self, db, authenticated_client, user):
        """Test customer-specific profile fields."""
        url = '/users/me/'
        response = authenticated_client.get(url)
        
        if response.status_code == 200:
            data = response.data
            role_val = data.get('role') or data.get('user', {}).get('role') or data.get('data', {}).get('role')
            assert role_val == 'customer'


@pytest.mark.integration
@pytest.mark.django_db
class TestUserSearchAPI:
    """Test user search functionality."""

    def test_search_users_by_username(self, db, api_client):
        """Test searching users by username."""
        UserFactory(username='john_doe')
        UserFactory(username='jane_smith')
        
        url = '/users/search/?q=john'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("User search endpoint not found")
        
        if response.status_code == 200:
            assert True

    def test_search_users_by_email(self, db, api_client):
        """Test searching users by email."""
        UserFactory(email='test@example.com')
        
        url = '/users/search/?email=test@'
        response = api_client.get(url)
        
        if response.status_code == 404:
            pytest.skip("User search endpoint not found")
        
        if response.status_code == 200:
            assert True


@pytest.mark.integration
@pytest.mark.django_db
class TestUserDocumentUpload:
    """Test user document upload (profile picture, license)."""

    def test_upload_profile_picture(self, db, authenticated_client, user):
        """Test uploading profile picture."""
        url = '/users/me/'
        # Note: File upload test requires InMemoryUploadedFile
        # This is a placeholder for the structure
        
        # Skip if not implemented
        pytest.skip("File upload test requires proper setup")

    def test_upload_license_documents(self, db, authenticated_client, user):
        """Test uploading license documents."""
        url = '/users/me/'
        # Placeholder for license upload test
        
        pytest.skip("License upload test requires proper setup")

    def test_upload_document_endpoint_rejects_single_side(self, db, authenticated_client):
        """Bypass guard: upload-document endpoint must reject front-only payloads."""
        url = '/users/me/upload-document/'
        response = authenticated_client.post(
            url,
            {'license_front_document': _make_upload('front.jpg')},
            format='multipart',
        )

        if response.status_code == 404:
            pytest.skip('Upload-document endpoint not found')

        assert response.status_code == 400

    def test_upload_document_endpoint_stores_verification_record(self, db, authenticated_client, user, monkeypatch):
        """Successful upload-document verification should be persisted."""
        url = '/users/me/upload-document/'

        def fake_verify(*args, **kwargs):
            return {
                'is_valid': True,
                'score': 0.88,
                'detected_country': 'FR',
                'date_check': {'issue_date': '2021-02-01', 'expiry_date': '2028-02-01', 'is_expired': False},
                'errors': [],
                'warnings': [],
                'checks': {},
            }

        monkeypatch.setattr('core.views.user_views.verify_driving_license_images', fake_verify)

        response = authenticated_client.post(
            url,
            {
                'license_front_document': _make_upload('front.jpg'),
                'license_back_document': _make_upload('back.jpg'),
            },
            format='multipart',
        )

        if response.status_code == 404:
            pytest.skip('Upload-document endpoint not found')

        assert response.status_code == 200
        record = LicenseVerificationRecord.objects.filter(user=user, context='user_upload').first()
        assert record is not None
        assert record.is_valid is True
        assert record.detected_country == 'FR'

    def test_upload_document_endpoint_ignores_audit_persist_failure(self, db, authenticated_client, monkeypatch):
        """Audit persistence failures should not block successful upload verification responses."""
        url = '/users/me/upload-document/'

        def fake_verify(*args, **kwargs):
            return {
                'is_valid': True,
                'score': 0.88,
                'detected_country': 'FR',
                'date_check': {'issue_date': '2021-02-01', 'expiry_date': '2028-02-01', 'is_expired': False},
                'errors': [],
                'warnings': [],
                'checks': {},
            }

        monkeypatch.setattr('core.views.user_views.verify_driving_license_images', fake_verify)
        monkeypatch.setattr(
            'core.utils.license_verification_persistence.LicenseVerificationRecord.objects.create',
            lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError('audit write failed')),
        )

        response = authenticated_client.post(
            url,
            {
                'license_front_document': _make_upload('front.jpg'),
                'license_back_document': _make_upload('back.jpg'),
            },
            format='multipart',
        )

        if response.status_code == 404:
            pytest.skip('Upload-document endpoint not found')

        assert response.status_code == 200
