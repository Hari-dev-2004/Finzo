import requests
import sys
import os

def fix_media_structure(token):
    """Call the API endpoint to fix media structure"""
    url = "http://localhost:8000/api/fix-media-structure/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        print("Media structure fixed successfully!")
        print(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fix_media.py <token>")
        sys.exit(1)
    
    token = sys.argv[1]
    fix_media_structure(token) 