// This file is the command-line entry point for the Express application.
// It reads startup options, creates the app, and starts one HTTP server.

const path = require('path');
const { createApp } = require('./app');

function parseArguments(argumentsList) {
  // The task allows both input files to be replaced at startup.
  const options = {
    mapPath: path.join(process.cwd(), 'map.ascii'),
    bookingsPath: path.join(process.cwd(), 'bookings.json'),
    port: Number(process.env.PORT || 3000),
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--map' || argument === '--bookings' || argument === '--port') {
      const value = argumentsList[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`The ${argument} option needs a value.`);
      if (argument === '--map') options.mapPath = path.resolve(process.cwd(), value);
      if (argument === '--bookings') options.bookingsPath = path.resolve(process.cwd(), value);
      if (argument === '--port') options.port = Number(value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error('The port must be an integer from 0 to 65535.');
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const app = createApp(options);
    const server = app.listen(options.port, () => {
      const address = server.address();
      console.log(`Resort Map is running at http://localhost:${address.port}`);
      console.log(`Map: ${options.mapPath}`);
      console.log(`Guests: ${options.bookingsPath}`);
    });
  } catch (error) {
    console.error(`Could not start Resort Map: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { parseArguments };
