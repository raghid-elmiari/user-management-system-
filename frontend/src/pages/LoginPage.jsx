import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';

export const LoginPage = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);
  
  try {
    const response = await authApi.login({ email, password });
    console.log('Full response:', response);
    console.log('Response data:', response.data);
    
    const authData = response.data;
    
    if (!authData || !authData.accessToken) {
      throw new Error('No access token received');
    }

    // If the login response already includes user/role info, use it directly.
    // Otherwise fetch the profile so userRole is available immediately.
    if (authData.role || authData.roles || authData.username) {
      setAuth(authData, authData);
    } else {
      setAuth(authData);
      try {
        const userRes = await authApi.getCurrentUser();
        setAuth(authData, userRes.data);
      } catch (_) {
        // Non-fatal
      }
    }

    navigate('/dashboard');
    
  } catch (err) {
    console.error('Login error details:', err);
    console.error('Error response:', err.response);
    console.error('Error data:', err.response?.data);
    
    // Show more specific error messages
    let errorMessage = 'Invalid credentials. Please try again.';
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.response?.status === 500) {
      errorMessage = 'Server error. Please check backend logs.';
    } else if (err.response?.status === 400) {
      errorMessage = 'Invalid request. Please check your input.';
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <div className="auth-logo-text">Nexus<span>RBAC</span></div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your admin account to continue</p>

        {error && (
          <div
            className="toast toast-error animate-slide-down"
            style={{ marginBottom: 20, position: 'static', minWidth: 0, maxWidth: '100%' }}
          >
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center" style={{ marginBottom: 7 }}>
              <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--color-text-faint)', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 6 }}
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup">Create one</Link>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: '12px 16px',
            background: 'var(--color-primary-subtle)',
            border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: 'var(--color-primary)' }}>Demo credentials</strong><br />
          Email: <code style={{ color: 'var(--color-text)' }}>admin@example.com</code><br />
          Password: <code style={{ color: 'var(--color-text)' }}>admin123</code>
        </div>
      </div>
    </div>
  );
};