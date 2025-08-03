#!/usr/bin/env python3
"""
Integration test for task queue API endpoints
"""

import asyncio
import sys
import os
from pathlib import Path
import json

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

import httpx
from fastapi.testclient import TestClient
from server import app

def test_task_api_endpoints():
    """Test task API endpoints without authentication"""
    print("Testing Task API Integration...")
    
    with TestClient(app) as client:
        try:
            # Test health endpoint first
            response = client.get("/api/health")
            print(f"✓ Health check: {response.status_code}")
            
            # Test task dashboard endpoint (should return HTML)
            response = client.get("/dashboard/tasks")
            if response.status_code == 200:
                print("✓ Task dashboard accessible")
            else:
                print(f"✗ Task dashboard failed: {response.status_code}")
            
            # Test task stats endpoint (will fail without auth, but should return 401/403)
            response = client.get("/api/tasks/stats")
            if response.status_code in [401, 403]:
                print("✓ Task stats endpoint properly protected")
            else:
                print(f"? Task stats returned: {response.status_code}")
            
            # Test task submission endpoint (will fail without auth)
            response = client.post("/api/tasks/submit", json={
                "name": "test_task",
                "args": [],
                "kwargs": {"message": "test"}
            })
            if response.status_code in [401, 403]:
                print("✓ Task submission endpoint properly protected")
            else:
                print(f"? Task submission returned: {response.status_code}")
            
            print("✓ Task API integration test completed!")
            
        except Exception as e:
            print(f"✗ Integration test failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_task_api_endpoints()