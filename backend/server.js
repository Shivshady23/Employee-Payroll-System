const app = require("./app");
const { connectDatabase } = require("./config/db");
const { getRuntimeConfig } = require("./config/env");

const { mongoUri, port } = getRuntimeConfig();

// Render entrypoint: boot DB first, then bind to process.env.PORT.
connectDatabase(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(error => {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });

