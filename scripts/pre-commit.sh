#!/bin/bash

# Pre-commit hook to prevent secrets from being committed
# Install with: ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit

echo "🔒 Running security checks before commit..."

# Check for potential secrets in staged files
if git diff --cached --name-only | xargs grep -l -E "(password|secret|key|token|api_key|auth_token)" 2>/dev/null; then
    echo "❌ BLOCKED: Potential secrets detected in staged files:"
    git diff --cached --name-only | xargs grep -n -E "(password|secret|key|token|api_key|auth_token)" 2>/dev/null
    echo ""
    echo "💡 To fix this:"
    echo "   1. Remove the secrets from your files"
    echo "   2. Use environment variables or secrets management"
    echo "   3. Add sensitive files to .gitignore"
    echo ""
    exit 1
fi

# Check for .env files being committed
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo "❌ BLOCKED: .env file cannot be committed"
    echo "💡 Use .env.example instead and add .env to .gitignore"
    exit 1
fi

# Check for common secret file patterns
SECRET_PATTERNS="\.pem$|\.key$|\.crt$|\.p12$|\.pfx$|auth\.json$|service-account.*\.json$"
if git diff --cached --name-only | grep -qE "$SECRET_PATTERNS"; then
    echo "❌ BLOCKED: Security-sensitive files detected:"
    git diff --cached --name-only | grep -E "$SECRET_PATTERNS"
    echo "💡 Add these file types to .gitignore"
    exit 1
fi

# Check for hardcoded database URLs with credentials
if git diff --cached | grep -qE "postgresql://[^:]+:[^@]+@"; then
    echo "❌ BLOCKED: Database credentials detected in diff"
    echo "💡 Use environment variables for database connections"
    exit 1
fi

echo "✅ Security checks passed! 🎉"
exit 0