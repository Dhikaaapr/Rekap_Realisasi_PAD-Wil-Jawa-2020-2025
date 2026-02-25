const functions = require('firebase-functions');
const app = require('./src/app');

// Expose Express app as a single Cloud Function:
exports.api = functions.https.onRequest(app);
