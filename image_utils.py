from PIL import Image
import io
from werkzeug.utils import secure_filename
from config import ALLOWED_EXTENSIONS, MAX_IMAGE_SIZE, IMAGE_QUALITY

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def optimize_image(file_stream, max_size=MAX_IMAGE_SIZE, quality=IMAGE_QUALITY):
    try:
        img = Image.open(file_stream)
        
        # Convert RGBA to RGB if needed
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1])
            img = background
        
        # Resize if too large
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save optimized image
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        
        return output
    except Exception as e:
        print(f"Image optimization error: {e}")
        return file_stream