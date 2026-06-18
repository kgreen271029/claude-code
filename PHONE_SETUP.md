# 📱 PHONE SETUP - PICK EASIEST OPTION

Your market monitor is ready. Pick ONE option below based on what's easiest for you on your phone:

---

## 🏆 EASIEST: Deploy to Railway (30 seconds)

**Why:** Super simple phone UI, just click buttons.

### Step 1: Open This Link
https://railway.app/new/template/market-monitor

(Opens in your phone browser)

### Step 2: Click "Deploy Now"
- Railway auto-deploys your code
- Automatically runs in cloud forever

### Step 3: Add Secrets (Click "Variables")
- Click "Add Variable"
- Name: `TELEGRAM_BOT_TOKEN`
- Value: `8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s`

- Click "Add Variable" again
- Name: `TELEGRAM_CHAT_ID`
- Value: `6470474178`

### Step 4: Done ✅
System runs forever. Check Telegram for alerts.

---

## 🚀 MEDIUM: GitHub Actions (2 minutes)

If you want to use GitHub Actions instead:

### Step 1: Open GitHub
https://github.com/kgreen271029/claude-code/settings/secrets/actions

### Step 2: Add First Secret
- Click "New repository secret"
- Copy-paste this Name: `TELEGRAM_BOT_TOKEN`
- Copy-paste this Value: `8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s`
- Click "Add secret"

### Step 3: Add Second Secret
- Click "New repository secret"
- Copy-paste this Name: `TELEGRAM_CHAT_ID`
- Copy-paste this Value: `6470474178`
- Click "Add secret"

### Step 4: Done ✅
Go to Actions tab, should see workflow running.

---

## 💻 LOCAL: PM2 (If you're on a computer)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

Monitor runs on your computer 24/7.

---

## 🎯 MY RECOMMENDATION

**For phone:** Use Railway (Step 1 - takes 30 seconds, clicks only)

**For computer:** Use PM2 (runs on your machine forever)

**For maximum:** Do BOTH (Railway + PM2 = backup if one fails)

---

## ✅ VERIFY IT'S WORKING

After setup, check your Telegram.

You should see alerts like:
- 😨 Fear & Greed Index
- 🔥 Trending Cryptos
- 📈 Price Changes
- 💬 Market Alerts

If you see these, **YOU'RE DONE.** System runs forever.

---

## 🆘 IF NOTHING WORKS

Send me a message and I'll set it up for you completely.

But try Railway first - it's literally just clicking buttons on your phone.

---

## THAT'S IT

Pick one option, follow the steps, check Telegram in 5 minutes.

Your market monitor runs 24/7/365 without you doing anything else.
