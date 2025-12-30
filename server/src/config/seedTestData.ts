import { pool } from '../config/db';

export async function seedTestCategories() {
  try {
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories', display_order: 1 },
      { name: 'Clothing', description: 'Apparel and fashion items', display_order: 2 },
      { name: 'Books', description: 'Books and educational materials', display_order: 3 },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies', display_order: 4 },
      { name: 'Sports', description: 'Sports equipment and accessories', display_order: 5 }
    ];

    for (const category of categories) {
      await pool.query(
        `INSERT INTO categories (name, description, display_order, is_active) 
         VALUES ($1, $2, $3, true)
         ON CONFLICT (name) DO NOTHING`,
        [category.name, category.description, category.display_order]
      );
    }

    console.log('✓ Test categories seeded successfully');
    
    // Display created categories
    const result = await pool.query('SELECT id, name FROM categories ORDER BY display_order');
    console.log('Available categories:');
    result.rows.forEach(cat => {
      console.log(`  ID: ${cat.id}, Name: ${cat.name}`);
    });
    
  } catch (error) {
    console.error('Error seeding test categories:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedTestCategories().then(() => process.exit(0));
}