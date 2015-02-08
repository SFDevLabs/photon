(function (window, _ , $) {

  $('#tags').tagsInput({
    'height':'60px',
    'width':'280px'
  });
  var gridster;

  	// same object than generated with gridster.serialize() method
  	var rows=6;
    var margins = [1,1]
    var tmpl=$("#figureTmpl").text();
    var compiled = _.template(tmpl);
    /**
	 * Created widgets in grister for the dom
	 * @param {object} [gallerySelector]  The grister object.
	 * @param {array} [serialization]  List of relaization oject to put into grister
	 * return undefined
	 */
    var addAllWidget = function(gridster, serialization){
        $.each(serialization, function() {
            gridster.add_widget('<li class="new">'+compiled({img_url:"http://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Small_rhombicosidodecahedron.png/600px-Small_rhombicosidodecahedron.png"})+'</li>', this.size_x, this.size_y, this.col, this.row);
        });
    };
    /**
	 * Utiliy to calculateBaseWidth of the DOM and divid by the grister rows
	 * @param {object} [gallerySelector]  The grister object.
	 * @param {array} [serialization]  List of relaization oject to put into grister
	 * return undefined
	 */
    var calculateBaseWidth = function(el, margins, rows){
        var width = $(el).width();
        var base = (width-((rows*2)*margins[0]))/rows;
        return base
    };

    $(window).resize(_.debounce(function(){
        window.toggleEditing(".edit-grid",false);
        gridster.destroy();
         var newbaseSize = calculateBaseWidth(".gridster",margins,rows)
         gridster = makeGridster(margins, newbaseSize);
    }, 500));

    var baseSize = calculateBaseWidth(".gridster", margins,rows)
    var makeGridster = function(margins, baseSize, edit){
         
        var grid = $(".gridster ul").gridster({
          widget_base_dimensions: [baseSize, baseSize],
          widget_margins: margins,
          resize:{
            enabled:edit?true:false
          }
        }).data('gridster')

        if (!edit){grid.disable(),$('.gs-resize-handle').remove();}
        return grid
    };
    window.makeGridster;
    var gridster = makeGridster(margins, baseSize);

    var initGrid=function(serialization){
    	var serialization = Gridster.sort_by_row_and_col_asc(serialization);
    	addAllWidget(gridster ,serialization);

    }
    var editGrid = function(editing){
		gridster.destroy();
        var newbaseSize = calculateBaseWidth(".gridster",margins, rows);
        gridster = makeGridster(margins, newbaseSize, editing);
    }
    window.editGrid=editGrid;
    window.initGrid = initGrid;

})(window, _, jQuery);


/**
 * Created initPhotoSwipeFromDOM for window scope
 * @param {string} [gallerySelector]  The css selector for the gallery div
 * return undefined
 */
(function(window){
var initPhotoSwipeFromDOM = function(gallerySelector) {

    // parse slide data (url, title, size ...) from DOM elements 
    // (children of gallerySelector)
    var parseThumbnailElements = function(el) {
        var thumbElements = $(el).find('figure'),//I know I'm adding jqeary
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            size,
            item;

        for(var i = 0; i < numNodes; i++) {

            figureEl = thumbElements[i]; // <figure> element

            // include only element nodes 
            if(figureEl.nodeType !== 1) {
                continue;
            }

            linkEl = figureEl.children[0]; // <a> element

            size = linkEl.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10)
            };



            if(figureEl.children.length > 1) {
                // <figcaption> content
                item.title = figureEl.children[1].innerHTML; 
            }

            if(linkEl.children.length > 0) {
                // <img> thumbnail element, retrieving thumbnail url
                item.msrc = linkEl.children[0].getAttribute('src');
            } 

            item.el = figureEl; // save link to element for getThumbBoundsFn
            items.push(item);
        }

        return items;
    };

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function(e) {
    	var index = 1;
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        if (!$(".edit-grid").data('editing')){
            return false;
        }
        

        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedGallery = $(eTarget).closest('ul')
        var clickedListItems = $(eTarget).closest('ul').find('figure')
        var clickedItem = $(eTarget).closest('figure')[0]
        // var clickedListItem = closest(eTarget, function(el) {
        //     return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        // });

        if(!clickedListItems) {
            return;
        }

        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
         
        // var childNodes = clickedListItem.parentNode.childNodes,
        //     numChildNodes = childNodes.length,
        var nodeIndex = 0;
        //     index;

        for (var i = 0; i < clickedListItems.length; i++) {
            if(clickedListItems[i].nodeType !== 1) { 
                continue; 
            }

            if(clickedListItems[i] === clickedItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }



        if(index && index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery[0] );
        }
        return false;
    };

    // parse picture index and gallery index from URL (#&pid=1&gid=2)
    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1),
        params = {};

        if(hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if(!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');  
            if(pair.length < 2) {
                continue;
            }           
            params[pair[0]] = pair[1];
        }

        if(params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        if(!params.hasOwnProperty('pid')) {
            return params;
        }
        params.pid = parseInt(params.pid, 10);
        return params;
    };

    var openPhotoSwipe = function(index, galleryElement, disableAnimation) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {
            index: index,

            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            getThumbBoundsFn: function(index) {
                // See Options -> getThumbBoundsFn section of documentation for more info
                var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect(); 

                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
            }

        };

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick
    }


    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if(hashData.pid > 0 && hashData.gid > 0) {
        openPhotoSwipe( hashData.pid - 1 ,  galleryElements[ hashData.gid - 1 ], true );
    }
};
window.initPhotoSwipeFromDOM=initPhotoSwipeFromDOM;
})(window)
