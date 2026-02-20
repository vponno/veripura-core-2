#!/bin/bash

# Kill any existing vite processes
pkill -9 -f vite 2>/dev/null
pkill -9 -f "node.*veripura" 2>/dev/null
sleep 2

# Change to the correct directory
cd /Users/onno/veripura-core-final

# Verify we're in the right place
if [ "$PWD" != "/Users/onno/veripura-core-final" ]; then
    echo "ERROR: Failed to change to correct directory!"
    exit 1
fi

echo "Starting VeriPura Core from: $PWD"

# Clear vite cache
rm -rf node_modules/.vite

# Start the dev server
npm run dev
