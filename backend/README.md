# LearnLoop Backend

This is the backend server for LearnLoop, built with Flask and Python. It provides API endpoints for user authentication, topic management, news research, and conversation summarization.

## Features

- User authentication via Supabase
- Topic news research using AI agents and browser automation
- Conversation summarization with Claude
- Subtopic generation
- Graph data persistence

## Prerequisites

- Python 3.9+
- Supabase account
- Anthropic API key
- OpenAI API key

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your credentials:
```
ANTHROPIC_API_KEY=your_anthropic_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Running the Server

```bash
python main.py
```

The server will start on `http://localhost:5001`

## API Endpoints

### Authentication
- `POST /api/session` - Create a new voice session
- All authenticated endpoints require a valid Supabase JWT token in the Authorization header

### Topics
- `GET /api/user/topics` - Get user's saved topics
- `POST /api/user/topics` - Save user's topics
- `POST /api/generate-subtopics` - Generate subtopics for a given topic

### News
- `POST /api/topic-news` - Create a new topic news summary
- `GET /api/topic-news/<summary_id>` - Get a specific news summary
- `GET /api/topic-news` - List all news summaries for the user

### Conversations
- `POST /api/summarize-conversation` - Summarize a voice conversation

## Project Structure

```
backend/
├── main.py              # Main Flask application
├── topic_news_agent.py  # News research agent
├── database.sql         # Database schema
└── requirements.txt     # Python dependencies
```

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:
- `news_summaries`: Stores news research results
- `user_topics`: Stores user's topic preferences
- `conversation_summaries`: Stores voice conversation summaries

## Development

To run tests:
```bash
python -m pytest
```

## Deployment

The backend can be deployed to any Python-compatible hosting service like PythonAnywhere or Fly.io. Make sure to:
1. Set up all environment variables
2. Configure CORS for your frontend domain
3. Set up SSL/TLS for secure connections
