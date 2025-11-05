from django.contrib import admin
from .models import User, Partner, Listing, Booking, Favorite, Review

admin.site.register(User)
admin.site.register(Partner)
admin.site.register(Listing)
admin.site.register(Booking)
admin.site.register(Favorite)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'listing', 'rating', 'is_verified', 'is_published', 'created_at']
    list_filter = ['rating', 'is_verified', 'is_published', 'created_at']
    search_fields = ['user__email', 'listing__make', 'listing__model', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
