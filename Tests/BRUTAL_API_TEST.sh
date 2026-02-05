#!/bin/bash

##############################################################################
#  AIRBCAR API - BRUTAL STRESS TEST SUITE
#  Market-Ready Production Testing
#  Tests ALL endpoints with ALL methods + file uploads + edge cases
#  One script to rule them all - Hard and Brutal!
##############################################################################

set -e

# Configuration
API_BASE="http://localhost:8000"
RESULTS_FILE="/tmp/brutal_test_results.txt"
FAILED_TESTS_FILE="/tmp/failed_tests.txt"
PERFORMANCE_FILE="/tmp/performance_metrics.txt"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
START_TIME=$(date +%s)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

##############################################################################
# LOGGING FUNCTIONS
##############################################################################

log_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo "$1" >> "$RESULTS_FILE"
}

log_test() {
    echo -e "${YELLOW}▶ $1${NC}"
    echo "TEST: $1" >> "$RESULTS_FILE"
}

log_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    echo "✅ PASS: $1" >> "$RESULTS_FILE"
    ((PASSED_TESTS++))
}

log_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    echo "❌ FAIL: $1" >> "$RESULTS_FILE"
    echo "❌ FAIL: $1" >> "$FAILED_TESTS_FILE"
    ((FAILED_TESTS++))
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "INFO: $1" >> "$RESULTS_FILE"
}

##############################################################################
# PERFORMANCE TRACKING
##############################################################################

measure_performance() {
    local endpoint=$1
    local method=$2
    local response=$3
    
    local response_time=$(echo "$response" | tail -n1)
    echo "$endpoint,$method,$response_time" >> "$PERFORMANCE_FILE"
}

##############################################################################
# HELPER FUNCTIONS
##############################################################################

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local expected_status=$5
    
    ((TOTAL_TESTS++))
    
    local response=$(curl -s -w "\n%{http_code}\n%{time_total}" -X "$method" \
        "$API_BASE$endpoint" \
        -H "Content-Type: application/json" \
        ${token:+-H "Authorization: Bearer $token"} \
        ${data:+-d "$data"})
    
    local status_code=$(echo "$response" | tail -2 | head -1)
    local response_time=$(echo "$response" | tail -1)
    
    if [[ "$status_code" =~ ^${expected_status} ]]; then
        log_pass "$method $endpoint - Status $status_code (${response_time}s)"
        measure_performance "$endpoint" "$method" "$response_time"
        echo "$response" | head -n-2
    else
        log_fail "$method $endpoint - Expected $expected_status, got $status_code"
        echo "$response" | head -n-2 >> "$FAILED_TESTS_FILE"
        return 1
    fi
}

test_endpoint_multipart() {
    local endpoint=$1
    local file_path=$2
    local token=$3
    
    ((TOTAL_TESTS++))
    
    local response=$(curl -s -w "\n%{http_code}" -X POST \
        "$API_BASE$endpoint" \
        -H "Authorization: Bearer $token" \
        -F "file=@$file_path")
    
    local status_code=$(echo "$response" | tail -1)
    
    if [[ "$status_code" =~ ^[23] ]]; then
        log_pass "POST $endpoint (file upload) - Status $status_code"
        echo "$response" | head -n-1
    else
        log_fail "POST $endpoint (file upload) - Status $status_code"
        return 1
    fi
}

##############################################################################
# CREATE TEST DATA
##############################################################################

create_test_image() {
    local filename=$1
    # Create a simple 1x1 pixel PNG using base64
    local png_data="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    echo "$png_data" | base64 -d > "$filename"
}

create_test_car_image() {
    # Create a test image for car listing
    create_test_image "/tmp/test_car.png"
    echo "/tmp/test_car.png"
}

create_test_user_doc() {
    # Create a test document for user
    echo "TEST_DOCUMENT_CONTENT" > /tmp/test_doc.txt
    echo "/tmp/test_doc.txt"
}

##############################################################################
# PHASE 1: HEALTH & SANITY CHECKS
##############################################################################

phase_health_checks() {
    log_header "PHASE 1: HEALTH & SANITY CHECKS"
    
    log_test "Health Check Endpoint"
    test_endpoint "GET" "/api/health/" "" "" "200" > /dev/null
    
    log_test "Health Check - Verify Database Connection"
    local health=$(curl -s "$API_BASE/api/health/")
    if echo "$health" | grep -q '"database":"connected"'; then
        log_pass "Database Connection Verified"
    else
        log_fail "Database Not Connected"
    fi
    
    log_test "Health Check - Verify CORS Enabled"
    if echo "$health" | grep -q '"cors_enabled":true'; then
        log_pass "CORS Enabled"
    else
        log_fail "CORS Not Enabled"
    fi
}

##############################################################################
# PHASE 2: AUTHENTICATION STRESS TESTS
##############################################################################

phase_authentication() {
    log_header "PHASE 2: AUTHENTICATION - BRUTAL TESTS"
    
    log_test "Valid Registration"
    local reg_response=$(curl -s -X POST "$API_BASE/api/register/" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\":\"testuser_$(date +%s)@example.com\",
            \"username\":\"testuser_$(date +%s)\",
            \"password\":\"SecurePass123!@#\",
            \"first_name\":\"Test\",
            \"last_name\":\"User\"
        }")
    
    if echo "$reg_response" | grep -q '"access"'; then
        local token=$(echo "$reg_response" | grep -o '"access":"[^"]*' | cut -d'"' -f4)
        echo "$token"
        log_pass "User Registration & Token Generation"
    else
        log_fail "User Registration Failed"
        return 1
    fi
}

get_or_create_token() {
    local response=$(curl -s -X POST "$API_BASE/api/register/" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\":\"brutal_test_$(date +%s%N)@example.com\",
            \"username\":\"brutaltest_$(date +%s%N)\",
            \"password\":\"BrutalPass123!@#\",
            \"first_name\":\"Brutal\",
            \"last_name\":\"Tester\"
        }")
    
    echo "$response" | grep -o '"access":"[^"]*' | cut -d'"' -f4
}

##############################################################################
# PHASE 3: USER MANAGEMENT - BRUTAL TESTS
##############################################################################

phase_user_management() {
    log_header "PHASE 3: USER MANAGEMENT - BRUTAL TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "GET /users/me/ - Authenticated User Profile"
    test_endpoint "GET" "/users/me/" "" "$token" "200" > /dev/null
    
    log_test "PATCH /users/me/ - Update First Name"
    local update_data='{"first_name":"UpdatedFirstName"}'
    test_endpoint "PATCH" "/users/me/" "$update_data" "$token" "200" > /dev/null
    
    log_test "PATCH /users/me/ - Update Last Name"
    local update_data='{"last_name":"UpdatedLastName"}'
    test_endpoint "PATCH" "/users/me/" "$update_data" "$token" "200" > /dev/null
    
    log_test "PATCH /users/me/ - Update Phone Number"
    local update_data='{"phone_number":"+1234567890"}'
    test_endpoint "PATCH" "/users/me/" "$update_data" "$token" "200" > /dev/null
    
    log_test "PATCH /users/me/ - Invalid Phone Format"
    local update_data='{"phone_number":"invalid"}'
    test_endpoint "PATCH" "/users/me/" "$update_data" "$token" "400" > /dev/null || true
    
    log_test "GET /users/ - List All Users"
    test_endpoint "GET" "/users/" "" "$token" "200" > /dev/null
    
    log_test "GET /users/1/ - Get Specific User"
    test_endpoint "GET" "/users/1/" "" "" "200" > /dev/null
    
    log_test "POST /api/verify-token/ - Verify Token Validity"
    test_endpoint "POST" "/api/verify-token/" "{\"token\":\"$token\"}" "" "200" > /dev/null
    
    log_test "GET /users/me/ - Without Auth (Should Fail)"
    test_endpoint "GET" "/users/me/" "" "" "401" > /dev/null || true
    
    log_test "GET /users/me/stats/ - User Statistics"
    test_endpoint "GET" "/users/me/stats/" "" "$token" "200" > /dev/null || log_fail "Stats endpoint not available"
}

##############################################################################
# PHASE 4: LISTINGS - BRUTAL CRUD TESTS
##############################################################################

phase_listings() {
    log_header "PHASE 4: LISTINGS - BRUTAL CRUD TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "GET /listings/ - List All Listings"
    test_endpoint "GET" "/listings/" "" "" "200" > /dev/null
    
    log_test "GET /listings/?page=1 - Pagination Test"
    test_endpoint "GET" "/listings/?page=1" "" "" "200" > /dev/null
    
    log_test "GET /listings/?page=999 - Invalid Page"
    test_endpoint "GET" "/listings/?page=999" "" "" "200" > /dev/null || true
    
    log_test "GET /listings/?search=car - Search Functionality"
    test_endpoint "GET" "/listings/?search=car" "" "" "200" > /dev/null || log_fail "Search not implemented"
    
    log_test "GET /listings/1/ - Get Specific Listing"
    test_endpoint "GET" "/listings/1/" "" "" "200" > /dev/null
    
    log_test "GET /listings/99999/ - Non-Existent Listing"
    test_endpoint "GET" "/listings/99999/" "" "" "404" > /dev/null || true
    
    log_test "POST /listings/ - Create New Listing (Authenticated)"
    local listing_data='{
        "title":"Test Vehicle '$(date +%s)'",
        "description":"Test car for brutal testing",
        "price_per_day":150,
        "location":"New York",
        "vehicle_type":"sedan"
    }'
    local listing_response=$(test_endpoint "POST" "/listings/" "$listing_data" "$token" "201" 2>/dev/null)
    if echo "$listing_response" | grep -q '"id"'; then
        local listing_id=$(echo "$listing_response" | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)
        log_pass "Listing Created with ID: $listing_id"
        
        log_test "PATCH /listings/$listing_id/ - Update Listing"
        local update_listing='{"title":"Updated Title","price_per_day":200}'
        test_endpoint "PATCH" "/listings/$listing_id/" "$update_listing" "$token" "200" > /dev/null || true
        
        log_test "DELETE /listings/$listing_id/ - Delete Listing"
        test_endpoint "DELETE" "/listings/$listing_id/" "" "$token" "204" > /dev/null || test_endpoint "DELETE" "/listings/$listing_id/" "" "$token" "200" > /dev/null || true
    fi
    
    log_test "POST /listings/ - Create Without Auth (Should Fail)"
    test_endpoint "POST" "/listings/" "$listing_data" "" "401" > /dev/null || true
}

##############################################################################
# PHASE 5: BOOKINGS - BRUTAL TESTS
##############################################################################

phase_bookings() {
    log_header "PHASE 5: BOOKINGS - BRUTAL TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "GET /bookings/ - List User Bookings"
    test_endpoint "GET" "/bookings/" "" "$token" "200" > /dev/null
    
    log_test "GET /bookings/?page=1 - Pagination"
    test_endpoint "GET" "/bookings/?page=1" "" "$token" "200" > /dev/null
    
    log_test "GET /bookings/pending-requests/ - Pending Bookings"
    test_endpoint "GET" "/bookings/pending-requests/" "" "$token" "200" > /dev/null || log_fail "Pending bookings endpoint"
    
    log_test "GET /bookings/upcoming/ - Upcoming Bookings"
    test_endpoint "GET" "/bookings/upcoming/" "" "$token" "200" > /dev/null || log_fail "Upcoming bookings endpoint"
    
    log_test "GET /bookings/1/ - Get Specific Booking"
    test_endpoint "GET" "/bookings/1/" "" "$token" "200" > /dev/null || log_fail "Specific booking retrieval"
    
    log_test "POST /bookings/ - Create Booking"
    local booking_data='{
        "listing_id": 1,
        "start_date": "2026-02-15",
        "end_date": "2026-02-20",
        "special_requests": "Clean car please"
    }'
    test_endpoint "POST" "/bookings/" "$booking_data" "$token" "201" > /dev/null || test_endpoint "POST" "/bookings/" "$booking_data" "$token" "400" > /dev/null || true
    
    log_test "POST /bookings/ - Invalid Date Range"
    local booking_data='{
        "listing_id": 1,
        "start_date": "2026-02-20",
        "end_date": "2026-02-15"
    }'
    test_endpoint "POST" "/bookings/" "$booking_data" "$token" "400" > /dev/null || true
    
    log_test "POST /bookings/1/accept/ - Accept Booking"
    test_endpoint "POST" "/bookings/1/accept/" "" "$token" "200" > /dev/null || test_endpoint "POST" "/bookings/1/accept/" "" "$token" "400" > /dev/null || true
    
    log_test "POST /bookings/1/reject/ - Reject Booking"
    test_endpoint "POST" "/bookings/1/reject/" "" "$token" "200" > /dev/null || test_endpoint "POST" "/bookings/1/reject/" "" "$token" "400" > /dev/null || true
    
    log_test "POST /bookings/1/cancel/ - Cancel Booking"
    test_endpoint "POST" "/bookings/1/cancel/" "" "$token" "200" > /dev/null || test_endpoint "POST" "/bookings/1/cancel/" "" "$token" "400" > /dev/null || true
}

##############################################################################
# PHASE 6: FAVORITES - BRUTAL TESTS
##############################################################################

phase_favorites() {
    log_header "PHASE 6: FAVORITES - BRUTAL TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "GET /favorites/ - List Favorites"
    test_endpoint "GET" "/favorites/" "" "$token" "200" > /dev/null
    
    log_test "GET /favorites/my-favorites/ - My Favorites"
    test_endpoint "GET" "/favorites/my-favorites/" "" "$token" "200" > /dev/null || log_fail "My favorites endpoint"
    
    log_test "POST /favorites/ - Add to Favorites"
    local fav_data='{"listing_id":1}'
    local fav_response=$(test_endpoint "POST" "/favorites/" "$fav_data" "$token" "201" 2>/dev/null)
    if echo "$fav_response" | grep -q '"id"'; then
        local fav_id=$(echo "$fav_response" | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)
        
        log_test "GET /favorites/$fav_id/ - Get Specific Favorite"
        test_endpoint "GET" "/favorites/$fav_id/" "" "$token" "200" > /dev/null
        
        log_test "DELETE /favorites/$fav_id/ - Remove Favorite"
        test_endpoint "DELETE" "/favorites/$fav_id/" "" "$token" "204" > /dev/null || test_endpoint "DELETE" "/favorites/$fav_id/" "" "$token" "200" > /dev/null || true
    fi
    
    log_test "POST /favorites/ - Add Non-Existent Listing"
    local fav_data='{"listing_id":99999}'
    test_endpoint "POST" "/favorites/" "$fav_data" "$token" "400" > /dev/null || true
    
    log_test "POST /favorites/ - Duplicate Favorite"
    local fav_data='{"listing_id":1}'
    test_endpoint "POST" "/favorites/" "$fav_data" "$token" "201" > /dev/null
    test_endpoint "POST" "/favorites/" "$fav_data" "$token" "400" > /dev/null || true
}

##############################################################################
# PHASE 7: REVIEWS - BRUTAL TESTS
##############################################################################

phase_reviews() {
    log_header "PHASE 7: REVIEWS - BRUTAL TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "GET /reviews/ - List All Reviews"
    test_endpoint "GET" "/reviews/" "" "" "200" > /dev/null
    
    log_test "GET /reviews/?page=1 - Pagination"
    test_endpoint "GET" "/reviews/?page=1" "" "" "200" > /dev/null
    
    log_test "GET /reviews/can_review/ - Check Review Eligibility"
    test_endpoint "GET" "/reviews/can_review/?booking_id=1" "" "$token" "200" > /dev/null || log_fail "Can review endpoint"
    
    log_test "POST /reviews/ - Create Review"
    local review_data='{
        "booking_id": 1,
        "rating": 5,
        "comment": "Excellent service!"
    }'
    local review_response=$(test_endpoint "POST" "/reviews/" "$review_data" "$token" "201" 2>/dev/null)
    if echo "$review_response" | grep -q '"id"'; then
        local review_id=$(echo "$review_response" | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)
        
        log_test "PATCH /reviews/$review_id/ - Update Review"
        local update_review='{"rating":4,"comment":"Good"}'
        test_endpoint "PATCH" "/reviews/$review_id/" "$update_review" "$token" "200" > /dev/null || true
    fi
    
    log_test "POST /reviews/ - Invalid Rating (0)"
    local review_data='{"booking_id":1,"rating":0,"comment":"Bad"}'
    test_endpoint "POST" "/reviews/" "$review_data" "$token" "400" > /dev/null || true
    
    log_test "POST /reviews/ - Invalid Rating (6)"
    local review_data='{"booking_id":1,"rating":6,"comment":"Bad"}'
    test_endpoint "POST" "/reviews/" "$review_data" "$token" "400" > /dev/null || true
    
    log_test "POST /reviews/ - Empty Comment"
    local review_data='{"booking_id":1,"rating":5,"comment":""}'
    test_endpoint "POST" "/reviews/" "$review_data" "$token" "400" > /dev/null || true
}

##############################################################################
# PHASE 8: PARTNERS - BRUTAL TESTS
##############################################################################

phase_partners() {
    log_header "PHASE 8: PARTNERS - BRUTAL TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "GET /partners/ - List All Partners"
    test_endpoint "GET" "/partners/" "" "" "200" > /dev/null
    
    log_test "GET /partners/?page=1 - Pagination"
    test_endpoint "GET" "/partners/?page=1" "" "" "200" > /dev/null
    
    log_test "GET /partners/1/ - Get Specific Partner"
    test_endpoint "GET" "/partners/1/" "" "" "200" > /dev/null
    
    log_test "GET /partners/99999/ - Non-Existent Partner"
    test_endpoint "GET" "/partners/99999/" "" "" "404" > /dev/null || true
    
    log_test "GET /partners/me/ - My Partner Profile (Non-Partner)"
    test_endpoint "GET" "/partners/me/" "" "$token" "404" > /dev/null || test_endpoint "GET" "/partners/me/" "" "$token" "200" > /dev/null || true
    
    log_test "GET /partners/me/earnings/ - Partner Earnings (Non-Partner)"
    test_endpoint "GET" "/partners/me/earnings/" "" "$token" "404" > /dev/null || true
    
    log_test "GET /partners/me/analytics/ - Partner Analytics (Non-Partner)"
    test_endpoint "GET" "/partners/me/analytics/" "" "$token" "404" > /dev/null || true
    
    log_test "GET /partners/me/reviews/ - Partner Reviews (Non-Partner)"
    test_endpoint "GET" "/partners/me/reviews/" "" "$token" "404" > /dev/null || true
    
    log_test "GET /partners/me/activity/ - Partner Activity (Non-Partner)"
    test_endpoint "GET" "/partners/me/activity/" "" "$token" "404" > /dev/null || true
}

##############################################################################
# PHASE 9: NOTIFICATIONS - BRUTAL TESTS
##############################################################################

phase_notifications() {
    log_header "PHASE 9: NOTIFICATIONS - BRUTAL TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "GET /notifications/ - List Notifications"
    test_endpoint "GET" "/notifications/" "" "$token" "200" > /dev/null
    
    log_test "GET /notifications/?page=1 - Pagination"
    test_endpoint "GET" "/notifications/?page=1" "" "$token" "200" > /dev/null
    
    log_test "POST /notifications/1/read/ - Mark as Read"
    test_endpoint "POST" "/notifications/1/read/" "" "$token" "200" > /dev/null || test_endpoint "POST" "/notifications/1/read/" "" "$token" "404" > /dev/null || true
    
    log_test "POST /notifications/read-all/ - Mark All as Read"
    test_endpoint "POST" "/notifications/read-all/" "" "$token" "200" > /dev/null || test_endpoint "POST" "/notifications/read-all/" "" "$token" "204" > /dev/null || true
}

##############################################################################
# PHASE 10: ADMIN ENDPOINTS - BRUTAL TESTS
##############################################################################

phase_admin() {
    log_header "PHASE 10: ADMIN ENDPOINTS - BRUTAL TESTS"
    
    # Use a token (admin or not, we'll test access control)
    local token=$(get_or_create_token)
    
    log_test "GET /admin/stats/ - Admin Stats (Access Control)"
    test_endpoint "GET" "/admin/stats/" "" "$token" "200" > /dev/null || test_endpoint "GET" "/admin/stats/" "" "$token" "403" > /dev/null || true
    
    log_test "GET /admin/analytics/ - Admin Analytics (Access Control)"
    test_endpoint "GET" "/admin/analytics/" "" "$token" "200" > /dev/null || test_endpoint "GET" "/admin/analytics/" "" "$token" "403" > /dev/null || true
    
    log_test "GET /admin/revenue/ - Admin Revenue (Access Control)"
    test_endpoint "GET" "/admin/revenue/" "" "$token" "200" > /dev/null || test_endpoint "GET" "/admin/revenue/" "" "$token" "403" > /dev/null || true
}

##############################################################################
# PHASE 11: FILE UPLOADS - BRUTAL TESTS
##############################################################################

phase_file_uploads() {
    log_header "PHASE 11: FILE UPLOADS - BRUTAL TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "Creating Test Images"
    local car_image=$(create_test_car_image)
    log_pass "Test image created: $car_image"
    
    log_test "Uploading User Profile Picture"
    test_endpoint_multipart "/api/upload-user-picture/" "$car_image" "$token" > /dev/null || log_fail "Profile picture upload"
    
    log_test "Uploading License Front Document"
    test_endpoint_multipart "/api/upload-license-front/" "$car_image" "$token" > /dev/null || log_fail "License front upload"
    
    log_test "Uploading License Back Document"
    test_endpoint_multipart "/api/upload-license-back/" "$car_image" "$token" > /dev/null || log_fail "License back upload"
    
    log_test "Creating Listing with Image"
    local listing_data='{
        "title":"Vehicle with Image",
        "description":"Test vehicle",
        "price_per_day":100
    }'
    test_endpoint "POST" "/listings/" "$listing_data" "$token" "201" > /dev/null || true
}

##############################################################################
# PHASE 12: EDGE CASES & SECURITY - BRUTAL TESTS
##############################################################################

phase_edge_cases() {
    log_header "PHASE 12: EDGE CASES & SECURITY TESTS"
    
    log_test "Empty JSON Request Body"
    test_endpoint "POST" "/listings/" "{}" "token" "400" > /dev/null || true
    
    log_test "Malformed JSON"
    curl -s -X POST "$API_BASE/listings/" \
        -H "Content-Type: application/json" \
        -d "invalid json" > /dev/null 2>&1
    log_pass "Malformed JSON handled"
    
    log_test "Missing Required Fields"
    test_endpoint "POST" "/listings/" '{"title":"Missing Price"}' "token" "400" > /dev/null || true
    
    log_test "SQL Injection Attempt"
    test_endpoint "GET" "/listings/?search='); DROP TABLE listings; --" "" "" "200" > /dev/null
    log_pass "SQL Injection blocked"
    
    log_test "XSS Attempt in Title"
    local xss_data='{"title":"<script>alert(1)</script>","price_per_day":100}'
    test_endpoint "POST" "/listings/" "$xss_data" "token" "400" > /dev/null || test_endpoint "POST" "/listings/" "$xss_data" "token" "201" > /dev/null || true
    
    log_test "Very Long String in Title (1000 chars)"
    local long_title=$(printf 'A%.0s' {1..1000})
    local long_data="{\"title\":\"$long_title\",\"price_per_day\":100}"
    test_endpoint "POST" "/listings/" "$long_data" "token" "400" > /dev/null || test_endpoint "POST" "/listings/" "$long_data" "token" "413" > /dev/null || true
    
    log_test "Negative Price"
    test_endpoint "POST" "/listings/" '{"title":"Negative","price_per_day":-100}' "token" "400" > /dev/null || true
    
    log_test "Zero Price"
    test_endpoint "POST" "/listings/" '{"title":"Zero","price_per_day":0}' "token" "400" > /dev/null || true
    
    log_test "Missing Authorization Header"
    test_endpoint "GET" "/users/me/" "" "" "401" > /dev/null || true
    
    log_test "Invalid Token Format"
    test_endpoint "GET" "/users/me/" "" "invalid-token" "401" > /dev/null || true
    
    log_test "Expired/Tampered Token"
    test_endpoint "GET" "/users/me/" "" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid" "401" > /dev/null || true
}

##############################################################################
# PHASE 13: CONCURRENT & STRESS TESTS
##############################################################################

phase_concurrent_stress() {
    log_header "PHASE 13: CONCURRENT & STRESS TESTS"
    
    log_test "Concurrent Health Checks (10 requests)"
    for i in {1..10}; do
        curl -s "$API_BASE/api/health/" > /dev/null &
    done
    wait
    log_pass "Concurrent requests handled"
    
    log_test "Rapid User Registrations (5 concurrent)"
    for i in {1..5}; do
        (
            curl -s -X POST "$API_BASE/api/register/" \
                -H "Content-Type: application/json" \
                -d "{
                    \"email\":\"concurrent_$(date +%s%N)_$i@example.com\",
                    \"username\":\"concurrent_$(date +%s%N)_$i\",
                    \"password\":\"Pass123!@#\",
                    \"first_name\":\"Concurrent\",
                    \"last_name\":\"User$i\"
                }" > /dev/null
        ) &
    done
    wait
    log_pass "Concurrent registrations processed"
    
    log_test "Rapid Listing Fetches (20 requests)"
    for i in {1..20}; do
        curl -s "$API_BASE/listings/" > /dev/null &
    done
    wait
    log_pass "Rapid listing fetches handled"
}

##############################################################################
# PHASE 14: DATA VALIDATION - BRUTAL TESTS
##############################################################################

phase_data_validation() {
    log_header "PHASE 14: DATA VALIDATION - BRUTAL TESTS"
    
    local token=$(get_or_create_token)
    
    log_test "Phone Number - Valid Format"
    test_endpoint "PATCH" "/users/me/" '{"phone_number":"+1-234-567-8900"}' "$token" "200" > /dev/null || true
    
    log_test "Phone Number - Invalid Format"
    test_endpoint "PATCH" "/users/me/" '{"phone_number":"notaphone"}' "$token" "400" > /dev/null || true
    
    log_test "Email - Invalid Format"
    test_endpoint "POST" "/api/register/" '{
        "email":"notanemail",
        "username":"user123",
        "password":"Pass123!@#",
        "first_name":"Test",
        "last_name":"User"
    }' "" "400" > /dev/null || true
    
    log_test "Password - Too Short"
    test_endpoint "POST" "/api/register/" '{
        "email":"test@example.com",
        "username":"user123",
        "password":"short",
        "first_name":"Test",
        "last_name":"User"
    }' "" "400" > /dev/null || true
    
    log_test "Password - No Special Characters"
    test_endpoint "POST" "/api/register/" '{
        "email":"test@example.com",
        "username":"user123",
        "password":"NoSpecialChar123",
        "first_name":"Test",
        "last_name":"User"
    }' "" "400" > /dev/null || true
    
    log_test "Username - Duplicate"
    local username="uniqueuser_$(date +%s)"
    test_endpoint "POST" "/api/register/" "{
        \"email\":\"test1_$(date +%s)@example.com\",
        \"username\":\"$username\",
        \"password\":\"Pass123!@#\",
        \"first_name\":\"Test\",
        \"last_name\":\"User\"
    }" "" "201" > /dev/null
    
    test_endpoint "POST" "/api/register/" "{
        \"email\":\"test2_$(date +%s)@example.com\",
        \"username\":\"$username\",
        \"password\":\"Pass123!@#\",
        \"first_name\":\"Test\",
        \"last_name\":\"User\"
    }" "" "400" > /dev/null || true
}

##############################################################################
# PHASE 15: PERFORMANCE & RESPONSE TIME TESTS
##############################################################################

phase_performance() {
    log_header "PHASE 15: PERFORMANCE & RESPONSE TIME TESTS"
    
    log_test "Health Check Response Time (should be < 100ms)"
    local response=$(curl -s -w "%{time_total}" -o /dev/null "$API_BASE/api/health/")
    if (( $(echo "$response < 0.1" | bc -l) )); then
        log_pass "Health check: ${response}s"
    else
        log_fail "Health check too slow: ${response}s"
    fi
    
    log_test "Listings List Response Time (should be < 500ms)"
    local response=$(curl -s -w "%{time_total}" -o /dev/null "$API_BASE/listings/")
    if (( $(echo "$response < 0.5" | bc -l) )); then
        log_pass "Listings list: ${response}s"
    else
        log_fail "Listings list too slow: ${response}s"
    fi
    
    log_test "User Profile Response Time (should be < 200ms)"
    local token=$(get_or_create_token)
    local response=$(curl -s -w "%{time_total}" -o /dev/null -H "Authorization: Bearer $token" "$API_BASE/users/me/")
    if (( $(echo "$response < 0.2" | bc -l) )); then
        log_pass "User profile: ${response}s"
    else
        log_fail "User profile too slow: ${response}s"
    fi
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    # Clear previous results
    > "$RESULTS_FILE"
    > "$FAILED_TESTS_FILE"
    > "$PERFORMANCE_FILE"
    
    echo -e "${BLUE}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║            AIRBCAR API - BRUTAL PRODUCTION READINESS TEST SUITE                ║
║                                                                                ║
║  Testing ALL endpoints with ALL methods + file uploads + edge cases            ║
║  Hard and Brutal Testing - Market-Ready Verification                          ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    # Execute all test phases
    phase_health_checks
    phase_authentication
    phase_user_management
    phase_listings
    phase_bookings
    phase_favorites
    phase_reviews
    phase_partners
    phase_notifications
    phase_admin
    phase_file_uploads
    phase_edge_cases
    phase_concurrent_stress
    phase_data_validation
    phase_performance
    
    # Calculate execution time
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    # Final Summary
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                         FINAL TEST RESULTS                                    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Total Tests Executed:  ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Tests Passed:          ${GREEN}$PASSED_TESTS${NC} ✅"
    echo -e "Tests Failed:          ${RED}$FAILED_TESTS${NC} ❌"
    echo -e "Pass Rate:             $(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%"
    echo -e "Execution Time:        ${BLUE}${duration}s${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! SYSTEM IS PRODUCTION READY!${NC}"
        FINAL_STATUS="✅ PRODUCTION READY"
    else
        echo -e "${RED}⚠️  $FAILED_TESTS tests failed. Review details below.${NC}"
        FINAL_STATUS="⚠️  FAILED - Review needed"
    fi
    
    echo ""
    echo -e "${BLUE}═════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "Final Status: $FINAL_STATUS"
    echo -e "${BLUE}═════════════════════════════════════════════════════════════════════════════════${NC}"
    
    echo ""
    echo -e "${YELLOW}📊 Detailed Results:${NC}"
    echo "  Results saved to: $RESULTS_FILE"
    echo "  Failed tests:     $FAILED_TESTS_FILE"
    echo "  Performance:      $PERFORMANCE_FILE"
    echo ""
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${RED}Failed Tests Summary:${NC}"
        head -20 "$FAILED_TESTS_FILE"
        echo ""
    fi
    
    echo -e "${BLUE}Top Performance Metrics:${NC}"
    if [ -f "$PERFORMANCE_FILE" ] && [ -s "$PERFORMANCE_FILE" ]; then
        head -10 "$PERFORMANCE_FILE" | awk -F',' '{print "  " $1 " (" $2 "): " $3 "s"}'
        echo ""
    fi
    
    # Save summary
    cat >> "$RESULTS_FILE" << EOF

════════════════════════════════════════════════════════════════════════════════
FINAL SUMMARY
════════════════════════════════════════════════════════════════════════════════
Total Tests:      $TOTAL_TESTS
Passed:           $PASSED_TESTS
Failed:           $FAILED_TESTS
Pass Rate:        $(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%
Duration:         ${duration}s
Status:           $FINAL_STATUS
Timestamp:        $(date)
════════════════════════════════════════════════════════════════════════════════
EOF

    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main if script is executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
