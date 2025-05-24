"use client";

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ContextMenu from './ContextMenu';
import VoiceConversation from './VoiceConversation';
import NotesModal from './NotesModal';
import AddTopicModal from './AddTopicModal';

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading learning graph...</p>
      </div>
    </div>
  )
});

interface GraphNode {
  id: string;
  name: string;
  color: string;
  size: number;
}

interface NodeMetadata {
  expanded: boolean;
  notes: string;
}

interface Link {
  source: string;
  target: string;
}

interface LearningGraphProps {
  initialInterests: string[];
}

export default function LearningGraph({ initialInterests }: LearningGraphProps) {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: Link[] }>({
    nodes: [],
    links: []
  });
  
  // Store node metadata separately to avoid breaking graph structure
  const [nodeMetadata, setNodeMetadata] = useState<Record<string, NodeMetadata>>({});
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId: string | null;
  }>({ visible: false, x: 0, y: 0, nodeId: null });
  
  const [voiceConversation, setVoiceConversation] = useState<{
    active: boolean;
    topic: string;
    nodeId: string | null;
  }>({ active: false, topic: '', nodeId: null });
  
  const [notesModal, setNotesModal] = useState<{
    visible: boolean;
    nodeId: string | null;
  }>({ visible: false, nodeId: null });
  
  const [addTopicModal, setAddTopicModal] = useState(false);
  
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedNode, setLastClickedNode] = useState<string | null>(null);

  // Initialize nodes from interests
  useEffect(() => {
    const initialNodes: GraphNode[] = initialInterests.map((interest, index) => ({
      id: `interest-${index}`,
      name: interest,
      color: '#8b5cf6',
      size: 5
    }));
    
    const initialMetadata: Record<string, NodeMetadata> = {};
    initialNodes.forEach(node => {
      initialMetadata[node.id] = {
        expanded: false,
        notes: ''
      };
    });
    
    setGraphData({ nodes: initialNodes, links: [] });
    setNodeMetadata(initialMetadata);
  }, [initialInterests]);

  const expandNode = useCallback(async (node: GraphNode) => {
    if (nodeMetadata[node.id]?.expanded) return;

    try {
      const response = await fetch('http://localhost:5001/api/generate-subtopics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parent_topic: node.name }),
      });

      if (!response.ok) throw new Error('Failed to generate subtopics');

      const data = await response.json();
      const subtopics = data.subtopics;

      // Generate unique IDs based on timestamp to avoid conflicts
      const timestamp = Date.now();
      
      // Create new nodes for subtopics
      const newNodes: GraphNode[] = subtopics.map((subtopic: string, index: number) => ({
        id: `${node.id}-sub-${timestamp}-${index}`,
        name: subtopic,
        color: '#3b82f6',
        size: 3
      }));

      // Create metadata for new nodes
      const newMetadata: Record<string, NodeMetadata> = {};
      newNodes.forEach(newNode => {
        newMetadata[newNode.id] = {
          expanded: false,
          notes: ''
        };
      });

      // Create links from parent to subtopics
      const newLinks: Link[] = subtopics.map((subtopic: string, index: number) => ({
        source: node.id,
        target: `${node.id}-sub-${timestamp}-${index}`
      }));

      // Update graph data
      setGraphData(prev => ({
        nodes: [...prev.nodes, ...newNodes],
        links: [...prev.links, ...newLinks]
      }));

      // Update metadata - mark parent as expanded and add new node metadata
      setNodeMetadata(prev => ({
        ...prev,
        [node.id]: { ...prev[node.id], expanded: true },
        ...newMetadata
      }));

    } catch (error) {
      console.error('Error expanding node:', error);
      alert('Failed to generate subtopics. Please try again.');
    }
  }, [nodeMetadata]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    if (timeDiff < 400 && lastClickedNode === node.id) {
      // Double click detected
      expandNode(node);
      setLastClickTime(0);
      setLastClickedNode(null);
    } else {
      // Single click
      setLastClickTime(currentTime);
      setLastClickedNode(node.id);
    }
  }, [expandNode, lastClickTime, lastClickedNode]);

  const handleNodeRightClick = useCallback((node: GraphNode, event: MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      nodeId: node.id
    });
  }, []);

  const handleStartConversation = (nodeId: string) => {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setVoiceConversation({
      active: true,
      topic: node.name,
      nodeId: node.id
    });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleViewNotes = (nodeId: string) => {
    setNotesModal({ visible: true, nodeId });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      links: prev.links.filter(l => l.source !== nodeId && l.target !== nodeId)
    }));
    
    // Remove metadata for deleted node
    setNodeMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata[nodeId];
      return newMetadata;
    });
    
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleSaveNotes = (nodeId: string, notes: string) => {
    setNodeMetadata(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], notes }
    }));
  };

  const handleVoiceConversationEnd = async (transcript: string) => {
    if (!voiceConversation.nodeId) return;
    
    try {
      // Generate notes from the conversation
      const response = await fetch('http://localhost:5001/api/summarize-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcript,
          parent_topic: voiceConversation.topic 
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        
        // Update the node metadata with generated notes
        const formattedNotes = `## Summary\n${analysis.summary.map((point: string) => `- ${point}`).join('\n')}\n\n## Key Points\n${analysis.key_points.map((point: string) => `- ${point}`).join('\n')}`;
        
        setNodeMetadata(prev => ({
          ...prev,
          [voiceConversation.nodeId!]: {
            ...prev[voiceConversation.nodeId!],
            notes: formattedNotes
          }
        }));

        // Create new nodes for suggested subtopics if any
        if (analysis.suggested_subtopics && analysis.suggested_subtopics.length > 0) {
          const timestamp = Date.now();
          const newNodes: GraphNode[] = analysis.suggested_subtopics.map((subtopic: string, index: number) => ({
            id: `${voiceConversation.nodeId}-voice-${timestamp}-${index}`,
            name: subtopic,
            color: '#10b981',
            size: 3
          }));

          // Create metadata for new nodes
          const newMetadata: Record<string, NodeMetadata> = {};
          newNodes.forEach(newNode => {
            newMetadata[newNode.id] = {
              expanded: false,
              notes: ''
            };
          });

          const newLinks: Link[] = analysis.suggested_subtopics.map((subtopic: string, index: number) => ({
            source: voiceConversation.nodeId!,
            target: `${voiceConversation.nodeId}-voice-${timestamp}-${index}`
          }));

          setGraphData(prev => ({
            nodes: [...prev.nodes, ...newNodes],
            links: [...prev.links, ...newLinks]
          }));

          // Add metadata for new nodes
          setNodeMetadata(prev => ({
            ...prev,
            ...newMetadata
          }));
        }
      }
    } catch (error) {
      console.error('Error processing conversation:', error);
    }

    setVoiceConversation({ active: false, topic: '', nodeId: null });
  };

  const handleAddTopics = (topics: string[]) => {
    const timestamp = Date.now();
    const newNodes: GraphNode[] = topics.map((topic, index) => ({
      id: `manual-${timestamp}-${index}`,
      name: topic,
      color: '#8b5cf6',
      size: 5
    }));

    const newMetadata: Record<string, NodeMetadata> = {};
    newNodes.forEach(node => {
      newMetadata[node.id] = {
        expanded: false,
        notes: ''
      };
    });

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...newNodes],
      links: prev.links
    }));

    setNodeMetadata(prev => ({
      ...prev,
      ...newMetadata
    }));
  };

  const handleBackgroundClick = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <div className="relative w-full h-screen" onClick={handleBackgroundClick}>
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h3 className="font-semibold text-gray-800 mb-2">How to use:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Double-click</strong> a node to expand it</li>
          <li>• <strong>Right-click</strong> for more options</li>
          <li>• <strong>Drag</strong> to move nodes around</li>
          <li>• <strong>Scroll</strong> to zoom in/out</li>
        </ul>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setAddTopicModal(true)}
        className="absolute bottom-6 right-6 z-10 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="Add new topics"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">+</span>
      </button>

      <div className="w-full h-full">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          nodeVal="size"
          linkColor={() => '#94a3b8'}
          linkWidth={2}
          onNodeClick={handleNodeClick}
          onNodeRightClick={handleNodeRightClick}
          backgroundColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.name;
            const nodeSize = node.size || 20;
            const fontSize = Math.max(11, Math.min(14, nodeSize * 0.6)) / globalScale;
            
            const displayText = label;
            
            // Draw node circle only
            ctx.fillStyle = node.color || '#8b5cf6';
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
            ctx.fill();
            
            // Draw white border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3/globalScale;
            ctx.stroke();
            
            // Draw label below the circle
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#1f2937';
            ctx.font = `bold ${fontSize}px Sans-Serif`;
            
            // Add white background for text readability
            const textMetrics = ctx.measureText(displayText);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;
            const padding = 4/globalScale;
            const textY = node.y + nodeSize + 8/globalScale;
            
            // Draw white background rectangle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(
              node.x - textWidth/2 - padding,
              textY - padding,
              textWidth + padding * 2,
              textHeight + padding * 2
            );
            
            // Draw border around text background
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1/globalScale;
            ctx.strokeRect(
              node.x - textWidth/2 - padding,
              textY - padding,
              textWidth + padding * 2,
              textHeight + padding * 2
            );
            
            // Draw the text
            ctx.fillStyle = '#1f2937';
            ctx.fillText(displayText, node.x, textY);
          }}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>

      {contextMenu.visible && contextMenu.nodeId && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={{
            id: contextMenu.nodeId,
            name: graphData.nodes.find(n => n.id === contextMenu.nodeId)?.name || '',
            notes: nodeMetadata[contextMenu.nodeId]?.notes || ''
          }}
          onStartConversation={() => handleStartConversation(contextMenu.nodeId!)}
          onViewNotes={() => handleViewNotes(contextMenu.nodeId!)}
          onDelete={() => handleDeleteNode(contextMenu.nodeId!)}
          onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        />
      )}

      {voiceConversation.active && (
        <VoiceConversation
          topic={voiceConversation.topic}
          onEnd={handleVoiceConversationEnd}
          onClose={() => setVoiceConversation({ active: false, topic: '', nodeId: null })}
        />
      )}

      {notesModal.visible && notesModal.nodeId && (
        <NotesModal
          node={{
            id: notesModal.nodeId,
            name: graphData.nodes.find(n => n.id === notesModal.nodeId)?.name || '',
            notes: nodeMetadata[notesModal.nodeId]?.notes || ''
          }}
          onSave={handleSaveNotes}
          onClose={() => setNotesModal({ visible: false, nodeId: null })}
        />
      )}

      {addTopicModal && (
        <AddTopicModal
          onAdd={handleAddTopics}
          onClose={() => setAddTopicModal(false)}
        />
      )}
    </div>
  );
}