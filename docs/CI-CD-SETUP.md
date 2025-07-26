# CI/CD Pipeline Setup Guide

## Overview

This guide covers the complete setup and usage of NeuralLift's CI/CD pipeline using GitHub Actions. The pipeline ensures code quality, automated testing, and safe deployments to staging and production environments.

## Pipeline Architecture

### CI Pipeline (Continuous Integration)

**Trigger**: Pull Requests and pushes to `main`/`develop` branches
**Purpose**: Validate code quality and prevent broken code from being merged

**Jobs:**

1. **Lint & Format Check** - ESLint and Prettier validation
2. **Unit Tests** - Jest tests with coverage reporting
3. **Build** - Next.js production build validation
4. **E2E Tests** - Playwright tests across multiple browsers
5. **Security Scan** - Dependency vulnerabilities and CodeQL analysis

### CD Pipeline (Continuous Deployment)

**Staging**: Automatic deployment on `main` branch push
**Production**: Manual deployment with approval gates

## Initial Setup

### 1. GitHub Secrets Configuration

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

#### Supabase Secrets (Staging)

```
NEXT_PUBLIC_SUPABASE_URL_STAGING
NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING
SUPABASE_ACCESS_TOKEN_STAGING
SUPABASE_PROJECT_REF_STAGING
SUPABASE_DB_PASSWORD_STAGING
```

#### Supabase Secrets (Production)

```
NEXT_PUBLIC_SUPABASE_URL_PROD
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD
SUPABASE_ACCESS_TOKEN_PROD
SUPABASE_PROJECT_REF_PROD
SUPABASE_DB_PASSWORD_PROD
```

#### Vercel Deployment Secrets

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### 2. Environment Setup

#### Obtaining Supabase Credentials

**For each environment (staging/production):**

1. **Supabase URL & Anon Key**:

   ```bash
   # Found in Supabase Dashboard → Settings → API
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Access Token**:

   ```bash
   # Generate in Supabase Dashboard → Settings → Access Tokens
   SUPABASE_ACCESS_TOKEN=your-access-token
   ```

3. **Project Reference**:

   ```bash
   # Found in Supabase Dashboard → Settings → General
   SUPABASE_PROJECT_REF=your-project-ref
   ```

4. **Database Password**:
   ```bash
   # Database password set during project creation
   SUPABASE_DB_PASSWORD=your-db-password
   ```

#### Obtaining Vercel Credentials

1. **Vercel Token**:

   ```bash
   # Generate in Vercel Dashboard → Settings → Tokens
   VERCEL_TOKEN=your-vercel-token
   ```

2. **Organization & Project IDs**:
   ```bash
   # Run in your local project directory
   npx vercel link
   cat .vercel/project.json
   ```

### 3. Branch Protection Rules

Configure branch protection for `main` branch:

1. Go to Repository Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Required status checks:
     - `CI Status Check`
     - `Lint and Format Check`
     - `Unit Tests`
     - `Build Application`
     - `E2E Tests`

### 4. Environment Configuration

#### GitHub Environments

1. Go to Repository Settings → Environments
2. Create `staging` environment:
   - No protection rules needed (automatic deployment)
3. Create `production` environment:
   - ✅ Required reviewers (add team leads)
   - ✅ Wait timer: 5 minutes
   - ✅ Deployment branches: Selected branches (`main` only)

## Workflow Usage

### Developer Workflow

#### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/awesome-feature

# Make changes and commit
git add .
git commit -m "feat: add awesome feature"
git push origin feature/awesome-feature
```

#### 2. Pull Request

1. Create PR from feature branch to `main`
2. CI pipeline automatically runs:
   - Code linting and formatting checks
   - Unit tests with coverage
   - Build validation
   - E2E tests
   - Security scanning

#### 3. Code Review

- Review code changes
- Ensure all CI checks pass (green checkmarks)
- Approve and merge when ready

#### 4. Automatic Staging Deployment

- Merge to `main` triggers staging deployment
- Monitor deployment progress in Actions tab
- Test changes on staging environment

#### 5. Production Deployment

1. Go to Actions tab → "CD - Production Deployment"
2. Click "Run workflow"
3. Fill in required fields:
   - Confirmation: Type "DEPLOY" exactly
   - Deployment reason: Brief description
4. Click "Run workflow"
5. Monitor deployment progress

### CI Pipeline Details

#### Lint and Format Check

```yaml
# Runs ESLint and Prettier
yarn lint
yarn format:check
```

#### Unit Tests

```yaml
# Runs Jest with coverage
yarn test:coverage
# Uploads coverage to Codecov
```

#### Build Validation

```yaml
# Tests production build
yarn build
```

#### E2E Tests

```yaml
# Runs Playwright tests
yarn test:e2e
# Tests multiple browsers: Chrome, Firefox, Safari, Mobile
```

#### Security Scanning

```yaml
# Dependency vulnerabilities
yarn audit --level moderate
# CodeQL static analysis
```

### CD Pipeline Details

#### Staging Deployment

1. **Validation**: Re-runs all CI checks
2. **Database Migration Check**: Validates pending migrations
3. **Deploy**: Deploys to Vercel preview environment
4. **Database Migrations**: Applies migrations to staging DB
5. **Smoke Tests**: Runs critical E2E tests

#### Production Deployment

1. **Pre-deployment Checks**: Comprehensive validation
2. **Database Backup**: Creates production backup
3. **Deploy**: Deploys to Vercel production
4. **Database Migrations**: Applies migrations to production DB
5. **Health Checks**: Validates deployment health
6. **Notifications**: Deployment status updates

## Monitoring and Troubleshooting

### Monitoring Deployment Status

#### GitHub Actions UI

- **Actions Tab**: View all workflow runs
- **Status Badges**: Green/red indicators for each job
- **Logs**: Detailed execution logs for debugging

#### Deployment Summaries

- **Staging**: Automatic summary with deployment URL
- **Production**: Comprehensive deployment report

### Common Issues and Solutions

#### CI Failures

**Linting Errors:**

```bash
# Fix locally
yarn lint:fix
git add . && git commit -m "fix: linting errors"
```

**Test Failures:**

```bash
# Run tests locally
yarn test:watch
# Fix failing tests and commit
```

**Build Errors:**

```bash
# Test build locally
yarn build
# Fix build issues and commit
```

#### CD Failures

**Environment Variables:**

- Verify all secrets are correctly set
- Check secret names match exactly

**Database Migrations:**

```bash
# Test migrations locally
supabase db push --dry-run
```

**Deployment Issues:**

- Check Vercel token permissions
- Verify project configuration

### Rollback Procedures

#### Code Rollback

1. **Identify Last Good Commit:**

   ```bash
   git log --oneline
   ```

2. **Revert Changes:**

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Trigger Deployment:**
   - Staging deploys automatically
   - Production requires manual trigger

#### Database Rollback

1. **Access Supabase Dashboard**
2. **Go to Database → Backups**
3. **Restore from Backup:**
   - Select backup timestamp before migration
   - Confirm restoration

## Performance Optimization

### CI Pipeline Optimization

- **Parallel Jobs**: Most jobs run in parallel
- **Caching**: Node modules cached between runs
- **Conditional Steps**: Database migrations only run when needed

### Monitoring Metrics

- **CI Duration**: Target < 5 minutes
- **CD Duration**: Target < 10 minutes
- **Success Rate**: Monitor for >99% success
- **Coverage**: Maintain >80% test coverage

## Security Considerations

### Secret Management

- **Rotation**: Regularly rotate access tokens
- **Scope**: Use minimal required permissions
- **Environment Separation**: Different secrets per environment

### Access Control

- **Branch Protection**: Require PR reviews
- **Environment Protection**: Production approval gates
- **Audit Logs**: Monitor deployment activities

## Future Enhancements

### Planned Improvements

1. **Automated Dependencies**: Dependabot integration
2. **Performance Testing**: Lighthouse CI integration
3. **Feature Flags**: Gradual rollout capabilities
4. **Enhanced Monitoring**: Real-time alerting
5. **Multi-environment**: Development environment support

### Configuration Updates

As the pipeline evolves, this documentation will be updated to reflect new features and improvements.

## Support and Contact

For CI/CD pipeline issues:

1. Check this documentation first
2. Review GitHub Actions logs
3. Contact the development team
4. Create GitHub issue for persistent problems

---

**Last Updated**: 2025-01-19
**Version**: 1.0
**Maintained by**: Development Team
