import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerificationEmail } from '../services/authService';
import toast from 'react-hot-toast';
import './AuthPages.css';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const fromLogin = searchParams.get('fromLogin');
  
  const maskEmail = (emailStr) => {
    if (!emailStr) return '';
    const [local, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.substring(0, 2)}****${local.substring(local.length - 2)}@${domain}`;
  };
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('No email provided.');
      navigate('/login');
    } else if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.some(char => isNaN(char))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    
    // Focus last filled input
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const data = await verifyEmail(email, otpString);
      if (data.status) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(data.message || 'Verification failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed.');
      if (err.response?.data?.message?.includes('expired') || err.response?.data?.message?.includes('Maximum verification attempts')) {
        setOtp(['', '', '', '', '', '']);
        if(inputRefs.current[0]) inputRefs.current[0].focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    try {
      const data = await resendVerificationEmail(email);
      if (data.status) {
        toast.success(data.message || 'OTP resent successfully!');
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      } else {
        toast.error(data.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  if (isSuccess) {
    return (
      <div className="auth-container animate-fade-in">
        <div className="auth-card glass-panel text-center">
          <div style={{ 
            fontSize: '64px', 
            color: '#4CAF50', 
            marginBottom: '20px',
            animation: 'scale-in 0.5s ease-out'
          }}>
            ✓
          </div>
          <h2>Success!</h2>
          <p>Email verified successfully! Redirecting to Login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel text-center">
        <div className="auth-header">
          <h2>Verify Your Email</h2>
          <p style={{ marginBottom: '10px' }}>
            {fromLogin 
              ? "Your account isn't verified yet. We've sent you a new verification code." 
              : "We've sent a verification code to your email. Enter the 6-digit code below to continue."}
          </p>
          <p><strong>{maskEmail(email)}</strong></p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                name="otp"
                maxLength="1"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                aria-label={`Digit ${index + 1} of OTP`}
                style={{
                  width: '45px',
                  height: '55px',
                  fontSize: '24px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ffffff'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-btn" 
            disabled={isVerifying || otp.join('').length !== 6}
          >
            {isVerifying ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <p>
            Didn't receive the code?{' '}
            <button 
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              style={{
                background: 'none',
                border: 'none',
                color: countdown > 0 ? '#666' : '#fff',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                textDecoration: countdown > 0 ? 'none' : 'underline',
                padding: 0,
                font: 'inherit'
              }}
            >
              {isResending ? 'Sending...' : (countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP')}
            </button>
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/signup" style={{ color: '#ff9800', textDecoration: 'none', fontSize: '0.9rem' }}>
              Change Email Address
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
