'use client';

export default function DebugEnvPage() {
  // Avoid exposing deployment/config details on production.
  if (process.env.NODE_ENV === 'production') {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>Not Found</h1>
      </div>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variable Debug</h1>
      <div style={{ background: '#f0f0f0', padding: '15px', marginTop: '20px', borderRadius: '5px' }}>
        <h2>Current API URL:</h2>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: apiUrl.includes('localhost') ? 'red' : 'green' }}>
          {apiUrl}
        </p>
        {apiUrl.includes('localhost') && (
          <div style={{ background: '#ffebee', padding: '10px', marginTop: '10px', borderRadius: '5px' }}>
            <strong>⚠️ WARNING:</strong> Still using localhost! This means:
            <ul>
              <li>If testing locally: Restart your dev server</li>
              <li>If testing deployed: You need to REDEPLOY after setting the environment variable</li>
            </ul>
          </div>
        )}
        {!apiUrl.includes('localhost') && (
          <div style={{ background: '#e8f5e9', padding: '10px', marginTop: '10px', borderRadius: '5px' }}>
            <strong>✅ Good!</strong> Using production backend: {apiUrl}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Environment Variables:</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
{JSON.stringify({
  NEXT_PUBLIC_DJANGO_API_URL: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'NOT SET',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
}, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginTop: '20px', background: '#fff3cd', padding: '15px', borderRadius: '5px' }}>
        <h3>Important Notes:</h3>
        <ul>
          <li>Next.js bakes environment variables into the JavaScript bundle at <strong>BUILD TIME</strong></li>
          <li>After setting an environment variable, you <strong>MUST redeploy</strong> for it to take effect</li>
          <li>Just saving the variable in Vercel/Render is not enough - you need a new build</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Test API Connection:</h3>
        <button 
          onClick={async () => {
            try {
              const response = await fetch(`${apiUrl}/api/health/`);
              const data = await response.json();
              alert(`✅ Success! Backend is responding:\n${JSON.stringify(data, null, 2)}`);
            } catch (error) {
              alert(`❌ Error connecting to ${apiUrl}:\n${error.message}`);
            }
          }}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Test Backend Connection
        </button>
      </div>
    </div>
  );
}




