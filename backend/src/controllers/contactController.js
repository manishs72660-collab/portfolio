const nodemailer = require('nodemailer');
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
  const { user, appPassword, to } = env.mail;

  if (!user || !appPassword || !to) {
    throw new AppError('Email delivery is not configured on the server', 503);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: appPassword },
  });

  await transporter.sendMail({
    from: `"Portfolio Contact" <${user}>`,
    to,
    replyTo: email,
    subject: `Portfolio message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  res.status(200).json({ success: true, message: 'Your message has been sent successfully' });
}

module.exports = { sendContactMessage };
