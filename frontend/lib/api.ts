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
    
    // Clean nodes - only keep the properties we need
    const cleanTopics = nodes.map(node => ({
      id: node.id,
      name: node.name,
      color: node.color,
      size: node.size,
      expanded: metadata[node.id]?.expanded || false,
      notes: metadata[node.id]?.notes || ''
    }));

    // Clean links - only keep source and target IDs
    const cleanLinks = links.map(link => ({
      source: typeof link.source === 'object' ? link.source.id : link.source,
      target: typeof link.target === 'object' ? link.target.id : link.target
    }));

    const response = await fetch('http://localhost:5001/api/user/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        topics: cleanTopics,
        relationships: cleanLinks
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