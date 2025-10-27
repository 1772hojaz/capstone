import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import cloudinary

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
    result = cloudinary.api.ping()
    print('Cloudinary ping successful:', result)
except Exception as e:
    print('Cloudinary ping failed:', str(e))