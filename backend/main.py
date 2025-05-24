import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from anthropic import Anthropic
import json
import requests
from supabase import create_client, Client
from functools import wraps
import threading
import asyncio
import uuid

from dotenv import load_dotenv
load_dotenv()

# Import our topic news agent
from topic_news_agent import fetch_topic_news

app = Flask(__name__)
CORS(app)

# Initialize clients
client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

# Initialize Supabase client
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

def verify_token(f):
    """Decorator to verify Supabase JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header required'}), 401
        
        try:
            token = auth_header.split(' ')[1]  # Remove 'Bearer ' prefix
            
            # Verify the token with Supabase
            response = supabase.auth.get_user(token)
            if response.user:
                request.user_id = response.user.id
                return f(*args, **kwargs)
            else:
                return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            print(f"Auth error: {e}")
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated

def process_news_summary_background(summary_id: str, topics: list, user_id: str):
    """Background function to process news summary using MCP client"""
    async def async_process():
        try:
            # Update status to processing
            supabase.table('news_summaries').update({
                'status': 'processing'
            }).eq('id', summary_id).execute()
            
            # Fetch news using our MCP client
            result = await fetch_topic_news(topics)
            
            if 'error' in result:
                # Update with error
                supabase.table('news_summaries').update({
                    'status': 'failed',
                    'error_message': result['error']
                }).eq('id', summary_id).execute()
            else:
                # Update with successful results
                supabase.table('news_summaries').update({
                    'status': 'completed',
                    'summary_markdown': result['summary_markdown'],
                    'raw_results': result['raw_results']
                }).eq('id', summary_id).execute()
                
        except Exception as e:
            # Update with error
            supabase.table('news_summaries').update({
                'status': 'failed',
                'error_message': str(e)
            }).eq('id', summary_id).execute()
    
    def run_async():
        # Create a new event loop for this thread
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(async_process())
        finally:
            loop.close()
    
    # Start the background task
    thread = threading.Thread(target=run_async)
    thread.daemon = True
    thread.start()

@app.route('/api/topic-news', methods=['POST'])
@verify_token
def create_topic_news_summary():
    """Create a new topic news summary (starts background processing)"""
    try:
        data = request.get_json()
        topics = data.get('topics', [])
        
        if not topics or not isinstance(topics, list):
            return jsonify({'error': 'topics must be a non-empty array'}), 400
        
        # Create initial database record
        summary_id = str(uuid.uuid4())
        initial_record = {
            'id': summary_id,
            'user_id': request.user_id,
            'topics': topics,
            'summary_markdown': '',  # Will be updated by background process
            'status': 'pending'
        }
        
        supabase.table('news_summaries').insert(initial_record).execute()
        
        # Start background processing
        process_news_summary_background(summary_id, topics, request.user_id)
        
        return jsonify({
            'summary_id': summary_id,
            'status': 'pending',
            'message': 'News summary processing started. Check status using GET /api/topic-news/{summary_id}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/topic-news/<summary_id>', methods=['GET'])
@verify_token
def get_topic_news_summary(summary_id):
    """Get the status and results of a topic news summary"""
    try:
        response = supabase.table('news_summaries').select('*').eq('id', summary_id).eq('user_id', request.user_id).execute()
        
        if not response.data:
            return jsonify({'error': 'Summary not found'}), 404
        
        summary = response.data[0]
        return jsonify(summary)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/topic-news', methods=['GET'])
@verify_token
def list_topic_news_summaries():
    """List all topic news summaries for the authenticated user"""
    try:
        response = supabase.table('news_summaries').select('*').eq('user_id', request.user_id).order('created_at', desc=True).execute()
        return jsonify({'summaries': response.data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-subtopics', methods=['POST'])
def generate_subtopics():
    """Generate subtopics for a given parent topic"""
    try:
        data = request.get_json()
        parent_topic = data.get('parent_topic')
        
        if not parent_topic:
            return jsonify({'error': 'parent_topic is required'}), 400
        
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": f"""Generate exactly 3 interesting and diverse subtopics for the topic: "{parent_topic}"

Return your response as a JSON array of strings, where each string is a subtopic. The subtopics should be:
- Specific enough to be meaningful for learning
- Diverse to cover different aspects of the parent topic
- Engaging and suitable for someone wanting to learn more
- Concise; 2-3 words each

Example format: ["Subtopic 1", "Subtopic 2", "Subtopic 3"]

Only return the JSON array, no other text."""
            }]
        )
        
        # Parse the response as JSON
        subtopics = json.loads(message.content[0].text.strip())
        
        return jsonify({'subtopics': subtopics})
        
    except json.JSONDecodeError:
        return jsonify({'error': 'Failed to parse AI response'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summarize-conversation', methods=['POST'])
def summarize_conversation():
    """Summarize a conversation transcript and suggest new subtopics"""
    try:
        data = request.get_json()
        transcript = data.get('transcript')
        parent_topic = data.get('parent_topic')
        
        if not transcript or not parent_topic:
            return jsonify({'error': 'Both transcript and parent_topic are required'}), 400
        
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            messages=[{
                "role": "user",
                "content": f"""Please analyze this conversation transcript about "{parent_topic}" and create educational notes based on what was discussed:

Transcript:
{transcript}

Return your response as JSON with this structure:
{{
    "summary": ["Concise bullet point about {parent_topic}", "Another key insight", "Third important concept"],
    "key_points": ["Specific detail 1", "Specific detail 2", "Specific detail 3"],
    "suggested_subtopics": ["New subtopic 1", "New subtopic 2"]
}}

Guidelines:
- The "summary" should be 3-5 concise bullet points covering the main concepts about {parent_topic}
- Write as educational content, not conversation summary (avoid "we discussed")
- Each summary bullet should be 1-2 sentences max
- Key points should be more specific factual details
- Use Markdown formatting (e.g., **bold**, *italic*, `code`) inside each bullet pointwhere appropriate
- Suggested_subtopics should only include topics specifically mentioned that would be valuable as separate learning nodes
- If no new subtopics emerged, return an empty array

Only return the JSON, no other text."""
            }]
        )

        first_brace = message.content[0].text.strip().find('{')
        last_brace = message.content[0].text.strip().rfind('}')

        if first_brace == -1 or last_brace == -1:
            return jsonify({'error': 'Failed to parse AI response'}), 500

        analysis = json.loads(message.content[0].text.strip()[first_brace:last_brace+1])
        
        return jsonify(analysis)
        
    except json.JSONDecodeError:
        return jsonify({'error': 'Failed to parse AI response'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/session', methods=['POST'])
def create_voice_session():
    """Create OpenAI realtime session for voice conversation"""
    try:
        data = request.get_json()
        topic = data.get('topic', 'general learning')
        
        response = requests.post(
            "https://api.openai.com/v1/realtime/sessions",
            headers={
                "Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-realtime-preview-2024-12-17",
                "voice": "alloy",
                "instructions": f"""You are an engaging educational assistant teaching about {topic}. 

Your role:
- Start by giving an interesting 30-60 second overview of {topic}
- Speak in a conversational, podcast-like manner
- Speak quickly, like the podcast is at 2x speed
- Allow the user to interrupt with questions at any time
- Keep responses engaging but not too long (30-60 seconds each)
- If the user asks to explore a specific aspect, dive deeper into that area
- Encourage curiosity and questions

Remember: This is an interactive learning conversation, not a lecture. Be enthusiastic about the topic and make it accessible."""
            }
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to create session', 'details': response.text}), response.status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/topics', methods=['GET'])
@verify_token
def get_user_topics():
    """Get all topics for the authenticated user"""
    try:
        response = supabase.table('topics').select('*').eq('user_id', request.user_id).execute()
        topics = response.data
        
        # Get relationships
        relationships_response = supabase.table('topic_relationships').select('*').eq('user_id', request.user_id).execute()
        relationships = relationships_response.data
        
        return jsonify({
            'topics': topics,
            'relationships': relationships
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/topics', methods=['POST'])
@verify_token
def save_user_topics():
    """Save topics and relationships for the authenticated user"""
    try:
        data = request.get_json()
        topics = data.get('topics', [])
        relationships = data.get('relationships', [])
        
        # Use upsert instead of delete/insert to handle updates better
        topics_to_upsert = []
        for topic in topics:
            topics_to_upsert.append({
                'id': topic['id'],
                'user_id': request.user_id,
                'name': topic['name'],
                'color': topic['color'],
                'size': topic['size'],
                'expanded': topic.get('expanded', False),
                'notes': topic.get('notes', '')
            })
        
        if topics_to_upsert:
            # Clear existing topics first
            supabase.table('topics').delete().eq('user_id', request.user_id).execute()
            # Insert new topics
            supabase.table('topics').insert(topics_to_upsert).execute()
        
        # Handle relationships
        relationships_to_insert = []
        for rel in relationships:
            relationships_to_insert.append({
                'user_id': request.user_id,
                'source_topic_id': rel['source'],
                'target_topic_id': rel['target']
            })
        
        if relationships_to_insert:
            # Clear existing relationships first
            supabase.table('topic_relationships').delete().eq('user_id', request.user_id).execute()
            # Insert new relationships
            supabase.table('topic_relationships').insert(relationships_to_insert).execute()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Save error: {e}")
        print(f"Topics data: {topics}")
        print(f"Relationships data: {relationships}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
