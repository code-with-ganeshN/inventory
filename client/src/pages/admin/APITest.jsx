import React, { useState } from 'react';
import { categoryAPI } from '../../api/endpoints';

export default function APITest() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testCategories = async () => {
    setLoading(true);
    try {
      console.log('Testing categories API...');
      const response = await categoryAPI.getAllCategories();
      console.log('Full response:', response);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('API Test Error:', error);
      setResult(`Error: ${error.message}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateCategory = async () => {
    setLoading(true);
    try {
      const testData = {
        name: 'Test Category ' + Date.now(),
        description: 'Test description'
      };
      console.log('Testing create category with:', testData);
      const response = await categoryAPI.createCategory(testData);
      console.log('Create response:', response);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Create Test Error:', error);
      setResult(`Error: ${error.message}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testCategories}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Get Categories
        </button>
        
        <button
          onClick={testCreateCategory}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Create Category
        </button>
      </div>

      {loading && <div className="mt-4">Loading...</div>}
      
      {result && (
        <div className="mt-4">
          <h3 className="font-bold">Result:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}