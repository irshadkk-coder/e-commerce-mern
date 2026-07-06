import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../services/authService';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  if (!token) {
    return (
      <div className="auth-container animate-fade-in">
        <div className="auth-card glass-panel text-center">
          <div style={{ color: '#f44336', fontSize: '3rem', marginBottom: '1rem' }}>✗</div>
          <h3>Invalid Request</h3>
          <p>No reset token provided.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await resetPassword(token, newPassword);
      if (data.status) {
        setIsSuccess(true);
        toast.success(data.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.details?.[0]?.message || errorData?.message || 'Failed to reset password';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2>Set New Password</h2>
          <p>Please enter your new password</p>
        </div>

        {isSuccess ? (
          <div className="text-center" style={{ padding: '2rem 0' }}>
            <div style={{ color: '#4caf50', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <p>Your password has been reset successfully!</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <input
                id="newPassword"
                type="password"
                className="form-control"
                placeholder="••••••••"
                aria-label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="8"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                placeholder="••••••••"
                aria-label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="8"
              />
            </div>

            <button type="submit" className="btn btn-primary auth-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
