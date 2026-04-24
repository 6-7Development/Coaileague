// postcss.config.cjs — forced CommonJS for ESM-project Railway builds
// package.json "type":"module" makes .js files ESM, but .cjs is always CJS.
// Tailwind auto-discovery: prefers tailwind.config.js, then .cjs if present.
const path = require('path');
module.exports = {
  plugins: {
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.cjs') },
    autoprefixer: {},
  },
};
