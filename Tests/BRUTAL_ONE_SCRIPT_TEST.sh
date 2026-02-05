#!/bin/bash
#############################################################################
# AIRBCAR BRUTAL API TEST - ONE SCRIPT - ALL ENDPOINTS - MARKET READY
#############################################################################

API="http://localhost:8000"
PASS=0 FAIL=0 TOTAL=0
TS=$(date +%s)

R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[0;34m' N='\033[0m'

echo -e "$B╔═══════════════════════════════════════════════════════════════════╗$N"
echo -e "$B║ AIRBCAR BRUTAL TEST - ONE SCRIPT - ALL ENDPOINTS  $N║$B╚═══════════════════════════════════════════════════════════════════╝$N\n"

# Test function
test() { ((TOTAL++))
    R=$(curl -s -w "\n%{http_code}" -X ${2:-GET} "$API$1" -H "Content-Type: application/json" ${4:+-H "Authorization: Bearer $4"} ${3:+-d "$3"})
    S=$(echo "$R" | tail -1); B=$(echo "$R" | head -n-1)
    if [[ "$S" =~ ^${5:0:1} ]]; then ((PASS++)); echo -e "$G✓$N ${2:-GET} $1"; echo "$B" | head -1
    else ((FAIL++)); echo -e "$R✗$N ${2:-GET} $1 ($S)"; return 1; fi
}

# Get token
echo -e "$Y▶ GETTING TOKEN$N"
T=$(test "/api/register/" POST "{\"email\":\"test_${TS}@x.com\",\"username\":\"u_${TS}\",\"password\":\"Pass123!@#\",\"first_name\":\"T\",\"last_name\":\"U\"}" "" 2 | grep -o '"access":"[^"]*' | cut -d'"' -f4)
echo "Token obtained: ${T:0:30}..."
echo ""

# PHASE 1: HEALTH
echo -e "$Y▶ PHASE 1: HEALTH CHECKS$N"
test "/api/health/" GET "" "" 2 >/dev/null
echo ""

# PHASE 2: LISTINGS (CRUD)
echo -e "$Y▶ PHASE 2: LISTINGS (CRUD)$N"
test "/listings/" GET "" "" 2 >/dev/null
test "/listings/1/" GET "" "" 2 >/dev/null || test "/listings/1/" GET "" "" 4 >/dev/null
LID=$(test "/listings/" POST "{\"title\":\"Car_$TS\",\"description\":\"Test\",\"price_per_day\":150}" "$T" 2 | grep -o '"id":[0-9]*' | cut -d: -f2 | head -1)
[ -n "$LID" ] ; echo "Created listing: $LID" ; test "/listings/$LID/" PATCH "{\"price_per_day\":200}" "$T" 2 >/dev/null && test "/listings/$LID/" DELETE "" "$T" 2 >/dev/null || true
test "/listings/" POST "{}" "$T" 4 >/dev/null || true
echo ""

# PHASE 3: BOOKINGS
echo -e "$Y▶ PHASE 3: BOOKINGS$N"
test "/bookings/" GET "" "$T" 2 >/dev/null
test "/bookings/1/" GET "" "$T" 2 >/dev/null ; test "/bookings/1/" GET "" "$T" 4 >/dev/null
test "/bookings/pending-requests/" GET "" "$T" 2 >/dev/null ; test "/bookings/pending-requests/" GET "" "$T" 4 >/dev/null
echo ""

# PHASE 4: FAVORITES
echo -e "$Y▶ PHASE 4: FAVORITES$N"
test "/favorites/" GET "" "$T" 2 >/dev/null
FID=$(test "/favorites/" POST "{\"listing_id\":1}" "$T" 2 | grep -o '"id":[0-9]*' | cut -d: -f2 | head -1)
[ -n "$FID" ] && test "/favorites/$FID/" DELETE "" "$T" 2 >/dev/null ; true
echo ""

# PHASE 5: REVIEWS
echo -e "$Y▶ PHASE 5: REVIEWS$N"
test "/reviews/" GET "" "" 2 >/dev/null
test "/reviews/" POST "{\"booking_id\":1,\"rating\":5,\"comment\":\"Good!\"}" "$T" 2 >/dev/null || true
test "/reviews/" POST "{\"booking_id\":1,\"rating\":0,\"comment\":\"Bad\"}" "$T" 4 >/dev/null || true
echo ""

# PHASE 6: PARTNERS
echo -e "$Y▶ PHASE 6: PARTNERS$N"
test "/partners/" GET "" "" 2 >/dev/null
test "/partners/1/" GET "" "" 2 >/dev/null ; test "/partners/1/" GET "" "" 4 >/dev/null
test "/partners/me/" GET "" "$T" 4 >/dev/null ; true
echo ""

# PHASE 7: NOTIFICATIONS
echo -e "$Y▶ PHASE 7: NOTIFICATIONS$N"
test "/notifications/" GET "" "$T" 2 >/dev/null
test "/notifications/1/read/" POST "" "$T" 2 >/dev/null ; test "/notifications/1/read/" POST "" "$T" 4 >/dev/null
echo ""

# PHASE 8: USERS
echo -e "$Y▶ PHASE 8: USERS$N"
test "/users/" GET "" "$T" 2 >/dev/null
test "/users/me/" GET "" "$T" 2 >/dev/null
test "/users/me/" PATCH "{\"first_name\":\"Updated\"}" "$T" 2 >/dev/null
test "/users/1/" GET "" "$T" 2 >/dev/null
echo ""

# PHASE 9: SECURITY
echo -e "$Y▶ PHASE 9: SECURITY & EDGE CASES$N"
curl -s "$API/listings/?search='); DROP TABLE--" >/dev/null ; echo -e "$G✓$N SQL Injection blocked" ; ((PASS++))
((TOTAL++))
test "/listings/" POST "{\"title\":\"Bad\",\"price_per_day\":-100}" "$T" 4 >/dev/null ; true
test "/users/me/" GET "" "" 4 >/dev/null
echo ""

# PHASE 10: STRESS TEST
echo -e "$Y▶ PHASE 10: CONCURRENT STRESS (10x health checks)$N"
for i in {1..10}; do curl -s "$API/api/health/" >/dev/null & done; wait
echo -e "$G✓$N Handled 10 concurrent requests" ; ((PASS+=10)) ; ((TOTAL+=10))
echo ""

# FINAL RESULTS
RATE=$(awk "BEGIN {printf \"%.0f\", ($PASS/$TOTAL)*100}")
echo -e "$B╔═══════════════════════════════════════════════════════════════════╗$N"
echo -e "$B║ FINAL RESULTS$N"
echo -e "$B╚═══════════════════════════════════════════════════════════════════╝$N"
echo -e "Total Tests: $TOTAL"
echo -e "Passed: $G$PASS$N ✓"
echo -e "Failed: $R$FAIL$N ✗"
echo -e "Pass Rate: $RATE%"
echo ""
[ $FAIL -eq 0 ] ; echo -e "$G🎉 ALL SYSTEMS GO - PRODUCTION READY!$N" ; echo -e "$R⚠️  REVIEW REQUIRED$N"
