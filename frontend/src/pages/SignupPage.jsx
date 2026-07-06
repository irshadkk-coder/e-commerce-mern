import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signup as signupService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import './AuthPages.css';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const getPasswordStrength = (pass) => {
    if (!pass) return { strength: '', color: '#333', percent: 0 };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.match(/[A-Z]/)) score += 1;
    if (pass.match(/[0-9]/)) score += 1;
    if (pass.match(/[^A-Za-z0-9]/)) score += 1;
    
    if (score < 2) return { strength: 'Weak', color: '#f44336', percent: 25 };
    if (score === 2 || score === 3) return { strength: 'Medium', color: '#ff9800', percent: 50 };
    return { strength: 'Strong', color: '#4caf50', percent: 100 };
  };

  const passStrength = getPasswordStrength(password);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await signupService({ name, email, password });
      
      if (data.status) {
        toast.success(data.message || 'Account created! Please check your email for the verification code.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.message || 'Signup failed');
      }
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.details?.[0]?.message || errorData?.message || 'Signup failed';
      
      if (errorMsg === 'An account with this email already exists. Please sign in instead.') {
        toast.error(
          <div>
            {errorMsg}
            <div style={{ marginTop: '10px' }}>
              <button 
                onClick={() => { toast.dismiss(); navigate('/login'); }}
                className="btn btn-primary"
                style={{ padding: '5px 10px', fontSize: '14px' }}
              >
                Go to Login
              </button>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join NeoShop and discover premium tech</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-control"
              placeholder="John Doe"
              aria-label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="name@example.com"
              aria-label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="8"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>
                  <span>Password Strength:</span>
                  <span style={{ color: passStrength.color, fontWeight: 'bold' }}>{passStrength.strength}</span>
                </div>
                <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${passStrength.percent}%`, background: passStrength.color, transition: 'all 0.3s' }}></div>
                </div>
              </div>
            )}
            <ul style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem', paddingLeft: '1.2rem', marginBottom: 0 }}>
              <li>At least 8 characters</li>
              <li>Include uppercase, number, and special character for strong password</li>
            </ul>
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
