import React, { useState } from "react";
import { AlertCircle, Shield, CheckCircle, Heart, Clock, Globe } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../utils/authUtils";
import Header from "../components/Header";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous messages
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(email, password);
      
      if (result.success) {
        setSuccess(result.message);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        // Wait a moment before redirecting to signin
        setTimeout(() => {
          navigate("/signin");
        }, 5000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Create Account" 
        showBackButton={true}
        showLogout={false}
      />
      
      <main className="max-w-4xl mx-auto p-6 flex flex-col">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sahyatri</h1>
          <p className="text-gray-600 mb-4">Your reliable safety companion for every journey</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center">
              <Clock className="text-blue-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800">24/7 Monitoring</h3>
              <p className="text-sm text-gray-600 text-center">Continuous protection, always active</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col items-center">
              <Shield className="text-purple-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800">Prioritized Safety</h3>
              <p className="text-sm text-gray-600 text-center">Your security is our only mission</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col items-center">
              <Globe className="text-green-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800">Always Connected</h3>
              <p className="text-sm text-gray-600 text-center">Never feel alone, wherever you go</p>
            </div>
          </div>
        </div>
        
        {/* Sign Up Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Email Sent!</h2>
              <p className="text-gray-600 mb-6">{success}</p>
              <p className="text-gray-500">Redirecting to sign in page...</p>
              <p className="mt-4 text-blue-600 font-medium">
                Welcome to AlertMate- where your safety is our priority!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
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
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <Shield size={18} className="text-blue-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700 font-medium">
                    Your safety is our commitment
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    By creating an account, you're taking a proactive step toward enhanced safety. 
                    Sahyatri is dedicated to keeping you secure and empowered, especially for women on the move.
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                By creating an account, you agree to our <Link to="/terms" className="text-blue-600">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600">Privacy Policy</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white shadow-sm flex items-center justify-center bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <span className="animate-spin h-5 w-5 mr-2 border-b-2 border-white rounded-full"></span>
                ) : (
                  <Shield size={18} className="mr-2" />
                )}
                Join Sahyatri
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="text-blue-600 font-medium hover:text-blue-800">
                Sign In
              </Link>
            </p>
          </div>
        </div>
        
        <div className="bg-purple-50 p-5 rounded-lg border border-purple-100 mb-8 max-w-2xl mx-auto">
          <div className="flex items-start">
            <Heart className="text-purple-600 mr-3 flex-shrink-0 mt-1" size={22} />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">A Special Note for Women</h3>
              <p className="text-sm text-gray-600">
                At Sahyatri, we understand the unique safety concerns women face. 
                Our platform was designed with you in mind, providing real-time monitoring, 
                quick emergency responses, and a community of guardians who care. 
                Your independence matters, and we're here to support it.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;
