import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import cloudinary
import cloudinary.uploader
import cloudinary.api

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

print('cloud_name:', cloudinary.config().cloud_name)
print('api_key exists:', bool(cloudinary.config().api_key))
print('api_secret exists:', bool(cloudinary.config().api_secret))

# Test Cloudinary connection
try:
    # Try to get account info instead of ping
    result = cloudinary.api.usage()
    print('Cloudinary connection successful - usage:', result.get('plan', 'Unknown'))
except Exception as e:
    print('Cloudinary API test failed:', str(e))
    # Try uploading a small test image
    try:
        with open('test_image.png', 'rb') as f:
            test_result = cloudinary.uploader.upload(f, folder="test")
            print('Test upload successful:', test_result.get('secure_url', 'No URL'))
    except FileNotFoundError:
        print('No test image found for upload test')
    except Exception as e2:
        print('Test upload failed:', str(e2))