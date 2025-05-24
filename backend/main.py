import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from anthropic import Anthropic
import json
import requests

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Claude client
client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
