module.exports = {
    apps: [
      {
        name: "koti-api",    // Replace with your app name
        script: "nodemon",
        args: "server.js",      // Replace with your entry point file
        watch: true,
        ignore_watch: [  'routes/convert/tmp', 'routes/convert/tmp/*',
          'node_modules' ],
        env: {
          NODE_ENV: "production",
        },
        env_production: {
          NODE_ENV: "production",
        },
      },
    ],
  };
  