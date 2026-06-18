# Content Repurposer - AI-Powered Video Caption Generation

A SaaS application that automatically generates platform-optimized captions for videos using Claude's AI. Upload once, repurpose to TikTok, Instagram Reels, YouTube Shorts, and Pinterest with AI-generated captions and hashtags.

## 🚀 Quick Start (2-3 Days to MVP)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials:
```env
PORT=3001
JWT_SECRET=your-secret-key
CLAUDE_API_KEY=sk-ant-your-key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PRICE_ID=price_your_id
```

### Running the Application

```bash
# Development mode (both server and client)
npm run dev

# Server runs on http://localhost:3001
# Client runs on http://localhost:3000
```

## 📁 Project Structure

```
/
├── server/
│   ├── index.js              # Express server entry point
│   ├── db/
│   │   └── init.js          # Database initialization
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── videos.js        # Video upload & repurpose endpoints
│   │   └── subscriptions.js # Stripe subscription endpoints
│   └── services/
│       └── caption-generator.js  # Claude AI caption generation
├── client/
│   ├── index.html           # HTML entry point
│   ├── vite.config.js      # Vite configuration
│   └── src/
│       ├── App.jsx          # Main React component
│       ├── App.css          # Styles
│       └── pages/
│           ├── Login.jsx    # Login page
│           ├── Signup.jsx   # Signup page
│           ├── Dashboard.jsx # Main app (video upload & repurpose)
│           └── Pricing.jsx  # Pricing page
├── package.json             # Server dependencies
└── .env.example            # Environment template
```

## 🔑 Key Features

### Authentication
- User signup/login with JWT tokens
- Password hashing with bcryptjs
- Protected API routes

### Video Management
- Video upload with multer
- Store video metadata in SQLite
- User-owned video isolation

### Content Repurposing
- Upload one video
- Select target platforms (TikTok, Instagram, YouTube Shorts, Pinterest)
- AI generates platform-optimized captions and hashtags
- Download or copy captions directly

### Payments
- Stripe subscription integration
- Free plan (1 video/month, 2 platforms)
- Pro plan ($19/month) - unlimited videos, all platforms
- Webhook handling for subscription events

## 💰 Monetization Model

**Free Plan:**
- 1 video/month
- Basic caption generation
- 2 platforms per repurpose

**Pro Plan ($19/month):**
- Unlimited videos
- AI-optimized captions
- All 4 platforms
- Priority support
- Analytics dashboard

**Agency Plan ($59/month):**
- Everything in Pro
- Team members (5)
- API access
- Bulk operations
- Dedicated support

**Estimated Revenue:**
- 100 Pro users × $19 = $1,900/month
- 10 Agency users × $59 = $590/month
- **Total: ~$2,500/month** (achievable in first 6 months with proper marketing)

## 🤖 AI Integration

Uses Claude's API to generate platform-specific captions:

```javascript
// Example caption for Instagram vs TikTok
Instagram: "Check out this amazing content! Subscribe for more... [2200 chars max]"
TikTok: "Wait till the end! 🎬 #FYP #viral" [150 chars max]
```

## 📊 Database Schema

### Users Table
- id, email, password, name
- stripe_customer_id, subscription_status

### Videos Table
- id, user_id, file_path, title, description, created_at

### Repurposed Videos Table
- id, video_id, platform, caption, hashtags, status

### Subscriptions Table
- id, user_id, stripe_subscription_id, plan, status

## 🔧 API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### Videos
- `POST /api/videos/upload` - Upload video
- `GET /api/videos/list` - List user's videos
- `POST /api/videos/:videoId/repurpose` - Generate captions
- `GET /api/videos/:videoId/repurposed` - Get repurposed versions

### Subscriptions
- `POST /api/subscriptions/create-checkout` - Start checkout
- `GET /api/subscriptions/status` - Check subscription
- `POST /api/subscriptions/webhook` - Stripe webhook

## 🎯 Next Steps to Launch

1. **Get Stripe Keys:**
   - Sign up at stripe.com
   - Get Secret Key and Price ID
   - Set up webhook endpoint

2. **Get Claude API Key:**
   - Create account at api.anthropic.com
   - Generate API key
   - Set CLAUDE_API_KEY in .env

3. **Deploy:**
   - Deploy server to Heroku/Railway/Render
   - Deploy client to Vercel/Netlify
   - Update CLIENT_URL in .env

4. **Market:**
   - Post on ProductHunt, Twitter
   - Target TikTok creators, content creators
   - Offer free trial ($19/month with 14-day free trial)

## 📈 Growth Potential

**Year 1 Goals:**
- 1,000 free users
- 100 Pro subscribers ($19k MRR)
- 10 Agency customers ($5.9k MRR)
- **Total: ~$25k MRR**

**Marketing Channels:**
- ProductHunt (launch day)
- Twitter/X (creator community)
- TikTok (demo videos)
- Reddit (creator subreddits)
- Affiliate partnerships with creators

## 🛠️ Tech Stack

**Backend:**
- Express.js
- SQLite (better-sqlite3)
- Stripe
- Claude API
- JWT authentication
- bcryptjs password hashing

**Frontend:**
- React 18
- React Router
- Axios
- Vite
- CSS3 (responsive design)

## 📝 License

This project is built for rapid SaaS development. Use it as a template for your own projects.

---

**Built with Claude Code** - From idea to MVP in 2-3 days!