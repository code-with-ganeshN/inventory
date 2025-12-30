const axios = require('axios');

async function test() {
  try {
    // Login first
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✓ Logged in successfully');
    
    // Create category
    const categoryRes = await axios.post('http://localhost:5000/api/categories', 
      {
        name: 'Electronics',
        description: 'Electronic devices and gadgets'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✓ Category created:', categoryRes.data);
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

test();
