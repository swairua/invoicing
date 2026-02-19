# eTIMS Environment Variables Setup Guide

## Quick Fix for "process is not defined" Error

**The Problem**: The eTIMS service was trying to use Node.js `process.env` in a browser environment.

**The Solution**: The code now uses Vite's `import.meta.env` for frontend and `getenv()` for backend.

---

## Frontend Setup (.env)

Create a `.env` file in your project root:

```env
# API Configuration
VITE_API_URL=https://med.wayrus.co.ke
VITE_EXTERNAL_API_URL=https://med.wayrus.co.ke/api.php
```

**OR for local development:**

```env
VITE_API_URL=http://localhost:8000
```

### Where to Create
```
your-project/
├── .env          ← Create this file here
├── .env.example  ← Reference file
├── src/
├── package.json
└── vite.config.ts
```

### Variable Explanation

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Base URL of your API | `https://med.wayrus.co.ke` |
| `VITE_EXTERNAL_API_URL` | Direct PHP API endpoint | `https://med.wayrus.co.ke/api.php` |

---

## Backend Setup (.env on Server)

Create a `.env` file in your PHP application directory:

```env
# Database
DB_HOST=localhost
DB_USER=wayrusc1_med
DB_PASS=your_password
DB_NAME=wayrusc1_med

# JWT
JWT_SECRET=your_secret_key

# eTIMS Sandbox
ETIMS_ENV=sandbox
ETIMS_SANDBOX_URL=https://sandbox.etims.kra.go.ke/api/submit-sale
ETIMS_SANDBOX_TIN=12345678
ETIMS_SANDBOX_API_KEY=your-sandbox-key

# eTIMS Production (after sandbox approval)
ETIMS_PRODUCTION_URL=https://etims.kra.go.ke/api/submit-sale
ETIMS_PRODUCTION_TIN=12345678
ETIMS_PRODUCTION_API_KEY=your-production-key
```

### Backend Directory Structure
```
/home/wayrusc1/med.wayrus.co.ke/
├── .env             ← Create here (NOT in version control)
├── .env.example     ← In version control
├── public/
│   └── api.php
├── src/
└── sql/
```

---

## Step-by-Step Setup

### 1. Frontend (.env)

```bash
cd /path/to/frontend/project
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=https://med.wayrus.co.ke
```

### 2. Backend (.env on server)

**SSH into your server:**
```bash
ssh user@med.wayrus.co.ke
cd /home/wayrusc1/med.wayrus.co.ke
cp .env.example .env
nano .env  # or vim, edit with your values
```

**Add these required variables:**
```env
ETIMS_ENV=sandbox
ETIMS_SANDBOX_URL=https://sandbox.etims.kra.go.ke/api/submit-sale
ETIMS_SANDBOX_TIN=12345678
ETIMS_SANDBOX_API_KEY=get-from-kra
```

### 3. Verify Frontend is Using Correct URL

**Open browser DevTools:**
1. Press `F12` to open developer tools
2. Go to Console tab
3. Type: `window.location.origin`
4. Should show: `https://med.wayrus.co.ke` or `http://localhost:8000`

### 4. Test API Connection

**Test the status endpoint (no auth needed):**
```bash
curl https://med.wayrus.co.ke/api?action=etims_status
```

Should return:
```json
{
  "status": "success",
  "etims": {
    "enabled": true,
    "environment": "sandbox",
    "configured": true
  }
}
```

---

## Environment Variable Locations

### Frontend Variables (Vite)

**Available at build time and in browser:**
- Accessed via: `import.meta.env.VITE_*`
- Compiled into the JavaScript bundle
- Visible in browser (don't put secrets here)
- Prefix: `VITE_`

Example:
```typescript
const API_URL = import.meta.env.VITE_API_URL; // Browser sees this
```

### Backend Variables (PHP)

**Only on server, never sent to browser:**
- Accessed via: `getenv('VARIABLE_NAME')`
- Stored in `.env` file (NOT version controlled)
- Can contain secrets safely
- No special prefix needed

Example:
```php
$api_key = getenv('ETIMS_SANDBOX_API_KEY'); // Only PHP sees this
```

---

## .env Files (Do NOT Commit)

### Gitignore Configuration

Make sure your `.gitignore` includes:
```
.env
.env.local
.env.*.local
```

### What SHOULD be committed
- ✅ `.env.example` - Template for others
- ✅ Code and configuration
- ✅ Documentation

### What SHOULD NOT be committed
- ❌ `.env` - Contains secrets
- ❌ `.env.production` - Contains production secrets
- ❌ API keys or database passwords

---

## Troubleshooting

### "process is not defined" Error (FIXED)

**Old code:**
```typescript
// ❌ WRONG - process is Node.js only
const API_URL = process.env.REACT_APP_API_URL;
```

**New code:**
```typescript
// ✅ CORRECT - Works in browser
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
```

### API Returns 404 Not Found

**Possible Causes:**
1. `VITE_API_URL` is pointing to wrong server
2. PHP api.php file doesn't exist
3. URL has extra slashes or wrong path

**Solution:**
```
Check: https://med.wayrus.co.ke/api?action=etims_status
Not: https://med.wayrus.co.ke//api or https://med.wayrus.co.ke/api.php?action=
```

### Configuration Incomplete Error

**Cause:** Backend .env missing eTIMS variables

**Solution:**
```bash
# SSH to server
nano /home/wayrusc1/med.wayrus.co.ke/.env

# Add:
ETIMS_ENV=sandbox
ETIMS_SANDBOX_URL=https://sandbox.etims.kra.go.ke/api/submit-sale
ETIMS_SANDBOX_TIN=12345678
ETIMS_SANDBOX_API_KEY=your-key-here
```

### Frontend Can't Connect to API

**Possible Causes:**
1. .env file doesn't exist
2. VITE_API_URL is wrong
3. CORS issue

**Check:**
```bash
# Verify .env exists
ls -la .env

# Verify variable is set
cat .env | grep VITE_API_URL

# Check browser console for CORS errors (F12)
```

---

## Production Checklist

- [ ] Frontend `.env` created with correct `VITE_API_URL`
- [ ] Backend `.env` created on server with database credentials
- [ ] `.env` files in `.gitignore` (not committed)
- [ ] `.env.example` committed as reference
- [ ] `ETIMS_ENV=sandbox` for testing
- [ ] `ETIMS_SANDBOX_URL` and `ETIMS_SANDBOX_API_KEY` configured
- [ ] `/api?action=etims_status` returns success
- [ ] Database tables created (etims_sales, etims_responses, etims_sync_logs)
- [ ] Admin can access `/admin/etims` dashboard

---

## Quick Start Command

**If you have SSH access, run this:**

```bash
# 1. Create backend .env
ssh user@med.wayrus.co.ke << 'EOF'
cd /home/wayrusc1/med.wayrus.co.ke
cat > .env << 'CONFIG'
ETIMS_ENV=sandbox
ETIMS_SANDBOX_URL=https://sandbox.etims.kra.go.ke/api/submit-sale
ETIMS_SANDBOX_TIN=12345678
ETIMS_SANDBOX_API_KEY=your-key-here
CONFIG
chmod 600 .env
EOF

# 2. Create frontend .env locally
echo "VITE_API_URL=https://med.wayrus.co.ke" > .env

# 3. Test
curl https://med.wayrus.co.ke/api?action=etims_status
```

---

## Reference Files

- **Frontend config example**: `.env.example`
- **eTIMS Implementation Guide**: `ETIMS_SETUP_GUIDE.md`
- **Quick Reference**: `ETIMS_QUICK_REFERENCE.md`
- **eTIMS Service**: `src/services/etimsService.ts`
- **eTIMS Admin**: `src/pages/admin/eTIMS.tsx`

---

**Status**: Environment setup guide  
**Last Updated**: 2026-02-04  
**Version**: 1.0
