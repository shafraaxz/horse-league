// components/admin/LocalDataInspector.js
import React, { useState, useEffect } from 'react';
import { Database, Trash2, Eye, AlertCircle, RefreshCw } from 'lucide-react';

const LocalDataInspector = () => {
  const [localData, setLocalData] = useState({});
  const [sessionData, setSessionData] = useState({});
  const [inMemoryCheck, setInMemoryCheck] = useState(null);

  const inspectLocalStorage = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const value = localStorage.getItem(key);
        data[key] = {
          raw: value,
          parsed: JSON.parse(value),
          type: 'localStorage'
        };
      } catch (e) {
        data[key] = {
          raw: localStorage.getItem(key),
          parsed: 'Not JSON',
          type: 'localStorage'
        };
      }
    }
    setLocalData(data);
  };

  const inspectSessionStorage = () => {
    const data = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      try {
        const value = sessionStorage.getItem(key);
        data[key] = {
          raw: value,
          parsed: JSON.parse(value),
          type: 'sessionStorage'
        };
      } catch (e) {
        data[key] = {
          raw: sessionStorage.getItem(key),
          parsed: 'Not JSON',
          type: 'sessionStorage'
        };
      }
    }
    setSessionData(data);
  };

  const checkInMemoryData = () => {
    // Check common global variables that might store admin data
    const checks = {
      'window.admins': window.admins,
      'window.adminList': window.adminList,
      'window.users': window.users,
      'window.mockData': window.mockData,
      'window.testData': window.testData,
      'window.__ADMIN_DATA__': window.__ADMIN_DATA__,
      'window.appState': window.appState,
      'window.adminCache': window.adminCache
    };

    const foundData = Object.entries(checks)
      .filter(([key, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    setInMemoryCheck(foundData);
  };

  useEffect(() => {
    inspectLocalStorage();
    inspectSessionStorage();
    checkInMemoryData();
  }, []);

  const clearLocalStorage = () => {
    if (window.confirm('Are you sure you want to clear ALL localStorage data? This might log you out.')) {
      localStorage.clear();
      inspectLocalStorage();
      alert('localStorage cleared!');
    }
  };

  const clearSessionStorage = () => {
    if (window.confirm('Are you sure you want to clear ALL sessionStorage data?')) {
      sessionStorage.clear();
      inspectSessionStorage();
      alert('sessionStorage cleared!');
    }
  };

  const clearSpecificItem = (key, type) => {
    if (type === 'localStorage') {
      localStorage.removeItem(key);
      inspectLocalStorage();
    } else if (type === 'sessionStorage') {
      sessionStorage.removeItem(key);
      inspectSessionStorage();
    }
  };

  const clearInMemoryData = () => {
    const keysToCheck = [
      'admins', 'adminList', 'users', 'mockData', 'testData', 
      '__ADMIN_DATA__', 'appState', 'adminCache'
    ];
    
    keysToCheck.forEach(key => {
      if (window[key]) {
        delete window[key];
      }
    });
    
    checkInMemoryData();
    alert('In-memory data cleared!');
  };

  const refreshAll = () => {
    inspectLocalStorage();
    inspectSessionStorage();
    checkInMemoryData();
  };

  const renderDataSection = (title, data, clearAllFn, icon) => (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          {icon}
          {title}
        </h3>
        <div className="space-x-2">
          <button
            onClick={clearAllFn}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      </div>
      
      {Object.keys(data).length === 0 ? (
        <p className="text-gray-500 text-sm">No data found</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{key}</span>
                <button
                  onClick={() => clearSpecificItem(key, value.type)}
                  className="px-2 py-1 bg-red-400 text-white text-xs rounded hover:bg-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              
              {/* Show if this might be admin data */}
              {(key.toLowerCase().includes('admin') || key.toLowerCase().includes('user')) && (
                <div className="mb-2 text-orange-600 text-xs font-medium">
                  ⚠️ Potential admin data detected!
                </div>
              )}
              
              <details className="text-xs">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                  View Data ({typeof value.parsed === 'object' ? 'Object/Array' : typeof value.parsed})
                </summary>
                <pre className="mt-2 bg-white p-2 rounded border max-h-32 overflow-auto">
                  {typeof value.parsed === 'object' 
                    ? JSON.stringify(value.parsed, null, 2)
                    : String(value.parsed)
                  }
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Local Data Inspector</h2>
        <button
          onClick={refreshAll}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-yellow-800 font-medium">Development Mode Detected?</h3>
            <p className="text-yellow-700 text-sm mt-1">
              If you're getting "email already exists" errors but the database is empty, 
              the app might be using local storage or in-memory data for development.
            </p>
          </div>
        </div>
      </div>

      {/* localStorage Section */}
      {renderDataSection(
        'localStorage Data',
        localData,
        clearLocalStorage,
        <Database className="w-4 h-4 mr-2" />
      )}

      {/* sessionStorage Section */}
      {renderDataSection(
        'sessionStorage Data',
        sessionData,
        clearSessionStorage,
        <Database className="w-4 h-4 mr-2" />
      )}

      {/* In-Memory Data Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            In-Memory Global Variables
          </h3>
          <button
            onClick={clearInMemoryData}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear Memory
          </button>
        </div>
        
        {Object.keys(inMemoryCheck || {}).length === 0 ? (
          <p className="text-gray-500 text-sm">No global admin data found</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(inMemoryCheck).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded p-3">
                <span className="font-medium text-sm text-red-600">{key}</span>
                <details className="text-xs mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    View Data ({Array.isArray(value) ? `Array[${value.length}]` : typeof value})
                  </summary>
                  <pre className="mt-2 bg-white p-2 rounded border max-h-32 overflow-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h3 className="font-semibold text-blue-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('admins');
              localStorage.removeItem('adminList');
              localStorage.removeItem('users');
              refreshAll();
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Clear Admin-Related Data
          </button>
          <button
            onClick={() => {
              // Clear everything and reload page
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Nuclear Reset (Reload Page)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalDataInspector;