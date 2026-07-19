// server.js
// Simple Express backend that receives wallet troubleshoot submissions
// and emails them via Gmail SMTP using Nodemailer.
//
// SETUP:
// 1. npm install express nodemailer cors dotenv
// 2. Create a Gmail "App Password" (NOT your normal Gmail password):
//    - Go to https://myaccount.google.com/apppasswords
//    - Requires 2-Step Verification to be enabled on the Google account
//    - Generate an app password for "Mail" / "Other (Custom name)"
//    - Copy the 16-character password it gives you
// 3. Create a .env file next to this server.js with:
//      GMAIL_USER=jusierose3@gmail.com
//      GMAIL_APP_PASSWORD=your16charapppassword
// 4. Run: node server.js
// 5. Update the frontend fetch URL to point at this server, e.g.
//      http://localhost:3001/send-troubleshoot

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

app.post('/send-troubleshoot', async (req, res) => {
  const { wallet, network, publicAddress, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const emailBody = `
New wallet troubleshoot submission

Wallet: ${wallet || 'Not specified'}
Network: ${network || 'Not specified'}
Public address: ${publicAddress || 'Not provided'}

Issue description:
${message}
  `.trim();

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `Wallet Troubleshoot: ${wallet || 'Unknown wallet'}`,
      text: emailBody
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Email send failed:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
