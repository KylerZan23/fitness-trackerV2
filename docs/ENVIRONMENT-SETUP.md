# Environment Variable Setup Guide

## Overview

This guide covers setting up environment variables for NeuralLift development and deployment. The application uses robust Zod-based validation to ensure all required configuration is properly set.

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Environment File Setup

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local  # If .env.example exists
# OR create manually:
touch .env.local
```

### 3. Configure Required Variables

Add the following to your `.env.local` file:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# AI/LLM Configuration (Required for AI features)
LLM_API_KEY=sk-...your-openai-api-key...

# Optional: Custom LLM endpoint
LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions

# Strava Integration (Optional)
NEXT_PUBLIC_STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=a1b2c3d4e5f6...
NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/auth/strava/callback
```

### 4. Validate Configuration

```bash
yarn validate:env
```

### 5. Start Development Server

```bash
yarn dev
# OR with validation:
yarn dev:validate
```

## Environment Variables Reference

### Core Application Variables

#### `NEXT_PUBLIC_SUPABASE_URL` (Required)

- **Description**: Your Supabase project URL
- **Format**: `https://your-project.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Example**: `https://abcdefghijklmnop.supabase.co`

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Required)

- **Description**: Supabase anonymous/public key for client-side access
- **Format**: JWT token starting with `eyJ`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → anon/public
- **Security**: Safe to expose on client-side
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### `SUPABASE_SERVICE_ROLE_KEY` (Server-only)

- **Description**: Supabase service role key for server-side operations
- **Format**: JWT token starting with `eyJ`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → service_role
- **Security**: ⚠️ **NEVER expose on client-side** - server-only
- **Required**: Development (recommended), Production (required)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### AI/LLM Configuration

#### `LLM_API_KEY` (Required for AI features)

- **Description**: API key for LLM service (OpenAI or Anthropic)
- **Format**: `sk-` (OpenAI) or `ak-` (Anthropic) prefix
- **Where to find**:
  - OpenAI: https://platform.openai.com/api-keys
  - Anthropic: https://console.anthropic.com/
- **Security**: Server-only, never expose on client-side
- **Example**: `sk-1234567890abcdef...`

#### `LLM_API_ENDPOINT` (Optional)

- **Description**: Custom LLM API endpoint
- **Default**: `https://api.openai.com/v1/chat/completions`
- **Use case**: Custom AI providers or local LLM servers
- **Example**: `https://api.anthropic.com/v1/messages`

### Strava Integration (Optional)

#### `NEXT_PUBLIC_STRAVA_CLIENT_ID` (Optional)

- **Description**: Strava app client ID for OAuth
- **Format**: Numeric string
- **Where to find**: https://www.strava.com/settings/api
- **Security**: Safe to expose on client-side
- **Example**: `12345`

#### `STRAVA_CLIENT_SECRET` (Optional)

- **Description**: Strava app client secret for OAuth
- **Format**: 40-character hexadecimal string
- **Where to find**: https://www.strava.com/settings/api
- **Security**: Server-only, never expose on client-side
- **Example**: `a1b2c3d4e5f6789012345678901234567890abcd`

#### `NEXT_PUBLIC_STRAVA_REDIRECT_URI` (Optional)

- **Description**: OAuth redirect URI for Strava integration
- **Format**: Full URL
- **Must match**: URI configured in Strava app settings
- **Example**: `http://localhost:3000/auth/strava/callback`

## Environment-Specific Setup

### Development Environment

**Required Variables:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Recommended Variables:**

- `SUPABASE_SERVICE_ROLE_KEY` (for server actions)
- `LLM_API_KEY` (for AI features)

**Optional Variables:**

- Strava integration variables (if testing Strava features)

### Production Environment

**Required Variables:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_API_KEY`

**Optional Variables:**

- `LLM_API_ENDPOINT` (if using custom AI provider)
- Strava integration variables (if Strava features are enabled)

### Test Environment

**Required Variables:**

- `NEXT_PUBLIC_SUPABASE_URL` (test database)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (test database)

**Optional Variables:**

- Most other variables can be mocked in tests

## Getting API Keys

### Supabase Setup

1. **Create Account**: Sign up at https://supabase.com
2. **Create Project**: New project → Choose region → Set database password
3. **Get Credentials**:
   - Go to Settings → API
   - Copy Project URL and API keys
4. **Configure Database**: Run migrations if needed

### OpenAI Setup

1. **Create Account**: Sign up at https://platform.openai.com
2. **Add Payment Method**: Required for API access
3. **Create API Key**:
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy and store securely
4. **Set Limits**: Configure usage limits if desired

### Strava Setup (Optional)

1. **Create Account**: Sign up at https://www.strava.com
2. **Create App**:
   - Go to https://www.strava.com/settings/api
   - Click "Create & Manage Your App"
   - Fill in app details
3. **Get Credentials**: Copy Client ID and Client Secret
4. **Configure Redirect**: Set authorization callback domain

## Validation and Testing

### Validate Environment

```bash
# Check current environment
yarn validate:env

# Check specific environment
yarn validate:env:development
yarn validate:env:production

# Start development with validation
yarn dev:validate
```

### Expected Output (Success)

```
🔍 Validating environment configuration...

📊 Environment: development
📂 Loading from: .env.local

✅ Environment validation passed!

🎯 Feature Availability:
   Core Services: ✅
   AI Features: ✅
   Strava Integration: ❌

🏥 Overall Health: HEALTHY
```

### Expected Output (Errors)

```
❌ Environment validation failed!

────────────────────────────────────────────────────────────────────────────────
🚨 ENVIRONMENT CONFIGURATION ERROR
────────────────────────────────────────────────────────────────────────────────

Environment validation failed for development environment

DETAILS:
  ❌ NEXT_PUBLIC_SUPABASE_URL: Required
  ❌ LLM_API_KEY: must be a valid OpenAI or Anthropic API key

SETUP INSTRUCTIONS:
  Get your Supabase URL from: https://supabase.com/dashboard → Settings → API
  Get your OpenAI API key from: https://platform.openai.com/api-keys

NEXT STEPS:
  1. Create or update your .env.local file
  2. Add the missing environment variables
  3. Restart your development server
  4. Run 'yarn validate:env' to verify your configuration
```

## Security Best Practices

### Development

- ✅ Use `.env.local` for local development
- ✅ Never commit `.env.local` to git
- ✅ Use separate Supabase project for development
- ✅ Limit OpenAI API usage and set spending limits

### Production

- ✅ Use environment variable management service (Vercel, etc.)
- ✅ Rotate secrets regularly
- ✅ Use separate credentials for each environment
- ✅ Monitor API usage and costs
- ❌ Never log secret values
- ❌ Never expose server-only keys on client-side

### Environment Separation

```
Development   →   dev.supabase.co/your-dev-project
Staging       →   staging.supabase.co/your-staging-project
Production    →   prod.supabase.co/your-prod-project
```

## Troubleshooting

### Common Issues

#### "Environment validation failed"

- **Cause**: Missing or invalid environment variables
- **Solution**: Check the error message and update `.env.local`
- **Debug**: Run `yarn validate:env` for detailed errors

#### "Supabase client cannot be initialized"

- **Cause**: Invalid Supabase URL or key format
- **Solution**: Verify URL format and key starts with `eyJ`
- **Debug**: Check Supabase dashboard for correct values

#### "AI Service configuration error"

- **Cause**: Missing or invalid LLM API key
- **Solution**: Set valid OpenAI API key starting with `sk-`
- **Debug**: Test API key with OpenAI playground

#### "Strava integration not working"

- **Cause**: Missing or invalid Strava credentials
- **Solution**: Check Strava app settings and redirect URI
- **Debug**: Verify callback URL matches exactly

### Development Server Won't Start

1. **Check Environment**: `yarn validate:env`
2. **Clear Cache**: `rm -rf .next && yarn dev`
3. **Check Logs**: Look for specific error messages
4. **Verify Dependencies**: `yarn install`

### Features Not Working

1. **Check Feature Availability**: Environment validation shows feature status
2. **Verify Credentials**: Test API keys independently
3. **Check Network**: Ensure API endpoints are accessible
4. **Review Logs**: Check browser and server console logs

## CI/CD Integration

### GitHub Actions

The environment validation is integrated into the CI/CD pipeline:

```yaml
# Automatic validation in CI
- name: Validate Environment Variables
  run: yarn validate:env
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL_STAGING }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING }}
    # ... other environment variables
```

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

**Staging Environment:**

- `NEXT_PUBLIC_SUPABASE_URL_STAGING`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
- `SUPABASE_SERVICE_ROLE_KEY_STAGING`
- `LLM_API_KEY_STAGING` (optional)

**Production Environment:**

- `NEXT_PUBLIC_SUPABASE_URL_PROD`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD`
- `SUPABASE_SERVICE_ROLE_KEY_PROD`
- `LLM_API_KEY_PROD`

## Support

### Getting Help

1. **Check this documentation** for setup instructions
2. **Run validation script** to identify specific issues
3. **Check logs** for detailed error messages
4. **Review API documentation** for external services
5. **Contact development team** for persistent issues

### Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Strava API Documentation](https://developers.strava.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Last Updated**: 2025-01-19
**Version**: 1.0
