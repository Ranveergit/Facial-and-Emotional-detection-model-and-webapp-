const path = require('path');

module.exports = {
  entry: './src/mark-attendance.js',  // Path to your mark-attendance.js
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/js') // Output directory
  },
  mode: 'development'
};
