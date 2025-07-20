"""
FastAPI backend for Application Generator UI.

Provides API endpoints to interact with the Pipeline Orchestrator
and serves the React frontend application.
"""

import asyncio
import logging
import os
import tempfile
import json
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional

import uvicorn
from fastapi import FastAPI, File, UploadFile, WebSocket, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Import core components
from core.db import DB
from core.session_manager import SessionManager
from core.node_registry import NodeRegistry
from core.orchestrator import PipelineOrchestrator
from stealth.stealth_manager import StealthManager

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Application Generator API",
    description="API for generating applications from requirements",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connections for real-time updates
active_connections: Dict[str, List[WebSocket]] = {}

# Global orchestrator instance
orchestrator: Optional[PipelineOrchestrator] = None

# Model definitions
class ProjectCreate(BaseModel):
    name: str
    requirements: str

class PipelineConfig(BaseModel):
    nodes: List[str] = []

class ProjectRun(BaseModel):
    project_id: str
    pipeline_config: Optional[PipelineConfig] = None

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup."""
    global orchestrator
    
    logger.info("Initializing API backend components")
    
    # Initialize database
    db = DB()
    await db.initialize()
    
    # Initialize stealth manager
    stealth_manager = StealthManager()
    
    # Initialize session manager
    session_manager = SessionManager(db, stealth_manager)
    
    # Initialize node registry and discover nodes
    node_registry = NodeRegistry()
    await node_registry.discover_nodes()
    
    # Initialize orchestrator
    orchestrator = PipelineOrchestrator(
        db=db,
        session_manager=session_manager,
        node_registry=node_registry
    )
    
    # Register event hooks for WebSocket updates
    await orchestrator.register_hook("on_status_update", broadcast_status_update)
    await orchestrator.register_hook("on_error", broadcast_error)
    await orchestrator.register_hook("on_completion", broadcast_completion)
    
    logger.info("API backend initialized successfully")

async def broadcast_status_update(data: Dict[str, Any]):
    """Broadcast status updates to connected clients."""
    if not data or "project_id" not in data:
        return
        
    project_id = data["project_id"]
    if project_id in active_connections:
        message = {
            "type": "status_update",
            "data": data
        }
        await broadcast_to_project(project_id, message)

async def broadcast_error(data: Dict[str, Any]):
    """Broadcast error information to connected clients."""
    if not data or "project_id" not in data:
        return
        
    project_id = data["project_id"]
    if project_id in active_connections:
        message = {
            "type": "error",
            "data": data
        }
        await broadcast_to_project(project_id, message)

async def broadcast_completion(data: Dict[str, Any]):
    """Broadcast completion information to connected clients."""
    if not data or "project_id" not in data:
        return
        
    project_id = data["project_id"]
    if project_id in active_connections:
        message = {
            "type": "completion",
            "data": data
        }
        await broadcast_to_project(project_id, message)

async def broadcast_to_project(project_id: str, message: Dict[str, Any]):
    """Send a message to all WebSocket connections for a project."""
    if project_id not in active_connections:
        return
        
    dead_connections = []
    
    for connection in active_connections[project_id]:
        try:
            await connection.send_json(message)
        except Exception as e:
            logger.error(f"Error sending to WebSocket: {e}")
            dead_connections.append(connection)
    
    # Remove dead connections
    for dead in dead_connections:
        active_connections[project_id].remove(dead)

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

@app.get("/api/nodes")
async def list_nodes():
    """List all available pipeline nodes."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
        
    registry = NodeRegistry()
    nodes = registry.list_available_nodes()
    
    return {"nodes": nodes}

@app.post("/api/projects")
async def create_project(project: ProjectCreate):
    """Create a new project."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
        
    try:
        project_id = await orchestrator.create_project(project.name, project.requirements)
        return {"project_id": project_id}
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects")
async def list_projects():
    """List all projects."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
        
    try:
        projects = await orchestrator.list_projects()
        return {"projects": projects}
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get project details."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
        
    try:
        project = await orchestrator.get_project_status(project_id)
        return project
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/{project_id}/run")
async def run_project(project_id: str, config: Optional[PipelineConfig] = None, background_tasks: BackgroundTasks = None):
    """Run a project pipeline."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
        
    custom_pipeline = None
    if config and config.nodes:
        custom_pipeline = config.nodes
    
    # Run in background task
    if background_tasks:
        background_tasks.add_task(orchestrator.run_project, project_id, custom_pipeline)
        return {"status": "started", "project_id": project_id}
    else:
        # For compatibility, but prefer background tasks
        try:
            asyncio.create_task(orchestrator.run_project(project_id, custom_pipeline))
            return {"status": "started", "project_id": project_id}
        except Exception as e:
            logger.error(f"Error starting project {project_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/{project_id}/cancel")
async def cancel_project(project_id: str):
    """Cancel a running project."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
        
    try:
        success = await orchestrator.cancel_project(project_id)
        if success:
            return {"status": "cancelled", "project_id": project_id}
        else:
            raise HTTPException(status_code=400, detail="Project not running or already completed")
    except Exception as e:
        logger.error(f"Error cancelling project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}/download")
async def download_project(project_id: str):
    """Download project generated code as a zip file."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
        
    try:
        # Get project state
        project = await orchestrator.get_project_status(project_id)
        if project["status"] not in ["completed", "partially_completed"]:
            raise HTTPException(status_code=400, detail=f"Project not completed. Current status: {project['status']}")
        
        # Get code files
        code_files = project.get("artifacts", {}).get("code_files", {})
        if not code_files:
            raise HTTPException(status_code=404, detail="No code files found in project")
        
        # Create a temporary directory for the files
        temp_dir = tempfile.mkdtemp()
        try:
            # Write files to temp directory
            for file_path, content in code_files.items():
                # Ensure directory exists
                os.makedirs(os.path.join(temp_dir, os.path.dirname(file_path)), exist_ok=True)
                
                # Write file
                with open(os.path.join(temp_dir, file_path), 'w') as f:
                    f.write(content)
            
            # Create a zip file
            zip_path = os.path.join(tempfile.gettempdir(), f"{project_id}.zip")
            shutil.make_archive(
                os.path.splitext(zip_path)[0],  # Remove .zip extension
                'zip',
                temp_dir
            )
            
            # Return the zip file
            return FileResponse(
                zip_path,
                media_type="application/zip",
                filename=f"{project['name'].replace(' ', '_')}.zip"
            )
        finally:
            # Clean up temporary directory
            shutil.rmtree(temp_dir)
            
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error downloading project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-requirements")
async def upload_requirements(file: UploadFile = File(...)):
    """Upload a requirements file and return its contents."""
    try:
        contents = await file.read()
        return {"requirements": contents.decode("utf-8")}
    except Exception as e:
        logger.error(f"Error uploading requirements: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/projects/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    """WebSocket endpoint for real-time project updates."""
    await websocket.accept()
    
    # Register connection
    if project_id not in active_connections:
        active_connections[project_id] = []
    active_connections[project_id].append(websocket)
    
    try:
        # Send initial project status if available
        if orchestrator:
            try:
                project = await orchestrator.get_project_status(project_id)
                await websocket.send_json({
                    "type": "status_update",
                    "data": {
                        "project_id": project_id,
                        "status": project.get("status", "unknown"),
                        "completion_percentage": project.get("completion_percentage", 0),
                        "current_node": project.get("current_node")
                    }
                })
            except ValueError:
                # Project not found, that's okay
                pass
        
        # Keep connection open until client disconnects
        while True:
            # Wait for client messages (ping/pong or requests)
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle client requests here if needed
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Remove connection when closed
        if project_id in active_connections and websocket in active_connections[project_id]:
            active_connections[project_id].remove(websocket)

# Mount static files for the React frontend
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)