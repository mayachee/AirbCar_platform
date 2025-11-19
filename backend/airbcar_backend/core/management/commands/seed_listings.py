"""
Management command to seed the database with sample car listings.
"""
from django.core.management.base import BaseCommand
from core.models import User, Partner, Listing
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed the database with sample car listings'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database with sample listings...')
        
        # Create or get a test partner user
        partner_user, created = User.objects.get_or_create(
            username='test_partner',
            defaults={
                'email': 'partner@airbcar.com',
                'first_name': 'Test',
                'last_name': 'Partner',
                'role': 'partner',
                'is_verified': True
            }
        )
        if created:
            partner_user.set_password('testpass123')
            partner_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created partner user: {partner_user.username}'))
        else:
            self.stdout.write(f'Using existing partner user: {partner_user.username}')
        
        # Create or get partner profile
        partner, created = Partner.objects.get_or_create(
            user=partner_user,
            defaults={
                'business_name': 'AirbCar Premium Rentals',
                'business_type': 'company',
                'is_verified': True,
                'rating': 4.8,
                'review_count': 150
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created partner: {partner.business_name}'))
        else:
            self.stdout.write(f'Using existing partner: {partner.business_name}')
        
        # Sample listings data
        listings_data = [
            {
                'make': 'Toyota',
                'model': 'Camry',
                'year': 2022,
                'color': 'White',
                'transmission': 'automatic',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'sedan',
                'price_per_day': Decimal('250.00'),
                'location': 'Casablanca',
                'vehicle_description': 'Comfortable and reliable sedan perfect for city driving. Features modern technology and excellent fuel economy.',
                'available_features': ['GPS', 'Bluetooth', 'Air Conditioning', 'USB Ports', 'Backup Camera'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.5,
                'review_count': 23
            },
            {
                'make': 'BMW',
                'model': '3 Series',
                'year': 2023,
                'color': 'Black',
                'transmission': 'automatic',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'sedan',
                'price_per_day': Decimal('450.00'),
                'location': 'Rabat',
                'vehicle_description': 'Luxury sedan with premium features and excellent performance. Perfect for business trips.',
                'available_features': ['GPS', 'Bluetooth', 'Leather Seats', 'Sunroof', 'Premium Sound', 'Parking Sensors'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.8,
                'review_count': 15
            },
            {
                'make': 'Mercedes-Benz',
                'model': 'C-Class',
                'year': 2022,
                'color': 'Silver',
                'transmission': 'automatic',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'sedan',
                'price_per_day': Decimal('500.00'),
                'location': 'Marrakech',
                'vehicle_description': 'Elegant luxury sedan with advanced technology and superior comfort.',
                'available_features': ['GPS', 'Bluetooth', 'Leather Seats', 'Panoramic Sunroof', 'Premium Sound', '360 Camera'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.9,
                'review_count': 31
            },
            {
                'make': 'Toyota',
                'model': 'RAV4',
                'year': 2023,
                'color': 'Blue',
                'transmission': 'automatic',
                'fuel_type': 'hybrid',
                'seating_capacity': 5,
                'vehicle_style': 'suv',
                'price_per_day': Decimal('350.00'),
                'location': 'Tetouan',
                'vehicle_description': 'Spacious SUV perfect for families and long trips. Hybrid engine for excellent fuel economy.',
                'available_features': ['GPS', 'Bluetooth', 'Air Conditioning', 'USB Ports', 'All-Wheel Drive', 'Roof Rack'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.6,
                'review_count': 18
            },
            {
                'make': 'Honda',
                'model': 'Civic',
                'year': 2022,
                'color': 'Red',
                'transmission': 'manual',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'sedan',
                'price_per_day': Decimal('200.00'),
                'location': 'Agadir',
                'vehicle_description': 'Fuel-efficient and fun to drive compact sedan. Great for city driving.',
                'available_features': ['GPS', 'Bluetooth', 'Air Conditioning', 'USB Ports'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': False,
                'rating': 4.4,
                'review_count': 12
            },
            {
                'make': 'Ford',
                'model': 'Explorer',
                'year': 2023,
                'color': 'Gray',
                'transmission': 'automatic',
                'fuel_type': 'gasoline',
                'seating_capacity': 7,
                'vehicle_style': 'suv',
                'price_per_day': Decimal('400.00'),
                'location': 'Fes',
                'vehicle_description': 'Large SUV with third-row seating for big families. Perfect for group trips.',
                'available_features': ['GPS', 'Bluetooth', 'Air Conditioning', 'USB Ports', 'Third Row Seating', 'Towing Package'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.7,
                'review_count': 9
            },
            {
                'make': 'Nissan',
                'model': 'Altima',
                'year': 2022,
                'color': 'White',
                'transmission': 'automatic',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'sedan',
                'price_per_day': Decimal('220.00'),
                'location': 'Tangier',
                'vehicle_description': 'Comfortable mid-size sedan with great fuel economy and modern features.',
                'available_features': ['GPS', 'Bluetooth', 'Air Conditioning', 'USB Ports', 'Backup Camera'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.3,
                'review_count': 7
            },
            {
                'make': 'Jeep',
                'model': 'Wrangler',
                'year': 2023,
                'color': 'Green',
                'transmission': 'manual',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'suv',
                'price_per_day': Decimal('380.00'),
                'location': 'Ouarzazate',
                'vehicle_description': 'Rugged off-road vehicle perfect for adventure. Can handle any terrain.',
                'available_features': ['GPS', 'Bluetooth', 'Four-Wheel Drive', 'Off-Road Capable', 'Removable Doors'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.8,
                'review_count': 14
            },
            {
                'make': 'Hyundai',
                'model': 'Elantra',
                'year': 2022,
                'color': 'Blue',
                'transmission': 'automatic',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'sedan',
                'price_per_day': Decimal('180.00'),
                'location': 'Meknes',
                'vehicle_description': 'Affordable and reliable compact sedan. Great value for money.',
                'available_features': ['GPS', 'Bluetooth', 'Air Conditioning', 'USB Ports'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': False,
                'instant_booking': True,
                'rating': 4.2,
                'review_count': 5
            },
            {
                'make': 'Tesla',
                'model': 'Model 3',
                'year': 2023,
                'color': 'White',
                'transmission': 'automatic',
                'fuel_type': 'electric',
                'seating_capacity': 5,
                'vehicle_style': 'sedan',
                'price_per_day': Decimal('550.00'),
                'location': 'Casablanca',
                'vehicle_description': 'Electric vehicle with cutting-edge technology. Zero emissions and instant acceleration.',
                'available_features': ['GPS', 'Bluetooth', 'Autopilot', 'Supercharging', 'Premium Interior', 'Panoramic Roof'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.9,
                'review_count': 42
            },
            {
                'make': 'Audi',
                'model': 'A4',
                'year': 2023,
                'color': 'Black',
                'transmission': 'automatic',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'sedan',
                'price_per_day': Decimal('480.00'),
                'location': 'Rabat',
                'vehicle_description': 'Premium German sedan with Quattro all-wheel drive. Excellent performance and luxury.',
                'available_features': ['GPS', 'Bluetooth', 'Leather Seats', 'Quattro AWD', 'Premium Sound', 'Virtual Cockpit'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': True,
                'rating': 4.7,
                'review_count': 19
            },
            {
                'make': 'Volkswagen',
                'model': 'Golf',
                'year': 2022,
                'color': 'Gray',
                'transmission': 'manual',
                'fuel_type': 'gasoline',
                'seating_capacity': 5,
                'vehicle_style': 'hatchback',
                'price_per_day': Decimal('190.00'),
                'location': 'Tetouan',
                'vehicle_description': 'Compact and efficient hatchback perfect for city driving. Fun to drive and practical.',
                'available_features': ['GPS', 'Bluetooth', 'Air Conditioning', 'USB Ports', 'Roof Rails'],
                'images': ['/carsymbol.jpg'],
                'is_available': True,
                'is_verified': True,
                'instant_booking': False,
                'rating': 4.5,
                'review_count': 11
            }
        ]
        
        # Create listings
        created_count = 0
        for listing_data in listings_data:
            listing, created = Listing.objects.get_or_create(
                partner=partner,
                make=listing_data['make'],
                model=listing_data['model'],
                year=listing_data['year'],
                defaults=listing_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created listing: {listing.make} {listing.model} {listing.year}'))
            else:
                self.stdout.write(f'Skipped (already exists): {listing.make} {listing.model} {listing.year}')
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully seeded {created_count} new listings!'))
        self.stdout.write(f'Total listings in database: {Listing.objects.count()}')

