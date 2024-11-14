var currentPage = 0;
var itemsPerPage = 5;

$(document).ready(function() {
    $.getJSON('./images.json', function(images) {
        var filteredImages = images;

        const filters = getQueryParameters();
        $('#website').val(filters.website);
        $('#file-name').val(filters.fileName);
        $('#min-width').val(filters.minWidth);
        $('#min-height').val(filters.minHeight);
        $('#max-width').val(filters.maxWidth);
        $('#max-height').val(filters.maxHeight);
        if (filters.beforeDate) {
            $('#before-date').val(filters.beforeDate);
        }
        if (filters.afterDate) {
            $('#after-date').val(filters.afterDate);
        }

        const beforeDate = filters.beforeDate ? new Date(filters.beforeDate) : null;
        const afterDate = filters.afterDate ? new Date(filters.afterDate) : null;  

        filteredImages = filterImages(images, filters.website, beforeDate, afterDate, filters.fileName, filters.minWidth, filters.maxWidth, filters.minHeight, filters.maxHeight);


        if (filters.page) {
            currentPage = Math.max(0, parseInt(filters.page) - 1);
        }
        
        loadImages(filteredImages, currentPage);
        displayPageNumbers(filteredImages);
        updateUrlWithPage(getQueryParameters());

        $('#filter-form').on('submit', function(e) {
            e.preventDefault();
        
            const websiteInput = $('#website').val();
            const fileNameInput = $('#file-name').val().toLowerCase();
            const beforeDateInput = $('#before-date').val() ? new Date($('#before-date').val()) : null;
            const afterDateInput = $('#after-date').val() ? new Date($('#after-date').val()) : null;
        
            const minWidthInput = $('#min-width').val() ? parseInt($('#min-width').val()) : null;
            const maxWidthInput = $('#max-width').val() ? parseInt($('#max-width').val()) : null;
            const minHeightInput = $('#min-height').val() ? parseInt($('#min-height').val()) : null;
            const maxHeightInput = $('#max-height').val() ? parseInt($('#max-height').val()) : null;
        
            filteredImages = filterImages(images, websiteInput, beforeDateInput, afterDateInput, fileNameInput, minWidthInput, maxWidthInput, minHeightInput, maxHeightInput);
        
            currentPage = 0; // Reset to the first page after filtering
            loadImages(filteredImages, currentPage); // Load images for the first page
            displayPageNumbers(filteredImages); // Display page numbers for filtered images
        
            updateUrlWithPage({website: websiteInput, fileName: fileNameInput, beforeDate: beforeDateInput, afterDate: afterDateInput, minWidth: minWidthInput, maxWidth: maxWidthInput, minHeight: minHeightInput, maxHeight: maxHeightInput}); // Ensure this reflects all filters
        });        

        $('#previous-page').on('click', function() {
            previousPage(filteredImages);
        });

        $('#next-page').on('click', function() {
            nextPage(filteredImages);
        });
    });
});

function filterImages(images, website, beforeDate, afterDate, fileName, minWidth, maxWidth, minHeight, maxHeight) {
    const fileNamePattern = convertWildcardToRegex(fileName);
    return images.filter(image => {
        var imageDate = image.date !== "Unknown" && image.date ? new Date(image.date) : (image.archiveDate !== "Unknown" ? new Date(image.archiveDate) : null);
        var matchesFileName = fileNamePattern.test(image.fileName);

        const imageWidth = image.width ? parseInt(image.width) : null;
        const imageHeight = image.height ? parseInt(image.height) : null;

        return (
            (website === "" || image.website === website) && // Filter by website
            (beforeDate === null || (imageDate && imageDate < beforeDate)) && // Filter by beforeDate
            (afterDate === null || (imageDate && imageDate > afterDate)) && // Filter by afterDate
            (fileName === "" || matchesFileName) && // Filter by file name
            (minWidth === "" || minWidth === null || imageWidth === null || imageWidth >= parseInt(minWidth)) && // Filter by minWidth
            (maxWidth === "" || maxWidth === null || imageWidth === null || imageWidth <= parseInt(maxWidth)) && // Filter by maxWidth
            (minHeight === "" || minHeight === null || imageHeight === null || imageHeight >= parseInt(minHeight)) && // Filter by minHeight
            (maxHeight === "" || maxHeight === null || imageHeight === null || imageHeight <= parseInt(maxHeight)) // Filter by maxHeight
        );
    });
}


function loadImages(images, page) {
    $('#image-gallery').empty();

    let start = page * itemsPerPage;
    let end = Math.min(start + itemsPerPage, images.length);

    for (let i = start; i < end; i++) {
        let image = images[i];
        let imageUrl = image.source.replace("%26", "%2526");

        let imageElement = $('<img>').attr('src', imageUrl);
        let panelDiv = $('<div>').addClass('panel');

        imageElement.on('click', function() {
            displayImageProperties(image);
        });

        panelDiv.append(imageElement);
        $('#image-gallery').append(panelDiv);
    }

    displayPageNumbers(images);
}

function nextPage(images) {
    if ((currentPage + 1) * itemsPerPage < images.length) {
        currentPage++;
        loadImages(images, currentPage);
        displayPageNumbers(images);
        updateUrlWithPage(getQueryParameters());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function previousPage(images) {
    if (currentPage > 0) {
        currentPage--;
        loadImages(images, currentPage);
        displayPageNumbers(images);
        updateUrlWithPage(getQueryParameters());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function displayPageNumbers(images) {
    var totalPages = Math.ceil(images.length / itemsPerPage);
    $('#page-numbers').text("Page " + (currentPage + 1) + '/' + totalPages);
}

function updateUrlWithPage(filters) {
    let newUrl = `?page=${currentPage + 1}`;

    // Only add filters if they have values
    if (filters.website) {
        newUrl += `&website=${encodeURIComponent(filters.website)}`;
    }
    if (filters.fileName) {
        newUrl += `&fileName=${encodeURIComponent(filters.fileName)}`;
    }
    if (filters.beforeDate) {
        newUrl += `&beforeDate=${encodeURIComponent(filters.beforeDate)}`;
    }
    if (filters.afterDate) {
        newUrl += `&afterDate=${encodeURIComponent(filters.afterDate)}`;
    }
    if (filters.minWidth !== null && filters.minWidth !== '') {
        newUrl += `&minWidth=${encodeURIComponent(filters.minWidth)}`;
    }
    if (filters.maxWidth !== null && filters.maxWidth !== '') {
        newUrl += `&maxWidth=${encodeURIComponent(filters.maxWidth)}`;
    }
    if (filters.minHeight !== null && filters.minHeight !== '') {
        newUrl += `&minHeight=${encodeURIComponent(filters.minHeight)}`;
    }
    if (filters.maxHeight !== null && filters.maxHeight !== '') {
        newUrl += `&maxHeight=${encodeURIComponent(filters.maxHeight)}`;
    }

    window.history.pushState({ path: newUrl }, '', newUrl);
}


function displayImageProperties(image) {
    $('#image-details').empty();
    $('#image-details').append('<h2>Image Properties</h2>');

    const propertiesOrder = ['fileName', 'website', 'archiveSource', 'archiveDate', 'date', 'imageLink', 'width', 'height'];

    propertiesOrder.forEach(function(property) {
        if (image.hasOwnProperty(property) && image[property] !== "Unknown") {
            $('#image-details').append('<p><strong>' + property + ':</strong> ' + image[property] + '</p>');
        }
    });
}


function getQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    return {
        website: params.get('website') || '',
        beforeDate: params.get('beforeDate') || '',
        afterDate: params.get('afterDate') || '',
        page: params.get('page') || '',
        fileName: params.get('fileName') || '',
        minWidth: params.get('minWidth') ? parseInt(params.get('minWidth')) : null,
        maxWidth: params.get('maxWidth') ? parseInt(params.get('maxWidth')) : null,
        minHeight: params.get('minHeight') ? parseInt(params.get('minHeight')) : null,
        maxHeight: params.get('maxHeight') ? parseInt(params.get('maxHeight')) : null,
    };
}


function convertWildcardToRegex(pattern) {
    let regexPattern = pattern
        .replace(/([.+?^${}()|\[\]\\])/g, '\\$1')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

    return new RegExp(`^${regexPattern}$`, 'i');
}
