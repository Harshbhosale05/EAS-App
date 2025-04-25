import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../utils/authUtils';
import Header from '../components/Header';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setSuccess(result.message);
        setEmail(''); // Clear the form
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Reset Password" 
        showBackButton={true}
        showLogout={false}
      />
      
      <main className="max-w-4xl mx-auto p-6 flex flex-col">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Your Password</h1>
          <p className="text-gray-600">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Sent!</h2>
              <p className="text-gray-600 mb-6">{success}</p>
              <p className="text-sm text-gray-500 mb-6">
                If you don't see the email, please check your spam folder.
              </p>
              <Link to="/signin" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center">
                <ArrowLeft size={16} className="mr-2" />
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 flex items-start">
                  <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-3 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white shadow-sm flex items-center justify-center bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <span className="animate-spin h-5 w-5 mr-2 border-b-2 border-white rounded-full"></span>
                ) : (
                  <Mail size={18} className="mr-2" />
                )}
                Send Reset Link
              </button>
              
              <div className="text-center pt-4">
                <Link to="/signin" className="text-blue-600 hover:text-blue-800 text-sm">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword; 