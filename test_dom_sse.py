#!/usr/bin/env python3
"""
Direct test of DOM grabbing functionality through the MCP server using SSE.
This bypasses the AI agent and directly calls the MCP tools via SSE transport.
"""

import asyncio
import json
import logging
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_dom_via_sse():
    """Test DOM grabbing directly through MCP server via SSE."""
    
    try:
        # Connect to the SSE endpoint
        async with aiohttp.ClientSession() as session:
            logger.info("Connecting to MCP server via SSE...")
            
            # Initialize connection to MCP server
            async with session.post(
                "http://localhost:8000/sse", 
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                if response.status != 200:
                    logger.error(f"Failed to connect: HTTP {response.status}")
                    return
                
                logger.info("Connected to MCP server")
                
                # Send initialize request
                init_request = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {}},
                        "clientInfo": {"name": "test-client", "version": "1.0.0"}
                    }
                }
                
                # For SSE, we need to send the request and read the response
                async for line in response.content:
                    if line:
                        try:
                            line_str = line.decode('utf-8').strip()
                            if line_str.startswith('data: '):
                                data = json.loads(line_str[6:])  # Remove "data: " prefix
                                logger.info(f"Received: {data}")
                                break
                        except json.JSONDecodeError:
                            continue
                
    except Exception as e:
        logger.error(f"Error during SSE test: {e}")
        raise

async def test_mcp_client_direct():
    """Test using MCP client library directly with the running server."""
    
    # Since the server is running on localhost:8000/sse, let's try a simpler HTTP approach
    try:
        async with aiohttp.ClientSession() as session:
            # First, let's see if the server is responding
            logger.info("Testing server connectivity...")
            async with session.get("http://localhost:8000/sse") as response:
                logger.info(f"Server response: {response.status}")
                if response.status == 200:
                    logger.info("MCP server is running and accessible")
                else:
                    logger.error(f"Server returned status: {response.status}")
                    
    except Exception as e:
        logger.error(f"Error connecting to server: {e}")

if __name__ == "__main__":
    print("Testing MCP server connectivity...")
    asyncio.run(test_mcp_client_direct())
    
    print("\nTesting DOM via SSE...")
    asyncio.run(test_dom_via_sse())