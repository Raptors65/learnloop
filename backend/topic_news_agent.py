import asyncio
import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
from datetime import datetime

from agents import Agent, Runner, enable_verbose_stdout_logging, gen_trace_id, trace
from agents.mcp import MCPServerSse
from agents.model_settings import ModelSettings

load_dotenv()

enable_verbose_stdout_logging()


async def fetch_topic_news(topics: List[str]) -> Dict[str, Any]:
    """
    Fetch recent news and developments for given topics using the dex-mcp server.
    
    Args:
        topics: List of topic strings (e.g., ["computer science", "biology", "AI"])
        
    Returns:
        Dictionary containing:
        - summary_markdown: Formatted summary of findings
        - raw_results: Raw results from the browser automation
        - error: Error message if something went wrong
    """
    try:
        # Connect to the dex-mcp server via SSE
        async with MCPServerSse(
            name="Dex MCP Server",
            params={
                "url": "http://localhost:8000/sse",
                "timeout": 20
            },
            client_session_timeout_seconds=5,
        ) as server:
            
            # Create an agent with access to browser automation tools
            agent = Agent(
                name="NewsResearchAgent",
                instructions=f"""You are a research assistant that finds recent news and developments about specific topics.

Your task is to search for and summarize recent news, research papers, and developments related to these topics: {', '.join(topics)}

Process:
1. For each topic, search for recent news and developments
2. Look for authoritative sources like research journals, tech news sites, university announcements
3. Focus on developments from the last 1-3 months when possible
4. Gather interesting links and sources

Important guidelines:
- Use search engines effectively to find recent content
- Visit and analyze multiple sources for each topic
- Look for credible, authoritative sources
- Capture both the content summary and source URLs
- Be thorough but efficient in your research

Return your findings in a structured format that includes summaries and source links.""",
                mcp_servers=[server],
                model_settings=ModelSettings(tool_choice="auto"),
                model="gpt-4.1-nano",
            )

            # Generate a query that combines all topics for efficient research
            topics_query = " OR ".join([f'"{topic}" recent news developments' for topic in topics])
            research_prompt = f"""Research recent news and developments for these topics: {', '.join(topics)}

Please search for and summarize recent developments in each of these areas:
{chr(10).join([f"- {topic}" for topic in topics])}

For each topic, find:
1. Recent news articles or announcements (last 1-3 months)
2. Research papers or academic developments
3. Industry developments or breakthroughs
4. Interesting resources or tools

Structure your response as a markdown summary with:
- A brief overview for each topic
- Key recent developments
- Links to interesting articles/resources
- Any notable trends or connections between topics

Focus on finding credible, recent sources and provide the URLs for further reading.

To aid in your search, note that the current date is {datetime.now().strftime("%Y-%m-%d")}"""

            # Use trace for debugging if needed
            trace_id = gen_trace_id()
            with trace(workflow_name="Topic News Research", trace_id=trace_id):
                result = await Runner.run(starting_agent=agent, input=research_prompt, max_turns=20)
                
                return {
                    "summary_markdown": result.final_output,
                    "raw_results": {
                        "trace_id": trace_id,
                        "topics_searched": topics,
                        "agent_messages": result.messages if hasattr(result, 'messages') else []
                    }
                }
                
    except Exception as e:
        return {
            "error": f"Failed to fetch topic news: {str(e)}",
            "summary_markdown": "",
            "raw_results": {}
        }


async def test_fetch_topic_news():
    """Test function to verify the news agent works"""
    test_topics = ["artificial intelligence", "quantum computing"]
    result = await fetch_topic_news(test_topics)
    
    print("Test Result:")
    print(f"Error: {result.get('error', 'None')}")
    print(f"Summary length: {len(result.get('summary_markdown', ''))}")
    print(f"Raw results keys: {list(result.get('raw_results', {}).keys())}")
    
    if result.get('summary_markdown'):
        print("\nSummary:")
        print(result['summary_markdown'] + "...")


if __name__ == "__main__":
    # Test the news agent when run directly
    asyncio.run(test_fetch_topic_news())