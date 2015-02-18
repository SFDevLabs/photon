(function (window, _ , $) {

  $('#tags').tagsInput({
    'height':'60px',
    'width':'280px'
  });
  var gridster;

  	// same object than generated with gridster.serialize() method
  	var rows=4;
    var margins = [7,7]
    var tmpl=$("#figureTmpl").text();
    var compiled = _.template(tmpl);
    /**
	 * Created widgets in grister for the dom
	 * @param {object} [gallerySelector]  The grister object.
	 * @param {array} [serialization]  List of relaization oject to put into grister
	 * return undefined
	 */
    var addAllWidget = function(gridster, serialization){
        gridster.remove_all_widgets();
        $.each(serialization, function(i , data) {
            
            var $li = gridster.add_widget('<li class="new">'+compiled({
                media_url:this.cdnUriProxy+'/org_'+this.fileName,
                
                caption: this.caption
            })+'</li>', this.size_x, this.size_y, this.col, this.row);
            $li.css('visibility','hidden');
            $li.attr("data-offset-x", this.offset_x)
            $li.attr("data-offset-y", this.offset_y)
            $li.attr("data-scale",this.scale)
            $li.attr("data-index",this.index)
            //widow.widgets.push($li)
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

    // $(window).resize(_.debounce(function(){
    //     window.toggleEditing(".edit-grid",false);
    //     gridster.destroy();
    //      var newbaseSize = calculateBaseWidth(".gridster",margins,rows)
    //      gridster = makeGridster(margins, newbaseSize);
    // }, 500));


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
    var gridster = makeGridster(margins, baseSize, true);

    var initGrid=function(serialization){
        var serialization = serialization.map(function(obj, i){ obj.index=i; return obj})
    	var serialization = Gridster.sort_by_row_and_col_asc(serialization);
    	addAllWidget(gridster ,serialization);
    }
  //   var editGrid = function(editing){
		// gridster.destroy();
  //       var newbaseSize = calculateBaseWidth(".gridster",margins, rows);
  //       gridster = makeGridster(margins, newbaseSize, editing);
  //   }

    //window.editGrid=editGrid;
    window.initGrid = initGrid;

    var save = function(url, _csrf){
        var widgets=[];
        gridster.$widgets.each(function(i,el){
            var $el = $(el)
            widgets.push({
             col : $el.attr('data-col')
            ,row : $el.attr('data-row')
            ,size_x: $el.attr('data-sizex')
            ,size_y: $el.attr('data-sizey')
            ,offset_x: $el.attr('data-offset-x')
            ,offset_y: $el.attr('data-offset-y')
            ,scale: $el.attr('data-scale')
            ,index: Number($el.attr('data-index'))
            // ,caption: $el.attr('data-caption')
            // ,location: $el.attr('data-location')
            });
        });
        widgets = _.sortBy(widgets,"index");
        var m = JSON.stringify( {_csrf:_csrf,widgets:widgets} ) 
        $.ajax({
          url: url,
          type: "PUT",
          context: document.body,
          dataType: "json",
          contentType: "application/json",
          data: m
        }).done(function(req) {
          //init(req);
        });
    };
    window.save = save;

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
    	var index;
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



        if(index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery[0], true);
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
            },
            hideAnimationDuration:0,
            showAnimationDuration:0


        };

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
        $('.pswp img').css("opacity",0);
        $('.pswp img').on('load',function(){
            $(this).css("opacity","");
        });
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
