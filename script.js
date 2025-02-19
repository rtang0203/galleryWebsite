const galleryElement = document.getElementById('gallery');
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
const colorThief = new ColorThief();
const IMAGES_PER_BATCH = 20;
let currentImageQueue = [];
let isLoading = false;

// Create popup elements
const popupOverlay = document.createElement('div');
popupOverlay.className = 'popup-overlay';
const popupImage = document.createElement('img');
popupImage.className = 'popup-image';
// const popupCaption = document.createElement('div');
// popupCaption.className = 'popup-caption';
popupOverlay.appendChild(popupImage);
// popupOverlay.appendChild(popupCaption);
document.body.appendChild(popupOverlay);

// Function to calculate brightness from RGB values
function getBrightness(color) {
    if (!color) return -1;
    
    const r = color[0] / 255;
    const g = color[1] / 255;
    const b = color[2] / 255;
    
    const rGamma = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gGamma = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bGamma = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    const luminance = 0.2126 * rGamma + 0.7152 * gGamma + 0.0722 * bGamma;
    
    return Math.round(luminance * 255);
}

// Function to get color category
function getColorCategory(color) {
    const r = color[0];
    const g = color[1];
    const b = color[2];
    
    const tolerance = 30;
    if (Math.abs(r - g) < tolerance && Math.abs(g - b) < tolerance) {
        return 'grayscale';
    }
    
    const max = Math.max(r, g, b);
    if (max < 60) return 'dark';
    if (r === max && r > g + tolerance) return 'red';
    if (g === max && g > r + tolerance) return 'green';
    if (b === max && b > r + tolerance) return 'blue';
    
    return 'mixed';
}

// Function to get quick dominant color from image
function getQuickColor(img) {
    try {
        return colorThief.getColor(img);
    } catch (e) {
        console.error('Quick color extraction failed:', e);
        return null;
    }
}

// Function to create and load an image
function createImage(fileName) {
    return new Promise((resolve) => {
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.className = 'gallery-image loading';
        img.alt = fileName;
        
        img.style.width = '40px';
        img.style.height = '40px';
        img.src = `images/${fileName}`;
        
        img.addEventListener('click', function() {
            popupImage.src = this.src;
            // const filename = this.alt.split('.')[0];
            // popupCaption.textContent = filename;
            popupOverlay.style.display = 'block';
        });
        
        img.onload = () => {
            const quickColor = getQuickColor(img);
            resolve({ img, colors: quickColor ? [quickColor] : null });
            
            const fullImg = new Image();
            fullImg.crossOrigin = 'anonymous';
            fullImg.src = img.src;
            
            fullImg.onload = () => {
                img.style.width = '';
                img.style.height = '';
                img.classList.remove('loading');
            };
        };

        img.onerror = () => {
            resolve({ img, colors: null });
        };
    });
}

// Function to insert images in sorted order
function insertSorted(newImages) {
    if (newImages.length === 0) return;

    const fragment = document.createDocumentFragment();
    
    // Sort only the new batch of images
    const sortedNewImages = newImages.sort((a, b) => {
        const catA = a.dataset.category;
        const catB = b.dataset.category;
        
        const categoryOrder = {
            'dark': 0, 'red': 1, 'blue': 2,
            'green': 3, 'grayscale': 4, 'mixed': 5
        };
        
        if (catA !== catB) {
            return categoryOrder[catA] - categoryOrder[catB];
        }
        
        return parseFloat(a.dataset.brightness) - parseFloat(b.dataset.brightness);
    });

    // Add sorted new images to fragment
    sortedNewImages.forEach(image => fragment.appendChild(image));
    
    // Append the new batch to the gallery
    galleryElement.appendChild(fragment);
}

// Function to prepare image with color data
function prepareImage(img, colors) {
    if (!colors) return img;

    const category = getColorCategory(colors[0]);
    const brightness = getBrightness(colors[0]);
    
    img.dataset.category = category;
    img.dataset.brightness = brightness;
    img.dataset.quickColor = JSON.stringify(colors[0]);

    return img;
}

// Function to check if we should load more images
function shouldLoadMore() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 1000; // Load more when within 1000px of bottom
    return scrollPosition > threshold;
}

// Function to load next batch of images
async function loadNextBatch() {
    if (isLoading || currentImageQueue.length === 0) return;
    
    isLoading = true;
    const batch = currentImageQueue.splice(0, IMAGES_PER_BATCH);
    const batchPromises = batch.map(fileName => createImage(fileName));
    
    try {
        const results = await Promise.all(batchPromises);
        const preparedImages = results.map(({ img, colors }) => prepareImage(img, colors));
        insertSorted(preparedImages);
    } catch (error) {
        console.error('Error loading batch:', error);
    } finally {
        isLoading = false;
    }
    
    // If we're still near the bottom after loading, load more
    if (shouldLoadMore() && currentImageQueue.length > 0) {
        loadNextBatch();
    }
}

// Add scroll listener
window.addEventListener('scroll', () => {
    if (shouldLoadMore()) {
        loadNextBatch();
    }
});

// Load and process images
function loadImages() {
    // Use the imageFiles array from image-list.js
    currentImageQueue = [...imageFiles];
    
    // Load first batch
    loadNextBatch();
}

// Initialize gallery
loadImages();

// Close popup when clicking overlay
popupOverlay.addEventListener('click', function() {
    popupOverlay.style.display = 'none';
});
