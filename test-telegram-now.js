#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6470474178';
const API_BASE = 'https://api.telegram.org/bot';

async function sendAlert(message) {
  try {
    console.log(`📤 Sending test message to Telegram...`);
    console.log(`📱 Chat ID: ${TELEGRAM_CHAT_ID}`);
    console.log(`💬 Message: ${message}`);

    const url = `${API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    }, { timeout: 10000 });

    if (response.data.ok) {
      console.log('✅ SUCCESS! Message sent to Telegram!');
      console.log(`✅ Check your Telegram chat ${TELEGRAM_CHAT_ID} right now`);
      process.exit(0);
    } else {
      console.error('❌ Telegram rejected message:', response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to send:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

const testMessage = `✅ <b>SYSTEM PROOF OF LIFE</b>

Your 24/7 market monitor is <b>WORKING RIGHT NOW</b>

This message was sent from your local test script at ${new Date().toLocaleString()}

Next step: Set 2 GitHub secrets and the cloud version runs forever.

Get instructions in DEPLOY_NOW.md`;

sendAlert(testMessage);
