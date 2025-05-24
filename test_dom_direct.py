#!/usr/bin/env python3
"""
Direct test of DOM grabbing functionality through the MCP server.
This bypasses the AI agent and directly calls the MCP tools.
"""

import asyncio
import json
import logging
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_dom_grabbing():
    """Test DOM grabbing directly through MCP server."""
    
    # Connect to the MCP server using stdio
    server_params = StdioServerParameters(
        command="python",
        args=["/Users/lucaskim/code/agenthacks/dex-mcp/main.py"],
        env=None
    )
    
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # Initialize the session
                await session.initialize()
                
                # List available tools
                logger.info("Listing available tools...")
                tools = await session.list_tools()
                logger.info(f"Available tools: {[tool.name for tool in tools.tools]}")
                
                # Test getting tabs first
                logger.info("Getting browser tabs...")
                tabs_result = await session.call_tool("get_tabs")
                logger.info(f"Tabs result: {tabs_result.content}")
                
                # Test getting page content (our new concise method)
                if any(tool.name == "get_page_content" for tool in tools.tools):
                    logger.info("Testing get_page_content...")
                    content_result = await session.call_tool("get_page_content")
                    logger.info(f"Page content result: {content_result.content[:500]}...")
                else:
                    logger.warning("get_page_content tool not found")
                
                # Test search and content extraction
                logger.info("Testing search with concise content...")
                search_result = await session.call_tool("search_google", {"query": "python programming"})
                logger.info(f"Search result type: {type(search_result.content)}")
                logger.info(f"Search result: {str(search_result.content)[:500]}...")
                
    except Exception as e:
        logger.error(f"Error during test: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_dom_grabbing())