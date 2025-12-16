#!/bin/bash

# Setup script for local development with SQLite

echo "Setting up local development environment..."

# Copy local schema
cp prisma/schema.local.prisma prisma/schema.prisma

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create database and run migrations
echo "Creating database and running migrations..."
npx prisma migrate dev --name init

# Create uploads directory
echo "Creating uploads directory..."
mkdir -p public/uploads/image public/uploads/video

echo "✅ Local setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Access the app at: http://localhost:3000"
echo "Admin panel at: http://localhost:3000/admin"
echo "Admin password: BNBCalc123$"

