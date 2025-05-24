import { supabase } from './supabase';

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

export async function saveUserData(
  nodes: GraphNode[],
  metadata: Record<string, NodeMetadata>,
  links: Link[]
) {
  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session');
    }
    
    // Combine nodes with metadata for backend
    const topics = nodes.map(node => ({
      ...node,
      expanded: metadata[node.id]?.expanded || false,
      notes: metadata[node.id]?.notes || ''
    }));

    const response = await fetch('http://localhost:5001/api/user/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        topics,
        relationships: links
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to save data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}

export async function loadUserData() {
  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session');
    }

    const response = await fetch('http://localhost:5001/api/user/topics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Convert back to frontend format
    const nodes: GraphNode[] = data.topics.map((topic: any) => ({
      id: topic.id,
      name: topic.name,
      color: topic.color,
      size: topic.size
    }));

    const metadata: Record<string, NodeMetadata> = {};
    data.topics.forEach((topic: any) => {
      metadata[topic.id] = {
        expanded: topic.expanded,
        notes: topic.notes
      };
    });

    const links: Link[] = data.relationships.map((rel: any) => ({
      source: rel.source_topic_id,
      target: rel.target_topic_id
    }));

    return { nodes, metadata, links };
  } catch (error) {
    console.error('Error loading user data:', error);
    throw error;
  }
}