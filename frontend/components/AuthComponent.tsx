"use client";

import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface AuthComponentProps {
  children: React.ReactNode;
}

export default function AuthComponent({ children }: AuthComponentProps) {
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      try {
        if (isSignUp) {
          await signUpWithEmail(email, password);
          setError('Check your email for a confirmation link!');
        } else {
          await signInWithEmail(email, password);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Learn<span className="text-blue-600">Loop</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Turn yourself into a lifelong learner with interactive knowledge graphs and AI-powered conversations
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                  minLength={6}
                />
              </div>
              
              {error && (
                <div className={`text-sm p-3 rounded-lg ${error.includes('Check your email') 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
                }`}>
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mt-8">
            <div className="p-4">
              <div className="text-3xl mb-2">🧠</div>
              <h3 className="font-semibold text-gray-800">Interactive Learning</h3>
              <p className="text-sm text-gray-600">Build knowledge graphs and explore topics through AI conversations</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">💾</div>
              <h3 className="font-semibold text-gray-800">Progress Tracking</h3>
              <p className="text-sm text-gray-600">Your learning journey is automatically saved and synced</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🎙️</div>
              <h3 className="font-semibold text-gray-800">Voice Conversations</h3>
              <p className="text-sm text-gray-600">Engage in natural conversations about any topic</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}