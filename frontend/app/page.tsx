"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import AuthComponent from '../components/AuthComponent';
import InterestInput from '../components/InterestInput';
import LearningGraph from '../components/LearningGraph';
import NewsModal from '../components/NewsModal';
import { loadUserData } from '../lib/api';

function HomePage() {
  const { user, signOut } = useAuth();
  const [interests, setInterests] = useState<string[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  const [isCheckingExistingData, setIsCheckingExistingData] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [userTopics, setUserTopics] = useState<string[]>([]);

  const handleInterestsSubmit = (selectedInterests: string[]) => {
    setInterests(selectedInterests);
    setUserTopics(selectedInterests);
    setShowGraph(true);
  };

  const handleBack = () => {
    setShowGraph(false);
    setInterests([]);
  };

  // Check if user has existing data when they sign in
  useEffect(() => {
    const checkExistingData = async () => {
      if (!user) {
        setIsCheckingExistingData(false);
        return;
      }

      try {
        const userData = await loadUserData();
        if (userData.nodes.length > 0) {
          // User has existing data, go straight to graph
          setHasExistingData(true);
          setShowGraph(true);
          // Extract topic names for news functionality
          setUserTopics(userData.nodes.map(node => node.name));
        }
      } catch (error) {
        console.error('Error checking existing data:', error);
        // If error loading, show interest input (new user flow)
      } finally {
        setIsCheckingExistingData(false);
      }
    };

    checkExistingData();
  }, [user]);

  // Refresh user topics when news modal opens (in case graph was updated)
  const handleNewsClick = async () => {
    if (user) {
      try {
        const userData = await loadUserData();
        setUserTopics(userData.nodes.map(node => node.name));
      } catch (error) {
        console.error('Error refreshing topics:', error);
      }
    }
    setNewsModalOpen(true);
  };

  if (isCheckingExistingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading your learning graph...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="p-6 border-b border-white/20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Learn<span className="text-blue-600">Loop</span>
          </h1>
          <div className="flex items-center gap-4">
            {showGraph && (
              <>
                <button
                  onClick={handleNewsClick}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  📰 Recent News
                </button>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Back to Interests
                </button>
              </>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {!showGraph ? (
          <InterestInput onSubmit={handleInterestsSubmit} />
        ) : (
          <LearningGraph initialInterests={interests} skipInitialLoad={hasExistingData} />
        )}
      </main>

      {/* News Modal */}
      <NewsModal 
        isOpen={newsModalOpen} 
        onClose={() => setNewsModalOpen(false)} 
        availableTopics={userTopics} 
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthComponent>
      <HomePage />
    </AuthComponent>
  );
}
