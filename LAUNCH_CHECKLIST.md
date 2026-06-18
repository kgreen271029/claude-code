# Content Repurposer - Launch Checklist

Complete these steps to launch your SaaS and start making money!

## Phase 1: Local Development & Testing (Day 1-2)

### Prerequisites Setup
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Code editor (VS Code recommended)

### Installation
```bash
# Clone and enter directory
cd /path/to/content-repurposer

# Install dependencies
npm install
cd client && npm install && cd ..
```

### Environment Configuration
```bash
# Copy template
cp .env.example .env

# Get your API keys from:
# 1. Claude API Key
#    - Go to https://console.anthropic.com
#    - Create new API key
#    - Copy to .env as CLAUDE_API_KEY

# 2. Stripe Keys (for testing)
#    - Go to https://dashboard.stripe.com
#    - Switch to Test Mode
#    - Copy Secret Key to STRIPE_SECRET_KEY
#    - Create a product with monthly pricing ($19)
#    - Copy Price ID to STRIPE_PRICE_ID

# 3. JWT Secret (any random string)
#    - Generate: openssl rand -base64 32
#    - Add to JWT_SECRET in .env

# Final .env should look like:
PORT=3001
NODE_ENV=development
JWT_SECRET=your-random-string-here
CLAUDE_API_KEY=sk-ant-xxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxx
CLIENT_URL=http://localhost:3000
```

### Test Locally
```bash
# Start dev server (opens both backend and frontend)
npm run dev

# Server: http://localhost:3001
# Frontend: http://localhost:3000
# API: http://localhost:3001/api/health
```

### Test These Features
- [ ] Sign up with email
- [ ] Login with credentials
- [ ] Upload a test video
- [ ] Repurpose to multiple platforms
- [ ] Copy captions to clipboard
- [ ] Download captions as CSV
- [ ] Check /dashboard works

---

## Phase 2: Stripe Setup (Day 2)

### Stripe Configuration
1. [ ] Go to https://stripe.com and create account
2. [ ] Get API Keys:
   - [ ] Copy Secret Key to .env
   - [ ] Create Product:
     - Name: "Content Repurposer Pro"
     - Price: $19/month
     - Copy Price ID to STRIPE_PRICE_ID
3. [ ] Setup Webhook (for production):
   - Endpoint: `https://yourdomain.com/api/subscriptions/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### Test Stripe Flow
- [ ] Click "Subscribe" on pricing page
- [ ] Complete fake payment with card: `4242 4242 4242 4242`
- [ ] Exp: `12/25` | CVC: `123`
- [ ] Check subscription status in dashboard

---

## Phase 3: Production Deployment (Day 3)

### Choose Hosting (Quick Setup Options)

#### Option A: Railway (Recommended - 5 min setup)
**Backend:**
1. [ ] Go to https://railway.app
2. [ ] Create account (GitHub login recommended)
3. [ ] Create new project
4. [ ] Connect to GitHub repo
5. [ ] Add environment variables from .env
6. [ ] Deploy

**Frontend:**
1. [ ] Go to https://vercel.com
2. [ ] Import GitHub project
3. [ ] Build command: `cd client && npm build`
4. [ ] Output: `client/dist`
5. [ ] Add env variable: `VITE_API_URL=https://your-railway-url.com`

#### Option B: Heroku (Traditional)
```bash
# Install Heroku CLI
brew install heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set CLAUDE_API_KEY=sk-ant-xxxxx
heroku config:set STRIPE_SECRET_KEY=sk_test_xxxxx
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

### Verify Production
- [ ] Visit https://your-domain.com
- [ ] Sign up and test full flow
- [ ] Try payment (use Stripe test card)
- [ ] Check /api/health endpoint

---

## Phase 4: Launch Marketing (Day 4+)

### Quick Win: ProductHunt
- [ ] Create ProductHunt account
- [ ] Write compelling description (highlight: AI captions from one click)
- [ ] Create 3-5 screenshots
- [ ] Schedule launch (Tuesday-Thursday best)
- [ ] Post in relevant communities

### Twitter/X Growth
- [ ] Post demo video (30 sec showing the repurposing)
- [ ] Target creators: `@creators`, `@tiktok`, `@instagramforbusiness`
- [ ] Hashtags: `#creators #contentmarketing #ai #saas`
- [ ] Engage with creator accounts

### Reddit Tactics
- [ ] Post in r/sidehustle, r/slavelabor
- [ ] Post in r/slavelabor with "Services" tag
- [ ] Offer limited free access to first users
- [ ] Engage genuinely (don't spam)

### TikTok Demo
- [ ] Create 15-30 second video showing:
  1. Upload video (quick)
  2. Click repurpose
  3. Show 4 platform captions
  4. Copy button
- [ ] Post: "I built this so creators can save hours"
- [ ] Link to site in bio

---

## Phase 5: Growth Milestones

### Week 1
- [ ] 50+ signups
- [ ] 2-3 paying customers
- [ ] Get user feedback via email

### Month 1
- [ ] 500+ signups
- [ ] 10-15 paying customers
- [ ] Refine based on feedback
- [ ] Add more features (bulk upload, etc.)

### Month 3
- [ ] 2,000+ signups
- [ ] 50+ paying customers
- [ ] $950/month revenue
- [ ] Hire help if needed

---

## Phase 6: Feature Enhancements (Optional, for Growth)

### High-Impact Features
- [ ] Bulk video upload (upload 10 at once)
- [ ] Social media account linking (auto-post)
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Affiliate program
- [ ] Team/multi-user accounts

---

## Key Metrics to Track

Weekly:
- [ ] Total signups
- [ ] New paying customers
- [ ] MRR (Monthly Recurring Revenue)
- [ ] Churn rate

Monthly:
- [ ] Growth rate
- [ ] Customer feedback
- [ ] Feature requests
- [ ] Support tickets

---

## Payment Checklist

For Full Launch:
- [ ] Update STRIPE_WEBHOOK_SECRET in production
- [ ] Change STRIPE_SECRET_KEY to production key
- [ ] Test real payment processing
- [ ] Set up Stripe account for payouts

---

## Troubleshooting

### "API Key not working"
- [ ] Check `.env` file exists
- [ ] Restart server after changing .env
- [ ] Verify API key format is correct

### "Port 3001 already in use"
```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>
```

### "Database locked"
- [ ] Close all server instances
- [ ] Delete `content_repurposer.db`
- [ ] Restart server

### "Payments not working"
- [ ] Verify STRIPE_PRICE_ID is correct
- [ ] Check Stripe is in test mode
- [ ] Verify webhook is configured

---

## Success Indicators

✅ You're ready to launch when:
- All features working locally
- Stripe payments tested
- Site deployed and accessible
- Marketing materials ready
- 100+ people know about it

✅ You're scaling when:
- 10+ paying customers
- $200+/month revenue
- <5% churn rate
- Positive user feedback

---

## Questions? Resources

- Stripe Docs: https://stripe.com/docs
- Claude API: https://console.anthropic.com
- Deployment Help: https://railway.app/docs
- Support: Check your email for user feedback

**Good luck! You've got this! 🚀**
