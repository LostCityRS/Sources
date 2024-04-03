function filterImages(images) {
    var website = $('#website').val(); // Get the selected option's value
    var beforeDate = $('#before-date').val() ? new Date($('#before-date').val()) : null;
    var afterDate = $('#after-date').val() ? new Date($('#after-date').val()) : null;
  
    return images.filter(function(image) {
      var imageDate = image.archiveDate !== "Unknown" ? new Date(image.archiveDate) : null;
      return (!website || image.website === website) &&
             (!beforeDate || (imageDate && imageDate <= beforeDate)) &&
             (!afterDate || (imageDate && imageDate >= afterDate));
    });
}

var currentPage = 0;
var itemsPerPage = 5; // Change this to the number of items you want per page

function loadImages(images) {
    $('#image-gallery').empty();
    var start = currentPage * itemsPerPage;
    var end = start + itemsPerPage;
    var pageImages = images.slice(start, end);
    pageImages.forEach(function(image) {
        var imgElement = '<div class="panel"><div class="panel-content"><div class="image-container"><img /></div></div></div>';
        var $imgElement = $(imgElement);
        $imgElement.find('img').on('load', function() {
            $('#image-gallery').append($imgElement);
        }).attr('src', image.source)
          .on('click', function(e) {
            e.preventDefault();
            displayImageProperties(image);
        });
    });
    displayPageNumbers(images);
}

function nextPage(images) {
    if ((currentPage + 1) * itemsPerPage < images.length) {
        currentPage++;
        loadImages(images);
    }
    displayPageNumbers(images);
}

function previousPage(images) {
    if (currentPage > 0) {
        currentPage--;
        loadImages(images);
    }
    displayPageNumbers(images);
}

// function to display the page numbers: currentPage/totalPages
function displayPageNumbers(images) {
    var totalPages = Math.ceil(images.length / itemsPerPage);
    $('#page-numbers').text("Page " + (currentPage + 1) + '/' + totalPages);
}

function displayImageProperties(image) {
    $('#image-details').empty();
    $('#image-details').append('<h2>Image Properties</h2>');
    for (var property in image) {
        if (image.hasOwnProperty(property)) {
            $('#image-details').append('<p><strong>' + property + ':</strong> ' + image[property] + '</p>');
        }
    }
}

var filteredImages = [];

$('#filter-form').on('submit', function(e) {
    e.preventDefault();

    $.getJSON('./images.json', function(data) {
        filteredImages = filterImages(data);
        currentPage = 0; // Reset current page to 0
        loadImages(filteredImages);
    });
});

$.getJSON('./images.json', function(data) {
    filteredImages = data; // Assuming 'images' is a global variable
    loadImages(filteredImages);

    $('#previous-page').on('click', function() {
        previousPage(filteredImages);
    });

    $('#next-page').on('click', function() {
        nextPage(filteredImages);
    });
});