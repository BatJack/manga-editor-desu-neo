// Gallery - folder image browser
// Opens a folder via webkitdirectory input and displays all images as thumbnails.
// Clicking a thumbnail loads the image onto the canvas as a small reference.

var galleryFiles = [];
var galleryObjectUrls = [];

function galleryRevokeUrls() {
    for (var u = 0; u < galleryObjectUrls.length; u++) {
        URL.revokeObjectURL(galleryObjectUrls[u]);
    }
    galleryObjectUrls = [];
}

function galleryClear() {
    galleryRevokeUrls();
    galleryFiles = [];
    var grid = document.getElementById('gallery-grid');
    if (grid) grid.innerHTML = '';
    var info = document.getElementById('gallery-info');
    if (info) info.textContent = '';
}

document.addEventListener('DOMContentLoaded', function () {
    var folderInput = document.getElementById('folderInput');
    if (!folderInput) return;

    folderInput.addEventListener('change', function (e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;

        galleryLogger.info('Gallery folder selected: ' + files.length + ' files');

        // Clean up previous gallery
        galleryClear();

        var info = document.getElementById('gallery-info');
        var grid = document.getElementById('gallery-grid');
        if (!grid) return;

        // Filter image files
        var imageFiles = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.type && f.type.startsWith('image/')) {
                imageFiles.push(f);
            }
        }

        if (imageFiles.length === 0) {
            if (info) info.textContent = 'No image files found';
            galleryLogger.warn('No image files found in selected folder');
            return;
        }

        galleryLogger.info('Loading ' + imageFiles.length + ' images via ObjectURL');

        if (info) info.textContent = '0 / ' + imageFiles.length + ' images';

        // Process in chunks to keep UI responsive
        var chunkSize = 50;
        var index = 0;

        function processChunk() {
            var end = Math.min(index + chunkSize, imageFiles.length);
            for (var ci = index; ci < end; ci++) {
                var file = imageFiles[ci];
                // Use ObjectURL — synchronous, no base64 overhead
                var objectUrl = URL.createObjectURL(file);
                galleryObjectUrls.push(objectUrl);
                galleryFiles.push({ name: file.name, objectUrl: objectUrl });

                var item = document.createElement('div');
                item.className = 'gallery-item';

                var img = document.createElement('img');
                img.className = 'gallery-thumb';
                img.loading = 'lazy';
                img.alt = file.name;

                // Set aspect ratio after image loads
                img.onload = (function (im) {
                    return function () {
                        im.style.aspectRatio = im.naturalWidth / im.naturalHeight;
                    };
                })(img);

                img.src = objectUrl;

                var nameSpan = document.createElement('span');
                nameSpan.className = 'gallery-item-name';
                nameSpan.textContent = file.name;

                // Click to import as thumbnail onto canvas
                item.addEventListener('click', (function (url, nm) {
                    return function () {
                        loadGalleryImageToCanvas(url, nm);
                    };
                })(objectUrl, file.name));

                item.appendChild(img);
                item.appendChild(nameSpan);
                grid.appendChild(item);
            }

            index = end;
            if (info) info.textContent = index + ' / ' + imageFiles.length + ' images';

            if (index < imageFiles.length) {
                // Yield to UI between chunks
                setTimeout(processChunk, 0);
            } else {
                galleryLogger.info('Gallery loaded: ' + imageFiles.length + ' images');
            }
        }

        // Small delay so the UI can update before heavy processing
        setTimeout(processChunk, 50);
    });
});

function openGalleryFolder() {
    var input = document.getElementById('folderInput');
    if (input) {
        galleryLogger.info('Opening folder picker');
        input.value = '';
        input.click();
    }
}

function loadGalleryImageToCanvas(imgUrl, fileName) {
    galleryLogger.info('Loading gallery image to canvas: ' + fileName);
    fabric.Image.fromURL(imgUrl, function (img) {
        if (!img) {
            galleryLogger.error('Failed to load image: ' + fileName);
            return;
        }
        try {
            // Scale to small reference thumbnail (max 150px on longest side)
            var thumbSize = 150;
            var scaleFactor = Math.min(thumbSize / img.width, thumbSize / img.height);
            img.scale(scaleFactor);

            // Offset so multiple imports don't stack exactly
            img.set({
                left: img.left + 10 + Math.random() * 30,
                top: img.top + 10 + Math.random() * 30
            });

            canvas.add(img);
            canvas.renderAll();
            canvas.setActiveObject(img);

            galleryLogger.info('Gallery image loaded as thumbnail: ' + fileName + ' (scale: ' + scaleFactor.toFixed(3) + ')');
        } catch (err) {
            galleryLogger.error('Error adding gallery image to canvas: ' + err);
        }
    });
}