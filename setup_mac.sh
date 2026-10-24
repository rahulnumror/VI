#!/bin/bash
# SOILEX ERP — Mac Setup Script
# Run this after brew install completes

export PATH="/opt/homebrew/bin:$PATH"

echo ">>> Step 1: Deleting Windows venv..."
rm -rf /Users/rahulkumarsingh/Downloads/VI/backend/venv

echo ">>> Step 2: Creating fresh Mac venv with Python 3.12..."
python3.12 -m venv /Users/rahulkumarsingh/Downloads/VI/backend/venv

echo ">>> Step 3: Installing backend packages..."
/Users/rahulkumarsingh/Downloads/VI/backend/venv/bin/pip install --upgrade pip
/Users/rahulkumarsingh/Downloads/VI/backend/venv/bin/pip install -r /Users/rahulkumarsingh/Downloads/VI/backend/requirements.txt

echo ">>> Step 4: Installing frontend node_modules..."
cd /Users/rahulkumarsingh/Downloads/VI && npm install

echo ""
echo "=============================="
echo "✅ Setup complete!"
echo "To start the backend:"
echo "  cd /Users/rahulkumarsingh/Downloads/VI/backend"
echo "  source venv/bin/activate"
echo "  python -m uvicorn app.main:app --reload --port 8000"
echo ""
echo "To start the frontend:"
echo "  cd /Users/rahulkumarsingh/Downloads/VI"
echo "  npm run dev"
echo "=============================="
