"use client";

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { NewsSummary, createTopicNewsSummary, getTopicNewsSummary, listTopicNewsSummaries } from '../lib/api';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTopics: string[];
}

export default function NewsModal({ isOpen, onClose, availableTopics }: NewsModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<NewsSummary | null>(null);
  const [previousSummaries, setPreviousSummaries] = useState<NewsSummary[]>([]);
  const [error, setError] = useState<string>('');
  const [pollingSummaryId, setPollingSummaryId] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Load previous summaries when modal opens and initialize selected topics
  useEffect(() => {
    if (isOpen) {
      loadPreviousSummaries();
      // Initialize with all topics selected by default
      setSelectedTopics(availableTopics);
    }
  }, [isOpen, availableTopics]);

  // Poll for summary completion
  useEffect(() => {
    if (!pollingSummaryId) return;

    const interval = setInterval(async () => {
      try {
        const summary = await getTopicNewsSummary(pollingSummaryId);
        setCurrentSummary(summary);
        
        if (summary.status === 'completed' || summary.status === 'failed') {
          setPollingSummaryId('');
          setIsGenerating(false);
          loadPreviousSummaries(); // Refresh the list
        }
      } catch (error) {
        console.error('Error polling summary:', error);
        setError('Failed to check summary status');
        setPollingSummaryId('');
        setIsGenerating(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingSummaryId]);

  const loadPreviousSummaries = async () => {
    try {
      const data = await listTopicNewsSummaries();
      setPreviousSummaries(data.summaries);
    } catch (error) {
      console.error('Error loading summaries:', error);
    }
  };

  const handleGenerateNews = async () => {
    if (selectedTopics.length === 0) {
      setError('No topics available. Please add some interests to your learning graph first.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setCurrentSummary(null);

    try {
      const result = await createTopicNewsSummary(selectedTopics);
      setPollingSummaryId(result.summary_id);
      
      // Set initial summary state
      setCurrentSummary({
        id: result.summary_id,
        user_id: '',
        topics: selectedTopics,
        summary_markdown: '',
        status: 'pending',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating news:', error);
      setError('Failed to generate news summary');
      setIsGenerating(false);
    }
  };

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSelectAll = () => {
    setSelectedTopics(availableTopics);
  };

  const handleSelectNone = () => {
    setSelectedTopics([]);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Recent News & Developments</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Generate News Section */}
          <div className="mb-8">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Select Topics for News ({selectedTopics.length}/{availableTopics.length}):</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleSelectNone}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                  >
                    Select None
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {availableTopics.map((topic) => (
                  <label key={topic} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => handleTopicToggle(topic)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{topic}</span>
                  </label>
                ))}
              </div>
              
              {selectedTopics.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Selected topics:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTopics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateNews}
              disabled={isGenerating || selectedTopics.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating News...
                </>
              ) : (
                <>
                  📰 Generate Latest News
                  {selectedTopics.length > 0 && ` (${selectedTopics.length} topic${selectedTopics.length === 1 ? '' : 's'})`}
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Current Summary */}
          {currentSummary && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Current Summary</h3>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentSummary.status === 'completed' ? 'bg-green-100 text-green-800' :
                    currentSummary.status === 'failed' ? 'bg-red-100 text-red-800' :
                    currentSummary.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentSummary.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(currentSummary.created_at).toLocaleString()}
                  </span>
                </div>

                {currentSummary.status === 'completed' && currentSummary.summary_markdown && (
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-strong:text-gray-800 prose-ul:text-gray-700 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800">
                    <ReactMarkdown>{currentSummary.summary_markdown}</ReactMarkdown>
                  </div>
                )}

                {currentSummary.status === 'failed' && (
                  <div className="text-red-600">
                    Error: {currentSummary.error_message || 'Unknown error occurred'}
                  </div>
                )}

                {(currentSummary.status === 'pending' || currentSummary.status === 'processing') && (
                  <div className="text-gray-600">
                    {currentSummary.status === 'pending' ? 'Waiting to start...' : 'Researching topics and generating summary...'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Previous Summaries */}
          {previousSummaries.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Previous Summaries</h3>
              <div className="space-y-4">
                {previousSummaries.slice(0, 5).map((summary) => (
                  <div key={summary.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-wrap gap-1">
                        {summary.topics.map((topic, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(summary.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        summary.status === 'completed' ? 'bg-green-100 text-green-800' :
                        summary.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {summary.status}
                      </span>
                      
                      {summary.status === 'completed' && (
                        <button
                          onClick={() => setCurrentSummary(summary)}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          View Summary
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}