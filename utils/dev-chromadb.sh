#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Error: Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i ":$port" > /dev/null; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process using a port
kill_port_process() {
    local port=$1
    echo "Killing process using port $port..."
    lsof -ti ":$port" | xargs kill -9 2>/dev/null
}

# Function to check if ChromaDB is accessible
check_chromadb() {
    if curl -s "${CHROMA_URL}/api/v1/heartbeat" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to start ChromaDB container
start_chromadb() {
    echo "Starting ChromaDB container for development..."
    
    # Check ports
    if check_port 3001; then
        echo "Port 3001 is in use. Killing the process..."
        kill_port_process 3001
        sleep 1
    fi
    
    if check_port 8000; then
        echo "Port 8000 is in use. Killing the process..."
        kill_port_process 8000
        sleep 1
    fi
    
    # Check if container exists and is running
    if docker ps --format '{{.Names}}' | grep -q "^chromadb-dev$"; then
        echo "ChromaDB development container is already running"
        return 0
    fi
    
    # Check if container exists but is stopped
    if docker ps -a --format '{{.Names}}' | grep -q "^chromadb-dev$"; then
        echo "ChromaDB development container exists, starting it..."
        docker start chromadb-dev
        return 0
    fi
    
    # Create a named volume if it doesn't exist
    if ! docker volume ls | grep -q "^chroma_data$"; then
        echo "Creating ChromaDB persistent volume..."
        docker volume create chroma_data
    fi
    
    echo "Creating new ChromaDB development container..."
    if ! docker run -d \
        --name chromadb-dev \
        -p 8000:8000 \
        -v "${CHROMA_PATH}":/chroma/chroma \
        -e ALLOW_RESET="${ALLOW_RESET:-true}" \
        -e ANONYMIZED_TELEMETRY="${ANONYMIZED_TELEMETRY:-false}" \
        -e CHROMA_SERVER_HOST="${CHROMA_SERVER_HOST:-0.0.0.0}" \
        -e CHROMA_SERVER_PORT="${CHROMA_SERVER_PORT:-8000}" \
        -e PERSIST_DIRECTORY=/chroma/chroma \
        chromadb/chroma:latest; then
        echo "Error: Failed to start ChromaDB container"
        exit 1
    fi
}

# Function to stop ChromaDB container
stop_chromadb() {
    echo "Stopping ChromaDB development container..."
    if docker ps --format '{{.Names}}' | grep -q "^chromadb-dev$"; then
        docker stop chromadb-dev >/dev/null 2>&1
        echo "ChromaDB stopped"
    else
        echo "ChromaDB was not running"
    fi
}

# Function to show ChromaDB logs
show_logs() {
    if ! docker ps --format '{{.Names}}' | grep -q "^chromadb-dev$"; then
        echo "Error: ChromaDB container is not running"
        exit 1
    fi
    docker logs -f chromadb-dev
}

# Function to clean up data (optional)
clean_data() {
    echo "WARNING: This will remove all ChromaDB data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
        stop_chromadb
        docker rm chromadb-dev >/dev/null 2>&1
        docker volume rm chroma_data
        echo "ChromaDB data cleaned"
    else
        echo "Operation cancelled"
    fi
}

case "$1" in
    start)
        check_docker
        if check_chromadb; then
            echo "ChromaDB is already running and accessible"
            exit 0
        fi
        start_chromadb
        echo "Waiting for ChromaDB to be ready..."
        max_attempts=60  # Increased timeout to 60 seconds
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if check_chromadb; then
                echo "ChromaDB is ready!"
                exit 0
            fi
            echo -n "."
            sleep 1
            attempt=$((attempt + 1))
            if [ $((attempt % 10)) -eq 0 ]; then
                echo " ($attempt seconds)"
            fi
        done
        echo "\nError: ChromaDB failed to start within $max_attempts seconds"
        echo "Check logs with: npm run chromadb:logs"
        exit 1
        ;;
    stop)
        check_docker
        stop_chromadb
        ;;
    restart)
        check_docker
        stop_chromadb
        start_chromadb
        ;;
    logs)
        check_docker
        show_logs
        ;;
    clean)
        check_docker
        clean_data
        ;;
    status)
        check_docker
        if check_chromadb; then
            echo "ChromaDB is running and accessible"
            exit 0
        else
            echo "ChromaDB is not accessible"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|clean|status}"
        exit 1
        ;;
esac
