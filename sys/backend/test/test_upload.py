import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import cloudinary
import cloudinary.uploader

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

print('Testing image upload functionality...')

try:
    # Test upload similar to admin.py
    with open('test_image.png', 'rb') as f:
        file_content = f.read()

    result = cloudinary.uploader.upload(
        file_content,
        folder="groupbuy_products",
        resource_type="image",
        quality="auto",
        format="webp"
    )

    print('✅ Upload successful!')
    print('Image URL:', result['secure_url'])
    print('Public ID:', result['public_id'])

except Exception as e:
    print('❌ Upload failed:', str(e))