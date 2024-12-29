/*
 * RiotGalleryViewer class
 * make items in an image gallery clickable.
 * load a viewer with previous/next buttons to view each image in the gallery
 */

class RiotGalleryViewer {

    static galleriesToBulidAr = [];

    /*****************************************************************************
     *****************************************************************************
     * Initialization - START */

    static initialize() {
        console.log('static initialize() {');
        // include jquery here if not available
        RiotGalleryViewer.buildGalleries();
    }

    static buildGalleries() {
        console.log('static buildGalleries() {');
        console.log('RiotGalleryViewer.galleriesToBulidAr', RiotGalleryViewer.galleriesToBulidAr);
        console.log('RiotGalleryViewer.galleriesToBulidAr.length', RiotGalleryViewer.galleriesToBulidAr.length);
        for (let x = 0; x < RiotGalleryViewer.galleriesToBulidAr.length; x++) {
            console.log('gallery in loop', RiotGalleryViewer.galleriesToBulidAr[x]);
            RiotGalleryViewer.buildGallery(RiotGalleryViewer.galleriesToBulidAr[x]);
        }
    }

    static buildGallery(gallery) {
        console.log('static buildGallery(gallery) {', gallery);
        let elem = $('#' + gallery.elementId).first();
        if (!elem) {
            return false;
        }
        if (elem.length < 1) {
            return false;
        }

        const tagName = RiotGalleryViewer.getElementTagName(elem);

        if (tagName === 'ul' || tagName === 'ol') {
            console.log('do nothing. we\'re already in a list');
            // do nothing. we're already in a list
        } else if (tagName === 'div') {
            console.log('insert here');
            let tempElem = $('<ul></ul>');
            console.log(1, tempElem);
            console.log(2, elem);
            elem.html(tempElem);
            elem = tempElem;
            console.log(3, elem);
        } else {
            console.log('not list or div');
            let tempElem = $('<ul></ul>');
            console.log(1, tempElem);
            console.log(2, elem);
            tempElem.insertAfter(elem);
            elem = tempElem;
            console.log(3, elem);
        }

        elem.addClass('riot-gallery-style');

        let html;
        console.log('tagName', tagName);
        console.log('images', images);
        for (let x = 0; x < gallery.images.length; x++) {
            const img = RiotGalleryViewer.buildGalleryImageInfo(gallery.images[x]);
            if (!img) {
                continue;
            }
            console.log(img);

            html = '<li><a href="' + img.url + '" target="_blank"><img src="' + img.thumbUrl + '"></a>';
            if (img.caption) {
                html += '<div class="riot-gallery-image-caption">'+img.caption+'</div>';    
            }
            html += '</li>';
            elem.append(html);
        }
    }

    static buildGalleryImageInfo(img) {
        console.log('---------------');
        console.log('img', img);
        let info = { url: null, thumbUrl: null, caption: null };
        if (typeof img === 'string') {
            info.url = img;
        }
        else if (Array.isArray(img)) {
            console.log('IS ARRAY');
            if (img.length > 0) {
                if (typeof img[0] === 'string' && img[0].length > 0) {
                    info.url = img[0];
                }
                if (img.length > 1) {
                    if (typeof img[1] === 'string' && img[1].length > 0) {
                        info.thumbUrl = img[1];
                    }
                    if (img.length > 2) {
                        if ((typeof img[2] === 'string' && img[2].length > 0) || typeof img[2] === 'number') {
                            info.caption = img[2];
                        }
                    }
                }
            }
            console.log(img);
            console.log(info);
        }

        if (info.url && !info.thumbUrl) {
            info.thumbUrl = info.url;
        } else if (info.thumbUrl && !info.url) {
            info.url = info.thumbUrl;
        }

        if (!info.url) {
            return null;
        }
        console.log(info);
        return info;
    }

    /* Initialization - END
    *****************************************************************************
    *****************************************************************************/

    /*****************************************************************************
     *****************************************************************************
     * Create html image gallery through class - START */

    static addGallery(elementId, images, options) {

        // validate element id.
        if (typeof elementId !== 'number') {
            // the elementid is a number, convert to string
            elementId = elementId.toString();
        }
        /*const tagName = RiotGalleryViewer.getTagNameFromIdJs(elementId);
        if (!tagName) {
            console.log('addGallery error 1');
            // element not found
            return false;
        }*///document.body.textContent
        if (typeof elementId !== 'string' || !elementId) {
            // id must be a string
            console.log('addGallery error 2', typeof images);
            return false;
        }
        let elem = document.getElementById(elementId);
        if (!elem) {
            let pageText = document.body.textContent;
            if (pageText.includes('[' + elementId + ']')) {
                document.body.innerHTML = document.body.innerHTML.replace(
                    '[' + elementId + ']',
                    '<div id="' + elementId + '"></div>');
            } else {
                // element not found
                console.log('addGallery error 2b', typeof images);
                return false;
            }
        }


        // validate image array
        if (typeof images !== 'object') {
            console.log('addGallery error 3', typeof images);
            // no image passed
            return false;
        }
        if (images.length < 1) {
            console.log('addGallery error 4');
            // no images passed
            return false;
        }

        // validate options
        if (typeof options === 'undefined') {
            // nothing passed, set to empty object
            options = {};
        }
        if (typeof options !== 'object') {
            console.log('addGallery error 6');
            // invalid options passed
            return false;
        }

        RiotGalleryViewer.galleriesToBulidAr.push({ elementId: elementId, images: images, options: options });
        console.log(RiotGalleryViewer.galleriesToBulidAr);
        /*let elem = $('#' + galleryElementId);

        const tagName = RiotGalleryViewer.getElementTag(elem);

        if (!tagName) {
            // could not get the tag name.
            return false;
        }*/
    }

    /* Create html image gallery through class - END
    *****************************************************************************
    *****************************************************************************/


    /*****************************************************************************
     *****************************************************************************
     * Helper Functions - START */

    /*
     * check that the tag Id is valid
     */
    /*static isValidHtmlTagId(id) {
        return /^[a-zA-Z0-9\_\.\-]+$/.test(id);
    }*/

    /*
     * get the tag name (a, img, table, ul, li) from a jquery element
     */
    /*static getTagNameFromIdJs(id) {

        if (typeof id == 'number') {
            id = id.toString();
        }

        if (!id || typeof id != 'string') {
            // empty or non string element Id
            return null;
        }

        const jsElem = document.getElementById(id);

        if (!jsElem) {
            // element not found
            return null;
        }

        const tagName = jsElem.tagName;

        if (!tagName) {
            // could not retrieve tag name
            return null;
        }

        return tagName.trim().toLowerCase();
    }*/

    /*
     * get the tag name (a, img, table, ul, li) from a jquery element
     */
    static getElementTagName(elem) {
        if (!elem) {
            // invalid jquery element
            return null;
        }

        if (!(elem instanceof jQuery)) {
            // no a jquery object
            return null;
        }

        if (elem.length < 1) {
            // element not found
            return null;
        }

        const tagName = elem.prop('tagName');

        if (!tagName) {
            // could not retrieve tag name
            return null;
        }

        return tagName.trim().toLowerCase();
    }



    /* Helper Functions - END
    *****************************************************************************
    *****************************************************************************/
};


// global variable to store an array of galleries
let riotGalleryViewerInstances = [];
// initialzie gallery/galleries on page load
window.onload = function () {
    RiotGalleryViewer.initialize();
}