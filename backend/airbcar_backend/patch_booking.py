import re

path = r"c:\Airbcar\backend\airbcar_backend\core\views\booking_views.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = """            # Calculate total amount
            # return_date is treated as checkout date (exclusive), so day-count is the difference
            days = (return_date - pickup_date).days
            security_deposit = listing.security_deposit if listing.security_deposit is not None else DEFAULT_SAFE_DEPOSIT_AMOUNT
            total_amount = (listing.price_per_day * days) + security_deposit + SERVICE_FEE_AMOUNT"""

new_str = """            # Calculate total amount
            # return_date is treated as checkout date (exclusive), so day-count is the difference
            days = (return_date - pickup_date).days
            security_deposit = listing.security_deposit if listing.security_deposit is not None else DEFAULT_SAFE_DEPOSIT_AMOUNT
            
            # B2B pricing logic
            is_b2b_booking = False
            price_to_use = listing.price_per_day
            
            if hasattr(request.user, 'partner_profile') and request.user.role == 'partner':
                if getattr(listing, 'is_b2b_enabled', False) and listing.partner != request.user.partner_profile:
                    is_b2b_booking = True
                    if getattr(listing, 'b2b_price_per_day', None) is not None:
                        price_to_use = listing.b2b_price_per_day
            
            total_amount = (price_to_use * days) + security_deposit + SERVICE_FEE_AMOUNT"""

content = content.replace(old_str, new_str)

old_str_kwargs = """                        # Prepare arguments for save()
                        # CRITICAL: We pass customer explicitly because it is read_only in serializer
                        # CRITICAL: listing and partner are also read_only in serializer
                        save_kwargs = {
                            'customer': request.user,
                            'listing': listing_locked,
                            'partner': partner,
                        }"""

new_str_kwargs = """                        # Prepare arguments for save()
                        # CRITICAL: We pass customer explicitly because it is read_only in serializer
                        # CRITICAL: listing and partner are also read_only in serializer
                        save_kwargs = {
                            'customer': request.user,
                            'listing': listing_locked,
                            'partner': partner,
                            'is_b2b': is_b2b_booking,
                        }"""

content = content.replace(old_str_kwargs, new_str_kwargs)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched booking_views.py successfully.")
