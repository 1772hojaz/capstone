#!/bin/bash

# Set Cloudinary environment variables
export CLOUDINARY_CLOUD_NAME=dz5rslegb
export CLOUDINARY_API_KEY=596291411567142
export CLOUDINARY_API_SECRET=7wR7cVkBDXHKVSI83-cG0bcD8Qk

# Set other required environment variables
export SECRET_KEY=your-secret-key-here-change-this-in-production
export LOG_LEVEL=INFO
export PORT=8000
# Use SQLite for local development (comment out for PostgreSQL)
export DATABASE_URL=sqlite:///./groupbuy.db

# Run the backend
python main.py