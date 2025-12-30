#!/bin/bash

echo "🚀 Setting up Inventory Management System..."

# Navigate to server directory
cd server

echo "📦 Installing server dependencies..."
npm install

echo "🗄️ Setting up database..."
# Run migrations
npm run migrate

echo "🌱 Seeding initial data..."
# Run seeds
npm run seed

echo "📊 Adding test categories..."
# Add test categories using node
node -e "
const { pool } = require('./dist/config/db');
const categories = [
  { name: 'Electronics', description: 'Electronic devices and accessories', display_order: 1 },
  { name: 'Clothing', description: 'Apparel and fashion items', display_order: 2 },
  { name: 'Books', description: 'Books and educational materials', display_order: 3 },
  { name: 'Home & Garden', description: 'Home improvement and garden supplies', display_order: 4 },
  { name: 'Sports', description: 'Sports equipment and accessories', display_order: 5 }
];

async function seedCategories() {
  try {
    for (const category of categories) {
      await pool.query(
        'INSERT INTO categories (name, description, display_order, is_active) VALUES (\$1, \$2, \$3, true) ON CONFLICT (name) DO NOTHING',
        [category.name, category.description, category.display_order]
      );
    }
    console.log('✅ Categories seeded successfully');
    
    const result = await pool.query('SELECT id, name FROM categories ORDER BY display_order');
    console.log('📋 Available categories:');
    result.rows.forEach(cat => {
      console.log('  ID: ' + cat.id + ', Name: ' + cat.name);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔑 Default Super Admin Credentials:"
echo "   Email: admin@inventory.local"
echo "   Password: admin@123456"
echo ""
echo "🚀 To start the server:"
echo "   cd server && npm run dev"
echo ""
echo "🧪 To test APIs:"
echo "   1. Import the Postman collection: Inventory_API_Collection.postman_collection.json"
echo "   2. Set base URL to: http://localhost:5000/api"
echo "   3. Login first to get authentication token"
echo ""