import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { verifyEmail, extractActionCodeFromURL } from '../utils/authUtils';
import Header from '../components/Header';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  // Verify the email with Firebase when component mounts
  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        // Get the full URL
        const fullUrl = window.location.href;
        
        // Extract the action code and mode
        const { mode, oobCode } = extractActionCodeFromURL(fullUrl);
        
        if (!oobCode || mode !== 'verifyEmail') {
          setError('Invalid verification link. Please request a new one.');
          setLoading(false);
          return;
        }
        
        // Verify the email with Firebase
        const result = await verifyEmail(oobCode);
        
        if (result.success) {
          setSuccess(result.message);
          setLoading(false);
          
          // Redirect to sign in after a delay
          setTimeout(() => {
            navigate('/signin');
          }, 5000);
        } else {
          setError(result.error || 'Failed to verify email. Please try again.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error verifying email:', err);
        setError('Failed to verify email. Please try again.');
        setLoading(false);
      }
    };
    
    verifyUserEmail();
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Verify Email" 
        showBackButton={false}
        showLogout={false}
      />
      
      <main className="max-w-4xl mx-auto p-6 flex flex-col">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Email Verification</h1>
          <p className="text-gray-600">
            We're verifying your email address
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{success}</p>
              <p className="text-gray-500">Redirecting to sign in page...</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/signin')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center mx-auto"
              >
                <Mail size={18} className="mr-2" />
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail; 