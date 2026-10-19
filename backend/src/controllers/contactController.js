const { env } = require('../config/env');
const AppError = require('../utils/AppError');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('A JSON request body is required', 400);
  }

  const { name, email, message } = body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100 || /[\r\n]/.test(name)) {
    throw new AppError('Name is required and must be at most 100 characters', 400);
  }
  if (typeof email !== 'string' || email.length > 254 || !emailPattern.test(email.trim())) {
    throw new AppError('A valid email address is required', 400);
  }
  if (typeof message !== 'string' || !message.trim() || message.trim().length > 5000) {
    throw new AppError('Message is required and must be at most 5000 characters', 400);
  }

  return { name: name.trim(), email: email.trim(), message: message.trim() };
}

async function sendContactMessage(req, res) {
  const { name, email, message } = validateContactBody(req.body);
  const { resendApiKey, from, to } = env.mail;

  if (!resendApiKey || !from || !to) {
    throw new AppError('Email delivery is not configured on the server', 503);
  }

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Portfolio message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error('Email provider request failed:', error.name, error.message);
    throw new AppError('Email delivery failed. Please try again later.', 502, { expose: true });
  }

  if (!response.ok) {
    console.error('Email provider rejected contact message with status:', response.status);
    throw new AppError('Email delivery failed. Please try again later.', 502, { expose: true });
  }

  res.status(200).json({ success: true, message: 'Your message has been sent successfully' });
}

module.exports = { sendContactMessage };
