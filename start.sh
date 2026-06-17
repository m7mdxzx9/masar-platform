#!/bin/bash
# Masar Platform Unix/Linux/macOS Startup Script

echo "============================================================"
echo "  MASAR Platform - AI Learning OS"
echo "============================================================"
echo ""

# Check if Python is installed
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Exiting."; exit 1; }

python3 start.py