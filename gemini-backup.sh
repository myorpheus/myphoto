#!/bin/bash

# Gemini Backup Script for Large Codebase Analysis
# Uses custom Google Cloud project when @google/gemini-cli quota is exceeded

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GEMINI_CLIENT="./gemini-api-client.js"
REQUIRED_ENV_VARS=("GEMINI_API_KEY")

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if [[ -z "${!var}" ]]; then
            print_error "Environment variable $var is not set"
            echo "Required environment variables:"
            echo "  GEMINI_API_KEY - Your Google AI API key"
            echo "  GOOGLE_CLOUD_PROJECT - Your Google Cloud project ID (optional)"
            echo ""
            echo "Set them in your shell profile (.bashrc, .zshrc) or run:"
            echo "  export GEMINI_API_KEY=\"your-api-key\""
            echo "  export GOOGLE_CLOUD_PROJECT=\"your-project-id\""
            exit 1
        fi
    done
}

# Check if Node.js client exists
check_client() {
    if [[ ! -f "$GEMINI_CLIENT" ]]; then
        print_error "Gemini API client not found at $GEMINI_CLIENT"
        echo "Please ensure gemini-api-client.js exists in the current directory"
        exit 1
    fi
    
    if [[ ! -x "$GEMINI_CLIENT" ]]; then
        chmod +x "$GEMINI_CLIENT"
        print_info "Made $GEMINI_CLIENT executable"
    fi
}

# Check if @google/generative-ai is installed
check_dependencies() {
    if ! node -e "require('@google/generative-ai')" 2>/dev/null; then
        print_warning "@google/generative-ai is not installed"
        print_info "Installing @google/generative-ai..."
        
        if npm install @google/generative-ai; then
            print_status "@google/generative-ai installed successfully"
        else
            print_error "Failed to install @google/generative-ai"
            echo "Please run: npm install @google/generative-ai"
            exit 1
        fi
    fi
}

# Main execution
main() {
    if [[ $# -eq 0 ]]; then
        echo "Gemini Backup Script - Use when gemini CLI quota is exceeded"
        echo ""
        echo "Usage:"
        echo "  $0 \"<prompt>\""
        echo "  $0 \"@file.js <prompt>\""
        echo "  $0 \"@src/ <prompt>\""
        echo ""
        echo "Examples:"
        echo "  $0 \"Analyze this codebase for patterns\""
        echo "  $0 \"@src/App.tsx Fix compilation errors\""
        echo "  $0 \"@src/ @tests/ Analyze test coverage\""
        echo ""
        echo "Prompt Enhancement:"
        echo "  $0 \"enhance_prompt:professional headshot|professional|man\""
        echo ""
        echo "Environment Variables Required:"
        echo "  GEMINI_API_KEY - Your Google AI API key"
        echo "  GOOGLE_CLOUD_PROJECT - Your Google Cloud project ID (optional)"
        exit 0
    fi
    
    print_info "Starting Gemini backup client..."
    
    # Run checks
    check_env_vars
    check_client
    check_dependencies
    
    # Execute the prompt
    print_info "Processing prompt with Gemini 2.0 Flash..."
    node "$GEMINI_CLIENT" "$@"
}

# Handle script execution
main "$@"