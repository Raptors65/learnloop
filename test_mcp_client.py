#!/usr/bin/env python3
"""
Simple test script for the MCP topic news client.
Run this to test the client without Flask backend.
"""

import sys
import asyncio
from backend.topic_news_client import fetch_topic_news

async def main():
    if len(sys.argv) > 1:
        # Use command line arguments as topics
        topics = sys.argv[1:]
    else:
        # Default test topics
        topics = ["artificial intelligence", "blockchain", "renewable energy"]
    
    print(f"Fetching news for topics: {', '.join(topics)}")
    print("=" * 50)
    
    try:
        result = await fetch_topic_news(topics)
        
        if "error" in result:
            print(f"❌ Error: {result['error']}")
            return
        
        print("✅ Success! Here's the summary:")
        print("\n" + result.get("summary_markdown", "No summary available"))
        
        print(f"\n📊 Found {len(result.get('raw_results', []))} topic results")
        
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("🚀 Testing MCP Topic News Client with Interleaved Thinking")
    print("Make sure Dex MCP server is running: cd dex-mcp && uv run main.py")
    print()
    
    asyncio.run(main())