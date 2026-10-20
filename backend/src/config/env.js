const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function numericEnv(name, fallback) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === '') return fallback;

  const value = Number(rawValue);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number`);
  return value;
}

const jwtSecret = process.env.JWT_SECRET;

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required in backend/.env');
}

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in backend/.env');
}

module.exports.env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  githubUsername: process.env.GITHUB_USERNAME || 'manishs72660-collab',
  leetcodeUsername: process.env.LEETCODE_USERNAME || 'manishsingh18',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  mail: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM,
    to: process.env.MAIL_TO || process.env.MAIL_USER,
  },
  rag: {
    googleApiKey: process.env.GOOGLE_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash',
    groqChatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
    qdrantUrl: process.env.QDRANT_URL,
    qdrantApiKey: process.env.QDRANT_API_KEY,
    qdrantCollection: process.env.QDRANT_COLLECTION_NAME || 'portfolio_knowledge',
    chunkSize: numericEnv('RAG_CHUNK_SIZE', 800),
    chunkOverlap: numericEnv('RAG_CHUNK_OVERLAP', 120),
    topK: numericEnv('RAG_TOP_K', 6),
    minScore: numericEnv('RAG_MIN_SCORE', 0.28),
    rateLimitWindowMs: numericEnv('RAG_RATE_LIMIT_WINDOW_MS', 900000),
    rateLimitMax: numericEnv('RAG_RATE_LIMIT_MAX', 15),
    conversationTtlDays: numericEnv('RAG_CONVERSATION_TTL_DAYS', 30),
  },
};
