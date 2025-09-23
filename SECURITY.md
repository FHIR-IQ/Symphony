# Symphony Security Guide

## API Key Security Best Practices

This document outlines security best practices for managing API keys and sensitive information in the Symphony project.

## 🔐 Critical Security Rules

### **NEVER commit API keys to version control**
- API keys should NEVER appear in code files
- Environment files containing keys should NEVER be committed
- Always use environment variables for sensitive information

### **Follow the principle of least privilege**
- Only provide the minimum API permissions needed
- Use separate API keys for different environments
- Regularly rotate API keys

## 📋 Environment Configuration

### Required API Keys

Symphony supports multiple LLM providers. You only need to configure the providers you plan to use:

```bash
# Required: Choose your LLM provider
MODEL_PROVIDER=anthropic  # Options: anthropic, openai, gemini, mock

# Anthropic Claude API (recommended)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI GPT API (optional)
OPENAI_API_KEY=sk-...

# Google Gemini API (optional)
GOOGLE_API_KEY=AI...

# FHIR Server Configuration
HAPI_BASE=http://hapi:8080/fhir
SOURCE_FHIR_BASE=https://hapi.fhir.org/baseR4

# Backend Configuration
BACKEND_URL=http://api:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Setting Up Environment Variables

#### 1. Local Development

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual API keys
nano .env
```

#### 2. Production Deployment

**For Vercel:**
```bash
# Set environment variables in Vercel dashboard
# Or use Vercel CLI
vercel env add ANTHROPIC_API_KEY
```

**For Docker:**
```bash
# Use environment variables
docker run -e ANTHROPIC_API_KEY=your-key-here symphony-backend

# Or use env file (not committed to git)
docker run --env-file .env.production symphony-backend
```

## 🛡️ API Key Security Measures

### 1. Environment File Protection

Our `.gitignore` protects these patterns:
```
.env*                    # All environment files
!.env.example           # Except the example template
*.env                   # Any file ending in .env
secrets/               # Any secrets directory
*_api_key.txt         # Any API key text files
```

### 2. Code-Level Protection

**✅ Correct way to access API keys:**
```python
import os
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found")
```

**❌ NEVER do this:**
```python
# NEVER hardcode API keys
api_key = "sk-ant-api03-..."  # DON'T DO THIS
```

### 3. Logging Security

Our logging configuration:
- API keys are NEVER logged
- Request/response bodies are sanitized
- Error messages don't expose sensitive data

```python
# Safe logging
logger.info(f"Using provider: {provider}")

# Unsafe logging - NEVER do this
logger.info(f"API key: {api_key}")  # DON'T DO THIS
```

## 🔧 Obtaining API Keys

### Anthropic Claude API

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-api03-`)
6. Add to your `.env` file

**Recommended models:**
- `claude-3-opus-20240229` (highest quality)
- `claude-3-sonnet-20240229` (balanced)
- `claude-3-haiku-20240307` (fastest/cheapest)

### OpenAI API (Alternative)

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new secret key
5. Copy the key (starts with `sk-`)
6. Add to your `.env` file

### Google Gemini API (Alternative)

1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Sign up or log in
3. Get API key
4. Copy the key (starts with `AI`)
5. Add to your `.env` file

## 🚨 Security Checklist

Before deploying or committing code, verify:

- [ ] No API keys in code files
- [ ] `.env` files are in `.gitignore`
- [ ] Environment variables are set in deployment platform
- [ ] API keys have appropriate permissions/limits
- [ ] Different keys for development/staging/production
- [ ] Regular key rotation schedule in place

## 🔍 Security Monitoring

### Check for Exposed Keys

```bash
# Search for potential API keys in code
grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "API_KEY" . --exclude-dir=node_modules --exclude-dir=.git

# Check git history for accidentally committed keys
git log --grep="key"
```

### Verify .gitignore

```bash
# Test that .env files are ignored
echo "ANTHROPIC_API_KEY=test" > .env.test
git check-ignore .env.test  # Should return the filename
rm .env.test
```

## 🚑 Security Incident Response

### If API Key is Accidentally Committed

1. **Immediately rotate the exposed key**
   - Deactivate the old key in the provider console
   - Generate a new key
   - Update all environments

2. **Clean git history** (if needed)
   ```bash
   # Remove sensitive data from git history
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push to update remote** (coordinate with team)
   ```bash
   git push origin --force --all
   ```

### If Unauthorized API Usage Detected

1. Immediately revoke/rotate all API keys
2. Check API usage logs in provider console
3. Review recent deployments and code changes
4. Update keys in all environments
5. Monitor for continued unauthorized usage

## 📚 Additional Security Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Anthropic API Security](https://docs.anthropic.com/claude/docs/api-security)
- [12-Factor App Config](https://12factor.net/config)
- [Git Secrets Tool](https://github.com/awslabs/git-secrets)

## 🔄 Key Rotation Schedule

- **Development**: Rotate every 90 days
- **Staging**: Rotate every 60 days
- **Production**: Rotate every 30 days
- **Immediately**: After any suspected compromise

## 📞 Support

For security-related questions or incidents:
- Review this documentation
- Check provider documentation
- Create GitHub issue with security label (no sensitive data)
- Contact development team