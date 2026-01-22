from rest_framework import serializers
from .models import Listing


class ListingSerializer(serializers.ModelSerializer):
    partner = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Listing
        fields = ['id', 'partner', 'make', 'model', 'year', 'location', 'features', 
            'price_per_day', 'availability', 'rating', 'created_at', 'fuel_type', 
            'transmission', 'seating_capacity', 'vehicle_condition', 'pictures', 'vehicle_description']
        read_only_fields = ['partner', 'created_at', 'rating']

    def to_internal_value(self, data):
        # Remove pictures from data (it's handled separately in views)
        if 'pictures' in data:
            data = data.copy()
            data.pop('pictures')
        
        # Handle FormData - convert string numbers to proper types
        # DRF should handle this, but let's ensure it works
        processed_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # Flatten single-value lists that can come from multipart/form-data
        single_value_fields = [
            'make', 'model', 'year', 'location', 'price_per_day',
            'fuel_type', 'transmission', 'seating_capacity',
            'vehicle_condition', 'vehicle_description', 'availability'
        ]
        for field in single_value_fields:
            if field in processed_data and isinstance(processed_data[field], list):
                processed_data[field] = processed_data[field][0] if processed_data[field] else ''

        # Convert string numbers to integers for year and seating_capacity
        if 'year' in processed_data and isinstance(processed_data['year'], str):
            try:
                processed_data['year'] = int(processed_data['year'])
            except (ValueError, TypeError):
                pass  # Let DRF handle the error
        
        if 'seating_capacity' in processed_data and isinstance(processed_data['seating_capacity'], str):
            try:
                processed_data['seating_capacity'] = int(processed_data['seating_capacity'])
            except (ValueError, TypeError):
                pass  # Let DRF handle the error
        
        # Convert string decimal to Decimal for price_per_day
        if 'price_per_day' in processed_data and isinstance(processed_data['price_per_day'], str):
            try:
                from decimal import Decimal
                processed_data['price_per_day'] = str(Decimal(processed_data['price_per_day']))
            except (ValueError, TypeError, Exception):
                pass  # Let DRF handle the error
        
        # Handle features - JSONField expects a list or JSON string
        if 'features' in processed_data:
            if isinstance(processed_data['features'], str):
                # If it's a string, try to parse as JSON
                try:
                    import json
                    parsed_features = json.loads(processed_data['features'])
                    if isinstance(parsed_features, list):
                        processed_data['features'] = parsed_features
                    else:
                        # If it's not a list after parsing, wrap it in a list
                        processed_data['features'] = [parsed_features] if parsed_features else []
                except (json.JSONDecodeError, ValueError):
                    # If it's not valid JSON, try to treat as a single feature value
                    # This handles cases where a single string was sent instead of JSON
                    processed_data['features'] = [processed_data['features']] if processed_data['features'].strip() else []
        
        return super().to_internal_value(processed_data)

