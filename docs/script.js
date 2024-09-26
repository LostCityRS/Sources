$(document).ready(function() {
    $.getJSON('./images.json', function(images) {
        var filteredImages = images;
        var currentPage = 0;

        const filters = getQueryParameters();
        $('#website').val(filters.website);
        if (filters.beforeDate) {
            $('#before-date').val(filters.beforeDate);
        }
        if (filters.afterDate) {
            $('#after-date').val(filters.afterDate);
        }

        const beforeDate = filters.beforeDate ? new Date(filters.beforeDate) : null;
        const afterDate = filters.afterDate ? new Date(filters.afterDate) : null;

        filteredImages = filterImages(images, filters.website, beforeDate, afterDate);
        loadImages(filteredImages);

        $('#filter-form').on('submit', function(e) {
            e.preventDefault();

            const website = $('#website').val();
            const beforeDateInput = $('#before-date').val() ? new Date($('#before-date').val()) : null;
            const afterDateInput = $('#after-date').val() ? new Date($('#after-date').val()) : null;

            filteredImages = filterImages(images, website, beforeDateInput, afterDateInput);

            currentPage = 0;
            loadImages(filteredImages);

            let newUrl = `?website=${encodeURIComponent(website)}`;
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

// Update the filterImages function to accept parameters
function filterImages(images, website, beforeDate, afterDate) {
    return images.filter(image => {
        var imageDate = image.archiveDate !== "Unknown" ? new Date(image.archiveDate) : null;
        return (
            (website === "" || image.website === website) && // Allow any website if "Any" is selected
            (beforeDate === null || (imageDate && imageDate < beforeDate)) && // Filter by beforeDate
            (afterDate === null || (imageDate && imageDate > afterDate)) // Filter by afterDate
        );
    });
}


var currentPage = 0;
var itemsPerPage = 5;

function loadImages(images) {
    $('#image-gallery').empty();

    let start = currentPage * itemsPerPage;
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
        loadImages(images);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    displayPageNumbers(images);
    updateUrlWithPage();
}

function previousPage(images) {
    if (currentPage > 0) {
        currentPage--;
        loadImages(images);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    displayPageNumbers(images);
    updateUrlWithPage();
}

function displayPageNumbers(images) {
    var totalPages = Math.ceil(images.length / itemsPerPage);
    $('#page-numbers').text("Page " + (currentPage + 1) + '/' + totalPages);
}

function updateUrlWithPage() {
    const filters = getQueryParameters();
    let newUrl = `?website=${encodeURIComponent(filters.website)}&page=${currentPage + 1}`;
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
        afterDate: params.get('afterDate') || ''
    };
}
