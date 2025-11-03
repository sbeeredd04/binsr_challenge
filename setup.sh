#!/bin/bash

# Flask Backend Setup Script for Binsr Challenge
# This script sets up the Flask backend server environment

set -e

echo "=========================================="
echo "Flask Backend Setup - Binsr Challenge"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version

if [ $? -ne 0 ]; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created successfully"
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ".env file created. Please update it with your configuration."
else
    echo ""
    echo ".env file already exists"
fi

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p output logs app/templates app/static/css

# Create .gitkeep files
touch output/.gitkeep logs/.gitkeep

echo ""
echo "=========================================="
echo "Setup completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Review and update .env file if needed"
echo "3. Run the server: python run.py"
echo ""
echo "API will be available at: http://127.0.0.1:5000"
echo "Health check: curl http://localhost:5000/api/health"
echo ""
