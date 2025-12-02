#!/bin/bash

# Find PIDs listening on port 8000
PIDS=$(lsof -t -i:8000)

if [ -z "$PIDS" ]; then
    echo "No process found on port 8000."
else
    echo "Killing process(es) on port 8000: $PIDS"
    echo "$PIDS" | xargs kill -9
fi

# Verify
sudo lsof -i :8000

