// SIMPLE TEST VERSION - Replace page.js with this to test
'use client'

export default function ResetPassword() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Reset Password Page - TEST</h1>
      <p>If you see this, the route is working!</p>
      <p>URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
      <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>URL Parameters:</h2>
        {typeof window !== 'undefined' && (
          <>
            <p>Token: {new URLSearchParams(window.location.search).get('token') || 'NOT FOUND'}</p>
            <p>UID: {new URLSearchParams(window.location.search).get('uid') || 'NOT FOUND'}</p>
            <p>Full URL: {window.location.href}</p>
          </>
        )}
      </div>
    </div>
  )
}

