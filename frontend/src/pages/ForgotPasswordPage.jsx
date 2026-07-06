import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '../services/authService';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await forgotPassword(email);
      if (data.status) {
        setIsSuccess(true);
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.details?.[0]?.message || errorData?.message || 'Failed to send reset link';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2>Forgot Password</h2>
          <p>Enter your email to receive a password reset link</p>
        </div>

        {isSuccess ? (
          <div className="text-center" style={{ padding: '2rem 0' }}>
            <div style={{ color: '#4caf50', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <p>If an account exists for this email, we've sent password reset instructions.</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
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

            <button type="submit" className="btn btn-primary auth-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Remember your password? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
