#!/usr/bin/env python
"""
Healthcheck script for Docker.
Returns 0 if server is healthy, 1 otherwise.
"""
import sys
import urllib.request
import urllib.error


def check_health():
    """Check if the Django server is responding."""
    url = 'http://localhost:8000/api/'
    
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Docker-HealthCheck')
        urllib.request.urlopen(req, timeout=5)
        # If we get here, server responded with 200
        return 0
    except urllib.error.HTTPError as e:
        # 401 (Unauthorized) means server is running, just needs auth
        # 403 (Forbidden) also means server is running
        if e.code in (200, 401, 403):
            return 0
        # Other HTTP errors mean server has issues
        print(f"HTTP Error {e.code}: {e.reason}", file=sys.stderr)
        return 1
    except Exception as e:
        # Connection errors or timeouts mean server is not responding
        print(f"Connection error: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(check_health())

