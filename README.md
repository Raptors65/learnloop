# LearnLoop

LearnLoop is an intelligent learning companion that dynamically builds and expands a visual map of your knowledge, using AI-powered conversations and automated research to help you explore and remember new topics.

## Features

- **Interactive Knowledge Graph**: Visualize and expand your learning topics through an interactive force-directed graph
- **AI-Powered Voice Conversations**: Engage in real-time voice conversations about any topic
- **Automated Research**: Get recent news and developments about your topics of interest
- **Personalized Learning**: Your learning graph evolves based on your interests and interactions
- **Persistent Memory**: All your learning progress is saved and can be accessed anytime

## Prerequisites

- Python 3.9+
- Node.js 18+
- Chrome browser (for Dex extension)
- Supabase account
- Anthropic API key
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/learnloop.git
cd learnloop
```

2. Set up the backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Install the Dex Chrome extension:
   - Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/dex/ignaljemchdlmoimaliinmonecgbdnkk)
   - Install the extension
   - Use Command+J (Mac) to activate Dex

5. Set up environment variables:

Create `.env` files in both `backend` and `frontend` directories:

Backend `.env`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

Frontend `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Application

1. Start the backend server:
```bash
cd backend
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python main.py
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Start the Dex MCP server:
```bash
cd dex-mcp
python main.py
```

The application will be available at `http://localhost:3000`

## Project Structure

```
learnloop/
├── backend/           # Flask backend server
├── frontend/         # Next.js frontend application
├── dex-mcp/         # Browser automation server
└── README.md        # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude API
- [OpenAI](https://openai.com/) for GPT-4 and voice API
- [Supabase](https://supabase.com/) for database and authentication
- [Dex](https://github.com/dex-ai/dex) for browser automation 