#!/bin/bash

# Production Deployment Script for ConnectAfrica Frontend
# This script builds the frontend with production environment variables

echo "🚀 Starting production build..."

# Create .env.production file
cat > .env.production << EOF
VITE_API_BASE_URL=https://connectafrica.store
EOF

echo "✅ Created .env.production"

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build for production
echo "🔨 Building frontend..."
npm run build

echo "✅ Build complete!"
echo "📁 Built files are in: ./dist"
echo ""
echo "📋 Next steps:"
echo "1. Copy dist folder to server: scp -r dist/* root@YOUR_SERVER:/var/www/capstone/sys/Front-end/connectsphere/dist/"
echo "2. Or on server: cd /var/www/capstone && git pull && cd sys/Front-end/connectsphere && npm run build"
echo "3. Restart nginx: sudo systemctl restart nginx"

