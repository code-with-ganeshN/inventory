import { pool } from './db';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test if categories table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'categories'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Categories table does not exist');
      console.log('Available tables:');
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    } else {
      console.log('✅ Categories table exists');
      
      // Test select from categories
      const result = await client.query('SELECT COUNT(*) FROM categories');
      console.log(`✅ Categories count: ${result.rows[0].count}`);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
  } finally {
    process.exit(0);
  }
}

testConnection();