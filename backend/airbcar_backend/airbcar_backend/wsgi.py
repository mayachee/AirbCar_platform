"""
WSGI config for airbcar_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import json
import traceback
import sys
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

try:
	application = get_wsgi_application()
except Exception as startup_error:
	print(f"CRITICAL: Django startup failed in WSGI: {startup_error}", file=sys.stderr)
	traceback.print_exc(file=sys.stderr)

	def application(environ, start_response):
		"""Emergency fallback app to avoid total 500 outage when Django fails to boot."""
		body = json.dumps({
			"status": "degraded",
			"error": "startup_failure",
			"message": "Backend startup failed. Check Render logs.",
		}).encode('utf-8')
		headers = [
			('Content-Type', 'application/json; charset=utf-8'),
			('Content-Length', str(len(body))),
			('Access-Control-Allow-Origin', '*'),
			('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS'),
			('Access-Control-Allow-Headers', 'authorization,content-type,origin,accept'),
		]
		start_response('503 Service Unavailable', headers)
		return [body]

