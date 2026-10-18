require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const { env } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function startServer() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exitCode = 1;
});