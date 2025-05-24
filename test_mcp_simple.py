#!/usr/bin/env python3
"""
Simple test of MCP server tools without using an AI agent.
Uses the same MCPServerSse approach as the topic_news_agent.
"""

import asyncio
import logging
from agents.mcp import MCPServerSse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_mcp_tools():
    """Test MCP tools directly without an agent."""
    
    try:
        # Connect to the dex-mcp server via SSE (same as topic_news_agent)
        async with MCPServerSse(
            name="Test Dex MCP Server",
            params={
                "url": "http://localhost:8000/sse",
                "timeout": 20
            },
            client_session_timeout_seconds=30,
        ) as server:
            
            logger.info("Connected to MCP server successfully")
            
            # List available tools
            tools = await server.list_tools()
            logger.info(f"Available tools: {[tool.name for tool in tools]}")
            
            # Test get_tabs
            logger.info("Testing get_tabs...")
            tabs_result = await server.call_tool("get_tabs", {})
            logger.info(f"Tabs result: {tabs_result}")
            
            # Test grab_dom directly
            tool_names = [tool.name for tool in tools]
            if "grab_dom" in tool_names:
                logger.info("Testing grab_dom...")
                dom_result = await server.call_tool("grab_dom", {})
                logger.info(f"DOM result type: {type(dom_result)}")
                logger.info(f"DOM result length: {len(str(dom_result))}")
                logger.info(f"DOM result preview: {str(dom_result)[:500]}...")
            else:
                logger.warning("grab_dom not available")
            
            # Test get_page_content if available
            if "get_page_content" in tool_names:
                logger.info("Testing get_page_content...")
                content_result = await server.call_tool("get_page_content", {})
                logger.info(f"Content result length: {len(str(content_result))}")
                logger.info(f"Content preview: {str(content_result)[:200]}...")
            else:
                logger.warning("get_page_content not available")
            
            # Test search_google
            if "search_google" in tool_names:
                logger.info("Testing search_google...")
                search_result = await server.call_tool("search_google", {"query": "test search"})
                logger.info(f"Search result type: {type(search_result)}")
                logger.info(f"Search result length: {len(str(search_result))}")
                logger.info(f"Search result preview: {str(search_result)[:300]}...")
            else:
                logger.warning("search_google not available")
                
    except Exception as e:
        logger.error(f"Error during MCP test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mcp_tools())