"""
API views for core app - using database models.

This file now imports all views from the views package for backward compatibility.
The views have been split into separate modules for better organization.
"""
import sys
import traceback

# Import all views from the views package with error handling
try:
    from .views import *
except Exception as e:
    # If views package fails to import, log the error but don't crash
    print(f"CRITICAL: Failed to import views package: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    # Import will fail, but at least we've logged the error
    raise
