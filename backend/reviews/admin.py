from django.contrib import admin
from .models import Review, ReviewVote, ReviewReport

admin.site.register(Review)
admin.site.register(ReviewVote)
admin.site.register(ReviewReport)

