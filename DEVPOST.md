# LearnLoop

## Elevator Pitch
LearnLoop is an intelligent learning companion that dynamically builds and expands a visual map of your knowledge, using AI-powered conversations and automated research to help you explore and remember new topics.

## About the Project

### Inspiration
The inspiration for LearnLoop came from the desire to create a more personalized and adaptive learning experience. Traditional learning methods often present information linearly, without necessarily connecting to a user's existing knowledge or evolving with their understanding. I wanted to build a tool that acts like a personal tutor, understanding what you know, helping you explore related concepts, and remembering what you've learned.

### What it Does
LearnLoop helps users build a "second brain" by:

1.  **Visualizing Knowledge:** Users start by inputting their initial areas of interest. LearnLoop then creates a dynamic, interactive force-directed graph representing these topics.
2.  **Expanding Horizons:** Users can click on any topic node in their graph to get AI-generated subtopics, allowing them to dive deeper or explore related fields. This expansion is powered by an LLM (Anthropic's Claude Sonnet 4) that suggests relevant and diverse areas for further learning.
3.  **AI-Powered Conversations:** Users can engage in real-time voice conversations with an AI (OpenAI's GPT-4o Realtime Preview) about any topic in their graph. The system transcribes the conversation and then uses an LLM to summarize the key takeaways, automatically adding them as notes to the corresponding topic node. This allows for a natural way to explore and capture insights.
4.  **Automated Research:** For any topic, users can request "Recent News." An AI agent (using GPT-4.1 Nano and the `dex-mcp` browser automation tool) scours the web for recent articles, research papers, and developments related to that topic, presenting a concise markdown summary with sources. This keeps the user's knowledge current.
5.  **Personalized Memory:** All graph structures, expanded subtopics, and notes (including conversation summaries) are saved to a Supabase database. When a user returns, their personalized learning graph is exactly as they left it, allowing them to pick up where they left off and see their knowledge evolve over time. User preferences (the topics they choose to explore, the notes they take) directly shape the system's behavior and the information it presents.

### How I Built It
-   **Frontend:** A Next.js (React) single-page application provides the user interface, including the interactive learning graph (using `react-force-graph-2d`), user authentication (Supabase Auth), and components for interest input, news display, and voice conversations.
-   **Backend:** A Flask (Python) application serves several API endpoints:
    -   Manages user data (topics, graph structure, notes) stored in a Supabase PostgreSQL database.
    -   Handles user authentication via Supabase.
    -   Integrates with Anthropic's API for subtopic generation and conversation summarization.
    -   Includes a `topic_news_agent` that uses the `dex-mcp` browser automation framework to perform web research.
-   **`dex-mcp` (Dex Model Context Protocol):** This submodule is a Python server that allows an AI agent to control a web browser via the Dex browser extension. It's used by the `topic_news_agent` to navigate websites, extract information, and perform searches.
-   **Voice Integration:** The frontend directly integrates with OpenAI's real-time voice API for the conversational learning feature, using WebRTC for low-latency audio streaming.

### Challenges I Ran Into
-   **Real-time Voice Integration:** Setting up the WebRTC connection for real-time, low-latency voice communication with the OpenAI API was complex, requiring careful handling of SDP offers/answers and data channels.
-   **Agentic Web Research:** Getting the `dex-mcp` browser automation to reliably navigate various websites and extract relevant information for the "Recent News" feature required significant prompt engineering and iteration on the agent's instructions.
-   **State Management for Graph:** Synchronizing the state of the interactive graph (node positions, expansions, metadata) with the backend database while ensuring a smooth user experience was challenging.

### Accomplishments That I'm Proud Of
-   **Seamless Integration of Multiple AI Services:** LearnLoop successfully combines LLMs from Anthropic (subtopics, summarization) and OpenAI (voice conversations, research agent) with a browser automation tool to create a cohesive and powerful learning experience.
-   **Personalized Knowledge Graph:** The core concept of a dynamically expanding visual knowledge graph that learns from user interactions and preferences truly came to life. The system adapts to the user, not the other way around.
-   **Voice as a Learning Interface:** Integrating voice conversations as a primary way to explore topics and automatically capturing the essence of those conversations as notes feels like a very natural and effective way to learn.

### What I Learned
-   **The Power of Agentic Systems:** Building the `topic_news_agent` demonstrated how much can be achieved by giving LLMs tools to interact with the digital world (like a browser).
-   **Complexity of Real-time AI:** Implementing the real-time voice feature highlighted the engineering effort required for truly interactive AI experiences beyond simple request-response patterns.
-   **Importance of User-State Persistence:** For a system that aims to "remember" and "personalize," robustly saving and loading user state is critical. Supabase proved to be an excellent tool for this.

### What's Next for LearnLoop
-   **Smarter Subtopic Suggestions:** Improve subtopic generation by considering the user's existing graph and notes to suggest more contextually relevant expansions.
-   **Proactive Learning Prompts:** Have LearnLoop proactively suggest new connections or areas to explore based on patterns in the user's graph and recent news.
-   **Collaborative Learning Graphs:** Allow users to share parts of their graphs or collaborate on building knowledge maps.
-   **Deeper Content Integration:** Beyond summaries, allow agents to extract and integrate more structured data from web sources directly into the graph.

## Built With
-   **Languages:** Python (Backend, `dex-mcp`), TypeScript (Frontend)
-   **Frameworks/Libraries:**
    -   **Frontend:** Next.js, React, `react-force-graph-2d`, Tailwind CSS
    -   **Backend:** Flask, `agents` library (for MCP integration)
-   **AI/ML:**
    -   Anthropic Claude Sonnet 4 (Subtopic generation, conversation summarization)
    -   OpenAI GPT-4o Realtime Preview (Voice conversations)
    -   OpenAI GPT-4.1 Nano (Research agent via `dex-mcp`)
-   **Browser Automation:** `dex-mcp` server and Dex Chrome Extension
-   **Database & Auth:** Supabase (PostgreSQL, Auth)
-   **Voice Technology:** WebRTC, OpenAI Realtime Voice API
-   **Deployment/Hosting (Conceptual):** Vercel (Frontend), PythonAnywhere/Fly.io (Backend) - (though run locally for development) 