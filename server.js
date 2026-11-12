// server.js
// Simple Express backend that receives wallet troubleshoot submissions
// and emails them via the Resend API (HTTPS, not blocked by free-tier hosts
// the way raw SMTP ports are).
//
// SETUP:
// 1. npm install express cors dotenv
// 2. Sign up free at https://resend.com
// 3. Get your API key from the Resend dashboard
// 4. Add RESEND_API_KEY as an environment variable in Render
// 5. Add RECEIVING_EMAIL as an environment variable too (jusierose3@gmail.com)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ---- log which page each request came from ----
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('From page:', req.get('Referer') || req.get('Origin') || 'unknown');
  }
  next();
});
// ---- end ----

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
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wallet Troubleshoot <onboarding@resend.dev>',
        to: [process.env.RECEIVING_EMAIL],
        subject: `Wallet Troubleshoot: ${wallet || 'Unknown wallet'}`,
        text: emailBody
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', errText);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Email send failed:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
