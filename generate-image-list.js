const fs = require('fs');
const path = require('path');

// Read the images directory
const imagesDir = path.join(__dirname, 'images');
const files = fs.readdirSync(imagesDir);

// Filter for image files
const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
});

// Generate the JavaScript code
const output = `// Auto-generated image list
const imageFiles = ${JSON.stringify(imageFiles, null, 2)};
`;

// Write to a new file
fs.writeFileSync('image-list.js', output);
console.log('Image list generated successfully!'); 