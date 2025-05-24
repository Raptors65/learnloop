"use client";

import { useState } from 'react';
import InterestInput from '../components/InterestInput';
import LearningGraph from '../components/LearningGraph';

export default function Home() {
  const [interests, setInterests] = useState<string[]>([]);
  const [showGraph, setShowGraph] = useState(false);

  const handleInterestsSubmit = (selectedInterests: string[]) => {
    setInterests(selectedInterests);
    setShowGraph(true);
  };

  const handleBack = () => {
    setShowGraph(false);
    setInterests([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="p-6 border-b border-white/20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Learn<span className="text-blue-600">Loop</span>
          </h1>
          {showGraph && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Interests
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">
        {!showGraph ? (
          <InterestInput onSubmit={handleInterestsSubmit} />
        ) : (
          <LearningGraph initialInterests={interests} />
        )}
      </main>
    </div>
  );
}
