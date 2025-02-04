import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebase";
import { AiOutlineAlert } from "react-icons/ai"; 


const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess("Signed in successfully!");
      navigate("/contacts"); // Redirect to contacts page
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md p-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
        <AiOutlineAlert className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Alertmate User Portal</h1>
          <p className="text-gray-500 mt-2">Sign in to access your account</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error and Success Messages */}
            {error && (
              <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-600 bg-green-100 p-2 rounded">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign Up
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Protected by Alertmate </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span>•</span>
            <a href="#" className="hover:text-gray-700">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700">
              Terms of Service
            </a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700">
              Help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
