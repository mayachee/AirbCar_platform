// MINIMAL TEST - If this doesn't work, the route itself has an issue
'use client'

export default function ResetPasswordTest() {
  const url = typeof window !== 'undefined' ? window.location.href : 'SSR'
  const search = typeof window !== 'undefined' ? window.location.search : ''
  
  return (
    <div style={{ padding: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ RESET PASSWORD PAGE LOADED!</h1>
      <p>If you see this, the route is working.</p>
      <div style={{ marginTop: '30px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>URL Information:</h2>
        <p><strong>Full URL:</strong> {url}</p>
        <p><strong>Search Params:</strong> {search}</p>
        {typeof window !== 'undefined' && (
          <>
            <p><strong>Token:</strong> {new URLSearchParams(window.location.search).get('token') || 'NOT FOUND'}</p>
            <p><strong>UID:</strong> {new URLSearchParams(window.location.search).get('uid') || 'NOT FOUND'}</p>
          </>
        )}
      </div>
      <div style={{ marginTop: '30px' }}>
        <a href="/auth/reset-password?uid=test&token=test" style={{ padding: '10px 20px', background: '#f97316', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Test with sample params
        </a>
      </div>
    </div>
  )
}

