#!/bin/bash

# Security Penetration Test Runner
# Automated security testing for LogiVox WMS

set -e

echo "🔒 LogiVox Security Penetration Test Suite"
echo "==========================================="
echo ""

# Configuration
TARGET_URL="${TARGET_URL:-http://localhost:3000}"
REPORT_DIR="./security-reports"
mkdir -p "$REPORT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo "Running: $test_name"
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        return 1
    fi
}

# 1. Dependency Audit
echo "📦 1. Dependency Vulnerability Scan"
echo "-----------------------------------"
npm audit --json > "$REPORT_DIR/npm-audit.json"
VULNERABILITIES=$(npm audit --json | jq '.metadata.vulnerabilities | to_entries[] | select(.key != "info" and .key != "low") | .value' | jq -s 'add')

if [ "$VULNERABILITIES" -eq 0 ]; then
    echo -e "${GREEN}✅ No critical/high vulnerabilities found${NC}"
else
    echo -e "${RED}❌ Found $VULNERABILITIES critical/high vulnerabilities${NC}"
    npm audit
fi
echo ""

# 2. Security Headers Check
echo "🛡️  2. Security Headers Validation"
echo "-----------------------------------"
check_header() {
    local header=$1
    local expected=$2
    local response=$(curl -s -I "$TARGET_URL" | grep -i "$header")
    
    if [[ ! -z "$response" ]]; then
        echo -e "${GREEN}✅${NC} $header: Present"
    else
        echo -e "${RED}❌${NC} $header: Missing"
    fi
}

check_header "Strict-Transport-Security"
check_header "X-Frame-Options"
check_header "X-Content-Type-Options"
check_header "Content-Security-Policy"
check_header "X-XSS-Protection"
echo ""

# 3. Authentication Tests
echo "🔐 3. Authentication Security Tests"
echo "-----------------------------------"

# Test: Weak password rejection
echo "Testing: Weak password rejection"
WEAK_PASS_RESPONSE=$(curl -s -X POST "$TARGET_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"123"}' \
    -w "%{http_code}")

if [[ "$WEAK_PASS_RESPONSE" == *"400"* ]] || [[ "$WEAK_PASS_RESPONSE" == *"422"* ]]; then
    echo -e "${GREEN}✅ Weak passwords rejected${NC}"
else
    echo -e "${RED}❌ Weak passwords accepted${NC}"
fi

# Test: SQL injection in login
echo "Testing: SQL injection prevention"
SQL_INJECTION_RESPONSE=$(curl -s -X POST "$TARGET_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"' OR '1'='1"}' \
    -w "%{http_code}")

if [[ "$SQL_INJECTION_RESPONSE" == *"401"* ]] || [[ "$SQL_INJECTION_RESPONSE" == *"400"* ]]; then
    echo -e "${GREEN}✅ SQL injection prevented${NC}"
else
    echo -e "${RED}❌ Potential SQL injection vulnerability${NC}"
fi

# Test: Rate limiting
echo "Testing: Rate limiting on login endpoint"
RATE_LIMIT_COUNT=0
for i in {1..15}; do
    RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$TARGET_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}')
    
    if [[ "$RESPONSE_CODE" == "429" ]]; then
        RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
    fi
done

if [ "$RATE_LIMIT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Rate limiting active (triggered after $((15 - RATE_LIMIT_COUNT)) attempts)${NC}"
else
    echo -e "${YELLOW}⚠️  Rate limiting not detected${NC}"
fi
echo ""

# 4. Authorization Tests
echo "🔑 4. Authorization & Access Control Tests"
echo "------------------------------------------"

# Test: Unauthorized API access
echo "Testing: API requires authentication"
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/inventory")

if [[ "$UNAUTH_RESPONSE" == "401" ]]; then
    echo -e "${GREEN}✅ API requires authentication${NC}"
else
    echo -e "${RED}❌ API accessible without authentication${NC}"
fi

# Test: Path traversal
echo "Testing: Path traversal prevention"
PATH_TRAVERSAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/files/../../etc/passwd")

if [[ "$PATH_TRAVERSAL_RESPONSE" == "400"* ]] || [[ "$PATH_TRAVERSAL_RESPONSE" == "404"* ]]; then
    echo -e "${GREEN}✅ Path traversal blocked${NC}"
else
    echo -e "${RED}❌ Potential path traversal vulnerability${NC}"
fi
echo ""

# 5. XSS Tests
echo "🚨 5. Cross-Site Scripting (XSS) Tests"
echo "--------------------------------------"

# Test: Reflected XSS
echo "Testing: Reflected XSS prevention"
XSS_PAYLOAD="<script>alert('xss')</script>"
XSS_RESPONSE=$(curl -s "$TARGET_URL/search?q=$XSS_PAYLOAD")

if [[ "$XSS_RESPONSE" == *"<script>"* ]]; then
    echo -e "${RED}❌ Potential reflected XSS vulnerability${NC}"
else
    echo -e "${GREEN}✅ XSS payload sanitized${NC}"
fi
echo ""

# 6. CSRF Tests
echo "🔄 6. Cross-Site Request Forgery (CSRF) Tests"
echo "---------------------------------------------"

# Test: CSRF token validation
echo "Testing: CSRF protection"
CSRF_RESPONSE=$(curl -s -X POST "$TARGET_URL/api/orders" \
    -H "Content-Type: application/json" \
    -d '{"productId":"PROD-001","quantity":10}' \
    -w "%{http_code}")

if [[ "$CSRF_RESPONSE" == *"403"* ]]; then
    echo -e "${GREEN}✅ CSRF token required${NC}"
else
    echo -e "${YELLOW}⚠️  CSRF token might not be enforced${NC}"
fi
echo ""

# 7. Information Disclosure
echo "📢 7. Information Disclosure Tests"
echo "-----------------------------------"

# Test: Error messages
echo "Testing: Verbose error messages"
ERROR_RESPONSE=$(curl -s "$TARGET_URL/api/nonexistent")

if [[ "$ERROR_RESPONSE" == *"stack"* ]] || [[ "$ERROR_RESPONSE" == *"at "* ]]; then
    echo -e "${RED}❌ Stack traces exposed in errors${NC}"
else
    echo -e "${GREEN}✅ Generic error messages${NC}"
fi

# Test: Server version disclosure
echo "Testing: Server version disclosure"
SERVER_HEADER=$(curl -s -I "$TARGET_URL" | grep -i "server:")

if [[ -z "$SERVER_HEADER" ]]; then
    echo -e "${GREEN}✅ Server version not disclosed${NC}"
else
    echo -e "${YELLOW}⚠️  Server header present: $SERVER_HEADER${NC}"
fi
echo ""

# 8. SSL/TLS Tests
echo "🔐 8. SSL/TLS Configuration Tests"
echo "---------------------------------"

if [[ "$TARGET_URL" == https://* ]]; then
    # Test SSL Labs (requires API key)
    echo "Testing: SSL configuration"
    
    # Test weak ciphers with nmap (if installed)
    if command -v nmap &> /dev/null; then
        HOST=$(echo "$TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
        nmap --script ssl-enum-ciphers -p 443 "$HOST" > "$REPORT_DIR/ssl-scan.txt" 2>&1
        
        if grep -q "SSLv2\|SSLv3\|TLSv1.0\|TLSv1.1" "$REPORT_DIR/ssl-scan.txt"; then
            echo -e "${RED}❌ Weak SSL/TLS versions enabled${NC}"
        else
            echo -e "${GREEN}✅ Strong SSL/TLS configuration${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  nmap not installed, skipping SSL scan${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  HTTPS not enabled for testing${NC}"
fi
echo ""

# 9. File Upload Tests
echo "📁 9. File Upload Security Tests"
echo "--------------------------------"

# Test: Malicious file upload
echo "Testing: Malicious file upload prevention"
echo '<?php system($_GET["cmd"]); ?>' > /tmp/test-upload.php

UPLOAD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$TARGET_URL/api/upload" \
    -F "file=@/tmp/test-upload.php")

rm /tmp/test-upload.php

if [[ "$UPLOAD_RESPONSE" == "400"* ]] || [[ "$UPLOAD_RESPONSE" == "415"* ]]; then
    echo -e "${GREEN}✅ Malicious file uploads blocked${NC}"
else
    echo -e "${RED}❌ Malicious files might be accepted${NC}"
fi
echo ""

# 10. SSRF Tests
echo "🌐 10. Server-Side Request Forgery (SSRF) Tests"
echo "-----------------------------------------------"

# Test: Internal network access
echo "Testing: SSRF prevention"
SSRF_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/fetch?url=http://localhost:5432")

if [[ "$SSRF_RESPONSE" == "400"* ]] || [[ "$SSRF_RESPONSE" == "403"* ]]; then
    echo -e "${GREEN}✅ SSRF attempts blocked${NC}"
else
    echo -e "${RED}❌ Potential SSRF vulnerability${NC}"
fi
echo ""

# Summary Report
echo "📊 Summary Report"
echo "=================="
echo ""
echo "Report saved to: $REPORT_DIR/"
echo ""
echo "Recommendations:"
echo "1. Review all ❌ FAIL and ⚠️  WARNING items"
echo "2. Fix critical vulnerabilities immediately"
echo "3. Run full OWASP ZAP scan for comprehensive testing"
echo "4. Schedule regular security audits"
echo ""
echo "Next Steps:"
echo "- Review detailed reports in $REPORT_DIR/"
echo "- Fix identified vulnerabilities"
echo "- Re-run this test suite"
echo "- Consider third-party penetration testing"
echo ""

# Generate summary JSON
cat > "$REPORT_DIR/summary.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "target": "$TARGET_URL",
  "tests_run": 10,
  "report_directory": "$REPORT_DIR"
}
EOF

echo "✅ Security test suite completed!"
