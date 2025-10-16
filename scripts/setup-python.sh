#!/bin/bash
# Setup Python for Railway environment
# This script ensures Python is available and properly linked

set -e

echo "🐍 Setting up Python for Railway..."

# Check if python3 is already available
if command -v python3 &> /dev/null; then
    PYTHON_PATH=$(which python3)
    echo "✅ Python 3 found at: $PYTHON_PATH"
    python3 --version
    exit 0
fi

# Check if python is available (might be python 3)
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    if [[ "$PYTHON_VERSION" == *"Python 3"* ]]; then
        echo "✅ Python found at: $(which python)"
        echo "   Version: $PYTHON_VERSION"
        # Create symlink for python3
        if [ -w /usr/local/bin ]; then
            ln -sf $(which python) /usr/local/bin/python3 2>/dev/null || true
        fi
        exit 0
    fi
fi

# Try to find Python 3 in nix store
if [ -d "/nix/store" ]; then
    PYTHON_IN_NIX=$(find /nix/store -name "python3" -o -name "python3.11" 2>/dev/null | head -1)
    if [ -n "$PYTHON_IN_NIX" ]; then
        echo "✅ Found Python in nix store: $PYTHON_IN_NIX"
        $PYTHON_IN_NIX --version
        # Try to create symlink
        if [ -w /usr/local/bin ]; then
            ln -sf $PYTHON_IN_NIX /usr/local/bin/python3 2>/dev/null || true
        fi
        exit 0
    fi
fi

# Check common Python installation paths
PYTHON_PATHS=(
    "/usr/bin/python3"
    "/usr/local/bin/python3"
    "/opt/python/bin/python3"
    "/usr/bin/python3.11"
)

for PYTHON_PATH in "${PYTHON_PATHS[@]}"; do
    if [ -f "$PYTHON_PATH" ]; then
        echo "✅ Found Python at: $PYTHON_PATH"
        $PYTHON_PATH --version
        exit 0
    fi
done

echo "❌ Python 3 not found!"
echo "   Please ensure python311 is in nixpacks.toml"
exit 1

