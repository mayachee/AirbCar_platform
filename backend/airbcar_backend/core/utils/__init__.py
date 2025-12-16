"""
Utility functions for the core app.
"""
# Import image utilities
from .image_utils import (
    validate_image_file,
    process_and_save_image,
    parse_images_data,
    combine_images,
    normalize_image_entry,
    upload_file_to_supabase_storage
)

# Import email utilities from parent utils.py module
# Since we're in core/utils/__init__.py, we need to import from core.utils (the .py file)
# We'll use importlib to import the parent utils.py as a module with proper package context
# Note: This import may fail if Django is not configured (e.g., during static analysis)
# The functions will be imported lazily when actually needed
import importlib.util
import sys
from pathlib import Path

# Get the path to the parent utils.py file
_parent_dir = Path(__file__).parent.parent
_utils_py_path = _parent_dir / 'utils.py'

# Try to import email utilities, but don't fail if Django isn't configured yet
_email_utils_loaded = False
_email_import_error = None

if _utils_py_path.exists():
    try:
        # Set up proper module name and package context
        module_name = 'airbcar_backend.core.utils_module'
        
        # Get the parent package path for proper imports
        parent_package_path = str(_parent_dir.parent)
        if parent_package_path not in sys.path:
            sys.path.insert(0, parent_package_path)
        
        try:
            spec = importlib.util.spec_from_file_location(module_name, str(_utils_py_path))
            if spec and spec.loader:
                _utils_module = importlib.util.module_from_spec(spec)
                # Set __package__ to 'airbcar_backend.core' so relative imports work
                _utils_module.__package__ = 'airbcar_backend.core'
                _utils_module.__name__ = module_name
                # Add to sys.modules temporarily
                sys.modules[module_name] = _utils_module
                try:
                    spec.loader.exec_module(_utils_module)
                    # Re-export email functions
                    send_verification_email = _utils_module.send_verification_email
                    send_password_reset_email = _utils_module.send_password_reset_email
                    verify_email_token = _utils_module.verify_email_token
                    verify_password_reset_token = _utils_module.verify_password_reset_token
                    reset_password_with_token = _utils_module.reset_password_with_token
                    _email_utils_loaded = True
                finally:
                    # Clean up - remove from sys.modules to avoid conflicts
                    if module_name in sys.modules:
                        del sys.modules[module_name]
            else:
                _email_import_error = ImportError("Could not load utils.py module")
        except Exception as e:
            # Store the error but don't raise it yet - will raise when function is called
            _email_import_error = e
        finally:
            # Remove parent package path from sys.path if we added it
            if parent_package_path in sys.path:
                sys.path.remove(parent_package_path)
    except Exception as e:
        _email_import_error = e
else:
    _email_import_error = ImportError(f"utils.py not found at {_utils_py_path}")

# If email utilities failed to load, create stub functions that raise helpful errors
if not _email_utils_loaded:
    def _raise_email_import_error():
        if _email_import_error:
            raise ImportError(f"Failed to import email utilities from core.utils: {_email_import_error}")
        else:
            raise ImportError("Email utilities not available")
    
    send_verification_email = _raise_email_import_error
    send_password_reset_email = _raise_email_import_error
    verify_email_token = _raise_email_import_error
    verify_password_reset_token = _raise_email_import_error
    reset_password_with_token = _raise_email_import_error

__all__ = [
    # Image utilities
    'validate_image_file',
    'process_and_save_image',
    'parse_images_data',
    'combine_images',
    'normalize_image_entry',
    'upload_file_to_supabase_storage',
    # Email utilities
    'send_verification_email',
    'send_password_reset_email',
    'verify_email_token',
    'verify_password_reset_token',
    'reset_password_with_token',
]

