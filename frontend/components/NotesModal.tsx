"use client";

import { useState, useEffect } from 'react';

interface Node {
  id: string;
  name: string;
  notes?: string;
}

interface NotesModalProps {
  node: Node;
  onSave: (nodeId: string, notes: string) => void;
  onClose: () => void;
}

export default function NotesModal({ node, onSave, onClose }: NotesModalProps) {
  const [notes, setNotes] = useState(node.notes || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setNotes(node.notes || '');
  }, [node.notes]);

  const handleSave = () => {
    onSave(node.id, notes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNotes(node.notes || '');
    setIsEditing(false);
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
            <h2 className="text-xl font-bold text-gray-800">Notes</h2>
            <p className="text-sm text-gray-600">{node.name}</p>
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
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-full min-h-[300px] p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              placeholder={`Add your notes about ${node.name}...`}
              autoFocus
            />
          ) : (
            <div className="min-h-[300px]">
              {notes ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                    {notes}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">📝</div>
                  <p className="text-gray-500">No notes available for this topic yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start a voice conversation or add notes manually.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {notes.length} characters
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit Notes
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}