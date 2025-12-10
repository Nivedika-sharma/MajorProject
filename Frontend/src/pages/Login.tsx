import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, saveOAuthLogin } = useAuth();
  const navigate = useNavigate();

  // ✅ Handle Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('googleToken');
    const profileData = params.get('profile');

    if (googleToken && profileData) {
      try {
        const profile = JSON.parse(profileData);
        saveOAuthLogin(googleToken, profile); // save token & profile in context
        navigate('/dashboard'); // redirect after login
      } catch (err) {
        console.error('Error parsing Google profile:', err);
      }
    }
  }, []);

  // Redirect user to Google OAuth login
  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/mail/google', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch (err) {
      console.error('Google login failed', err);
      setError('Google login failed. Try again.');
    }
  };

  // Handle normal email/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left info panel */}
        <div className="hidden md:flex flex-col items-center justify-center p-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl">
            <FileText className="w-32 h-32 text-blue-600 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Unified Document Intelligence System
            </h2>
            <p className="text-gray-600 text-lg">
              Streamline your document management and compliance workflows with AI-powered automation
            </p>
          </div>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your UDIS dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your.email@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg shadow-lg"
            >
              Continue with Google
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Secure enterprise authentication powered by UDIS
          </div>
        </div>
      </div>
    </div>
  );
}
