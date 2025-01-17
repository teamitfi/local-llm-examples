#!/bin/bash

# Function to check if ChromaDB is accessible
check_chromadb() {
    if curl -s "http://localhost:8000/api/v1/heartbeat" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# First check if ChromaDB is already accessible (might be running outside Docker)
if check_chromadb; then
    echo "ChromaDB is already accessible at http://localhost:8000"
    exit 0
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if ChromaDB container is already running
if [ "$(docker ps -q -f name=chromadb)" ]; then
    echo "ChromaDB container is running but not accessible. This might indicate a problem."
    echo "Stopping and removing the container to recreate it..."
    docker stop chromadb
    docker rm chromadb
fi

# Remove any stopped ChromaDB container
if [ "$(docker ps -aq -f status=exited -f name=chromadb)" ]; then
    echo "Removing stopped ChromaDB container"
    docker rm chromadb
fi

echo "Creating and starting new ChromaDB container"
if ! docker run -d --name chromadb -p 8000:8000 chromadb/chroma; then
    echo "Failed to start ChromaDB container"
    exit 1
fi

# Wait for the server to be ready
echo "Waiting for ChromaDB server to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if check_chromadb; then
        echo "ChromaDB server is ready at http://localhost:8000!"
        exit 0
    fi
    echo "Attempt $attempt/$max_attempts: Server not ready yet, waiting..."
    sleep 1
    attempt=$((attempt + 1))
done

echo "Failed to confirm ChromaDB server is running after $max_attempts attempts"
echo "Showing recent container logs:"
docker logs chromadb --tail 50
exit 1
