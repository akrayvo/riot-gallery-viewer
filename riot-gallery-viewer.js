/*
 * RiotGalleryViewer class
 * make items in an image gallery clickable.
 * load a viewer with previous/next buttons to view each image in the gallery
 */

RiotGalleryViewer = {

    // images/images container
    galleries: [],

    // the fields in a new gallery
    galleryBlank: {
        // the container element of the gallery
        elem: null,
        // the id of the container element
        elemId: null,
        // initial images that will be converted into gallery items/images (will only be false for generated galleries)
        initImgs: [],
        // each item/image in the gallery
        items: [],
        // is the the gallery html setup (will only be false for generated galleries)
        isHtmlBuilt: false,
        // the gallery is loaded (set up)
        isLoaded: false,
        // there was a gallery setting up the gallery
        isError: false,
        // array of errors setting up the gallery. will be set if isError is true
        errorMessages: [],
        // a file of images for generated html galleries
        imgFileUrl: null,
        // the imageFileUrl has been processed
        isImgFileUrlComplete: false,
    },

    // fields to initialize a new gallery item
    galleryItemBlank: {
        // url of the full sized display image
        url: null,
        // element that is clicked to display the image
        clickElem: null,
        caption: null,
        isError: false,
        isLoaded: false,
        // full width of the image file
        width: null,
        // full height of the image file
        height: null
    },

    options: {
        // write information to the console log. needed for troubeshooting/testing/development only
        doConsoleLog: false,
        // write a code trace on every console log. needed for troubeshooting/testing/development only
        doConsoleTrace: false,
        transitionMs: 3000,
        transitionFrameMs: 30,
        imageFailedCaptionHtml: '<i>Could Not Load Image</i>',
        defaultImgSize: 300
    },

    /*****************************************************************************
     *****************************************************************************
     * Initialization - START - code to run after page load to initialize the galleries */

    /*
     * called on page load
     * begin initialization
     */
    initialize() {
        this.consoleLog('Riot Gallery Viewer - begin initialization of loaded data');

        //const isGalleryWithFileRemoteUrl = this.processGalleryFileRemoteUrls();
        const isGalleryWithFileRemoteUrl = false;

        // if there are no remote urls process now
        if (!isGalleryWithFileRemoteUrl) {
            // checks that remote files are process. if so continue initializtion
            this.initializeRemoteComplete();
        }
    },

    /*
     * 2nd part of initialization
     * called after remote image urls have been read (if required)
     */
        initializeRemoteComplete() {
            for (let x = 0; x < this.galleries.length; x++) {
                const gal = this.galleries[x];
                if (gal.imageFileUrl && !gal.imageFileUrlIsComplete && !gal.isError) {
                    // there is still a remote file to process (file set, not processed, and no error)
                    // do not continue. function will be called again
                    return;
                }
            }
            // this.buildHtmlGalleries();
            this.setGalleriesByClass();
            console.log(this.galleries);
        },

    /* Initialization - END
     *****************************************************************************
     *****************************************************************************/

    

    /*****************************************************************************
     *****************************************************************************
     * Set Galleries and Images - START */

    /*
     * automatically create gallery instances on ui, ol, table, and ld tags with the "riot-gallery-viewer" class
     */
    setGalleriesByClass() {
        const elems = document.getElementsByClassName('riot-gallery');
        for (let x = 0; x < elems.length; x++) {
            this.setGalleryByElem(elems[x], null);
        }
    },

    /*
     * automatically create single gallery instance on tags/elements with the "riot-gallery-viewer" class
     */
    setGalleryByElem(galElem, galKey) {
        if (galKey === null) {
            galKey = this.getNewGalKeyByElem(galElem);
            if (galKey === null) {
                // already set up
                return false;
            }
        }

        if (this.galleries[galKey].isError) {
            return false;
        }

        // try to get elements by class
        let elems = galElem.getElementsByClassName('riot-gallery-item');

        if (elems.length < 1) {
            const tagName = this.getElemTagName(galElem);
            // try to get elements by tag based on the container tag
            if (tagName == 'ul' || tagName == 'ol') {
                elems = galElem.getElementsByTagName('li');
            } else if (tagName == 'table') {
                elems = galElem.getElementsByTagName('td');
            } else {
                elems = galElem.getElementsByTagName('figure');
            }
        }

        if (elems.length < 1) {
            this.galleries[galKey].isError = true;
            this.galleries[galKey].errorMessages.push('no items (image containers) found');
            this.consoleLog('gallery not loaded. no items (image containers) found', galKey);
            return false;
        }

        for (let elemKey = 0; elemKey < elems.length; elemKey++) {
            this.setGalleryItemByElem(galKey, elems[elemKey]);
        }

        if (this.galleries[galKey].items.length < 1) {
            this.galleries[galKey].isError = true;
            this.galleries[galKey].errorMessages.push('no items found');
            this.consoleLog('gallery not loaded. no valid items (image containers) found', galKey);
            return false;
        }

        this.galleries[galKey].isLoaded = true;

        return true;
    },

    /*
     * get the key of the galleries array. if it doesn't exist, add it
     */
    getNewGalKeyByElem(elem) {

        if (!this.getElemTagName(elem)) {
            return false;
        }

        for (let galKey = 0; galKey < this.galleries.length; galKey++) {
            if (this.galleries[galKey].elem === elem) {
                if (this.galleries[galKey].isError) {
                    // gallery already added, but had errors
                    return false;
                }
                // gallery found, return key, do not add
                return galKey;
            }
        }

        // create new gallery object
        let gal = this.getByVal(this.galleryBlank);

        gal.elem = elem;

        this.galleries.push(gal);

        // array key of the current (new) gallery
        const galKey = this.galleries.length - 1;

        return galKey;
    },

    setGalleryItemByElem(galleryKey, elem) {

        const url = this.getImgUrlFromConElem(elem);
        if (!url) {
            return false;
        }

        const clickElem = this.getClickElemFromConElem(elem);
        if (clickElem) {
            // make sure that the clickElem isn't already set (in this gallery or another)
            for (let g = 0; g < this.galleries.length; g++) {
                for (let i = 0; i < this.galleries[g].items.length; i++) {
                    if (this.galleries[g].items[i].clickElem === clickElem) {
                        console.log('skip element. click elem already set.');
                        return false;
                    }
                }
            }
        }

        const caption = this.getCaptionFromConElem(elem);

        return this.setGalleryItem(galleryKey, url, clickElem, caption);
    },

    setGalleryItem(galKey, url, clickElem, caption) {

        if (!this.galleries[galKey]) {
            return false;
        }

        if (!url) {
            return false;
        }

        if (clickElem) {
            // add click event to item
            clickElem.galKey = galKey;
            // current length, before adding. this will be the new key
            clickElem.itemKey = this.galleries[galKey].items.length;
            clickElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.itemClicked(this.galKey, this.itemKey);
            }, false);
        }

        let item = this.getByVal(this.galleryItemBlank);
        item.url = url;
        item.clickElem = clickElem;
        if (caption) {
            item.caption = caption;
        }
        this.galleries[galKey].items.push(item);

        return true;
    },

    /* Set Galleries and Images - END
     *****************************************************************************
     *****************************************************************************/


    /*****************************************************************************
     *****************************************************************************
     * Get item info from container - START - get URL, click elem, and caption) */

    /*
     * Get image url from container element
     */
    getImgUrlFromConElem(conElem) {
        let url;

        // data-riot-gallery-image-url set on container or children
        // <li data-riot-gallery-image-url="./image.jpg"><img src="./thumb.jpg"></li>
        // <li><img src="./thumb.jpg" data-riot-gallery-image-url="./image.jpg"></li>
        url = this.getSubElemAttrVal(conElem, 'data-riot-gallery-image-url');
        if (url) {
            return url;
        }
        // data-image-url set on li container or children
        // <li data-image-url="./image.jpg"><img src="./thumb.jpg"></li>
        // <li><a href="./image.jpg" data-image-url="./image.jpg"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrVal(conElem, 'data-image-url');
        if (url) {
            return url;
        }

        // href from a tag (link) with a class of "riot-gallery-image-link"
        // <li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrValBySelector(conElem, 'a.riot-gallery-image-link', 'href');
        if (url) {
            return url;
        }

        // href from a tag (link) with a class of "image-link"
        // <li><a href="./image.jpg" class="image-link"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrValBySelector(conElem, 'a.image-link', 'href');
        if (url) {
            return url;
        }

        // src from img tag with "riot-gallery-image-thumb" class
        // <li><img src="./image.jpg" class="riot-gallery-image-thumb"></li>
        url = this.getSubElemAttrValBySelector(conElem, 'img.riot-gallery-image-thumb', 'src');
        if (url) {
            return url;
        }

        // src from img tag with "image-thumb" class
        // <li><img src="./thumb.jpg" class="image-thumb"></li>
        url = this.getSubElemAttrValBySelector(conElem, 'img.image-thumb', 'src');
        if (url) {
            return url;
        }

        // href from a tag (link)
        // <li><a href="./image.jpg"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrValBySelector(conElem, 'a', 'href');
        if (url) {
            return url;
        }

        // src from img tag
        // <li><img src="./image.jpg"></li>
        url = this.getSubElemAttrValBySelector(conElem, 'img', 'src');
        if (url) {
            return url;
        }

        return null;
    },

    /*
     * Get clickable gallery element (loads the image in the viewer) from container element
     */    
    getClickElemFromConElem(conElem) {

        // a tag (link) with a class of "riot-gallery-image-link"
        // <li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
        let elem = this.getSubElemBySelector(conElem, 'a.riot-gallery-image-link');
        if (elem) {
            return elem;
        }

        // img tag with "riot-gallery-image-thumb" class
        // <li><img src="./thumb.jpg" class="riot-gallery-image-thumb"></li>
        elem = this.getSubElemBySelector(conElem, 'img.riot-gallery-image-thumb');
        if (elem) {
            return elem;
        }

        // a tag (link) with a class of "image-link"
        // <li><a href="./image.jpg" class="image-link"><img src="./thumb.jpg"></a></li>
        elem = this.getSubElemBySelector(conElem, 'a.image-link');
        if (elem) {
            return elem;
        }

        // img tag with "image-thumb" class
        // <li><img src="./thumb.jpg" class="image-thumb"></li>
        elem = this.getSubElemBySelector(conElem, 'img.image-thumb');
        if (elem) {
            return elem;
        }

        // data-riot-gallery-image-url set on an img
        // <li><img src="./thumb.jpg" data-riot-gallery-image-url="./image.jpg"></li>
        elem = this.getElemSubByAttr(conElem, 'data-riot-gallery-image-url');
        if (elem) {
            return elem;
        }

        // data-image-url set on an img
        // <li><img src="./thumb.jpg" data-image-url="./image.jpg"></li>
        elem = this.getElemSubByAttr(conElem, 'data-image-url');
        if (elem) {
            return elem;
        }

        // a tag (link)
        // <li><a href="./image.jpg"><img src="./thumb.jpg"></a></li>
        elem = this.getSubElemBySelector(conElem, 'a');
        if (elem) {
            return elem;
        }

        // src from img tag
        // <li><img src="./image.jpg"></li>
        elem = this.getSubElemBySelector(conElem, 'img');
        if (elem) {
            return elem;
        }

        // no link or image found
        return conElem;
    },

    /*
     * Get get caption from container element
     */    
    getCaptionFromConElem(conElem) {
        // data-riot-gallery-image-caption on the container
        // <li data-riot-gallery-image-caption="My Pic"><img src="./image.jpg"></li>
        // <li><img src="./image.jpg" data-riot-gallery-image-caption="My Pic"></li>
        let caption = this.getSubElemAttrVal(conElem, 'data-riot-gallery-image-caption');
        if (caption) {
            return caption;
        }

        // data-image-caption on the container
        // <li data-image-caption="My Pic"><img src="./image.jpg"></li>
        // <li><img src="./image.jpg" data-image-caption="My Pic"></li>
        caption = this.getSubElemAttrVal(conElem, 'data-image-caption');
        if (caption) {
            return caption;
        }

        // riot-gallery-image-caption class on any text container
        // <li><img src="./image.jpg"><div class="riot-gallery-image-caption">My Pic</div></li>
        caption = this.getSubElemTextBySelector(conElem, '.riot-gallery-image-caption', 'text');
        if (caption) {
            return caption;
        }

        // image-caption class on any text container
        // <li><img src="./image.jpg"><div class="image-caption">My Pic</div></li>
        caption = this.getSubElemTextBySelector(conElem, '.image-caption', 'text');
        if (caption) {
            return caption;
        }

        // image-caption class on any text container
        // <li><figure><img src="./image.jpg"><figcaption>My Pic</figcaption></figure></li>
        caption = this.getSubElemTextBySelector(conElem, 'figcaption', 'text');
        if (caption) {
            return caption;
        }

        // get all images
        let imgElems = conElem.getElementsByTagName('img');

        // alt or title of an img with img.riot-gallery-image-thumb class
        // <li><img src="./image.jpg" class="riot-gallery-image-thumb" alt="My Pic"></li>
        for (let x = 0; x < imgElems.length; x++) {
            const imgElem = imgElems[x];
            if (imgElem.classList.contains('riot-gallery-image-thumb')) {
                let caption = imgElem.getAttribute('alt');
                if (caption) {
                    return caption;
                }
                caption = imgElem.getAttribute('title');
                if (caption) {
                    return caption;
                }
            }
        }
        // alt or title of an img with img.riot-gallery-image-thumb class
        // <li><img src="./image.jpg" class="image-thumb" alt="My Pic"></li>
        for (let x = 0; x < imgElems.length; x++) {
            const imgElem = imgElems[x];
            if (imgElem.classList.contains('image-thumb')) {
                let caption = imgElem.getAttribute('alt');
                if (caption) {
                    return caption;
                }
                caption = imgElem.getAttribute('title');
                if (caption) {
                    return caption;
                }
            }
        }
        // alt or title of an img with img.riot-gallery-image-thumb class
        // <li><img src="./image.jpg" alt="My Pic"></li>
        for (let x = 0; x < imgElems.length; x++) {
            const imgElem = imgElems[x];
            let caption = imgElem.getAttribute('alt');
            if (caption) {
                return caption;
            }
            caption = imgElem.getAttribute('title');
            if (caption) {
                return caption;
            }
        }

        // nothing found. return null
        return null;
    },

    /* Get item info from container - END
     *****************************************************************************
     *****************************************************************************/


    
    /*****************************************************************************
     *****************************************************************************
     * event handling (click and other) - START */

     itemClicked(galKey, itemKey) {
        this.loadImage(galKey, itemKey, null);
    }, 

    /* event handling (click and other) - END
     *****************************************************************************
     *****************************************************************************/


    /*****************************************************************************
     *****************************************************************************
     * DOM - START */

     getElemTagName(elem) {
        if (!elem) {
            // invalid element
            return null;
        }

        if (!elem.tagName) {
            // not an element
            return null;
        }

        return elem.tagName.trim().toLowerCase();
    },

    getSubElemAttrVal(elem, attr) {
        if (!elem || !attr) {
            return null;
        }

        let val = elem.getAttribute(attr);
        if (val !== null && val !== false) {
            return val;
        }

        let subElem = elem.querySelector('[' + attr + ']');

        if (!subElem) {
            return null;
        }

        val = subElem.getAttribute(attr);

        return val;
    },
    
    getSubElemAttrValBySelector(elem, selector, attr) {
        const subElem = this.getSubElemBySelector(elem, selector);
        if (!subElem) {
            return null;
        }

        let val = subElem.getAttribute(attr);
        if (val === null) {
            return null;
        }

        return val;
    },

    getSubElemTextBySelector(elem, selector) {

        const subElem = this.getSubElemBySelector(elem, selector);
        if (!subElem) {
            return null;
        }

        const text = subElem.innerHTML;
        if (text === null) {
            return null;
        }

        return text;
    },    
    
    getSubElemBySelector(elem, selector) {
        if (!elem || !selector) {
            return null;
        }

        const subElem = elem.querySelector(selector);
        if (!subElem) {
            return null;
        }

        return subElem;
    },

    getElemSubByAttr(elem, attr) {
        if (!elem || !attr) {
            return null;
        }

        let val = elem.getAttribute(attr);
        if (val !== null && val !== false) {
            return elem;
        }

        let item = elem.querySelector('[' + attr + ']');

        if (!item) {
            return null;
        }

        return item;
    },    

    /* DOM - END
     *****************************************************************************
     *****************************************************************************/    

    /*****************************************************************************
     *****************************************************************************
     * Misc - START */

    /*
     * get the value of a
     */
    getOptionVal(option) {
        if (this.options.hasOwnProperty('option')) {
            return this.options['option'];
        }

        return null;
    },

    /*
     * add info to the console 
     * only works if options.doConsoleLog is true
     */
    consoleLog(val1, val2, val3, val4) {

        if (this.getOptionVal('doConsoleLog')) {
            if (typeof val4 !== 'undefined') {
                console.log(val1, '|', val2, '|', val3, '|', vals4);
            } else if (typeof val3 !== 'undefined') {
                console.log(val1, '|', val2, '|', val3);
            } else if (typeof val2 !== 'undefined') {
                console.log(val1, '|', val2);
            } else if (typeof val1 !== 'undefined') {
                console.log(val1);
            }
        }

        if (this.getOptionVal('doConsoleTrace')) {
            console.trace();
        }
    },

    /* Misc - END
     *****************************************************************************
     *****************************************************************************/


    /*****************************************************************************
     *****************************************************************************
     * Helper - START - not specific to this program */

    /*
     * return the value of an object (does NOT return a reference)
     */
    getByVal(theVar) {
        if (typeof theVar !== 'object') {
            return theVar;
        }
        return JSON.parse(JSON.stringify(theVar));
    },

    /* Helper - END
        *****************************************************************************
        *****************************************************************************/     
};


// initialzie gallery/galleries
window.onload = function () {
    RiotGalleryViewer.initialize();
    console.log(RiotGalleryViewer);
}