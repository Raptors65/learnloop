"use client";

interface Node {
  id: string;
  name: string;
  expanded?: boolean;
  notes?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  node: Node;
  onStartConversation: () => void;
  onViewNotes: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ContextMenu({ 
  x, 
  y, 
  node, 
  onStartConversation, 
  onViewNotes, 
  onDelete, 
  onClose 
}: ContextMenuProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-48"
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
        transform: 'translate(-50%, -10px)'
      }}
      onClick={handleClick}
    >
      <div className="px-4 py-2 border-b border-gray-100">
        <h4 className="font-semibold text-gray-800 truncate">{node.name}</h4>
      </div>
      
      <button
        onClick={onStartConversation}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
      >
        <span className="text-lg">🎙️</span>
        <span className="text-gray-700">Start Voice Conversation</span>
      </button>
      
      <button
        onClick={onViewNotes}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
      >
        <span className="text-lg">📝</span>
        <span className="text-gray-700">View Notes</span>
      </button>
      
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          onClick={onDelete}
          className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
        >
          <span className="text-lg">🗑️</span>
          <span>Delete Topic</span>
        </button>
      </div>
    </div>
  );
}