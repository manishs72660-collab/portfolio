require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require('mongoose');
const { env } = require('./config/env');
const connectDB = require('./config/db');
const { initializeRag } = require('./services/ragService');
const app = require('./app');

async function startServer() {
  await connectDB();
  await initializeRag();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer().catch(async (error) => {
  console.error('Failed to start server:', error.message);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    console.error('Failed to close MongoDB after startup error:', disconnectError.message);
  }
  process.exitCode = 1;
});