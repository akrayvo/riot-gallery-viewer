/*
 * RiotGalleryViewer class
 * make items in an image gallery clickable
 * load a viewer with previous/next buttons to view each image in the gallery
 */

const RiotGalleryViewer = {

    // items/images containers
    galleries: [],

    // fields in a new gallery
    galleryBlank: {
        // the container element of the gallery
        elem: null,
        // the id of the container element
        elemId: null,
        // initial images that will be converted into gallery items/images
        // array will be empty unless the gallery was generated via JavaScript
        initImgs: [],
        // each item/image in the gallery
        items: [],
        // is the gallery HTML set up?
        // will only be false for galleries that the program generates via JavaScript
        isHtmlBuilt: false,
        // is the gallery is loaded (set up)?
        isLoaded: false,
        // there was an error setting up the gallery?
        isError: false,
        // array of gallery init errors. will be empty when unless isError is true
        errorMessages: [],
        // URL of a file of images for HTML galleries generated via JavaScript 
        imageFileUrl: null,
        // has the remote file (imageFileUrl) has been processed?
        isImageFileUrlComplete: false
    },

    // fields in a new gallery item
    galleryItemBlank: {
        // URL of the full sized display image
        url: null,
        // element that is clicked to display the image
        clickElem: null,
        // caption of the image (optional)
        caption: null,
        // if the image has an error (could not load)
        isError: false,
        // if the image was loaded successfully.
        // if true, width and height will be set
        isLoaded: false,
        // full width of the image file
        width: null,
        // full height of the image file
        height: null
    },

    // image viewers
    // there are multiple so that 2 can display at a time during transitions
    viewers: [],
    viewerCurKey: null,
    viewerPrevKey: null,

    // fields for a new image viewer
    viewerBlank: {
        galKey: null,
        itemKey: null,
        height: null,
        width: null,
        left: null,
        top: null,
        closeRight: null,
        closeTop: null,
        padding: null,
        transition: {}
    },

    // is the RiotGalleryViewer HTML (main image, background, previous/next buttons, close button, etc) loaded?
    isViewerHtmlLoaded: false,

    // is the RiotGalleryViewer currently open?
    isViewerOpen: false,

    // blank (transparent) image.
    blankImageSrc: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',

    // JavaScript HTML elements
    // saved rather than repeatedly running selectors
    elems: {
        // window body
        body: null,
        // partially transparent background behind image, caption, close, previous, and next
        bg: null,
        // the text of the caption
        caption: null,
        // the caption container; hidden when there is no caption
        captionCon: null,
        // close buttons (in each viewer)
        closeCons: [],
        // main image (in each viewer)
        images: [],
        // main image container (in each viewer)
        imageCons: [],
        // container for the next button
        nextCon: null,
        // container for the previous button
        prevCon: null
    },

    // transition from the current main image to the new main image
    transition: null,

    // fields for a new transition
    // times are used to determine what percentage of the transaction is complete
    transitionBlank: {
        // the interval set through JavaScript's setInterval function
        jsInterval: null,
        // start time of the transition in milliseconds (thousands of a second)
        startTimeMs: null,
        // end time of the transition in milliseconds (thousands of a second)
        endTimeMs: null
    },

    // information on a swipe of a touch screen
    swipeInfo: {
        startX: null,
        //startY: null,
        startTime: null
    },

    // program options/preferences that can be set by the user
    options: {
        // write information to the console log and error log? needed for troubleshooting/testing/development only
        doConsoleLog: false,
        // output a stack trace on every console and error log? needed for troubleshooting/testing/development only
        doConsoleTrace: false,
        // if and when images should be preloaded; see validPreloadImagesTypes
        preloadImagesType: 'prevnext',
        // should material icons be loaded?
        // if set, the close, previous, and next buttons will look nicer. if not, the page will load slightly faster
        useMaterialIcons: true,
        // effect when transitioning from one image to another. see validTransitionTypes
        transitionType: 'slide',
        // the number of seconds to transition from one image to another; min = 0.1, max = 5
        transitionSeconds: 0.5,
        // the number of seconds between animation updates.
        // less time (more frames/updates) will require more processing
        // more time (time frames/updates) will result in smoother animation
        transitionFrameSeconds: 0.04,
        // text to display in the caption if an image does not load; can include HTML
        imageFailedCaptionHtml: '<i>Could Not Load Image</i>',
        // default image size (width and height, must be square) in pixels
        // will be used while an image is loading (spinner) and or fails loading (red background)
        // min = 200, max = 1000
        defaultImgSize: 300,
        // allow users on touch screens (phones, tables) to swipe to the previous or next image?
        doTouchSwipe: true,
        // if doTouchSwipe is true, the minimum number of pixels to swipe to change the image; min=0, max = 1000
        swipeMinPixels: 200,
        // if doTouchSwipe is true, the percentage of the screen to swipe to change the image; min=0, max = 90  
        swipeMinPercent: 50,
        // if doTouchSwipe is true, the minimum number of seconds to swipe to change the image. min=0, max = 2
        swipeMaxSeconds: 0.8
    },

    // when should images be preloaded?
    validPreloadImagesTypes: ['none', 'prevnext', 'galleryload', 'pageload'],

    // effect when transitioning from one image to the next
    validTransitionTypes: ['none', 'slide', 'fade', 'slidefade', 'size'],

    // URL of material icons
    // will only matter if options.useMaterialIcons is set
    materialIconsCssUrl: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',

    // have material icons (materialIconsCssUrl) been loaded?
    isMaterialIconsLoadComplete: false,

    // window width and height; set on page load and resize
    windowWidth: null,
    windowHeight: null,



    /*************************************************************
     *************************************************************
     * User Input - START - user functions to build and load galleries */

    /*
     * add an image to a gallery
     * called by user or other function
     * gallery is created if it doesn't already exist
     * does not validate data, validation is done when gallery is initialized
     */
    addImage(galleryElemId, url, thumbUrl, caption) {

        const galKey = this.getGalKeyByElemId(galleryElemId);

        if (galKey === false) {
            this.consoleError('addImage failed, could not find gallery', galleryElemId);
            return false;
        }

        if (this.addInitImage(galKey, url, thumbUrl, caption)) {
            this.consoleLog('image added', url);
        } else {
            this.consoleError('image added failed', url);
        }
    },

    /*
     * add a gallery from a file (remote URL)
     * called by user
     * gallery is created if it doesn't already exist
     */
    addImagesByFile(galleryElemId, fileUrl) {
        if (!fileUrl || typeof fileUrl !== 'string') {
            this.consoleError('addGalleryByString failed, no fileUrl', fileUrl, typeof fileUrl);
            return false;
        }

        const galKey = this.getGalKeyByElemId(galleryElemId);

        if (galKey === false) {
            this.consoleError('could not add add images to failed gallery', galleryElemId);
            return false;
        }

        this.galleries[galKey].imageFileUrl = fileUrl;

        this.consoleLog('Image list file set for adding to gallery', galleryElemId, fileUrl);
    },

    /*
     * set global options to determine the style and behavior of the gallery
     * called by user
     */
    setOption(option, value) {
        if (!option) {
            this.consoleError('setOption called with no option');
            return false;
        }
        if (typeof option !== 'string') {
            this.consoleError('setOption requires the option (field) to be a string', option);
            return false;
        }

        if (typeof value === 'undefined') {
            this.consoleError('setOption called with no value', option);
            return false;
        }

        // set to lower case so check is case insensitive; ex: "transitionType" = "transitiontype" = "TRANSITIONTYPE"
        const passedOption = option;
        option = option.toLowerCase();

        // use functions to set the value based on the type (boolean, string, number, etc)
        switch (option) {
            case 'preloadImagesType'.toLowerCase():
                return this.setOptionFromValid('preloadImagesType', value, this.validPreloadImagesTypes);
            case 'doConsoleLog'.toLowerCase():
                return this.setOptionBoolean('doConsoleLog', value);
            case 'doConsoleTrace'.toLowerCase():
                return this.setOptionBoolean('doConsoleTrace', value);
            case 'useMaterialIcons'.toLowerCase():
                return this.setOptionBoolean('useMaterialIcons', value);
            case 'transitionSeconds'.toLowerCase():
                return this.setOptionFloat('transitionSeconds', value, 0.1, 5);
            case 'transitionFrameSeconds'.toLowerCase():
                return this.setOptionFloat('transitionFrameSeconds', value, 0.02, 0.25);
            case 'imageFailedCaptionHtml'.toLowerCase():
                return this.setOptionString('imageFailedCaptionHtml', value);
            case 'defaultImgSize'.toLowerCase():
                return this.setOptionFloat('defaultImgSize', value, 200, 1000);
            case 'transitionType'.toLowerCase():
                return this.setOptionFromValid('transitionType', value, this.validTransitionTypes);
            case 'doTouchSwipe'.toLowerCase():
                return this.setOptionBoolean('doTouchSwipe', value);
            case 'swipeMinPixels'.toLowerCase():
                return this.setOptionFloat('swipeMinPixels', value, 0, 1000);
            case 'swipeMinPercent'.toLowerCase():
                return this.setOptionFloat('swipeMinPercent', value, 0, 90);
            case 'swipeMaxSeconds'.toLowerCase():
                return this.setOptionFloat('swipeMaxSeconds', value, 0, 2);
        }

        this.consoleError('invalid option', passedOption, value);
        return false;
    },
    /* User Input - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Set options - START - User specified settings */

    /*
     * set the value of an option to boolean (true/false) value
     */
    setOptionBoolean(option, value) {
        // if the value is "off", "no", or "false", set to false
        if (typeof value === 'string') {
            const lc = value.toLowerCase();
            if (lc === 'off' || lc === 'no' || lc === 'false') {
                this.options[option] = false;
                this.consoleLog('boolean option value set by string', option, this.options[option]);
                return true;
            }
        }

        if (value) {
            this.options[option] = true;
        } else {
            this.options[option] = false;
        }
        this.consoleLog('boolean option value set', option, this.options[option]);

        return true;
    },

    /*
     * set the value of an option to float (numeric) value
     * make sure the value is in the valid range (between min and max)
     */
    setOptionFloat(option, value, min, max) {
        const valueType = typeof value;

        if (valueType === 'number') {
            // the value is already a number, do nothing
        } else if (valueType === 'string') {
            if (isNaN(value)) {
                this.consoleError('option value must be a number, string passed', option, value);
                return false;
            }
            value = parseFloat(value);
        } else if (valueType === 'null') {
            value = 0;
        } else {
            this.consoleError('option value must be a number', option, value, typeof value);
            return false;
        }

        if (value < min || value > max) {
            this.consoleError('option value not in range', option, value, 'must be between', min, 'and', max);
            return false;
        }

        if (value > max) {
            this.consoleError('invalid option value, must be less than maximum', option, value, max);
            return false;
        }

        this.options[option] = value;
        this.consoleLog('number option value set', option, value);
        return true;
    },

    /*
     * set the value of an option to string value
     */
    setOptionString(option, value) {
        const valueType = typeof value;

        if (valueType === 'string') {
            // the value is already a string, do nothing
        } else if (valueType === 'null') {
            value = '';
        } else if (valueType === 'number' || valueType === 'bigint') {
            value = value.toString();
        } else {
            this.consoleError('option value must be a string', option, value, typeof value);
            return false;
        }

        this.options[option] = value;
        this.consoleLog('string option value set', option, value);
        return true;
    },

    /*
     * set the value of an option to a preselected value
     * value must be in the validValues array
     */
    setOptionFromValid(option, value, validValues) {
        if (validValues.indexOf(value) >= 0) {
            this.options[option] = value;
            this.consoleLog('valid option value set', option, value);
            return true;
        }
        this.consoleError('option is not value', option, validValues, value);
        return false;
    },

    /* Set options - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Initialization - START - code to run after page load to initialize the galleries */

    /*
     * begin initialization
     * called on page load event
     */
    initialize() {
        this.consoleLog('Riot Gallery Viewer - begin initialization of loaded data');

        const hasGalleryWithFileRemoteUrl = this.processGalleryFileRemoteUrls();

        // if there are no remote URLs process now
        if (!hasGalleryWithFileRemoteUrl) {
            this.initializeRemoteComplete();
        }
    },

    /*
     * 2nd part of initialization
     */
    initializeRemoteComplete() {
        this.galleries.forEach((gal) => {
            if (gal.imageFileUrl && !gal.isImageFileUrlComplete && !gal.isError) {
                // there is still a remote file to process (file set, not processed, and no error)
                // do not continue. function will be called again
                return;
            }
        });
        this.buildHtmlGalleries();
        this.setGalleriesByClass();
        if (this.options.preloadImagesType === 'pageload') {
            this.preloadAllImages();
        }
    },

    /* Initialization - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Preload Images - START */

    /*
     * preload all images in all galleries
     */
    preloadAllImages() {
        this.galleries.forEach((gal, galKey) => {
            this.preloadGalleryImages(galKey);
        });
    },

    /*
     * preload all images in a gallery
     */
    preloadGalleryImages(galKey) {
        if (!this.galleries[galKey]) {
            return;
        }

        this.galleries[galKey].items.forEach((item, itemKey) => {
            this.preloadImage(galKey, itemKey);
        });
    },

    /*
     * preload a specific gallery image
     */
    preloadImage(galKey, itemKey) {
        if (!this.galleries[galKey]) {
            return;
        }

        // an item before the first item. set the last item
        if (itemKey < 0) {
            itemKey = this.galleries[galKey].items.length - 1;
        }
        // an item after the last item. set the first item
        if (itemKey >= this.galleries[galKey].items.length) {
            itemKey = 0;
        }

        // item doesn't exist
        // should no happen since galleries with no images are not set up
        if (!this.galleries[galKey].items[itemKey]) {
            return;
        }

        const item = this.galleries[galKey].items[itemKey];

        // image has already been loaded. exit.
        if (item.isLoaded || item.isError) {
            return;
        }

        const img = new Image();
        img.src = item.url;
        img.galKey = galKey;
        img.itemKey = itemKey;
        this.consoleLog('start image preload', item.url);

        img.onload = function (e) {
            RiotGalleryViewer.consoleLog('image preload successful', img.src);
            RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, img, false);
        };

        img.onerror = function (e) {
            RiotGalleryViewer.consoleError('image preload error', this.src);
            RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, null, true);
        };
    },

    /* Preload Images - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Get images from remote text files - START - either a list or json */

    /*
     * process remote urls (files with lists of images for galleries)
     * calls function that runs the individual urls
     * return true if there is a file to process. false if no file to process.
     */
    processGalleryFileRemoteUrls() {
        let hasGalleryWithFileRemoteUrl = false;

        this.galleries.forEach((gal, galKey) => {
            if (gal.imageFileUrl) {
                this.processGalleryFileRemoteUrl(galKey);
                hasGalleryWithFileRemoteUrl = true;
            }
        });
        return hasGalleryWithFileRemoteUrl;
    },

    /*
     * process a remote URL (file with lists of images for a gallery)
     * send text to a function that processes images or set error
     * call function that checks if all urls are complete. if so, initialization continues
     */
    processGalleryFileRemoteUrl(galKey) {
        // double check that the url exists.
        if (!this.galleries[galKey]) {
            return false;
        }
        if (!this.galleries[galKey].imageFileUrl) {
            return false;
        }

        const url = this.galleries[galKey].imageFileUrl;

        const xhr = this.createXHR();

        if (!xhr) {
            this.galleries[galKey].isError = true;
            const msg = 'could not create an XHR request. could not read remote file.';
            this.galleries[galKey].errorMessages.push(msg + url);
            this.consoleError(msg, url);
            return;
        }

        xhr.open('GET', url, true);

        xhr.galKey = galKey;

        xhr.onreadystatechange = function () {
            const galKey = xhr.galKey;
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // success
                    RiotGalleryViewer.addGalleryImagesByText(galKey, xhr.responseText);
                } else {
                    // failed
                    RiotGalleryViewer.galleries[galKey].isError = true;
                    RiotGalleryViewer.galleries[galKey].errorMessages.push('could not read file: ' + xhr.responseURL);
                }
                RiotGalleryViewer.galleries[galKey].isImageFileUrlComplete = true;

                RiotGalleryViewer.initializeRemoteComplete();
            }
        };

        xhr.send();
    },

    /*
     * process text from a remote URL (file with list of images for a gallery)
     * either send the text to a function that handles json or a text list
     */
    addGalleryImagesByText(galKey, text) {
        let parsed = null;

        text = this.strReplaceAll(["\r\n", "\n\r", "\r"], "\n", text);
        text = text.trim();

        if (!text) {
            this.galleries[galKey].isError = true;
            this.galleries[galKey].errorMessages.push('addGalleryImagesByText - text file is empty: ' + galKey);
            return false;
        }

        const firstChar = text.substring(0, 1);
        const lastChar = text.substring(text.length - 1);

        // initial check; a json array will be in square brackets
        if (firstChar === '[' && lastChar === ']') {
            parsed = this.parseJson(text);
        }

        if (parsed) {
            parsed.forEach((parsedItem) => {
                this.addImageByObj(galKey, parsedItem);
            });

        } else {
            const lines = text.split("\n");

            lines.forEach((line) => {
                this.addImageByString(galKey, line);
            });
        }
    },

    /*
     * process an image object (from a remote text file)
     */
    addImageByObj(galKey, obj) {
        // double check that the gallery exists.
        if (!this.galleries[galKey]) {
            return false;
        }

        if (typeof obj !== 'object') {
            return false;
        }

        let url = null;
        let thumbUrl = null;
        let caption = null;

        if (Array.isArray(obj)) {
            if (obj[0]) {
                url = obj[0].trim();
            }
            if (obj[1]) {
                thumbUrl = obj[1].trim();
            }
            if (obj[2]) {
                caption = obj[2].trim();
            }
        } else {
            if (obj.url) {
                url = obj.url.trim();
            }
            if (obj.thumbUrl) {
                thumbUrl = obj.thumbUrl.trim();
            }
            if (obj.caption) {
                caption = obj.caption.trim();
            }
        }

        this.addInitImage(galKey, url, thumbUrl, caption);

        return true;
    },

    /*
     * process a single image from string (single line from a remote text file)
     */
    addImageByString(galKey, line) {
        let url = null;
        let thumbUrl = null;
        let caption = null;

        const strs = line.split("\t");

        if (strs.length > 1) {
            // tab separated
            if (strs[0]) {
                url = this.strStripStartEndQuotes(strs[0]);
            }
            if (strs[1]) {
                thumbUrl = this.strStripStartEndQuotes(strs[1]);
            }
            if (strs[2]) {
                caption = this.strStripStartEndQuotes(strs[2]);
            }
            this.addInitImage(galKey, url, thumbUrl, caption);
        } else {
            // strings in quotes (with validation)
            this.addImageByStringsWithQuotes(galKey, line);
        }
    },

    /*
     * trim a double quote from the beginning and end of the string
     * do not remove escaped double quotes. ex: \"Have a nice day\"
     */
    strStripStartEndQuotes(str) {
        const tempQuoteReplace = "[~~(quote here, riot gallery)~~]";
        str = this.strReplaceAll('\\"', tempQuoteReplace, str).trim();

        if (str.length < 1) {
            return '';
        }

        const first = str.substring(0, 1);
        if (first === '"') {
            // remove 1st character
            str = str.substring(1);
            if (str.length < 1) {
                return '';
            }
        }

        const last = str.substring(str.length - 1);
        if (last === '"') {
            // remove last character
            str = str.substring(0, str.length - 1);

            if (str.length < 1) {
                return '';
            }
        }

        str = this.strReplaceAll(tempQuoteReplace, '"', str).trim();

        return str;
    },

    /*
     * add image to a gallery based on a quoted string
     * "./image1.jpg", "./image1_thumbnail.jpg", "My Image"
     */
    addImageByStringsWithQuotes(galKey, line) {
        const tempQuoteReplace = "[~~(quote here, riot gallery)~~]";
        line = this.strReplaceAll('\\"', tempQuoteReplace, line);
        line = line.trim();

        const strs = line.split('"');

        let url = null;
        let thumbUrl = null;
        let caption = null;

        // 0 = [before first quote], 1 = url, 2 = [between quotes], 3 = thumbUrl, 4 = [between quotes], 5 = caption

        if (strs[1]) {
            url = this.strReplaceAll(tempQuoteReplace, '"', strs[1]);
        }
        if (strs[3]) {
            thumbUrl = this.strReplaceAll(tempQuoteReplace, '"', strs[3]);
        }
        if (strs[5]) {
            caption = this.strReplaceAll(tempQuoteReplace, '"', strs[5]);
        }

        this.addInitImage(galKey, url, thumbUrl, caption);
    },

    /* Get images from remote text files - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Build HTML Galleries - START */

    /*
     * build HTML galleries that the user added via JavaScript
     */
    buildHtmlGalleries() {
        this.galleries.forEach((gal, galKey) => {
            if (!gal.isHtmlBuilt && !gal.isError) {
                this.buildHtmlGallery(galKey);
            }
        });
    },

    /*
     * build a single HTML gallery that the user added via JavaScript
     */
    buildHtmlGallery(galKey) {
        if (!this.galleries[galKey]) {
            return false;
        }

        const gal = this.galleries[galKey];

        if (gal.isError) {
            return false;
        }

        if (gal.isHtmlBuilt) {
            return false;
        }

        if (gal.initImgs.length < 1) {
            return false;
        }

        this.setGalleryElem(galKey);

        if (!this.galleries[galKey].elem) {
            return false;
        }

        this.addGalleryLiItemsFromInitImages(galKey);
    },

    /*
     * set the parent URL of a gallery that the user added via JavaScript
     * if the element is a list (ul or ol), than set it as the container
     * if the element is a div, add a list (ul) inside, set the new ul as the container
     * if the element is not a div or list, add a list (ul) after the element, set the new ul as the container
     */
    setGalleryElem(galKey) {
        if (!this.galleries[galKey]) {
            return false;
        }

        if (!this.galleries[galKey].elemId) {
            this.galleries[galKey].isError = true;
            this.galleries[galKey].errorMessages.push('setGalleryElem - gallery Elem ID not set');
            return false;
        }

        let elem = document.getElementById(this.galleries[galKey].elemId);
        if (!elem) {
            this.galleries[galKey].isError = true;
            this.galleries[galKey].errorMessages.push('setGalleryElem - gallery Elem ID not found: ' + this.galleries[galKey].elemId);
            return false;
        }

        let tagName = this.getElemTagName(elem);

        if (!tagName) {
            this.galleries[galKey].isError = true;
            this.galleries.errorMessages.push('setGalleryElem - could not get element tag name: ' + this.galleries[galKey].elemId);
            return false;
        }

        tagName = tagName.trim().toLowerCase();

        let ulElem = null;

        if (tagName === 'ul' || tagName === 'ol') {
            // already in a list
            ulElem = elem;
            ulElem.classList.add('riot-gallery-style');
        } else if (tagName === 'div') {
            // in a div, add a ul inside
            ulElem = document.createElement('ul');
            ulElem.classList = 'riot-gallery-style';
            elem.innerHTML = '';
            elem.appendChild(ulElem);
        } else {
            // not a list or a div, add the ul after
            ulElem = document.createElement('ul');
            ulElem.classList = 'riot-gallery-style';
            this.insertAfter(elem, ulElem);
        }

        this.galleries[galKey].elem = ulElem;

        return true;
    },

    addGalleryLiItemsFromInitImages(galKey) {
        if (!this.galleries[galKey]) {
            return false;
        }

        let isImageAdded = false;

        this.galleries[galKey].initImgs.forEach((initImg, initImgKey) => {
            if (this.addGalleryLiItemFromInitImage(galKey, initImgKey)) {
                isImageAdded = true;
            }
        });

        if (!isImageAdded) {
            this.galleries[galKey].isError = true;
            this.galleries[galKey].errorMessages.push('addGalleryLiItemsFromInitImages - no images set');
            return false;
        }

        this.galleries[galKey].isHtmlBuilt = true;

        this.galleries[galKey].isLoaded = true;

        return true;
    },

    addGalleryLiItemFromInitImage(galKey, initImageKey) {
        if (!this.galleries[galKey]) {
            return false;
        }

        if (!this.galleries[galKey].initImgs[initImageKey]) {
            return false;
        }

        if (!this.galleries[galKey].elem) {
            return false;
        }

        const initImage = this.galleries[galKey].initImgs[initImageKey];

        if (typeof initImage.url !== 'string') {
            // url is not a string
            return false;
        }

        if (initImage.url.length < 1) {
            // url is an empty string
            return false;
        }

        let url = initImage.url;
        let thumbUrl = initImage.url;
        let caption = null;

        if (typeof initImage.thumbUrl === 'string') {
            if (initImage.thumbUrl.length > 0) {
                thumbUrl = initImage.thumbUrl;
            }
        }

        if (typeof initImage.caption === 'number') {
            caption = caption.toString();
        } else if (typeof initImage.caption === 'string') {
            if (initImage.caption.length > 0) {
                caption = initImage.caption;
            }
        }

        let liElem = document.createElement('li');
        let aElem = document.createElement('a');
        aElem.href = url;
        aElem.setAttribute('target', '_blank');

        if (!this.setGalleryItem(galKey, url, aElem, caption)) {
            return false;
        }

        let imgElem = document.createElement('img');
        imgElem.src = thumbUrl;
        aElem.appendChild(imgElem);
        liElem.appendChild(aElem);
        if (caption) {
            let divCapElem = document.createElement('div');
            divCapElem.innerHTML = caption;
            divCapElem.className = "riot-gallery-caption";
            liElem.appendChild(divCapElem);
        }

        this.galleries[galKey].elem.appendChild(liElem);

        return true;
    },

    /* Build HTML Galleries - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Add Gallery and Image - START - add to the galleries array or the initImgs array */

    /*
    get the key of the galleries array. if it doesn't exist, add it
    */
    getGalKeyByElemId(elemId) {

        if (typeof elemId !== 'string') {
            this.consoleError('cannot add gallery, invalid elemId type', elemId, typeof elemId);
            return false;
        }

        if (elemId.length < 1) {
            this.consoleError('cannot add gallery, elemId is empty', elemId, typeof elemId);
            return false;
        }

        this.galleries.forEach((gal, galKey) => {
            if (gal.elemId === elemId) {
                if (gal.isError) {
                    // gallery already created with error
                    return false;
                }
                return galKey;
            }
        });

        // new empty gallery record
        let gal = this.getByVal(this.galleryBlank);

        gal.elemId = elemId;

        this.consoleLog('new gallery added', elemId);

        // add a new empty gallery to the galleries array. assign so that it is copied by value.
        this.galleries.push(gal);

        // array key of the current (new) gallery
        return this.galleries.length - 1;
    },

    /*
     * add an initImgs record to a gallery record
     */
    addInitImage(galKey, url, thumbUrl, caption) {

        // double check that the gallery exists.
        if (!this.galleries[galKey]) {
            return false;
        }

        if (!url || typeof url !== 'string') {
            return false;
        }

        const initImg = { url: url, thumbUrl: thumbUrl, caption: caption };
        this.galleries[galKey].initImgs.push(initImg);

        return true;
    },

    /* add gallery and image - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Set Galleries and Images - START */

    /*
     * automatically create gallery instances on tags with the "riot-gallery" class
     */
    setGalleriesByClass() {
        const elems = document.getElementsByClassName('riot-gallery');
        if (!elems) {
            return;
        }

        for (let x = 0; x < elems.length; x++) {
            this.setGalleryByElem(elems[x], null);
        }
    },

    /*
     * automatically create single gallery instance on tags/elements with the "riot-gallery" class
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
            this.consoleError('gallery not loaded. no items (image containers) found', galKey);
            return false;
        }

        for (let elemKey = 0; elemKey < elems.length; elemKey++) {
            this.setGalItemByElem(galKey, elems[elemKey]);
        }
        
        if (this.galleries[galKey].items.length < 1) {
            this.galleries[galKey].isError = true;
            this.galleries[galKey].errorMessages.push('no items found');
            this.consoleError('gallery not loaded. no valid items (image containers) found', galKey);
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

        this.galleries.forEach((gal, galKey) => {
            if (gal.elem === elem) {
                if (gal.isError) {
                    // gallery already added, but had errors
                    return false;
                }
                // gallery found, return key, do not add
                return galKey;
            }
        });

        // create new gallery object
        let gal = this.getByVal(this.galleryBlank);

        gal.elem = elem;

        this.galleries.push(gal);

        // array key of the current (new) gallery
        return this.galleries.length - 1;
    },

    /*
     * set up a gallery item (image URL, clickable element, and caption) from an HTML container element
     */
    setGalItemByElem(galKey, elem) {

        const url = this.getImgUrlFromConElem(elem);
        if (!url) {
            return false;
        }

        const clickElem = this.getClickElemFromConElem(elem);
        if (clickElem) {
            // make sure that the clickElem isn't already set (in this gallery or another)
            this.galleries.forEach((gal) => {
                gal.items.forEach((item) => {
                    if (item.clickElem === clickElem) {
                        // skip element. click elem already set.
                        return false;
                    }
                });
            });
        }

        const caption = this.getCaptionFromConElem(elem);

        return this.setGalleryItem(galKey, url, clickElem, caption);
    },

    /*
     * set up a gallery item from passed data (image URL, clickable element, and caption)
     */
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
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
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

        // href from a tag (link) with a class of "riot-gallery-image-link"
        // <li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrValBySelector(conElem, 'a.riot-gallery-image-link', 'href');
        if (url) {
            return url;
        }

        // src from img tag with "riot-gallery-image-thumb" class
        // <li><img src="./image.jpg" class="riot-gallery-image-thumb"></li>
        url = this.getSubElemAttrValBySelector(conElem, 'img.riot-gallery-image-thumb', 'src');
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

        // tag with a class of "riot-gallery-item-clickable"
        // <li><span class="riot-gallery-item-clickable"><a href="./image.jpg"><img src="./thumb.jpg"></a></span></li>
        let elem = this.getSubElemBySelector(conElem, '.riot-gallery-item-clickable');
        if (elem) {
            return elem;
        }

        // a tag (link) with a class of "riot-gallery-image-link"
        // <li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
        elem = this.getSubElemBySelector(conElem, 'a.riot-gallery-image-link');
        if (elem) {
            return elem;
        }

        // img tag with "riot-gallery-image-thumb" class
        // <li><img src="./thumb.jpg" class="riot-gallery-image-thumb"></li>
        elem = this.getSubElemBySelector(conElem, 'img.riot-gallery-image-thumb');
        if (elem) {
            return elem;
        }

        // data-riot-gallery-image-url set on an img
        // <li><img src="./thumb.jpg" data-riot-gallery-image-url="./image.jpg"></li>
        elem = this.getElemSubByAttr(conElem, 'data-riot-gallery-image-url');
        if (elem) {
            return elem;
        }

        // a tag (link)
        // <li><a href="./image.jpg"><img src="./thumb.jpg"></a></li>
        elem = this.getSubElemBySelector(conElem, 'a');
        if (elem) {
            return elem;
        }

        // img tag
        // <li><img src="./image.jpg"></li>
        elem = this.getSubElemBySelector(conElem, 'img');
        if (elem) {
            return elem;
        }

        // no link or image found
        // the container is clickable
        return conElem;
    },

    /*
     * Get get caption from container element
     */
    getCaptionFromConElem(conElem) {
        // data-riot-gallery-caption set on container or children
        // <li data-riot-gallery-caption="My Pic"><img src="./image.jpg"></li>
        // <li><img src="./image.jpg" data-riot-gallery-caption="My Pic"></li>
        let caption = this.getSubElemAttrVal(conElem, 'data-riot-gallery-caption');
        if (caption) {
            return caption;
        }

        // riot-gallery-caption class on any text container
        // <li><img src="./image.jpg"><div class="riot-gallery-caption">My Pic</div></li>
        caption = this.getSubElemTextBySelector(conElem, '.riot-gallery-caption', 'text');
        if (caption) {
            return caption;
        }

        // text inside a figcaption tag
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
                let caption = imgElem.getAttribute('title');
                if (caption) {
                    return caption;
                }
                caption = imgElem.getAttribute('alt');
                if (caption) {
                    return caption;
                }
            }
        }

        // alt or title of an img
        // <li><img src="./image.jpg" alt="My Pic"></li>
        for (let x = 0; x < imgElems.length; x++) {
            const imgElem = imgElems[x];
            let caption = imgElem.getAttribute('title');
            if (caption) {
                return caption;
            }
            caption = imgElem.getAttribute('alt');
            if (caption) {
                return caption;
            }
        }

        // nothing found. return null
        return null;
    },

    /* Get item info from container - END
      *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * event handling (click and other) - START */

    /*
     * A gallery item (image) has been clicked
     */
    itemClicked(galKey, itemKey) {
        this.loadImage(galKey, itemKey, null);
    },

    /*
     * The previous button has been clicked
     */
    prevClicked() {
        this.incrementImageAndLoad(-1, 'prev');
    },

    /*
     * The next button has been clicked
     */
    nextClicked() {
        this.incrementImageAndLoad(1, 'next');
    },

    /*
     * go to another image (previous or next)
     */
    incrementImageAndLoad(increment, transDirection) {
        if (!increment) {
            // should not happen
            return;
        }

        let galKey = null;
        let itemKey = null;

        const viewItem = this.getViewerCur();

        if (viewItem) {
            galKey = viewItem.galKey;
            itemKey = viewItem.itemKey;
        }

        if (galKey === null) {
            // no current gallery. should not happen
            galKey = 0;
        }
        if (itemKey === null) {
            // no current item. should not happen
            itemKey = 0;
        } else {
            itemKey += increment;
            const itemCount = this.galleries[galKey].items.length;
            if (itemKey >= itemCount) {
                itemKey = 0;
            }
            else if (itemKey < 0) {
                itemKey = itemCount - 1;
            }
        }

        this.loadImage(galKey, itemKey, transDirection);
    },

    /*
     * close button clicked
     */
    closeClicked() {
        this.closeViewer();
    },

    /*
     * the window (browser) is resized
     */
    windowResized() {
        if (!this.isViewerOpen) {
            return;
        }
        this.setWindowSize();

        this.calculateViewerPlacement();
        this.placeImgInPosition();
    },

    /* event handling (click and other) - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * load HTML viewer - START */

    /*
     * load HTML (background, main image, previous, next, close, caption)
     * set element selector values (this.elems)
     */
    loadViewerHtml() {
        // skip if already loaded
        if (this.isViewerHtmlLoaded) {
            return;
        }

        // body needed for appending HTML and setting classes
        this.elems.body = document.body;

        // make sure the gallery HTML isn't already loaded 
        const checkElem = document.getElementById('riot-gallery-viewer-bg');
        if (!checkElem) {

            let divElem = null;
            let aElem = null;
            let subDivElem = null;
            let imgElem = null;

            window.addEventListener('resize', function () {
                RiotGalleryViewer.windowResized();
            });

            if (this.options.doTouchSwipe) {
                window.addEventListener("touchstart", function (event) {
                    if (!RiotGalleryViewer.isViewerOpen) {
                        return;
                    }
                    RiotGalleryViewer.slideSwipeStartEvent(event);
                });
                window.addEventListener("touchend", function (event) {
                    if (!RiotGalleryViewer.isViewerOpen) {
                        return;
                    }
                    RiotGalleryViewer.slideSwipeEndEvent(event);
                });
            }

            // background
            // <div id="riot-gallery-viewer-bg"></div>
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-bg';
            divElem.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                RiotGalleryViewer.closeClicked();
            }, false);
            this.elems.bg = divElem;
            this.elems.body.appendChild(divElem);

            // previous button
            // <div id="riot-gallery-viewer-prev-con"><a href="#">&laquo;</a></div>
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-prev-con';
            aElem = document.createElement('a');
            aElem.innerHTML = '&laquo;';
            aElem.href = '#';
            divElem.appendChild(aElem);
            divElem.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                RiotGalleryViewer.prevClicked();
            }, false);
            this.elems.prevCon = divElem;
            this.elems.body.appendChild(divElem);

            // next button
            // <div id="riot-gallery-viewer-next-con"><a href="#">&raquo;</a></div>
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-next-con';
            aElem = document.createElement('a');
            aElem.innerHTML = '&raquo;';
            aElem.href = '#';
            divElem.appendChild(aElem);
            divElem.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                RiotGalleryViewer.nextClicked();
            }, false);
            this.elems.nextCon = divElem;
            this.elems.body.appendChild(divElem);

            // main image containers
            // multiple containers so we can transition
            // <div id="riot-gallery-viewer-image#-con">
            //      <div id="riot-gallery-viewer-close#-con">X</div>
            //      <img id="riot-gallery-viewer-image#" src="">
            //      <div id="riot-gallery-viewer-loading#"></div>
            // </div>
            this.elems.closeCons = [];
            this.elems.images = [];
            this.elems.imageCons = [];
            for (let x = 0; x < 2; x++) {
                divElem = document.createElement('div');
                divElem.id = 'riot-gallery-viewer-image-con' + x;
                divElem.classList = 'riot-gallery-viewer-image-con';

                subDivElem = document.createElement('div');
                subDivElem.id = 'riot-gallery-viewer-close-con' + x;
                subDivElem.classList = 'riot-gallery-viewer-close-con';
                aElem = document.createElement('a');
                aElem.innerHTML = 'X';
                aElem.href = '#';
                aElem.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    RiotGalleryViewer.closeClicked();
                }, false);
                subDivElem.appendChild(aElem);
                this.elems.closeCons[x] = subDivElem;
                divElem.appendChild(subDivElem);

                imgElem = document.createElement('img');
                imgElem.id = 'riot-gallery-viewer-image' + x;
                imgElem.classList = 'riot-gallery-viewer-image';
                imgElem.src = this.blankImageSrc;
                this.elems.images[x] = imgElem;
                divElem.appendChild(imgElem);
                subDivElem = document.createElement('div');
                subDivElem.id = 'riot-gallery-viewer-loading' + x;
                subDivElem.classList = 'riot-gallery-viewer-loading';
                divElem.appendChild(subDivElem);

                divElem.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    RiotGalleryViewer.nextClicked();
                }, false);

                this.elems.imageCons[x] = divElem;
                this.elems.body.appendChild(divElem);
            }

            // caption container
            // <div id="riot-gallery-viewer-caption-con"><div id="riot-gallery-viewer-caption"></div></div>
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-caption-con';
            subDivElem = document.createElement('div');
            subDivElem.id = 'riot-gallery-viewer-caption';
            this.elems.caption = subDivElem;
            divElem.appendChild(subDivElem);
            this.elems.captionCon = divElem;
            this.elems.body.appendChild(divElem);

            this.consoleLog('load viewer HTML complete');
        }

        if (this.options.useMaterialIcons) {
            this.loadMaterialIcons();
        }
    },

    /*
     * add an invisible (opacity=0) element with a Material Icons
     * if Material Icons are loaded, the with should be low.
     */
    areMaterialIconsLoaded() {
        let divElem = document.createElement('div');
        divElem.style.position = "fixed";
        divElem.style.opacity = 0;
        divElem.style.left = 0;
        divElem.style.top = 0;
        let spanElem = document.createElement('span');
        spanElem.classList = 'material-symbols-outlined';
        spanElem.innerHTML = 'arrow_back_ios_new';
        divElem.appendChild(spanElem);
        this.elems.body.appendChild(divElem);
        const w = divElem.offsetWidth;
        document.body.removeChild(divElem);

        if (w < 50) {
            this.consoleLog('Material Icons are already available.');
            return true;
        }
        return false;
    },

    /*
     * add Material Icons (CSS URL)
     */
    loadMaterialIcons() {
        if (this.isMaterialIconsLoadComplete) {
            this.addMaterialIconsToHtml();
            return;
        }
        if (this.areMaterialIconsLoaded()) {
            this.addMaterialIconsToHtml();
            return;
        }

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.type = 'text/css';
        styleLink.href = this.materialIconsCssUrl;

        styleLink.onload = function () {
            RiotGalleryViewer.consoleLog('Material Icons are loaded');
            RiotGalleryViewer.isMaterialIconsLoadComplete = true;
            RiotGalleryViewer.addMaterialIconsToHtml();
        };

        styleLink.onerror = function () {
            RiotGalleryViewer.consoleError('Could not load Material Icons');
        };

        document.head.appendChild(styleLink);
    },

    /*
     * replace previous, next and close button text with Material Icons
     */
    addMaterialIconsToHtml() {

        let closeElems = document.getElementsByClassName('riot-gallery-viewer-close-con');
        for (let x = 0; x < closeElems.length; x++) {
            let closeAs = closeElems[x].getElementsByTagName('a');
            for (let x = 0; x < closeAs.length; x++) {
                let spanElem = document.createElement('span');
                spanElem.classList = 'material-symbols-outlined';
                spanElem.innerHTML = 'close';
                closeAs[x].innerHTML = '';
                closeAs[x].appendChild(spanElem);
            }
        }

        let prevElem = document.getElementById('riot-gallery-viewer-prev-con');
        if (prevElem) {
            let prevAs = prevElem.getElementsByTagName('a');
            for (let x = 0; x < prevAs.length; x++) {
                let spanElem = document.createElement('span');
                spanElem.classList = 'material-symbols-outlined';
                spanElem.innerHTML = 'arrow_back_ios_new';
                prevAs[x].innerHTML = '';
                prevAs[x].appendChild(spanElem);
            }
        }

        let nextElem = document.getElementById('riot-gallery-viewer-next-con');
        if (nextElem) {
            let nextAs = nextElem.getElementsByTagName('a');
            for (let x = 0; x < nextAs.length; x++) {
                let spanElem = document.createElement('span');
                spanElem.classList = 'material-symbols-outlined';
                spanElem.innerHTML = 'arrow_forward_ios';
                nextAs[x].innerHTML = '';
                nextAs[x].appendChild(spanElem);
            }
        }
    },

    /* load HTML viewer - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Touchscreen Swipe - START */

    /*
     * touchscreen swipe started
     * save time in milliseconds and the X position
     */
    slideSwipeStartEvent(event) {
        const temp = this.getSwipeXYFromEvent(event);
        if (temp === null) {
            this.swipeInfoReset();
            this.consoleLog('slideSwipeStartEvent - no position found, stop swipe action;');
            return;
        }
        const x = temp[0];

        this.swipeInfo.startX = x;
        //this.swipeInfo.startY = y;
        this.swipeInfo.startTime = this.getCurMs();

        this.consoleLog('slideSwipeStartEvent - position = ' + x);
    },

    /*
     * touchscreen swipe ended
     * make sure the time and position is valid
     * go to the next or previous item/image (if the swipe is valid)
     */
    slideSwipeEndEvent(event) {
        if (!this.swipeInfo.startX || !this.swipeInfo.startTime) {
            this.swipeInfoReset();
            this.consoleLog('slideSwipeEndEvent - end swipe with no start swipe, stop swipe action');
            return;
        }

        if (this.options.swipeMaxSeconds) {
            const timeDif = this.getCurMs() - this.swipeInfo.startTime;
            if (timeDif > this.options.swipeMaxSeconds * 1000) {
                this.swipeInfoReset();
                // too much time passed between start and end. either an event was missed or slow swipe
                this.consoleLog('slideSwipeEndEvent - slide time too long, stop swipe action, max seconds = ' +
                    this.options.swipeMaxSeconds + ', seconds taken = ' + (timeDif / 1000));
                return;
            }
        }

        const temp = this.getSwipeXYFromEvent(event);

        if (temp === null) {
            this.swipeInfoReset();
            this.consoleLog('slideSwipeEndEvent - no position found, stop swipe action');
            return;
        }

        const x = temp[0];
        //const y = temp[1];

        const xDif = Math.abs(x - this.swipeInfo.startX);
        //const yDif = Math.abs(y - this.swipeInfo.startY);

        if (this.options.swipeMinPixels || this.options.swipeMinPercent) {
            let swipeDistanceSuccess = false;

            if (this.options.swipeMinPixels) {
                if (xDif >= this.options.swipeMinPixels) {
                    swipeDistanceSuccess = true;
                }
            }

            if (!swipeDistanceSuccess && this.options.swipeMinPercent) {
                const widthPercent = xDif / window.innerWidth * 100;
                if (widthPercent >= this.options.swipeMinPercent) {
                    swipeDistanceSuccess = true;
                }
            }

            if (!swipeDistanceSuccess) {
                this.swipeInfoReset();
                this.consoleLog('swipe distance was insufficient. Do not go to next image.');
                return;
            }
        }

        if (x < this.swipeInfo.startX) {
            this.consoleLog('slideSwipeEndEvent - previous');
            this.incrementImageAndLoad(-1, 'prev');
        } else {
            this.consoleLog('slideSwipeEndEvent - next');
            this.incrementImageAndLoad(1, 'next');
        }
    },

    /*
     * reset the swipe info to default values
     */
    swipeInfoReset() {
        this.swipeInfo.startX = null;
        //this.swipeInfo.startY = null;
        this.swipeInfo.startTime = null;
    },

    /*
     * get the X and Y coordinates for a swipe event
     */
    getSwipeXYFromEvent(event) {
        if (event.TouchList) {
            if (event.TouchList[0]) {
                if (event.TouchList[0].screenX && event.TouchList[0].screenY) {
                    return [event.TouchList[0].pageX, event.TouchList[0].pageY];
                }
            }
        }

        if (event.changedTouches) {
            if (event.changedTouches[0]) {
                if (event.changedTouches[0].screenX && event.changedTouches[0].screenX) {
                    return [event.changedTouches[0].screenX, event.changedTouches[0].screenY];
                }
            }
        }

        return null;
    },

    /* Touchscreen Swipe - END
     *************************************************************
     *************************************************************/


     
    /*************************************************************
     *************************************************************
      * Item/image display - START */

    /*
     * new image displayed in the viewer
     * happens on gallery image click and previous/next button click
     */
    loadImage(galKey, itemKey, transDirection) {
        const galItem = this.getGalItem(galKey, itemKey);

        if (!galItem) {
            // item/image not found. should not happen
            return;
        }

        // if transition is running, stop it
        this.endTransition();

        let isOpenViewerNow = false;
        if (!this.isViewerOpen) {
            if (!this.isViewerHtmlLoaded) {
                this.loadViewerHtml();
            }
            this.openViewer();
            this.setWindowSize();
            isOpenViewerNow = true;
        }

        if (this.viewerCurKey === null || this.options.transitionType === 'none') {
            this.viewerCurKey = 0;
        } else {
            this.viewerPrevKey = this.viewerCurKey;
            this.viewerCurKey++;
            if (this.viewerCurKey >= 2) {
                this.viewerCurKey = 0;
            }
        }

        this.viewers[this.viewerCurKey] = this.getByVal(this.viewerBlank);

        this.viewers[this.viewerCurKey].galKey = galKey;
        this.viewers[this.viewerCurKey].itemKey = itemKey;

        if (!galItem.isLoaded && !galItem.isError) {
            var img = new Image();
            img.src = galItem.url;
            if (img.complete) {
                this.consoleLog('display already loaded image', img);
                this.updateGalItem(galKey, itemKey, img, false);
            } else {
                img.galKey = galKey;
                img.itemKey = itemKey;

                img.onload = function (e) {
                    RiotGalleryViewer.consoleLog('image url successfully loaded', img.src);
                    // update the gallery item. even if we've moved on to another image, we'll set values in case the image is displayed again
                    RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, img, false);

                    if (!RiotGalleryViewer.isViewerOpen || RiotGalleryViewer.galKey === null || RiotGalleryViewer.itemKey === null) {
                        // we've moved on to another image or closed the viewer, don't update view
                        return false;
                    }
                    const viewer = RiotGalleryViewer.getViewerCur();
                    if (viewer.galKey === this.galKey && viewer.itemKey === this.itemKey) {
                        // image has not changed since start of image load
                        RiotGalleryViewer.calculateViewerPlacement();
                        RiotGalleryViewer.placeImgInPosition();
                    }
                };

                img.onerror = function (e) {
                    RiotGalleryViewer.consoleError('image url load error', this.src);
                    RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, null, true);
                    const viewer = RiotGalleryViewer.getViewerCur();
                    if (viewer.galKey === this.galKey && viewer.itemKey === this.itemKey) {
                        RiotGalleryViewer.calculateViewerPlacement();
                        RiotGalleryViewer.placeImgInPosition();
                        RiotGalleryViewer.updateCaption();
                    }
                };
                this.consoleLog('load image', img);
            }

        }
        this.calculateViewerPlacement(transDirection);
        this.placeImgInPosition();
        this.updateCaption();

        if (this.options.preloadImagesType === 'prevnext') {
            this.preloadImage(galKey, itemKey + 1);
            this.preloadImage(galKey, itemKey - 1);
        }
        else if (isOpenViewerNow && this.options.preloadImagesType === 'galleryload') {
            this.preloadGalleryImages(galKey);
        }

    },

    /*
     * open the viewer if it is not already open
     */
    openViewer() {
        if (this.isViewerOpen) {
            return;
        }

        this.elems.body.classList.add('riot-gallery-viewer-open');
        this.isViewerOpen = true;
    },

    /*
     * close the viewer
     */
    closeViewer() {
        this.elems.body.classList.remove('riot-gallery-viewer-open');
        this.isViewerOpen = false;
        this.resetViewerValues();
    },

    /*
     * close the viewer
     */
    resetViewerValues() {
        for (let x = 0; x < this.elems.imageCons.length; x++) {
            this.elems.images[x].src = this.blankImageSrc;
            this.elems.imageCons[x].classList.remove('is-displayed');
        }
        this.viewerCurKey = null;
        this.viewerPrevKey = null;
    },

    /*
     * update values for a gallery item/image 
     */
    updateGalItem(galKey, itemKey, img, isError) {
        if (!this.isGalItem(galKey, itemKey)) {
            return;
        }
        if (isError || !img) {
            this.galleries[galKey].items[itemKey].isError = true;
            return;
        }

        if (!img.width || !img.height) {
            this.galleries[galKey].items[itemKey].isError = true;
            RiotGalleryViewer.consoleError('invalid image. can not load', img.url);
            return;
        }

        this.galleries[galKey].items[itemKey].width = img.width;
        this.galleries[galKey].items[itemKey].height = img.height;
        this.galleries[galKey].items[itemKey].isError = false;
        this.galleries[galKey].items[itemKey].isLoaded = true;

    },

    /*
     * end a transition from one item/image to another
     */
    endTransition() {
        // clear the JavaScript interval (stop animation) and remote the transition information
        if (this.transition) {
            clearInterval(this.transition.jsInterval);
            this.transition = null;
        }

        // set all values that change during transitions to the final value
        if (this.viewerCurKey !== null) {
            let viewer = this.getViewerCur();
            if (viewer.transition) {
                for (var prop in viewer.transition) {
                    if (Object.prototype.hasOwnProperty.call(viewer.transition, prop)) {
                        if (prop === 'left') {
                            this.elems.imageCons[this.viewerCurKey].style.left = viewer.left + 'px';
                        } else if (prop === 'top') {
                            this.elems.imageCons[this.viewerCurKey].style.top = viewer.top + 'px';
                        } else if (prop === 'width') {
                            this.elems.imageCons[this.viewerCurKey].style.width = viewer.width + 'px';
                        } else if (prop === 'height') {
                            this.elems.imageCons[this.viewerCurKey].style.height = viewer.height + 'px';
                        } else if (prop === 'opacity') {
                            this.elems.imageCons[this.viewerCurKey].style.opacity = 1;
                        }
                    }
                }
            }
            this.viewers[this.viewerCurKey].transition = null;
        }

        // remove the previous image viewer
        this.removePrevViewer();
    },

    /*
     * remove the previous image viewer (the viewer for the previous image that transitioned out)
     */
    removePrevViewer() {
        if (this.viewerPrevKey !== null) {
            this.elems.imageCons[this.viewerPrevKey].classList.remove('is-displayed');
            this.elems.images[this.viewerPrevKey].src = this.blankImageSrc;
            this.viewers[this.viewerPrevKey] = null;
            this.viewerPrevKey = null;
        }
    },

    /*
     * show the next frame in the transition animation
     */
    transitionFrame() {
        if (!this.transition) {
            this.endTransition();
            return;
        }

        const curMs = this.getCurMs();
        const k = this.viewerCurKey;
        const viewer = this.viewers[k];

        // the transition is over
        if (!this.transition.endTimeMs || curMs > this.transition.endTimeMs) {
            this.endTransition();
            return;
        }

        // in order to determine where new values for the transition, determine the percentage of the total time has passed 
        const timeSinceTransStart = curMs - this.transition.startTimeMs;
        const percentToEnd = timeSinceTransStart / (this.options.transitionSeconds * 1000);
        const percentToStart = 1 - percentToEnd;

        let prevViewer = null;
        if (this.viewerPrevKey !== null) {
            prevViewer = this.viewers[this.viewerPrevKey];
        }

        // change the individual values for the current animation frame
        for (var prop in viewer.transition) {
            if (Object.prototype.hasOwnProperty.call(viewer.transition, prop)) {
                if (prop === 'left') {
                    let newLeft;
                    if (prevViewer) {
                        newLeft = (percentToStart * prevViewer.left) + (percentToEnd * prevViewer.transition[prop]);
                        this.elems.imageCons[this.viewerPrevKey].style.left = newLeft + 'px';
                    }
                    newLeft = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.left);
                    this.elems.imageCons[k].style.left = newLeft + 'px';
                } else if (prop === 'top') {
                    let newTop;
                    if (prevViewer) {
                        newTop = (percentToStart * prevViewer.top) + (percentToEnd * prevViewer.transition[prop]);
                        this.elems.imageCons[this.viewerPrevKey].style.top = newTop + 'px';
                    }
                    newTop = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.top);
                    this.elems.imageCons[k].style.top = newTop + 'px';
                } else if (prop === 'width') {
                    let newWidth;
                    if (prevViewer) {
                        newWidth = (percentToStart * prevViewer.width) + (percentToEnd * prevViewer.transition[prop]);
                        this.elems.imageCons[this.viewerPrevKey].style.width = newWidth + 'px';
                    }
                    newWidth = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.width);
                    this.elems.imageCons[k].style.width = newWidth + 'px';
                } else if (prop === 'height') {
                    let newHeight;
                    if (prevViewer) {
                        newHeight = (percentToStart * prevViewer.height) + (percentToEnd * prevViewer.transition[prop]);
                        this.elems.imageCons[this.viewerPrevKey].style.height = newHeight + 'px';
                    }
                    newHeight = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.height);
                    this.elems.imageCons[k].style.height = newHeight + 'px';
                } else if (prop === 'opacity') {
                    let newOpacity;
                    if (prevViewer) {
                        newOpacity = (percentToStart * 1) + (percentToEnd * 0);
                        this.elems.imageCons[this.viewerPrevKey].style.opacity = newOpacity;
                    }
                    newOpacity = (percentToStart * 0) + (percentToEnd * 1);
                    this.elems.imageCons[k].style.opacity = newOpacity;
                }
            }
        }
    },

    /*
     * set the dimensions of the browser window
     * run on page load and window resize.
     */
    setWindowSize() {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
    },


    /*
     * calculate the left, top, width, and height positions
     * get values for the start and final positions of transition for both the old and new images
     */
    calculateViewerPlacement(transDirection) {
        if (!transDirection) {
            transDirection = null;
        }

        const item = this.getCurGalItem();

        let imgWidth = this.options.defaultImgSize;
        let imgHeight = this.options.defaultImgSize;
        let isLoadingImage = true;
        let conPadding = 0;

        if (item.isLoaded && !item.isError && item.width && item.height) {
            imgWidth = item.width;
            imgHeight = item.height;
            isLoadingImage = false;
        }

        let viewerWidth = imgWidth;
        let viewerHeight = imgHeight;

        const maxWidth = this.windowWidth - 40;
        const maxHeight = this.windowHeight - 24;

        if (viewerWidth > maxWidth) {
            viewerWidth = maxWidth;
            viewerHeight = imgHeight / imgWidth * viewerWidth;
        }

        if (viewerHeight > maxHeight) {
            viewerHeight = maxHeight;
            viewerWidth = imgWidth / imgHeight * viewerHeight;
        }

        let viewerLeft = (this.windowWidth - viewerWidth) / 2;
        let viewerTop = (this.windowHeight - viewerHeight) / 2;

        if (isLoadingImage) {
            viewerLeft = viewerLeft - 8;
            viewerTop = viewerTop - 8;
            conPadding = 8;
        }

        let closeRight = -28;
        let closeTop = -28;
        if (viewerTop < 36) {
            closeTop = closeTop + (36 - viewerTop);
        }
        if (viewerLeft < 98) {
            closeRight = closeRight + (98 - viewerLeft);
        }

        const curK = this.viewerCurKey;

        this.viewers[curK].width = viewerWidth;
        this.viewers[curK].height = viewerHeight;
        this.viewers[curK].left = viewerLeft;
        this.viewers[curK].top = viewerTop;
        this.viewers[curK].closeTop = closeTop;
        this.viewers[curK].closeRight = closeRight;
        this.viewers[curK].padding = conPadding;

        const transExtraDistance = 4;
        const closeXWidth = 40;

        if (transDirection !== null) {
            const prevK = this.viewerPrevKey;
            this.viewers[curK].transition = {};
            if (prevK !== null) {
                this.viewers[prevK].transition = {};
            }

            if (prevK !== null) {
                if (this.options.transitionType === 'slide' || this.options.transitionType === 'slidefade') {
                    if (transDirection === 'prev') {
                        this.viewers[curK].transition.left = (this.windowWidth + transExtraDistance);
                        this.viewers[prevK].transition.left = -(this.viewers[prevK].width + transExtraDistance + closeXWidth);
                    } else if (transDirection === 'next') {
                        this.viewers[curK].transition.left = -(this.viewers[prevK].width + transExtraDistance + closeXWidth);
                        this.viewers[prevK].transition.left = (this.windowWidth + transExtraDistance);
                    }
                }

                if (this.options.transitionType === 'size') {
                    this.viewers[curK].transition.width = this.viewers[prevK].width;
                    this.viewers[curK].transition.height = this.viewers[prevK].height;
                    this.viewers[curK].transition.left = this.viewers[prevK].left;
                    this.viewers[curK].transition.top = this.viewers[prevK].top;
                }
            }

            if (this.options.transitionType === 'fade' || this.options.transitionType === 'slidefade') {
                this.viewers[curK].transition.opacity = 0;
                if (prevK !== null) {
                    this.viewers[prevK].transition.opacity = 0;
                }
            }
        }
    },

    /*
     * update the CSS classes for the image viewer
     */
    updateImgClassesAndSrc() {
        const item = this.getCurGalItem();
        const curK = this.viewerCurKey;

        let src = this.blankImageSrc;

        if (item.isError) {
            this.elems.imageCons[curK].classList.add('is-error');
            this.elems.imageCons[curK].classList.remove('is-loading');
        } else if (!item.isLoaded) {
            this.elems.imageCons[curK].classList.add('is-loading');
            this.elems.imageCons[curK].classList.remove('is-error');
        } else {
            this.elems.imageCons[curK].classList.remove('is-loading', 'is-error');
            if (item.url) {
                src = item.url;
            }
        }
        this.elems.images[curK].src = src;
        this.elems.imageCons[curK].classList.add('is-displayed');
    },

    /*
     * places the images (old and new for transitions) into the previously calculated location
     */
    placeImgInPosition() {
        const curK = this.viewerCurKey;

        if (curK === null) {
            return;
        }

        const viewer = this.getViewerCur();

        let curLeft = viewer.left;
        let curTop = viewer.top;
        let curWidth = viewer.width;
        let curHeight = viewer.height;
        if (this.transition) {
            for (var prop in viewer.transition) {
                if (Object.prototype.hasOwnProperty.call(viewer.transition, prop)) {
                    if (prop === 'left') {
                        curLeft = null;
                    } else if (prop === 'top') {
                        curTop = null;
                    } else if (prop === 'width') {
                        curWidth = null;
                    } else if (prop === 'height') {
                        curHeight = null;
                    }
                }
            }
        }

        let isNewTransition = false;

        if (curLeft !== null) {
            if (viewer.transition) {
                if (Object.keys(viewer.transition).length > 0) {
                    isNewTransition = true;
                    this.transition = this.getByVal(this.transitionBlank);
                    this.transition.startTimeMs = this.getCurMs();
                    this.transition.endTimeMs = this.transition.startTimeMs + (this.options.transitionSeconds * 1000);

                    this.transition.jsInterval = setInterval(function () {
                        RiotGalleryViewer.transitionFrame();
                    }, this.options.transitionFrameSeconds * 1000);

                    if (viewer.transition.hasOwnProperty('left')) {
                        if (viewer.transition.left !== null) {
                            curLeft = viewer.transition.left;
                        }
                    }
                    if (viewer.transition.hasOwnProperty('top')) {
                        if (viewer.transition.top !== null) {
                            curTop = viewer.transition.top;
                        }
                    }
                    if (viewer.transition.hasOwnProperty('width')) {
                        if (viewer.transition.width !== null) {
                            curWidth = viewer.transition.width;
                        }
                    }
                    if (viewer.transition.hasOwnProperty('height')) {
                        if (viewer.transition.height !== null) {
                            curHeight = viewer.transition.height;
                        }
                    }
                }
            }
        }

        if (curLeft !== null) {
            this.elems.imageCons[curK].style.left = curLeft + 'px';
        }

        if (this.options.transitionType === 'fade' && isNewTransition) {
            this.elems.imageCons[curK].style.opacity = 0;
        }

        if (curTop !== null) {
            this.elems.imageCons[curK].style.top = curTop + 'px';
        }
        if (curWidth !== null) {
            this.elems.imageCons[curK].style.width = curWidth + 'px';
        }
        if (curHeight !== null) {
            this.elems.imageCons[curK].style.height = curHeight + 'px';
        }

        this.elems.imageCons[curK].style.padding = viewer.padding + 'px';

        this.elems.closeCons[curK].style.right = viewer.closeRight + 'px';
        this.elems.closeCons[curK].style.top = viewer.closeTop + 'px';

        this.updateImgClassesAndSrc();

        if (this.options.transitionType === 'size') {
            this.removePrevViewer();
        }
    },

    /*
     * places the images (old and new for transitions) into the previously calculated location
     */
    updateCaption() {
        const item = this.getCurGalItem();

        if (item.isError && this.options.imageFailedCaptionHtml) {
            this.elems.caption.innerHTML = this.options.imageFailedCaptionHtml;
            this.elems.captionCon.classList = 'is-displayed';
        }
        else if (item.caption) {
            this.elems.caption.innerHTML = item.caption;
            this.elems.captionCon.classList = 'is-displayed';
        } else {
            this.elems.caption.innerHTML = '';
            this.elems.captionCon.classList = '';
        }
    },

    /* Item/image display - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * DOM - START */

    /*
     * get the tag name (ul, li, div, a, etc)
     */
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

    /*
     * get the value of an attribute, either on the current element or a child
     * used to get data-riot-gallery-image-url and data-riot-gallery-caption
     */
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

    /*
     * get the value of an attribute in a child
     * ex get the href of an a tag or the src of an img tag
     */
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

    /*
     * get the text (innerHTML) of a child element
     */
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

    /*
     * get the text (innerHTML) of a child element
     */
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

    /*
     * get a child element with that contains an attribute (ex: data-riot-gallery-image-url)
     */
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
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Misc - START */

    /*
     * get the current viewer
     */
    getViewerCur() {
        if (this.viewerCurKey === null) {
            return null;
        }
        return this.viewers[this.viewerCurKey];
    },

    /*
     * get a gallery item (image)
     */
    getGalItem(galKey, itemKey) {

        if (!this.isGalItem(galKey, itemKey)) {
            return null;
        }

        return this.galleries[galKey].items[itemKey];
    },

    /*
     * does the gallery item (image) exist?
     */
    isGalItem(galKey, itemKey) {

        if (galKey === null || itemKey === null) {
            return false;
        }

        if (!this.galleries[galKey]) {
            return false;
        }

        if (!this.galleries[galKey].items[itemKey]) {
            return false;
        }

        return true;
    },

    /*
     * get the current item (image) in the current gallery
     */
    getCurGalItem() {
        const viewer = this.getViewerCur();
        if (viewer === null) {
            return null;
        }
        return this.getGalItem(viewer.galKey, viewer.itemKey);
    },

    /*
     * add info to the browser console 
     * only if options.doConsoleLog is true
     */
    consoleLog(val1, val2, val3, val4, val5, val6, val7) {
        if (this.options.doConsoleLog) {
            if (typeof val7 !== 'undefined') {
                console.log(val1, '|', val2, '|', val3, '|', val4, '|', val5, '|', val6, '|', val7);
            } else if (typeof val6 !== 'undefined') {
                console.log(val1, '|', val2, '|', val3, '|', val4, '|', val5, '|', val6);
            } else if (typeof val5 !== 'undefined') {
                console.log(val1, '|', val2, '|', val3, '|', val4, '|', val5);
            } else if (typeof val4 !== 'undefined') {
                console.log(val1, '|', val2, '|', val3, '|', val4);
            } else if (typeof val3 !== 'undefined') {
                console.log(val1, '|', val2, '|', val3);
            } else if (typeof val2 !== 'undefined') {
                console.log(val1, '|', val2);
            } else if (typeof val1 !== 'undefined') {
                console.log(val1);
            }
        }

        if (this.options.doConsoleTrace) {
            console.trace();
        }
    },

    /*
     * add info to the browser error console 
     * only if options.doConsoleLog is true
     */
    consoleError(val1, val2, val3, val4, val5, val6, val7) {
        if (this.options.doConsoleLog) {
            if (typeof val7 !== 'undefined') {
                console.error(val1, '|', val2, '|', val3, '|', val4, '|', val5, '|', val6, '|', val7);
            } else if (typeof val6 !== 'undefined') {
                console.error(val1, '|', val2, '|', val3, '|', val4, '|', val5, '|', val6);
            } else if (typeof val5 !== 'undefined') {
                console.error(val1, '|', val2, '|', val3, '|', val4, '|', val5);
            } else if (typeof val4 !== 'undefined') {
                console.error(val1, '|', val2, '|', val3, '|', val4);
            } else if (typeof val3 !== 'undefined') {
                console.error(val1, '|', val2, '|', val3);
            } else if (typeof val2 !== 'undefined') {
                console.error(val1, '|', val2);
            } else if (typeof val1 !== 'undefined') {
                console.error(val1);
            }
        }

        if (this.options.doConsoleTrace) {
            console.trace();
        }
    },

    /* Misc - END
     *************************************************************
     *************************************************************/



    /*************************************************************
     *************************************************************
     * Helper - START - not specific to this program */

    /*
     * create an HTTP request for AJAX calls
     */
    createXHR() {
        if (window.XMLHttpRequest) { // Modern browsers
            return new XMLHttpRequest();
        }

        throw new Error("This browser does not support XMLHttpRequest");
    },

    /*
     * replace all characters in a string
     */
    strReplaceAll(from, to, str) {
        if (typeof from === 'number') {
            from = from.toString();
        }
        if (typeof to === 'number') {
            to = to.toString();
        }
        if (typeof from === 'string' || typeof from === 'number') {
            from = [from];
        } else {
            if (Array.isArray(from)) {
                return str;
            }
        }

        from.forEach((curFrom) => {
            let prev = '';
            while (prev !== str) {
                prev = str;
                str = str.replace(curFrom, to, str);
            }
        });

        return str;
    },

    /*
     * return the value of an object (does NOT return a reference)
     * needed because JavaScript passes arrays by reference
     */
    getByVal(theVar) {
        if (typeof theVar !== 'object') {
            return theVar;
        }
        return JSON.parse(JSON.stringify(theVar));
    },

    /*
     * get the current time in milliseconds
     */
    getCurMs() {
        const d = new Date();
        return d.getTime();
    },

    /*
     * parse json
     * return object on success and false on error
     */
    parseJson(str) {
        let parsed;
        try {
            parsed = JSON.parse(str);
        } catch (e) {
            // console.log(e);
            return false;
        }
        return parsed;
    },

    /* Helper - END
     *****************************************************************************
     *****************************************************************************/
};


// initialize gallery/galleries on page load
window.onload = function () {
    RiotGalleryViewer.initialize();
};
