#!/bin/bash
# Fix EMFILE: too many open files error on macOS

# Increase file descriptor limit for current session
ulimit -n 4096

echo "File descriptor limit increased to 4096 for this session"
echo "To make this permanent, add the following to ~/.zshrc:"
echo "ulimit -n 4096"
echo ""
echo "Or install watchman for better file watching:"
echo "brew install watchman"

