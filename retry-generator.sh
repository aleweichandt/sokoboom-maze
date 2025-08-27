#!/bin/bash

# retry-generator.sh
# Runs yarn start with timeout and retry logic

set -e  # Exit on any error (except in our controlled retry loop)

# Configuration
MAX_ATTEMPTS=90
TIMEOUT_SECONDS=30  # 45 seconds timeout per attempt
CURRENT_ATTEMPT=1
SUCCESS=false

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "${2:-$NC}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Function to calculate wait time (exponential backoff)
calculate_wait_time() {
    local attempt=$1
    if [ $attempt -lt 6 ]; then
        echo $((attempt * 2))
    else
        echo 30
    fi
}

# Function to format duration
format_duration() {
    local seconds=$1
    local minutes=$((seconds / 60))
    local remaining_seconds=$((seconds % 60))
    
    if [ $minutes -gt 0 ]; then
        echo "${minutes}m ${remaining_seconds}s"
    else
        echo "${seconds}s"
    fi
}

# Function to detect OS and set timeout command
setup_timeout_command() {
    if command -v timeout >/dev/null 2>&1; then
        # Linux has timeout command
        TIMEOUT_CMD="timeout ${TIMEOUT_SECONDS}s"
        log "🖥️  Using Linux timeout command" "$BLUE"
    elif command -v gtimeout >/dev/null 2>&1; then
        # macOS with coreutils installed (brew install coreutils)
        TIMEOUT_CMD="gtimeout ${TIMEOUT_SECONDS}s"
        log "🖥️  Using gtimeout (coreutils)" "$BLUE"
    else
        # Fallback for macOS/other systems without timeout
        TIMEOUT_CMD=""
        log "⚠️  No timeout command available - using background process method" "$YELLOW"
        log "💡 For better timeout support on macOS: brew install coreutils" "$BLUE"
    fi
}

# Function to run command with timeout (cross-platform)
run_with_timeout() {
    local cmd="$1"
    local timeout_seconds="$2"
    
    if [ -n "$TIMEOUT_CMD" ]; then
        # Use system timeout command
        $TIMEOUT_CMD $cmd
        return $?
    else
        # Fallback method using background process and kill
        local pid
        local exit_code
        
        # Start the command in background
        $cmd &
        pid=$!
        
        # Start timeout in background
        (
            sleep $timeout_seconds
            if kill -0 $pid 2>/dev/null; then
                log "⏰ Killing process $pid after timeout" "$YELLOW"
                kill -TERM $pid 2>/dev/null || true
                sleep 2
                kill -KILL $pid 2>/dev/null || true
            fi
        ) &
        local timeout_pid=$!
        
        # Wait for the main command
        wait $pid
        exit_code=$?
        
        # Kill the timeout process if command finished
        kill $timeout_pid 2>/dev/null || true
        
        # Return 124 for timeout (same as timeout command)
        if [ $exit_code -eq 143 ] || [ $exit_code -eq 137 ]; then
            return 124
        fi
        
        return $exit_code
    fi
}

# Setup timeout command based on OS
setup_timeout_command

# Main retry loop
log "🚀 Starting generator with timeout and retry logic..." "$BLUE"
log "📋 Configuration: $MAX_ATTEMPTS max attempts, $(format_duration $TIMEOUT_SECONDS) timeout per attempt" "$BLUE"

START_TIME=$(date +%s)

while [ $CURRENT_ATTEMPT -le $MAX_ATTEMPTS ] && [ "$SUCCESS" = false ]; do
    ATTEMPT_START_TIME=$(date +%s)
    
    log "🔄 Attempt $CURRENT_ATTEMPT of $MAX_ATTEMPTS" "$YELLOW"
    log "⏰ Started at: $(date)" "$BLUE"
    
    # Run yarn start with timeout
    if run_with_timeout "yarn start" $TIMEOUT_SECONDS; then
        ATTEMPT_END_TIME=$(date +%s)
        ATTEMPT_DURATION=$((ATTEMPT_END_TIME - ATTEMPT_START_TIME))
        
        log "✅ Generator completed successfully on attempt $CURRENT_ATTEMPT" "$GREEN"
        log "⏱️  Attempt duration: $(format_duration $ATTEMPT_DURATION)" "$GREEN"
        SUCCESS=true
    else
        EXIT_CODE=$?
        ATTEMPT_END_TIME=$(date +%s)
        ATTEMPT_DURATION=$((ATTEMPT_END_TIME - ATTEMPT_START_TIME))
        
        log "⚠️  Attempt $CURRENT_ATTEMPT failed" "$YELLOW"
        log "⏱️  Attempt duration: $(format_duration $ATTEMPT_DURATION)" "$YELLOW"
        
        if [ $EXIT_CODE -eq 124 ]; then
            log "⏰ Process timed out after $(format_duration $TIMEOUT_SECONDS)" "$RED"
        else
            log "💥 Process failed with exit code: $EXIT_CODE" "$RED"
        fi
        
        if [ $CURRENT_ATTEMPT -lt $MAX_ATTEMPTS ]; then
            WAIT_TIME=$(calculate_wait_time $CURRENT_ATTEMPT)
            log "⏳ Waiting $(format_duration $WAIT_TIME) before retry..." "$YELLOW"
            sleep $WAIT_TIME
        fi
    fi
    
    CURRENT_ATTEMPT=$((CURRENT_ATTEMPT + 1))
done

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

if [ "$SUCCESS" = false ]; then
    log "💥 All $MAX_ATTEMPTS attempts failed. Generator could not complete successfully." "$RED"
    log "📊 Total runtime: $(format_duration $TOTAL_DURATION)" "$RED"
    log "🔍 Troubleshooting tips:" "$YELLOW"
    log "   - Check if your generator script has infinite loops" "$YELLOW"
    log "   - Verify all required environment variables are set" "$YELLOW"
    log "   - Check for network connectivity issues" "$YELLOW"
    log "   - Review the logs above for specific error patterns" "$YELLOW"
    if [ -z "$TIMEOUT_CMD" ]; then
        log "   - Consider installing coreutils for better timeout support: brew install coreutils" "$YELLOW"
    fi
    exit 1
fi

log "🎉 Generator completed successfully after $((CURRENT_ATTEMPT - 1)) attempt(s)" "$GREEN"
log "📊 Total runtime: $(format_duration $TOTAL_DURATION)" "$GREEN"

# Optional: Show some stats
if [ $((CURRENT_ATTEMPT - 1)) -gt 1 ]; then
    log "📈 Retry stats: $((CURRENT_ATTEMPT - 2)) retries were needed" "$BLUE"
fi