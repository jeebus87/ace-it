# Ace-It Production Setup Guide

## Required Services & Environment Variables

This document describes all the external services and environment variables needed for production deployment.

---

## 1. Modal Secrets (Backend)

Create Modal secrets at https://modal.com/secrets

### Required: Gemini API Key
```bash
modal secret create gemini-api-key GEMINI_API_KEY=your-key-here
```

### Optional: Upstash Redis (Rate Limiting & Caching)
```bash
modal secret create upstash-redis \
  UPSTASH_REDIS_URL=https://your-instance.upstash.io \
  UPSTASH_REDIS_TOKEN=your-token-here
```
Get credentials at: https://console.upstash.com/

### Optional: Sentry (Error Tracking)
```bash
modal secret create sentry SENTRY_DSN=https://xxx@sentry.io/xxx
```
Get DSN at: https://sentry.io/

### Optional: Cloudflare R2 (Image Storage)
```bash
modal secret create cloudflare-r2 \
  R2_ACCESS_KEY_ID=your-access-key \
  R2_SECRET_ACCESS_KEY=your-secret-key \
  R2_BUCKET_NAME=ace-it-images \
  R2_ENDPOINT_URL=https://xxx.r2.cloudflarestorage.com \
  R2_PUBLIC_URL=https://images.your-domain.com
```
Setup at: https://dash.cloudflare.com/

---

## 2. Vercel Environment Variables (Frontend)

Set at: https://vercel.com/your-project/settings/environment-variables

### Optional: Sentry (Error Tracking)
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=ace-it
SENTRY_AUTH_TOKEN=sntrys_xxx (for source map uploads)
```

---

## 3. Deployment Commands

### Backend (Modal)
```bash
cd backend
modal deploy main.py
```

### Frontend (Vercel)
```bash
cd ..
npx vercel --prod
```

---

## 4. Feature Availability by Configuration

| Feature | Without Config | With Config |
|---------|---------------|-------------|
| Answer Generation | ✅ Works | ✅ Works |
| Quiz Generation | ✅ Works | ✅ Works |
| Image Generation | ✅ Base64 (slower) | ✅ R2 URLs (faster) |
| Rate Limiting | ❌ Disabled | ✅ 100 req/min |
| Chat Session Cache | ⚠️ In-memory (lost on restart) | ✅ Redis (persistent) |
| Error Tracking | ❌ Console only | ✅ Sentry dashboard |

---

## 5. Cost Estimates (Monthly)

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Modal | 30 credits | ~$10-50 |
| Gemini API | 1,500 req/day | ~$0-20 |
| Upstash Redis | 10K req/day | ~$0-10 |
| Cloudflare R2 | 10GB storage | ~$0-5 |
| Sentry | 5K errors | Free |
| Vercel | Unlimited | Free |

---

## 6. Scaling Recommendations

### For < 100 users/day
- Use free tiers for everything
- No Redis/R2 needed

### For 100-1000 users/day
- Add Upstash Redis for rate limiting
- Add R2 for image storage
- Add Sentry for monitoring

### For > 1000 users/day
- Upgrade Gemini to paid tier
- Add multiple API keys with rotation
- Consider database (Supabase) for user accounts
- Add Clerk for authentication
