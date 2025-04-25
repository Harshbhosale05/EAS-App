import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { verifyPasswordReset, confirmResetPassword, extractActionCodeFromURL } from '../utils/authUtils';
import Header from '../components/Header';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [actionCode, setActionCode] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract and verify the action code from the URL on component mount
  useEffect(() => {
    const verifyCode = async () => {
      try {
        // Get the full URL
        const fullUrl = window.location.href;
        
        // Extract the action code and mode
        const { mode, oobCode } = extractActionCodeFromURL(fullUrl);
        
        if (!oobCode || mode !== 'resetPassword') {
          setError('Invalid password reset link. Please request a new one.');
          setLoading(false);
          return;
        }
        
        setActionCode(oobCode);
        
        // Verify the code with Firebase
        const result = await verifyPasswordReset(oobCode);
        
        if (result.success) {
          setEmail(result.email);
          setLoading(false);
        } else {
          setError(result.error || 'Invalid or expired password reset link. Please request a new one.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error verifying reset code:', err);
        setError('Invalid or expired password reset link. Please request a new one.');
        setLoading(false);
      }
    };
    
    verifyCode();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setVerifying(true);
    setError('');
    
    try {
      const result = await confirmResetPassword(actionCode, password);
      
      if (result.success) {
        setSuccess(result.message);
        // Clear form
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to sign in after a delay
        setTimeout(() => {
          navigate('/signin');
        }, 5000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setVerifying(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Reset Password" 
        showBackButton={false}
        showLogout={false}
      />
      
      <main className="max-w-4xl mx-auto p-6 flex flex-col">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Password</h1>
          <p className="text-gray-600">
            {email ? `For your account ${email}` : 'Please set your new password'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-6">{success}</p>
              <p className="text-gray-500">Redirecting to sign in page...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Link Invalid</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Request New Reset Link
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Create a new password"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-3 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3 rounded-lg font-medium text-white shadow-sm flex items-center justify-center bg-blue-600 hover:bg-blue-700"
              >
                {verifying ? (
                  <span className="animate-spin h-5 w-5 mr-2 border-b-2 border-white rounded-full"></span>
                ) : (
                  <Lock size={18} className="mr-2" />
                )}
                Reset Password
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPassword; 