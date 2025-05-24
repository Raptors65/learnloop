"use client";

import { useState } from 'react';

interface AddTopicModalProps {
  onAdd: (topics: string[]) => void;
  onClose: () => void;
}

const POPULAR_INTERESTS = [
  'Artificial Intelligence',
  'Biochemistry',
  'Astronomy',
  'Psychology',
  'Climate Science',
  'Philosophy',
  'Quantum Physics',
  'Neuroscience',
  'Economics',
  'Genetics',
  'History',
  'Literature',
  'Mathematics',
  'Photography',
  'Music Theory',
  'Cooking',
  'Architecture',
  'Linguistics'
];

export default function AddTopicModal({ onAdd, onClose }: AddTopicModalProps) {
  const [customTopic, setCustomTopic] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const handleToggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleAddCustom = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
      setSelectedTopics(prev => [...prev, customTopic.trim()]);
      setCustomTopic('');
    }
  };

  const handleSubmit = () => {
    if (selectedTopics.length > 0) {
      onAdd(selectedTopics);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add New Topics</h2>
            <p className="text-sm text-gray-600">Choose from popular topics or add your own</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Custom Topic Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Custom Topic
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Enter a topic you're interested in..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
              />
              <button
                onClick={handleAddCustom}
                disabled={!customTopic.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected Topics */}
          {selectedTopics.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Topics ({selectedTopics.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTopics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {topic}
                    <button
                      onClick={() => handleToggleTopic(topic)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Popular Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Popular Topics
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_INTERESTS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleToggleTopic(topic)}
                  className={`p-3 text-sm text-left rounded-lg border transition-colors ${
                    selectedTopics.includes(topic)
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedTopics.length === 0}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedTopics.length} Topic{selectedTopics.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}