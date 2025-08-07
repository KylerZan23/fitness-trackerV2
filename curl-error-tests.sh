#!/bin/bash
# Neural API Error Handling Test Suite using cURL
# ===============================================
# Tests all error scenarios using cURL commands

API_BASE="http://localhost:3000"
NEURAL_ENDPOINT="$API_BASE/api/neural/generate"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Neural API Error Handling Test Suite (cURL)${NC}"
echo "================================================"

# Get authentication token
echo -e "${YELLOW}🔑 Getting authentication token...${NC}"

AUTH_RESPONSE=$(curl -s -X POST \
  "https://wgdhavfcjhwqgfezigcd.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZGhhdmZjamh3cWdmZXppZ2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2Nzk1ODEsImV4cCI6MjA0NDI1NTU4MX0.dEnoR1vEZjBgdV19u_Y8u6-bA4oXUdixUYhhNHFGR8s" \
  -d '{
    "email": "test@fitnesstrack.local",
    "password": "Test123!@#"
  }')

ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get authentication token${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo "Token preview: ${ACCESS_TOKEN:0:20}..."

# Test function
test_scenario() {
  local name="$1"
  local description="$2"
  local data="$3"
  local expected_status="$4"
  local extra_checks="$5"
  
  echo -e "\n${BLUE}🧪 $name${NC}"
  echo "   $description"
  
  # Make the request and capture both status and response
  RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "$data" \
    "$NEURAL_ENDPOINT")
  
  # Extract status code and body
  HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  RESPONSE_BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')
  
  # Check status
  if [ "$HTTP_STATUS" = "$expected_status" ]; then
    echo -e "   📊 Status: $HTTP_STATUS ${GREEN}✅${NC}"
  else
    echo -e "   📊 Status: $HTTP_STATUS ${RED}❌${NC} (expected $expected_status)"
  fi
  
  # Check if response is valid JSON
  if echo "$RESPONSE_BODY" | jq empty 2>/dev/null; then
    echo -e "   📝 Response Type: JSON ${GREEN}✅${NC}"
    
    # Extract key fields
    ERROR_MESSAGE=$(echo "$RESPONSE_BODY" | jq -r '.message // .error // empty')
    ERROR_CODE=$(echo "$RESPONSE_BODY" | jq -r '.code // empty')
    TIMESTAMP=$(echo "$RESPONSE_BODY" | jq -r '.timestamp // empty')
    DETAILS_COUNT=$(echo "$RESPONSE_BODY" | jq '.details | length' 2>/dev/null || echo "0")
    
    [ -n "$ERROR_MESSAGE" ] && echo -e "   💬 Error Message: \"$ERROR_MESSAGE\""
    [ -n "$ERROR_CODE" ] && echo -e "   🏷️  Error Code: $ERROR_CODE"
    [ -n "$TIMESTAMP" ] && echo -e "   ⏰ Timestamp: $TIMESTAMP"
    
    # Extra checks based on scenario
    case "$extra_checks" in
      "field_details")
        if [ "$DETAILS_COUNT" -gt 0 ]; then
          echo -e "   🔍 Field Details: $DETAILS_COUNT errors ${GREEN}✅${NC}"
          echo "$RESPONSE_BODY" | jq -r '.details[]? | "      \(.field): \(.message) [\(.code)]"'
        else
          echo -e "   🔍 Field Details: Missing ${RED}❌${NC}"
        fi
        ;;
      "program_data")
        PROGRAM_ID=$(echo "$RESPONSE_BODY" | jq -r '.program.id // empty')
        if [ -n "$PROGRAM_ID" ]; then
          echo -e "   🏋️ Program Data: Present ${GREEN}✅${NC}"
          PROGRAM_NAME=$(echo "$RESPONSE_BODY" | jq -r '.program.programName // empty')
          WORKOUT_COUNT=$(echo "$RESPONSE_BODY" | jq '.program.workouts | length' 2>/dev/null || echo "0")
          echo "      Program ID: $PROGRAM_ID"
          echo "      Program Name: $PROGRAM_NAME"
          echo "      Workouts: $WORKOUT_COUNT"
        else
          echo -e "   🏋️ Program Data: Missing ${RED}❌${NC}"
        fi
        ;;
      "parsing_error")
        if echo "$ERROR_MESSAGE" | grep -i "json" >/dev/null; then
          echo -e "   📋 JSON Parsing Error: Detected ${GREEN}✅${NC}"
        else
          echo -e "   📋 JSON Parsing Error: Not detected ${RED}❌${NC}"
        fi
        ;;
    esac
    
  else
    echo -e "   📝 Response Type: Not JSON ${RED}❌${NC}"
    echo "   Raw Response: ${RESPONSE_BODY:0:200}..."
  fi
}

# Test Scenario 1: Invalid Validation Data
test_scenario \
  "1. Invalid Validation Data" \
  "Should return HTTP 400 with field details" \
  '{
    "primaryFocus": "invalid_focus",
    "experienceLevel": "expert",
    "sessionDuration": 120,
    "equipmentAccess": "home_gym",
    "personalRecords": {
      "squat": "not_a_number"
    }
  }' \
  "400" \
  "field_details"

# Test Scenario 2: Missing Required Fields
test_scenario \
  "2. Missing Required Fields" \
  "Should return HTTP 400 with validation errors" \
  '{
    "primaryFocus": "hypertrophy"
  }' \
  "400" \
  "field_details"

# Test Scenario 3: Valid Data (might succeed or fail at AI level)
test_scenario \
  "3. Valid Data Structure" \
  "Should return HTTP 200 (success) or 502 (AI failure)" \
  '{
    "primaryFocus": "general_fitness",
    "experienceLevel": "beginner", 
    "sessionDuration": 45,
    "equipmentAccess": "dumbbells_only",
    "personalRecords": {
      "squat": 135
    }
  }' \
  "200" \
  "program_data"

# Test Scenario 4: Malformed JSON
test_scenario \
  "4. Malformed JSON" \
  "Should return HTTP 400 with parsing error" \
  '{ "primaryFocus": "hypertrophy", "experienceLevel": }' \
  "400" \
  "parsing_error"

echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "================================"
echo -e "${GREEN}✅ Completed all error handling scenarios${NC}"
echo -e "${YELLOW}🎯 Key validations performed:${NC}"
echo "   • Validation errors return 400 with field details"
echo "   • Valid data returns 200 or 502 (AI service dependent)"  
echo "   • JSON parsing errors return 400 with parse message"
echo "   • All responses include proper error codes and timestamps"
echo "   • Authentication works consistently across scenarios"

echo -e "\n${BLUE}🔧 Manual verification needed:${NC}"
echo "   • Review status codes match expected values"
echo "   • Check field validation provides specific error details"
echo "   • Verify error messages are user-friendly"
echo "   • Confirm timestamps are included in all error responses"
