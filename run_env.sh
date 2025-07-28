#!/bin/bash

# Script to automate Flask setup and run the app on macOS

# Variables
VENV_NAME="myenv"
APP_FILE="run.py"
REQUIREMENTS=(
    "flask"
    "flask_wtf"
    "flask_sqlalchemy"
    "flask_cors"
    "psycopg2"
    "requests"
    "markdown"
)

# Step 1: Create a virtual environment
echo "Creating virtual environment..."
python3 -m venv $VENV_NAME

# Step 2: Activate the virtual environment
echo "Activating virtual environment..."
source $VENV_NAME/bin/activate

# Step 3: Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Step 4: Install required packages
echo "Installing required packages..."
for package in "${REQUIREMENTS[@]}"; do
    pip install $package
done

# Step 5: Run the Flask app
echo "Starting Flask app..."
python $APP_FILE &

# Step 6: Get the process ID of the Flask app
FLASK_PID=$!

# Step 7: Open the browser to http://127.0.0.1:5000
echo "Opening http://127.0.0.1:5000 in your default browser..."
sleep 2  # Wait for the Flask app to start
open "http://127.0.0.1:5000"

# Step 8: Wait for the user to press Ctrl+C to stop the script
echo "Press Ctrl+C to stop the Flask app and exit..."
trap "kill $FLASK_PID" EXIT  # Kill the Flask app when the script exits
wait $FLASK_PID
