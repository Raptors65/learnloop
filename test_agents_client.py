#!/usr/bin/env python3
"""
Test script for the OpenAI Agents SDK topic news client.
Run this to test the agent without Flask backend.
"""

import sys
import asyncio
from backend.topic_news_agent import fetch_topic_news

async def main():
    if len(sys.argv) > 1:
        # Use command line arguments as topics
        topics = sys.argv[1:]
    else:
        # Default test topics
        topics = ["artificial intelligence", "blockchain", "renewable energy"]
    
    print(f"🔍 Fetching news for topics: {', '.join(topics)}")
    print("=" * 60)
    
    try:
        result = await fetch_topic_news(topics)
        
        if "error" in result:
            print(f"❌ Error: {result['error']}")
            return
        
        print("✅ Success! Here's the comprehensive summary:")
        print("\n" + result.get("summary_markdown", "No summary available"))
        
        print(f"\n📊 Research completed for {len(result.get('raw_results', []))} topics")
        
        # Show trace links if available
        if "summary_trace_id" in result:
            print(f"🔗 View summary generation trace: https://platform.openai.com/traces/trace?trace_id={result['summary_trace_id']}")
        
        # Show individual topic traces
        for i, topic_result in enumerate(result.get('raw_results', [])):
            if 'trace_id' in topic_result:
                topic_name = topic_result.get('topic', f'Topic {i+1}')
                print(f"🔗 View '{topic_name}' research trace: https://platform.openai.com/traces/trace?trace_id={topic_result['trace_id']}")
        
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("🚀 Testing OpenAI Agents SDK Topic News Client")
    print("📋 Requirements:")
    print("  1. Dex MCP server running: cd dex-mcp && uv run main.py")
    print("  2. OPENAI_API_KEY environment variable set")
    print("  3. Chrome with Dex extension installed and activated")
    print()
    
    asyncio.run(main())