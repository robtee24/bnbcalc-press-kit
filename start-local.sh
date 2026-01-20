#!/bin/bash

# Start script for local development

# Set environment variables
export DATABASE_URL="file:./dev.db"
export JWT_SECRET="local-dev-secret-key"

# Start the development server
npm run dev



