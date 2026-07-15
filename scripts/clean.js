// Removes and recreates the dist/ output directory.
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
console.log('Cleaned dist/');
