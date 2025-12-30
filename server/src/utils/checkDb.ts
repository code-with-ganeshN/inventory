import { pool } from '../config/db';

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Check if categories table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'categories'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Categories table does not exist');
      return;
    }
    
    console.log('✅ Categories table exists');
    
    // Check table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    console.log('Categories table structure:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Try to select from categories
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories');
    console.log(`Categories count: ${categoriesCount.rows[0].count}`);
    
    // Try to insert a test category
    const testResult = await pool.query(`
      INSERT INTO categories (name, description, is_active, display_order) 
      VALUES ('Test Category', 'Test Description', true, 0) 
      RETURNING *
    `);
    console.log('✅ Test category created:', testResult.rows[0]);
    
    // Clean up test category
    await pool.query('DELETE FROM categories WHERE name = $1', ['Test Category']);
    console.log('✅ Test category cleaned up');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();