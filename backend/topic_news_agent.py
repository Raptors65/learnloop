"""
Topic News Agent using OpenAI Agents SDK with Dex MCP server for browser automation.
"""

import asyncio
import json
import logging
from typing import List, Dict
import os

from agents import Agent, Runner, gen_trace_id, trace
from agents.mcp import MCPServerSse
from agents.model_settings import ModelSettings
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TopicNewsAgent:
    def __init__(self, server_url: str = "http://127.0.0.1:8000/sse"):
        self.server_url = server_url
        self.mcp_server = None
        
    async def connect_to_mcp_server(self):
        """Connect to the Dex MCP server"""
        try:
            self.mcp_server = MCPServerSse(
                name="Dex Browser Server",
                params={"url": self.server_url}
            )
            logger.info(f"Connected to MCP server at {self.server_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            return False

    async def search_topic_news(self, topic: str, max_articles: int = 5) -> Dict:
        """Search for recent news and developments on a specific topic"""
        try:
            if not self.mcp_server:
                await self.connect_to_mcp_server()
            
            # Create an agent with browser automation capabilities
            agent = Agent(
                name="News Research Agent",
                instructions=f"""
                You are a professional research assistant specializing in finding recent news and developments.
                
                Your task is to search for recent news and developments about "{topic}".
                
                Follow this process:
                1. Open a new browser tab
                2. Search Google for "{topic} latest news developments 2024 2025"
                3. Analyze the search results and extract information from legitimate news sources
                4. Search for academic/research developments: "{topic} research paper study findings 2024 2025 site:arxiv.org OR site:nature.com OR site:science.org"
                5. Extract research information from academic sources
                6. Close any tabs you opened
                
                For each article or research paper you find, extract:
                - Title
                - Brief description or key findings
                - Source (website, journal, etc.)
                - Date if visible (or mark as "Recent")
                
                Focus on:
                - Legitimate news sources and academic publications
                - Recent developments (2024-2025)
                - Up to {max_articles} news articles
                - Up to 3 research papers/academic developments
                
                Return your findings in this JSON format:
                {{
                    "topic": "{topic}",
                    "news_articles": [
                        {{
                            "title": "Article title",
                            "description": "Brief description",
                            "source": "Source name",
                            "date": "Date or 'Recent'"
                        }}
                    ],
                    "research_developments": [
                        {{
                            "title": "Research title",
                            "description": "Research description or findings",
                            "source": "Journal/arxiv",
                            "date": "Date or 'Recent'"
                        }}
                    ]
                }}
                
                Be thorough but efficient. Avoid ads, sponsored content, or unreliable sources.
                """,
                mcp_servers=[self.mcp_server],
                model_settings=ModelSettings(
                    temperature=0.1,
                    max_tokens=4000
                )
            )
            
            # Generate trace ID for monitoring
            trace_id = gen_trace_id()
            
            with trace(workflow_name="Topic News Search", trace_id=trace_id):
                logger.info(f"Starting news search for topic: {topic}")
                logger.info(f"View trace: https://platform.openai.com/traces/trace?trace_id={trace_id}")
                
                # Run the agent
                result = await Runner.run(
                    starting_agent=agent,
                    input=f"Search for recent news and developments about {topic}"
                )
                
                # Parse the result
                final_output = result.final_output
                
                # Try to extract JSON from the result
                try:
                    # Look for JSON in the response
                    start_idx = final_output.find('{')
                    end_idx = final_output.rfind('}') + 1
                    
                    if start_idx != -1 and end_idx > start_idx:
                        parsed_result = json.loads(final_output[start_idx:end_idx])
                        return parsed_result
                    else:
                        # Fallback: create structure from text
                        return {
                            "topic": topic,
                            "news_articles": [],
                            "research_developments": [],
                            "summary": final_output,
                            "trace_id": trace_id
                        }
                        
                except json.JSONDecodeError:
                    return {
                        "topic": topic,
                        "news_articles": [],
                        "research_developments": [],
                        "summary": final_output,
                        "trace_id": trace_id
                    }
            
        except Exception as e:
            logger.error(f"Error searching for topic news: {e}")
            return {
                "topic": topic,
                "news_articles": [],
                "research_developments": [],
                "error": str(e)
            }

    async def get_topics_summary(self, topics: List[str]) -> Dict:
        """Get news summaries for multiple topics and create a consolidated markdown report"""
        try:
            # Connect to MCP server
            async with self.mcp_server:
                all_results = []
                
                for topic in topics:
                    logger.info(f"Processing topic: {topic}")
                    topic_results = await self.search_topic_news(topic)
                    all_results.append(topic_results)
                
                # Create summary agent
                summary_agent = Agent(
                    name="Summary Writer",
                    instructions=f"""
                    You are a professional technical writer specializing in creating comprehensive summaries.
                    
                    Create a well-formatted markdown summary of recent news and developments based on the research results provided.
                    
                    Your summary should include:
                    1. A brief executive summary (2-3 sentences) highlighting the most important developments across all topics
                    2. For each topic, create a dedicated section with:
                       - A brief overview paragraph
                       - Key news developments with source attribution
                       - Research highlights from academic sources
                       - Any notable trends or implications
                    
                    Use proper markdown formatting:
                    - Headers (##, ###)
                    - Bullet points
                    - **Bold** for emphasis
                    - Links where available
                    
                    Make it engaging and informative for someone interested in learning about these topics.
                    Focus on the most significant and recent developments.
                    
                    If any topic had no results, briefly mention that current information wasn't available.
                    """,
                    model_settings=ModelSettings(
                        model="gpt-4o",
                        temperature=0.2,
                        max_tokens=3000
                    )
                )
                
                # Generate summary
                trace_id = gen_trace_id()
                with trace(workflow_name="Topics Summary Generation", trace_id=trace_id):
                    summary_input = f"""
                    Create a comprehensive markdown summary based on these research results:
                    
                    {json.dumps(all_results, indent=2)}
                    """
                    
                    summary_result = await Runner.run(
                        starting_agent=summary_agent,
                        input=summary_input
                    )
                    
                    return {
                        "topics": topics,
                        "summary_markdown": summary_result.final_output,
                        "raw_results": all_results,
                        "summary_trace_id": trace_id
                    }
        
        except Exception as e:
            logger.error(f"Error generating topics summary: {e}")
            return {
                "topics": topics,
                "summary_markdown": f"# Error\n\nFailed to generate summary: {str(e)}",
                "raw_results": [],
                "error": str(e)
            }

# Convenience function for standalone usage
async def fetch_topic_news(topics: List[str], server_url: str = "http://127.0.0.1:8000/sse") -> Dict:
    """
    Fetch news for topics using OpenAI Agents SDK with Dex MCP server
    
    Args:
        topics: List of topic strings to search for
        server_url: URL of the Dex MCP server SSE endpoint
    
    Returns:
        Dictionary with markdown summary and raw results
    """
    try:
        agent_client = TopicNewsAgent(server_url)
        return await agent_client.get_topics_summary(topics)
    except Exception as e:
        logger.error(f"Error in fetch_topic_news: {e}")
        return {
            "error": str(e),
            "topics": topics,
            "summary_markdown": f"# Error\n\nFailed to fetch news for: {', '.join(topics)}\n\nError: {str(e)}",
            "raw_results": []
        }

if __name__ == "__main__":
    # Test with sample topics
    test_topics = ["artificial intelligence", "climate change", "quantum computing"]
    
    async def test():
        print("🚀 Testing Topic News Agent with OpenAI Agents SDK")
        print("Make sure Dex MCP server is running: cd dex-mcp && uv run main.py")
        print()
        
        result = await fetch_topic_news(test_topics)
        
        if "error" in result:
            print(f"❌ Error: {result['error']}")
            return
        
        print("✅ Success! Here's the summary:")
        print("\n" + result.get("summary_markdown", "No summary available"))
        
        print(f"\n📊 Found {len(result.get('raw_results', []))} topic results")
        if "summary_trace_id" in result:
            print(f"🔗 Summary trace: https://platform.openai.com/traces/trace?trace_id={result['summary_trace_id']}")
    
    asyncio.run(test())