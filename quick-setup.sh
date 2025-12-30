#!/bin/bash

echo "🔧 Quick Database Setup"

# Create database if it doesn't exist
echo "📊 Creating database..."
psql -U postgres -c "CREATE DATABASE inventory_db;" 2>/dev/null || echo "Database already exists"

# Run migrations
echo "🏗️ Running migrations..."
cd server
npm run migrate 2>/dev/null || echo "Migration failed or already run"

# Run seeds
echo "🌱 Running seeds..."
npm run seed 2>/dev/null || echo "Seeds failed or already run"

# Test connection
echo "🧪 Testing connection..."
node -e "
const { pool } = require('./dist/config/db');
pool.query('SELECT COUNT(*) FROM categories')
  .then(result => {
    console.log('✅ Database working! Categories:', result.rows[0].count);
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Database error:', error.message);
    process.exit(1);
  });
"

echo "✅ Setup complete!"