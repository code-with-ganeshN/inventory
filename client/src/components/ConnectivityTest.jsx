import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ConnectivityTest() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testConnections = async () => {
    setLoading(true);
    const tests = {};

    // Test 1: Direct backend connection
    try {
      const response = await fetch('http://localhost:5000');
      tests.backendDirect = {
        status: response.ok ? 'SUCCESS' : 'FAILED',
        data: await response.text()
      };
    } catch (error) {
      tests.backendDirect = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 2: API test endpoint
    try {
      const response = await fetch('http://localhost:5000/api/test');
      tests.apiTest = {
        status: response.ok ? 'SUCCESS' : 'FAILED',
        data: await response.json()
      };
    } catch (error) {
      tests.apiTest = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 3: Categories test endpoint (no auth)
    try {
      const response = await fetch('http://localhost:5000/api/categories-test');
      tests.categoriesTest = {
        status: response.ok ? 'SUCCESS' : 'FAILED',
        data: await response.json()
      };
    } catch (error) {
      tests.categoriesTest = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 4: Using axios client
    try {
      const api = axios.create({ baseURL: 'http://localhost:5000/api' });
      const response = await api.get('/test');
      tests.axiosClient = {
        status: 'SUCCESS',
        data: response.data
      };
    } catch (error) {
      tests.axiosClient = {
        status: 'FAILED',
        error: error.message
      };
    }

    setResults(tests);
    setLoading(false);
  };

  useEffect(() => {
    testConnections();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Backend Connectivity Test</h1>
      
      <button 
        onClick={testConnections}
        disabled={loading}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Tests'}
      </button>

      <div className="space-y-4">
        {Object.entries(results).map(([testName, result]) => (
          <div key={testName} className="border rounded p-4">
            <h3 className="font-semibold flex items-center gap-2">
              {testName}
              <span className={`px-2 py-1 rounded text-sm ${
                result.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.status}
              </span>
            </h3>
            
            {result.error && (
              <div className="mt-2 text-red-600">
                <strong>Error:</strong> {result.error}
              </div>
            )}
            
            {result.data && (
              <div className="mt-2">
                <strong>Response:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-auto">
                  {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">Debug Info:</h3>
        <ul className="mt-2 text-sm text-yellow-700">
          <li>Frontend URL: {window.location.origin}</li>
          <li>Expected Backend: http://localhost:5000</li>
          <li>API Base URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</li>
          <li>Token in localStorage: {localStorage.getItem('token') ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    </div>
  );
}