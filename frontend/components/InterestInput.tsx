"use client";

import { useState } from 'react';

interface InterestInputProps {
  onSubmit: (interests: string[]) => void;
}

const POPULAR_INTERESTS = [
  'Artificial Intelligence',
  'Biochemistry',
  'Astronomy',
  'Climate Science',
  'Psychology',
  'Quantum Physics',
  'Philosophy',
  'History',
  'Music Theory',
  'Computer Science',
  'Biology',
  'Economics',
  'Art History',
  'Literature',
  'Mathematics'
];

export default function InterestInput({ onSubmit }: InterestInputProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const handleSubmit = () => {
    if (selectedInterests.length > 0) {
      onSubmit(selectedInterests);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          What do you want to learn?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select your interests to create your personalized learning graph. 
          You can always add more topics later as you explore.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Popular Interests</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {POPULAR_INTERESTS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                selectedInterests.includes(interest)
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Custom Interest</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
              placeholder="Enter a topic you're interested in..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addCustomInterest}
              disabled={!customInterest.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {selectedInterests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Selected Interests ({selectedInterests.length})
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedInterests.map((interest) => (
              <div
                key={interest}
                className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm"
              >
                <span>{interest}</span>
                <button
                  onClick={() => removeInterest(interest)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={selectedInterests.length === 0}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:scale-105"
        >
          Create Learning Graph →
        </button>
      </div>
    </div>
  );
}