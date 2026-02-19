const fs = require('fs');
const path = require('path');

// Files to exclude from the gallery (add filenames here)
const blacklist = [
    'IMG_1425.JPG',
    'IMG_5819 Large.jpeg',
    'IMG_5135.jpg',
    'jackie.jpg',
    'IMG_2976 Large.jpeg',
    'IMG_5551.jpg',
    'IMG_3112.jpg',
];

// Read the images directory
const imagesDir = path.join(__dirname, 'images');
const files = fs.readdirSync(imagesDir);

// Filter for image files, excluding blacklisted ones
const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) && !blacklist.includes(file);
});

// Generate the JavaScript code
const output = `// Auto-generated image list
const imageFiles = ${JSON.stringify(imageFiles, null, 2)};
`;

// Write to a new file
fs.writeFileSync('image-list.js', output);
console.log('Image list generated successfully!'); 