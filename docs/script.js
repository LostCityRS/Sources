var currentPage = 0;
var itemsPerPage = 5;

$(document).ready(function() {
    $.getJSON('./images.json', function(images) {
        var filteredImages = images; // Start with all images

        const filters = getQueryParameters();
        $('#website').val(filters.website);
        $('#file-name').val(filters.fileName);
        if (filters.beforeDate) {
            $('#before-date').val(filters.beforeDate);
        }
        if (filters.afterDate) {
            $('#after-date').val(filters.afterDate);
        }

        const beforeDate = filters.beforeDate ? new Date(filters.beforeDate) : null;
        const afterDate = filters.afterDate ? new Date(filters.afterDate) : null;

        filteredImages = filterImages(images, filters.website, beforeDate, afterDate, filters.fileName);

        // Set the current page from the URL parameter, converting it to a number
        if (filters.page) {
            currentPage = Math.max(0, parseInt(filters.page) - 1); // Convert to zero-based index
        }
        
        loadImages(filteredImages, currentPage);
        displayPageNumbers(filteredImages);

        $('#filter-form').on('submit', function(e) {
            e.preventDefault();

            const website = $('#website').val();
            const fileName = $('#file-name').val().toLowerCase();
            const beforeDateInput = $('#before-date').val() ? new Date($('#before-date').val()) : null;
            const afterDateInput = $('#after-date').val() ? new Date($('#after-date').val()) : null;

            filteredImages = filterImages(images, website, beforeDateInput, afterDateInput, fileName);

            currentPage = 0; // Reset to the first page after filtering
            loadImages(filteredImages, currentPage); // Load images for the first page
            displayPageNumbers(filteredImages); // Display page numbers for filtered images

            // Update URL
            let newUrl = `?website=${encodeURIComponent(website)}&page=${currentPage + 1}&fileName=${encodeURIComponent(fileName)}`;
            if (beforeDateInput) {
                beforeDateInput.setHours(0, 0, 0, 0);
                newUrl += `&beforeDate=${encodeURIComponent(beforeDateInput.toISOString().split('T')[0])}`;
            }
            if (afterDateInput) {
                afterDateInput.setHours(0, 0, 0, 0);
                newUrl += `&afterDate=${encodeURIComponent(afterDateInput.toISOString().split('T')[0])}`;
            }
            window.history.pushState({ path: newUrl }, '', newUrl);
        });

        $('#previous-page').on('click', function() {
            previousPage(filteredImages);
        });

        $('#next-page').on('click', function() {
            nextPage(filteredImages);
        });
    });
});

function filterImages(images, website, beforeDate, afterDate, fileName) {
    const fileNamePattern = convertWildcardToRegex(fileName);
    return images.filter(image => {
        var imageDate = image.archiveDate !== "Unknown" ? new Date(image.archiveDate) : null;
        var matchesFileName = fileNamePattern.test(image.fileName);
        return (
            (website === "" || image.website === website) && 
            (beforeDate === null || (imageDate && imageDate < beforeDate)) && 
            (afterDate === null || (imageDate && imageDate > afterDate)) && 
            (fileName === "" || matchesFileName) 
        );
    });
}

function loadImages(images, page) {
    $('#image-gallery').empty();

    let start = page * itemsPerPage;
    let end = Math.min(start + itemsPerPage, images.length);

    for (let i = start; i < end; i++) {
        let image = images[i];
        let imageUrl = image.source;

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
        updateUrlWithPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function previousPage(images) {
    if (currentPage > 0) {
        currentPage--;
        loadImages(images, currentPage);
        displayPageNumbers(images);
        updateUrlWithPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function displayPageNumbers(images) {
    var totalPages = Math.ceil(images.length / itemsPerPage);
    $('#page-numbers').text("Page " + (currentPage + 1) + '/' + totalPages);
}

function updateUrlWithPage() {
    const filters = getQueryParameters();
    let newUrl = `?website=${encodeURIComponent(filters.website)}&page=${currentPage + 1}&fileName=${encodeURIComponent(filters.fileName)}`;
    if (filters.beforeDate) {
        newUrl += `&beforeDate=${encodeURIComponent(filters.beforeDate)}`;
    }
    if (filters.afterDate) {
        newUrl += `&afterDate=${encodeURIComponent(filters.afterDate)}`;
    }
    window.history.pushState({ path: newUrl }, '', newUrl);
}

function displayImageProperties(image) {
    $('#image-details').empty();
    $('#image-details').append('<h2>Image Properties</h2>');

    const propertiesOrder = ['fileName', 'website', 'archiveSource', 'archiveDate'];

    propertiesOrder.forEach(function(property) {
        if (image.hasOwnProperty(property)) {
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
        fileName: params.get('fileName') || ''
    };
}

function convertWildcardToRegex(pattern) {
    let regexPattern = pattern
        .replace(/([.+?^${}()|\[\]\\])/g, '\\$1')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

    return new RegExp(`^${regexPattern}$`, 'i');
}
