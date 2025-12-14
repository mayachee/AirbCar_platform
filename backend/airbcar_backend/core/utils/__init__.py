"""
Utility functions for the core app.
"""
# Import image utilities
from .image_utils import (
    validate_image_file,
    process_and_save_image,
    parse_images_data,
    combine_images,
    normalize_image_entry
)

# Import email utilities from parent utils.py module
# Since we're in core/utils/__init__.py, we need to import from core.utils (the .py file)
# We'll use importlib to import the parent utils.py as a module with proper package context
import importlib.util
import sys
from pathlib import Path

# Get the path to the parent utils.py file
_parent_dir = Path(__file__).parent.parent
_utils_py_path = _parent_dir / 'utils.py'

# Import the parent utils.py module
if _utils_py_path.exists():
    try:
        # Set up proper module name and package context
        module_name = 'core.utils_module'
        
        # Make sure the parent package (core) is in sys.modules
        if 'core' not in sys.modules:
            import core
            sys.modules['core'] = core
        
        spec = importlib.util.spec_from_file_location(module_name, str(_utils_py_path))
        if spec and spec.loader:
            _utils_module = importlib.util.module_from_spec(spec)
            # Set __package__ to 'core' so relative imports work
            _utils_module.__package__ = 'core'
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
            finally:
                # Clean up - remove from sys.modules to avoid conflicts
                if module_name in sys.modules:
                    del sys.modules[module_name]
        else:
            raise ImportError("Could not load utils.py module")
    except Exception as e:
        # If import fails, raise a clear error
        raise ImportError(f"Failed to import email utilities from core.utils: {e}")
else:
    raise ImportError(f"utils.py not found at {_utils_py_path}")

__all__ = [
    # Image utilities
    'validate_image_file',
    'process_and_save_image',
    'parse_images_data',
    'combine_images',
    'normalize_image_entry',
    # Email utilities
    'send_verification_email',
    'send_password_reset_email',
    'verify_email_token',
    'verify_password_reset_token',
    'reset_password_with_token',
]

