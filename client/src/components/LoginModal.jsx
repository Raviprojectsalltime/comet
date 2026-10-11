import { useState } from 'react';

export default function LoginModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) return setError('Enter your email and password');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Something went wrong');
      if (mode === 'signup') {
        // auto-login right after creating the account
        const res2 = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data2 = await res2.json();
        if (!res2.ok) return setError(data2.error || 'Account created — please log in');
        return onSuccess(data2.user);
      }
      onSuccess(data.user);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close login">×</button>
        <h3>{mode === 'login' ? 'HELLO, COMETEER.' : 'CREATE YOUR ACCOUNT'}</h3>

        <input
          className="login-input"
          type="email"
          placeholder="Email address"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />

        {error && <p className="login-error">{error}</p>}

        <button className="btn-dark" onClick={submit} disabled={loading}>
          {loading ? 'PLEASE WAIT…' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
        </button>

        <p className="login-switch">
          {mode === 'login' ? (
            <>New to Comet?{' '}
              <button onClick={() => { setMode('signup'); setError(''); }}>Create an account</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }}>Log in</button>
            </>
          )}
        </p>
        <p className="modal-fine">By continuing, you agree to our T&C and Privacy Policy</p>
      </div>
    </div>
  );
}
