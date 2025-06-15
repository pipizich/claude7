import os

SECRET_KEY = 'art_gallery_secret_key'
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
MAX_IMAGE_SIZE = (1920, 1080)
IMAGE_QUALITY = 85

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)