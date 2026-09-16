const path = require('node:path');
const sharp = require('sharp');
const root = path.join(__dirname, '..');
Promise.all([
  sharp(path.join(root, 'assets/brand/icon.svg'))
    .png()
    .toFile(path.join(root, 'assets/brand/icon.png')),
  sharp(path.join(root, 'assets/brand/icon.svg'))
    .resize(64, 64)
    .png()
    .toFile(path.join(root, 'assets/brand/favicon.png')),
]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
