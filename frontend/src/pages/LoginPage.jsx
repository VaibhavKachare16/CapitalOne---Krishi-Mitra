import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    aadharNumber: '',
    otp: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateAadhar = (aadhar) => {
    // Remove spaces and check if it's 12 digits
    const cleanAadhar = aadhar.replace(/\s/g, '');
    return /^\d{12}$/.test(cleanAadhar);
  };

  const validateOTP = (otp) => {
    return /^\d{6}$/.test(otp);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.aadharNumber) {
      newErrors.aadharNumber = 'Aadhar number is required';
    } else if (!validateAadhar(formData.aadharNumber)) {
      newErrors.aadharNumber = 'Please enter a valid 12-digit Aadhar number';
    }
    
    if (otpSent && !formData.otp) {
      newErrors.otp = 'OTP is required';
    } else if (otpSent && !validateOTP(formData.otp)) {
      newErrors.otp = 'Please enter a valid 6-digit OTP';
    }
    
    return newErrors;
  };

  const handleSendOTP = async () => {
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      // Simulate OTP sending
      setTimeout(() => {
        setIsLoading(false);
        setOtpSent(true);
        console.log('OTP sent to Aadhar:', formData.aadharNumber);
      }, 2000);
    } else {
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      // Simulate login verification
      setTimeout(() => {
        setIsLoading(false);
        login({ aadharNumber: formData.aadharNumber.replace(/\s/g, '') });
        navigate('/shc');
      }, 2000);
    } else {
      setErrors(newErrors);
    }
  };

  const formatAadhar = (value) => {
    // Format Aadhar number as XXXX XXXX XXXX
    const cleanValue = value.replace(/\s/g, '');
    const formatted = cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  return (
    <div className="login-page">
      <video className="login-video" autoPlay loop muted playsInline>
          <source src="/main-video.mp4" type="video/mp4" />
        </video>
      <div className="login-left">
        <div className="login-container">
          <div className="login-header">
            <Link to="/" className="back-link">
              <span className="back-arrow">←</span>
              Back to Home
            </Link>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="logo-section">
                <span className="logo-icon">🌱</span>
                <h1>Welcome to Krishi Mitra</h1>
                <p>Login with your Aadhar number</p>
              </div>
              <br />
              <label htmlFor="aadharNumber">Aadhar Number</label>
              <input
                type="text"
                id="aadharNumber"
                name="aadharNumber"
                value={formatAadhar(formData.aadharNumber)}
                onChange={handleChange}
                className={errors.aadharNumber ? 'error' : ''}
                placeholder="Enter your 12-digit Aadhar number"
                maxLength="14"
                disabled={otpSent}
              />
              {errors.aadharNumber && <span className="error-message">{errors.aadharNumber}</span>}
            </div>

            {!otpSent ? (
              <button 
                type="button" 
                onClick={handleSendOTP}
                className={`submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="otp">OTP</label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    className={errors.otp ? 'error' : ''}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                  />
                  {errors.otp && <span className="error-message">{errors.otp}</span>}
                </div>

                <div className="otp-info">
                  <p>OTP sent to your registered mobile number</p>
                  <button 
                    type="button" 
                    className="resend-btn"
                    onClick={handleSendOTP}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                </div>

                <button 
                  type="submit" 
                  className={`submit-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </>
            )}
          </form>

          <div className="login-info">
            <p className="info-text">
              Your Aadhar number is used for secure authentication and to provide personalized farming services.
            </p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-video-overlay"></div>
        <div className="login-advice-card">
          <div className="advice-header">
            <span className="advice-icon">🔐</span>
            <h3>Aadhar-based Login</h3>
          </div>
          <p className="advice-text">
            Use your 12-digit Aadhar number to sign in securely. We verify with a one-time password (OTP).
          </p>
          <ul className="advice-list">
            <li><strong>Enter Aadhar</strong>: Ensure it’s exactly 12 digits.</li>
            <li><strong>Receive OTP</strong>: Sent to your registered mobile number.</li>
            <li><strong>Verify OTP</strong>: Enter within 5 minutes for secure access.</li>
            <li><strong>Privacy</strong>: OTPs are single‑use and auto‑expire.</li>
          </ul>
          <div className="advice-note">
            <span>Tip:</span> If you don’t get the OTP, wait a moment and tap “Resend OTP”.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
