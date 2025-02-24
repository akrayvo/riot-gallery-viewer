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

    viewers: [],
    viewerCurKey: null,
    viewerPrevKey: null,

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
        transition: {}, // cssVar: [cssValStart, cssValEnd]
        //transLeftPx: null,
        //transLeftEnd: null,
        //transLeftLtGt: null, // check whether to stop tranitioning (greater than or less than)
    },

    // is the RiotGalleryViewer HTML (main image, background, previous/next butttons, close button, etc) loaded
    isViewerHtmlLoaded: false,

    // is the RiotGalleryViewer currently open
    isViewerOpen: false,


    // blank image.
    blankImageSrc: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',

    // javascript HTML elements. saved rather than repeatedly running selectors
    elems: {
        body: null,
        bg: null,
        caption: null,
        captionCon: null,
        closeCons: [],
        images: [],
        imageCons: [],
        //imageTrans: null,
        //imageTransCon: null,
        nextCon: null,
        prevCon: null
    },

    transition: null,

    transitionBlank: {
        jsTnterval: null,
        //isTransitioning: false,
        //type: null, // left, or right
        startTimeMs: null,
        endTimeMs: null,
    },

    swipeInfo: {
        startX: null,
        //startY: null,
        startTime: null
    },


    options: {
        // write information to the console log. needed for troubeshooting/testing/development only
        doConsoleLog: false,
        // write a code trace on every console log. needed for troubeshooting/testing/development only
        doConsoleTrace: false,
        transitionSeconds: .7,
        transitionFrameSeconds: .01,
        imageFailedCaptionHtml: '<i>Could Not Load Image</i>',
        defaultImgSize: 300,
        transitionType: 'size', // "none", "size", "slide", "fade", "slidefade"
        useMaterialIcons: true,
        doTouchSwipe: false,
        swipeMinPx: 200,
        swipeMinPercent: 50,
        swipeMaxSeconds: 500
    },

    materialIconsCssUrl: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',

    isMaterialIconsLoadComplete: false,

    windowWidth: null,
    windowHeight: null,

    /*****************************************************************************
         *****************************************************************************
         * User Input - START - User functions to build and load galleries */

    /*
     * add an image to a gallery
     * called by user or other function
     * gallery is created if needed
     * does not validate data, validation is done when gallery is initialized
     */
    addImage(galleryElemId, url, thumbUrl, caption) {

        const galleryKey = this.getGalleryKeyByElemId(galleryElemId); // , false

        if (galleryKey === false) {
            this.consoleLog('ERROR - addImage failed, could not find gallery', galleryElemId);
            return false;
        }

        if (this.addInitImage(galleryKey, url, thumbUrl, caption)) {
            this.consoleLog('image added', url);
        } else {
            this.consoleLog('ERROR - image added failed', url);
        }
    },



    /*
    add a gallery from a file (remote url)
    called by user
    gallery is created if needed
    */
    addImagesByFile(galleryElemId, fileUrl) {
        if (!fileUrl || typeof fileUrl !== 'string') {
            this.consoleLog('addGalleryByString failed, no fileUrl', fileUrl, typeof fileUrl);
            return false;
        }

        const galleryKey = this.getGalleryKeyByElemId(galleryElemId);

        if (galleryKey === false) {
            this.consoleLog('ERROR - could not add add images to failed gallery', galleryElemId);
            return false;
        }

        this.galleries[galleryKey].imageFileUrl = fileUrl;

        this.consoleLog('Image list file set for adding to gallery', galleryElemId, fileUrl);
    },

    /*
    set global options to determine the style and behavior of the gallery
    called by user
    */
    setOption(option, value) {

        if (typeof value === 'undefined') {
            this.consoleLog('setOption - ERROR - no value passed', option);
            return false;
        }

        if (option === 'doConsoleLog' || option === 'doConsoleTrace') {
            if (value) {
                this.options[option] = true;
            } else {
                this.options[option] = false;
            }
            this.consoleLog('setOption - global option set', option, this.options[option]);
            return true;
        }

        this.consoleLog('setOption - ERROR - invalid option passed', option);
        return false;
    },

    /* User Input - END
     *****************************************************************************
     *****************************************************************************/



    /*****************************************************************************
     *****************************************************************************
     * Initialization - START - code to run after page load to initialize the galleries */

    /*
     * called on page load
     * begin initialization
     */
    initialize() {
        this.consoleLog('Riot Gallery Viewer - begin initialization of loaded data');

        const isGalleryWithFileRemoteUrl = this.processGalleryFileRemoteUrls();
        //const isGalleryWithFileRemoteUrl = false;

        // if there are no remote urls process now
        if (!isGalleryWithFileRemoteUrl) {
            // checks that remote files are processed. if so continue initializtion
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
        this.buildHtmlGalleries();
        this.setGalleriesByClass();
        console.log(this.galleries);
    },

    /* Initialization - END
     *****************************************************************************
     *****************************************************************************/



    /*****************************************************************************
     *****************************************************************************
    * Get images from remote text files - START - either a list or json */

    /*
    process remote urls (files with lists of images for galleries)
    calls function that runs the individual urls
    return whether or not there is a file to process exists.
    */
    processGalleryFileRemoteUrls() {
        let isGalleryWithFileRemoteUrl = false;
        for (let x = 0; x < this.galleries.length; x++) {
            if (this.galleries[x].imageFileUrl) {
                this.processGalleryFileRemoteUrl(x);
                isGalleryWithFileRemoteUrl = true;
            }
        }
        return isGalleryWithFileRemoteUrl;
    },

    /*
    process a remote url (file with lists of images for a gallery)
    send text to a function that processes images or set error
    call function that checks if all urls are complete. if so, initialization continues
    */
    processGalleryFileRemoteUrl(galleryKey) {
        // double check that the url exists.
        if (!this.galleries[galleryKey]) {
            return false;
        }
        if (!this.galleries[galleryKey].imageFileUrl) {
            return false;
        }

        const xhr = this.createXHR();

        xhr.open('GET', this.galleries[galleryKey].imageFileUrl, true);

        xhr.galleryKey = galleryKey;

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    //console.log(xhr);
                    RiotGalleryViewer.addGalleryImagesByText(xhr.galleryKey, xhr.responseText);
                    //console.log(RiotGalleryViewer);
                    //RiotGalleryViewer.textFilesDone.push(xhr.responseURL);
                } else {
                    // failed
                    RiotGalleryViewer.galleries[xhr.galleryKey].isError = true;
                    RiotGalleryViewer.galleries[xhr.galleryKey].errorMessages.push('could not read file: ' + xhr.responseURL);

                    console.log('addGalleryByFile failed. could not read file', xhr.galleryKey, xhr.responseURL, xhr);
                    //RiotGalleryViewer.textFilesDone.push(xhr.responseURL);
                }
                RiotGalleryViewer.galleries[xhr.galleryKey].imageFileUrlIsComplete = true;

                // checks if all urls are complete. if so, initialization continues
                // RiotGalleryViewer.galleryFileRemoteUrlsComplete();
                RiotGalleryViewer.initializeRemoteComplete();
            }
        };

        xhr.send();
    },

    /*
    process text from a remote url (file with lists of images for a gallery)
    either send the text to a function that handles the array parsed from json or a text list
    */
    addGalleryImagesByText(galleryKey, text) {
        //console.log('addGalleryImagesByText(galleryKey, text) {', galleryKey, text);

        let parsed = null;

        text = this.strReplace(["\r\n", "\n\r", "\r"], "\n", text);
        text = text.trim();

        if (!text) {
            this.galleries[galleryKey].isError = true;
            this.galleries[galleryKey].errorMessages.push('addGalleryImagesByText - text file is empty: ' + galleryKey);
            return false;
        }

        const firstChar = text.substring(0, 1);
        const lastChar = text.charAt(text.length - 1);

        // initial check so that there is no console log error trying to parse non json as json
        if (firstChar === '[' && lastChar === ']') {
            parsed = this.parseJson(text);
            console.log(parsed);
        }

        if (parsed) {
            for (let x = 0; x < parsed.length; x++) {
                this.addImageByObj(galleryKey, parsed[x]);
            }
        } else {

            const lines = text.split("\n");

            for (let x = 0; x < lines.length; x++) {
                //let line = lines[x].trim();
                //console.log('270 ------- lines[x]', lines[x]);
                this.addImageByString(galleryKey, lines[x]);
                //console.log('272 ------- galleries', this.galleries);
                //img = this.strLineToItem(line);
                //if (item) {
                //imgs.push(img);
                //}
                //console.log('abc', line, item);
            }
        }
    },

    /*
    process an image object (from a remote text file)
    */
    addImageByObj(galleryKey, obj) {
        console.log('addImageByObj(galleryKey, obj) {', galleryKey, obj);

        // double check that the gallery exists.
        if (!this.galleries[galleryKey]) {
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
                caption = obj[0].trim();
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
        /*if (!url) {

            console.log('addImageByObj(galleryKey, obj) { ERROR - no url found', obj);
            return false;
        }*/

        /*const newObj = { url: url, thumbUrl: thumbUrl, caption: caption };
        this.galleries[galleryKey].initImages.push(newObj);*/
        this.addInitImage(galleryKey, url, thumbUrl, caption);

        return true;
        //let img = this.strLineToItem(string);
        //if (item) {
        //imgs.push(img);
        //}
        //console.log('abc', line, item);
    },

    /*
    process a single image from string (single line from a remote text file)
    */
    addImageByString(galKey, line) {
        //console.log('addImageByString(galKey, line) {', galKey, line);

        let url = null;
        let thumbUrl = null;
        let caption = null;

        const strs = line.split("\t");

        if (strs.length > 1) {
            // tab separated
            if (strs[0]) {
                url = this.strStripStartEndQuotes(strs[0]);
                //console.log('---------------if (strs[0]) {', url, strs[0]);
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
            //console.log(line);
            const strs = this.addImageByStringsWithQuotes(galKey, line);
        }

        if (!url) {
            //console.log('addImageByString(galKey, line) { ERROR - no url found', line);
            return false;
        }

        //const newObj = { url: url, thumbUrl: thumbUrl, caption: caption };
        //this.galleries[galKey].initImages.push(newObj);

        return true;
    },

    /*
    trim a double quote from the beginning and end of the string
    convert an escaped quote so that it does not get removed. ex: \"Have a nice day\"
    */
    strStripStartEndQuotes(str) {
        const tempQuoteReplace = "[~~(quote here, riotgallery)~~]";
        str = str.strReplace('\\"', tempQuoteReplace, str).trim();

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

        const last = str.substring(str.length - 1, 1);
        if (last === '"') {
            // remove last character
            str = str.substring(0, str.length - 1);
            if (str.length < 1) {
                return '';
            }
        }

        str = str.strReplace(tempQuoteReplace, '\\"', str).trim();
        return str;
    },

    /*
    add image to a gallery based on a quoted string, ex: "./image1.jpg", "./image1_thumbnail.jpg", "My Image"
    */
    addImageByStringsWithQuotes(galKey, line) {
        console.log('addImageByStringsWithQuotes(galleryKey, line) {', galKey, line);
        console.log(line);
        const tempQuoteReplace = "[~~(quote here, riotgallery)~~]";
        line = this.strReplace('\\"', tempQuoteReplace, line);
        console.log(line);
        line = line.trim();
        console.log(line);

        strs = line.split('"');

        for (let x = 0; x < strs.length; x++) {
            strs[x] = this.strReplace('\\"', tempQuoteReplace, strs[x]);
        }

        //console.log(strs);

        // 0 = [before first quote], 1 = url, 2 = [between quotes], 3 = thumUrl, 4 = [between quotes], 5 = caption

        let url = null;
        let thumbUrl = null;
        let caption = null;

        if (strs[1]) {
            url = strs[1];
        }/* else {
                console.log('addImageByStringsWithQuotes(galleryKey, line) {', galleryKey, line);
                return false;
            }*/
        if (strs[3]) {
            thumbUrl = strs[3];
        }
        if (strs[5]) {
            caption = strs[5];
        }

        //const newObj = { url: url, thumbUrl: thumbUrl, caption: caption };
        //this.galleries[galleryKey].initImages.push(newObj);

        this.addInitImage(galKey, url, thumbUrl, caption);

        console.log('453 ------------ ', this.galleries[galKey]);
        return true;
    },

    /* Get images from remote text files - END
     *****************************************************************************
     *****************************************************************************/



    buildHtmlGalleries() {
        for (let galKey = 0; galKey < this.galleries.length; galKey++) {
            if (!this.galleries[galKey].isHtmlBuilt && !this.galleries[galKey].isError) {
                this.buildHtmlGallery(galKey);
            }
        }
    },

    buildHtmlGallery(galKey) {
        //console.log('buildGallery(gallery) {', galKey, this.galleries[galKey]);

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



        /*

            for (let y = 0; y < gal.initImages.length; y++) {
                const initImage = gal.initImages[y];

                if (initImage.url && typeof initImage.url === 'string') {
                    let obj = { url: initImage.url }

                    if (initImage.thumbUrl && typeof initImage.url === 'string') {
                        obj.thumbUrl = initImage.thumbUrl;
                    } else {
                        obj.thumbUrl = obj.url;
                    }

                    if (initImage.caption && (typeof initImage.caption === 'string')) {
                        obj.caption = initImage.thumbUrl;
                    } else if (typeof initImage.caption === 'number') {
                        obj.caption = initImage.thumbUrl.toString();
                    } else {
                        obj.caption = null;
                    }

                    this.galleries[x].items.push(obj);
                }
            }
        }*/
    },



    setGalleryElem(galKey) {
        //console.log('setGalleryElem(gallery) {', galKey);

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
            // we're already in a list
            ulElem = elem;
            //ulElem = this.elemAddClass(elem, 'riot-gallery-style');
            ulElem.classList.add('riot-gallery-style');
        } else if (tagName === 'div') {
            // we'e in a div, add a list inside
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
        //console.log('setGalleryItemsFromInitImages(gallery) {', galKey);

        if (!this.galleries[galKey]) {
            return false;
        }

        let isImageAdded = false;
        for (let initImageKey = 0; initImageKey < this.galleries[galKey].initImgs.length; initImageKey++) {
            if (this.addGalleryLiItemFromInitImage(galKey, initImageKey)) {
                isImageAdded = true;
            }
        }

        if (!isImageAdded) {
            this.galleries[galKey].isError = true;
            this.galleries[galKey].errorMessages.push('addGalleryLiItemsFromInitImages - no images set');
            return false;
        }

        this.galleries[galKey].isHtmlBuilt = true;

        this.galleries[galKey].isLoaded = true;

        return true;
        //this.galleries[x].isHtmlBuilt = true;
        //this.galleries[x].images = images;
    },

    addGalleryLiItemFromInitImage(galKey, initImageKey) {
        //console.log('addGalleryLiItemFromInitImage(galKey, initImageKey)', galKey, initImageKey);

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
        let aElem = document.createElement('a')
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
            divCapElem.className = "riot-gallery-image-caption";
            liElem.appendChild(divCapElem);
        }

        //setGalleryImageByElem(galKey, elem) {



        this.galleries[galKey].elem.appendChild(liElem);



        return true;
    },




    /*****************************************************************************
     *****************************************************************************
     * add gallery and image - START - add to the galleries array or the initImgs array */

    /*
    get the key of the galleries array. if it doesn't exist, add it
    */
    getGalleryKeyByElemId(elemId) {

        if (typeof elemId !== 'string') {
            this.consoleLog('ERROR - cannot add gallery, invalid elemId type', elemId, typeof elemId);
            return false;
        }

        if (elemId.length < 1) {
            this.consoleLog('ERROR - cannot add gallery, elemId is empty', elemId, typeof elemId);
            return false;
        }

        for (let x = 0; x < this.galleries.length; x++) {
            if (this.galleries[x].elemId === elemId) {
                if (this.isError) {
                    // addGallery error - gallery already created with error
                    return false;
                }
                return x;
            }
        }

        // new empty gallery record
        let gal = this.getByVal(this.galleryBlank);

        gal.elemId = elemId;

        this.consoleLog('new gallery added', elemId);

        // add a new empty gallery to the galleries array. assign so that it is copied by value.
        this.galleries.push(gal);

        // array key of the current (new) gallery
        const galleryKey = this.galleries.length - 1;

        return galleryKey;
    },

    /*
    get the key of the galleries array. if it doesn't exist, add it
    */
    getNewGalleryKeyByElem(elem) {

        console.log('getNewGalleryKeyByElem(elem) {', elem);

        if (!this.getIsElem(elem)) {
            return false;
        }

        for (let k = 0; k < this.galleries.length; k++) {
            if (this.galleries[k].elem === elem) {
                if (this.isError) {
                    // gallery already added, but had errors
                    return false;
                }
                // gallery found, return key, do not add
                return k;
            }
        }
        console.log(this.galleryBlank);
        // create new gallery object
        let gal = this.getObjByVal(this.galleryBlank);
        console.log(gal);

        gal.elem = elem;

        this.galleries.push(gal);

        // array key of the current (new) gallery
        const galKey = this.galleries.length - 1;

        return galKey;
    },

    /*
    add an initImgs record to a gallery record
    */
    addInitImage(galKey, url, thumbUrl, caption) {

        // double check that the gallery exists.
        if (!this.galleries[galKey]) {
            return false;
        }

        if (!url || typeof url !== 'string') {
            return false;
        }

        this.galleries[galKey].initImgs.push({ url: url, thumbUrl: thumbUrl, caption: caption });

        return true;
    },

    /* add gallery and image - END
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
        console.log('itemClicked(galKey, itemKey) {', galKey, itemKey);
        this.loadImage(galKey, itemKey, null);
    },

    prevClicked() {
        console.log('prevClicked() {');
        this.incrementImageAndLoad(-1, 'prev');
    },

    nextClicked() {
        console.log('nextClicked() {');
        this.incrementImageAndLoad(1, 'next');
    },

    incrementImageAndLoad(increment, transDirection) {

        console.log('increment', transDirection);
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

    closeClicked() {
        this.closeViewer();
    },

    windowResized() {
        if (!this.isViewerOpen) {
            return;
        }
        this.setWindowSize();

        this.calculateViewerPlacement();
        this.placeImgInPosition();

        //this.endTransition();
        //this.placeImage();
    },

    /* event handling (click and other) - END
     *****************************************************************************
     *****************************************************************************/



    /*****************************************************************************
     *****************************************************************************
     * load HTML viewer - START */

    /*
     * load html (image container, previous/next buttons, caption ,etc)
     * set element selector values (this.elems)
     */
    loadViewerHtml() {
        // skip if already loaded
        if (this.isViewerHtmlLoaded) {
            return;
        }

        // body and window selectors added.
        // body needed for appending html and setting classes
        this.elems.body = document.body;

        // make sure the gallery html isn't already loaded 
        // will not happen if mulitple galleries are on the same page and one has already been loaded
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
                    //event.preventDefault();
                    //event.stopPropagation();
                    console.log('-----------------img touchstart');
                    RiotGalleryViewer.slideSwipeStartEvent(event);
                });
                window.addEventListener("touchend", function (event) {
                    if (!RiotGalleryViewer.isViewerOpen) {
                        return;
                    }
                    //event.preventDefault();
                    //event.stopPropagation();
                    console.log('--------------------img touchend');
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
                ////
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
                ////
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
                    console.log('img click');
                    RiotGalleryViewer.nextClicked();
                }, false);

                //document.getElementById('my-image').ondragstart = function() { return false; };

                imgElem.addEventListener("ondragstart", function (event) {
                    //event.preventDefault();
                    //event.stopPropagation();
                    console.log('-----------------img ondragstart');
                    //RiotGalleryViewer.slideSwipeStartEvent(event);
                });

                /*divElem.addEventListener("touchstart", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('-----------------img touchstart');
                    RiotGalleryViewer.slideSwipeStartEvent(event);
                });
                divElem.addEventListener("touchend", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('--------------------img touchend');
                    RiotGalleryViewer.slideSwipeEndEvent(event);
                });*/
                this.elems.imageCons[x] = divElem;
                ////
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

            this.consoleLog('load html complete');
        }

        console.log('this.options.useMaterialIcons', this.options.useMaterialIcons);
        if (this.options.useMaterialIcons) {
            this.loadMaterialIcons();
        }
    },

    areMaterialIconsLoaded() {
        console.log('areMaterialIconsLoaded()');
        divElem = document.createElement('div');
        divElem.style.position = "fixed";
        spanElem = document.createElement('span');
        spanElem.classList = 'material-symbols-outlined';
        spanElem.innerHTML = 'arrow_back_ios_new';
        divElem.appendChild(spanElem);
        this.elems.body.appendChild(divElem);
        const w = divElem.offsetWidth;
        document.body.removeChild(divElem);

        if (w < 50) {
            this.consoleLog('material icons are already available.');
            return true;
        }
        return false;
    },

    loadMaterialIcons() {
        console.log('loadMaterialIcons() {');
        if (this.isMaterialIconsLoadComplete) {
            console.log('// already loaded 1');
            this.addMaterialIconsToHtml();
            return;
        }
        if (this.areMaterialIconsLoaded()) {
            // already loaded
            console.log('// already loaded 2');
            this.addMaterialIconsToHtml();
            return;
        }

        console.log('keep goin');
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
            RiotGalleryViewer.consoleLog('Could not load Material Icons');
        };

        document.head.appendChild(styleLink);
    },

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


        //document.querySelector('.riot-gallery-viewer-close-con a').innerHTML = 'c';
        //document.querySelector('#riot-gallery-viewer-prev-con a').innerHTML = 'p';
        //document.querySelector('#riot-gallery-viewer-next-con a').innerHTML = 'n';
        //<span class="material-symbols-outlined">close</span>
        //<span class="material-symbols-outlined">arrow_forward_ios</span>
        //<span class="material-symbols-outlined">arrow_back_ios_new</span>
    },

    /* load HTML viewer - END
     *****************************************************************************
     *****************************************************************************/




    /*
      * Touchscreen swipe started
      * save time in milliseconds and the X and Y position
      */
    slideSwipeStartEvent(event) {
        console.log('slideSwipeStartEvent(event)');
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
    * Touchscreen swipe ended
    * make sure the time and position is valid
    * go to the next or previous slide
    */
    slideSwipeEndEvent(event) {
        console.log('slideSwipeEndEvent(event)');
        if (!this.swipeInfo.startX || !this.swipeInfo.startTime) {
            this.swipeInfoReset();
            this.consoleLog('slideSwipeEndEvent - end swipe with no start swipe, stop swipe action');
            return;
        }

        if (this.options.swipeMaxSeconds) {
            const timeDif = this.getCurMs() - this.swipeInfo.startTime;
            console.log('this.options.swipeMaxSeconds', this.options.swipeMaxSeconds);
            console.log('timeDif', timeDif);
            console.log('if (timeDif > this.options.swipeMaxSeconds * 1000) {', (timeDif > this.options.swipeMaxSeconds * 1000), timeDif, this.options.swipeMaxSeconds);
            if (timeDif > this.options.swipeMaxSeconds * 1000) {
                this.swipeInfoReset();
                // too much time passed bewteen start and end. either event missed or very slow slide.
                this.consoleLog('slideSwipeEndEvent - slide time too long, stop swipe action, max seconds = '
                    + this.options.swipeMaxSeconds + ', seconds taken = ' + (timeDif / 1000));
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

        //this.consoleLog('slideSwipeEndEvent - x=' + xDif + 'px, time=' + timeDif + 'MS');

        let swipeDistinceSuccess = false;
        if (this.options.swipeMinPx) {
            console.log('if (xDif >= this.options.swipeMinPx) {', (xDif >= this.options.swipeMinPx), xDif, this.options.swipeMinPx);
            if (xDif >= this.options.swipeMinPx) {
                swipeDistinceSuccess = true;
            }
        }

        if (!swipeDistinceSuccess && this.options.swipeMinPercent) {
            this.consoleLog('slideSwipeEndEvent - xDif=' + xDif + ', < ' + this.options.swipeMinPx + ', check percednt');

            const widthPercent = xDif / window.innerWidth * 100;
            console.log('if (widthPercent >= this.options.swipeMinPercent)', (widthPercent >= this.options.swipeMinPercent), widthPercent, this.options.swipeMinPercent);
            if (widthPercent >= this.options.swipeMinPercent) {
                swipeDistinceSuccess = true;
            }
        }

        if (this.options.swipeMinPercent && this.options.swipeMinPx && !swipeDistinceSuccess) {
            this.swipeInfoReset();
            this.consoleLog('swipe distance was insufficient. Do not go to next image.');
            return;
        }


        //this.endTransition()
        if (x < this.swipeInfo.startX) {
            this.consoleLog('slideSwipeEndEvent - previous');
            //this.incrementSlideNumber(-1);
            this.incrementImageAndLoad(-1, 'prev');
        } else {
            this.consoleLog('slideSwipeEndEvent - next');
            //this.incrementSlideNumber(1);
            this.incrementImageAndLoad(1, 'next');
        }
        //this.goToSlide();
    },

    swipeInfoReset() {
        this.swipeInfo.startX = null;
        //this.swipeInfo.startY = null;
        this.swipeInfo.startTime = null;
    },

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




    /*****************************************************************************
     *****************************************************************************
     * Item/image display - START */

    /*
     * new image displayed in the viewer
     * happens on gallery image and previous/next button click
     */
    loadImage(galKey, itemKey, transDirection) {
        console.log('loadImage(galKey, itemKey, transDirection) {', galKey, itemKey, transDirection);
        const galItem = this.getGalItem(galKey, itemKey);

        if (!galItem) {
            // item/image not found. should not happen
            return;
        }

        // if transition is running, stop it
        this.endTransition();


        //this.viewItemCur ++;
        //if (this.viewItemCur > 2) {
        //    this.viewItemCur = 1;
        //}

        if (!this.isViewerOpen) {
            if (!this.isViewerHtmlLoaded) {
                this.loadViewerHtml();
            }
            this.openViewer();
            this.setWindowSize();
        }
        //console.log('zzzzzzzzzzzzzzzz a');
        //      if (this.options.transitionType === 'none') {
        //          console.log('zzzzzzzzzzzzzzzz b');
        //          this.removePrevViewer();
        //      }


        console.log('viewerPrevKey set to cur key', this.viewerPrevKey);
        if (this.viewerCurKey === null || this.options.transitionType === 'none') {
            this.viewerCurKey = 0;
            //console.log('b', this.viewerCurKey);
        } else {
            this.viewerPrevKey = this.viewerCurKey;
            this.viewerCurKey++;
            //console.log('c', this.viewerCurKey);
            if (this.viewerCurKey >= 2) {
                this.viewerCurKey = 0;
                //console.log('d', this.viewerCurKey);
            }
        }


        this.viewers[this.viewerCurKey] = this.getByVal(this.viewerBlank);

        //this.viewItemCur = this.getByVal(this.viewItemBlank);

        //this.viewItemCur.galKey = galKey;
        //this.viewItemCur.itemKey = itemKey;
        this.viewers[this.viewerCurKey].galKey = galKey;
        this.viewers[this.viewerCurKey].itemKey = itemKey;

        //console.log('viewers',this.viewers,this.viewerPrevKey,this.viewerCurKey);

        console.log('START load image');
        //console.log('a1');
        if (!galItem.isLoaded) {
            console.log('!galItem.isLoaded');
            var img = new Image();
            img.src = galItem.url;
            //console.log(img.src);
            if (img.complete) {
                console.log('img.complete');
                //console.log('if (img.complete) {');
                //console.log(this.viewers);
                this.updateGalItem(galKey, itemKey, img, false);
                //console.log(this.viewers);
            } else {
                //console.log('d1');
                //console.log('ELSE if (img.complete) {');
                img.galKey = galKey;
                img.itemKey = itemKey;
                //    this.startImageLoad();
                console.log('img.onload');
                img.onload = function (e) {
                    //console.log('e1');
                    console.log('IMAGE LOADED');
                    RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, img, false);
                    if (!RiotGalleryViewer.isViewerOpen || RiotGalleryViewer.galKey === null || RiotGalleryViewer.itemKey === null) {
                        return false;
                    }
                    const viewer = RiotGalleryViewer.getViewerCur();
                    if (viewer.galKey === this.galKey && viewer.itemKey === this.itemKey) {
                        // image has not changed since start of image load
                        //RiotGalleryViewer.updateViewerImg();
                        //console.log('f1');
                        RiotGalleryViewer.calculateViewerPlacement();
                        RiotGalleryViewer.placeImgInPosition();
                    }
                }
                //console.log('g1');
                img.onerror = function (e) {
                    //console.log('h1');
                    //console.log('IMAGE ERROR');
                    RiotGalleryViewer.consoleLog('image not found. can not load', this.url);
                    RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, null, true);
                    //RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, img, false);
                    const viewer = RiotGalleryViewer.getViewerCur();
                    if (viewer.galKey === this.galKey && viewer.itemKey === this.itemKey) {
                        //console.log('i1');
                        //RiotGalleryViewer.setImage();
                        //RiotGalleryViewer.updateViewerImg();
                        RiotGalleryViewer.calculateViewerPlacement();
                        RiotGalleryViewer.placeImgInPosition();
                        //RiotGalleryViewer.placeImage(this.galKey, this.itemKey);
                        RiotGalleryViewer.updateCaption();
                    }
                }
            }

        }
        //console.log('j1');
        this.calculateViewerPlacement(transDirection);
        this.placeImgInPosition();
        this.updateCaption();

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

    closeViewer() {
        console.log('closeViewer()');
        this.elems.body.classList.remove('riot-gallery-viewer-open');
        this.isViewerOpen = false;
        this.resetViewerValues();
    },

    resetViewerValues() {
        console.log('resetViewerValues() {');
        for (let x = 0; x < this.elems.imageCons.length; x++) {
            this.elems.images[x].src = this.blankImageSrc;
            this.elems.imageCons[x].classList.remove('is-displayed');
        }
        this.viewerCurKey = null;
        this.viewerPrevKey = null;
    },

    updateGalItem(galKey, itemKey, img, isError) {
        console.log('updateGalItem', galKey, itemKey, img, isError);
        if (!this.isGalItem(galKey, itemKey)) {
            return;
        }
        if (isError || !img) {
            this.galleries[galKey].items[itemKey].isError = true;
            return;
        }

        if (!img.width || !img.height) {
            this.galleries[galKey].items[itemKey].isError = true;
            RiotGalleryViewer.consoleLog('invalid image. can not load', img.url);
            return;
        }

        this.galleries[galKey].items[itemKey].width = img.width;
        this.galleries[galKey].items[itemKey].height = img.height;
        this.galleries[galKey].items[itemKey].isError = false;
        this.galleries[galKey].items[itemKey].isLoaded = true;

    },

    endTransition() {

        if (this.viewerCurKey !== null) {
            let viewer = this.getViewerCur();
            if (viewer.transition) {
                for (var prop in viewer.transition) {
                    if (Object.prototype.hasOwnProperty.call(viewer.transition, prop)) {
                        // do stuff
                        console.log(prop, viewer.transition[prop]);
                        //hasTransition = true;
                        if (prop === 'left') {
                            this.elems.imageCons[this.viewerCurKey].style.left = viewer.left + 'px';
                        }
                        if (prop === 'top') {
                            this.elems.imageCons[this.viewerCurKey].style.top = viewer.top + 'px';
                        }
                        if (prop === 'width') {
                            this.elems.imageCons[this.viewerCurKey].style.width = viewer.width + 'px';
                        }
                        if (prop === 'height') {
                            this.elems.imageCons[this.viewerCurKey].style.height = viewer.height + 'px';
                        }
                        if (prop === 'opacity') {
                            this.elems.imageCons[this.viewerCurKey].style.opacity = 1;
                        }
                    }
                }
            }
            this.viewers[this.viewerCurKey].transition = null;
        }
        console.log(this.transition);
        if (this.transition) {
            console.log('if (this.transition) {', this.transition);
            //if (this.transition.isTransitioning) {
                clearInterval(this.transition.jsTnterval);
            //}
            //this.transition = this.getByVal(this.transitionBlank);
            this.transition = null;
        }

        this.removePrevViewer();

    },

    removePrevViewer() {
        console.log('removePrevViewer() {');
        if (this.viewerPrevKey !== null) {
            console.log('if (this.viewerPrevKey !== null) {');
            this.elems.imageCons[this.viewerPrevKey].classList.remove('is-displayed');
            this.elems.images[this.viewerPrevKey].src = this.blankImageSrc;
            this.viewers[this.viewerPrevKey] = null;
            this.viewerPrevKey = null;
            console.log('removePrevViewer - this.viewerPrevKey set to null', this.viewerPrevKey);
        }
    },

    transitionFrame() {
        //console.log('transitionFrame() {');
        if (!this.transition) {
            this.endTransition();
            return;
        }

        const curMs = this.getCurMs();

        const k = this.viewerCurKey;
        const viewer = this.viewers[k];

        //const viewerPrev = this.viewers[this.viewerPrevKey];

        //viewer.left = viewer.transition[prop];

        console.log('if (!this.transition.endTimeMs || curMs > this.transition.endTimeMs) {', curMs, this.transition.endTimeMs);

        if (!this.transition.endTimeMs || curMs > this.transition.endTimeMs) {
            console.log('mmmmmmmmmmmmmmmmmmm this.endTransition();');
            this.endTransition();
            //this.placeImgInPosition();
            /*for (var prop in viewer.transition) {
                if (Object.prototype.hasOwnProperty.call(viewer.transition, prop)) {
                    // do stuff
                    hasTransition = true;
                    if (prop === 'left') {
                        this.elems.imageCons[k].style.left = viewer.left + 'px';
                    }
                }
            }*/
            return;
        } /**/

        const timeSinceTransStart = curMs - this.transition.startTimeMs;
        const percentToEnd = timeSinceTransStart / (this.options.transitionSeconds * 1000);
        const percentToStart = 1 - percentToEnd;

        /*let newLeft = (percentToStart * this.viewItemCur.transLeftPx) + (percentToEnd * this.viewItemCur.left);
        this.elems.imageCon.style.left = newLeft + 'px';
 
        newLeft = (percentToEnd * this.viewItemPrev.transLeftPx) + (percentToStart * this.viewItemPrev.left);
        this.elems.imageTransCon.style.left = newLeft + 'px';*/

        //console.log('viewer.transition', viewer.transition);

        let prevViewer = null;
        if (this.viewerPrevKey !== null) {
            prevViewer = this.viewers[this.viewerPrevKey];
        }
console.log(viewer.transition);
        for (var prop in viewer.transition) {
            if (Object.prototype.hasOwnProperty.call(viewer.transition, prop)) {
                // do stuff
                console.log('-------------', prop, viewer.transition[prop]);
                //hasTransition = true;
                if (prop === 'left') {
                    console.log('if (prop === \'left\') {');
                    let newLeft;
                    if (prevViewer) {
                        newLeft = (percentToStart * prevViewer.left) + (percentToEnd * prevViewer.transition[prop]);
                        this.elems.imageCons[this.viewerPrevKey].style.left = newLeft + 'px';
                    }
                    newLeft = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.left);
                    console.log('newLeft = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.left);', newLeft, percentToStart, viewer.transition[prop], percentToEnd, viewer.left);
                    this.elems.imageCons[k].style.left = newLeft + 'px';
                    console.log('newLeft', newLeft);
                }
                if (prop === 'top') {
                    let newTop;
                    if (prevViewer) {
                        newTop = (percentToStart * prevViewer.top) + (percentToEnd * prevViewer.transition[prop]);
                        this.elems.imageCons[this.viewerPrevKey].style.top = newTop + 'px';
                    }
                    newTop = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.top);
                    this.elems.imageCons[k].style.top = newTop + 'px';
                }
                if (prop === 'width') {
                    let newWidth;
                    if (prevViewer) {
                        newWidth = (percentToStart * prevViewer.width) + (percentToEnd * prevViewer.transition[prop]);
                        this.elems.imageCons[this.viewerPrevKey].style.width = newWidth + 'px';
                    }
                    newWidth = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.width);
                    this.elems.imageCons[k].style.width = newWidth + 'px';
                }
                if (prop === 'height') {
                    let newHeight;
                    if (prevViewer) {
                        newHeight = (percentToStart * prevViewer.height) + (percentToEnd * prevViewer.transition[prop]);
                        this.elems.imageCons[this.viewerPrevKey].style.height = newHeight + 'px';
                    }
                    newHeight = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.height);
                    this.elems.imageCons[k].style.height = newHeight + 'px';
                }
                if (prop === 'opacity') {
                    let newOpacity;
                    if (prevViewer) {
                        newOpacity = (percentToStart * 1) + (percentToEnd * 0);
                        this.elems.imageCons[this.viewerPrevKey].style.opacity = newOpacity;
                    }
                    newOpacity = (percentToStart * 0) + (percentToEnd * 1);
                    //console.log('newLeft = (percentToStart * viewer.transition[prop]) + (percentToEnd * viewer.left);', newLeft, percentToStart, viewer.transition[prop], percentToEnd, viewer.left);
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

    calculateViewerPlacement(transDirection) {
        console.log('calculateViewerPlacement(transDirection) { ____________________________________________________________');
        if (!transDirection) {
            transDirection = null;
        }
        console.log('calculateViewerPlacement(transDirection) {', transDirection);
        //console.log('calculateViewerPlacement() {');
        const item = this.getCurGalItem();

        //console.log(item);

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

        //console.log('a', viewerWidth, viewerHeight);

        const maxWidth = this.windowWidth - 40;
        const maxHeight = this.windowHeight - 24;

        if (viewerWidth > maxWidth) {
            viewerWidth = maxWidth;
            viewerHeight = imgHeight / imgWidth * viewerWidth;
            //console.log('b', viewerWidth, viewerHeight);
        }



        if (viewerHeight > maxHeight) {
            viewerHeight = maxHeight;
            viewerWidth = imgWidth / imgHeight * viewerHeight;
            //console.log('c', viewerWidth, viewerHeight);
        }

        let viewerLeft = (this.windowWidth - viewerWidth) / 2;
        let viewerTop = (this.windowHeight - viewerHeight) / 2;
        //console.log('viewerTop = (this.windowHeight - viewerHeight) / 2;', viewerTop, this.windowHeight, viewerHeight);

        if (isLoadingImage) {
            viewerLeft = viewerLeft - 8;
            viewerTop = viewerTop - 8;
            conPadding = 8;
        }

        //console.log(pos);
        let closeRight = -28;
        let closeTop = -28;
        if (viewerTop < 36) {
            closeTop = closeTop + (36 - viewerTop);
        }
        if (viewerLeft < 98) {
            closeRight = closeRight + (98 - viewerLeft);
        }


        /*this.viewItemCur.width = viewerWidth;
        this.viewItemCur.height = viewerHeight;
        this.viewItemCur.left = viewerLeft;
        this.viewItemCur.top = viewerTop;
        this.viewItemCur.closeTop = closeTop;
        this.viewItemCur.closeRight = closeRight;
        this.viewItemCur.padding = conPadding;*/
        const curK = this.viewerCurKey;

        /* let prevWidth = null;
         let prevHeight = null;
         let prevLeft = null;
         let prevTop = null;
 
         console.log('zzzzzzzzzzzzzzzz');
         if (this.options.transitionType === 'size' && curK !== null) {
             console.log('yyyyyyyyyyyyy');
             if (this.viewers[curK]) {
                 console.log('xxxxxxxxxxxxxx');
                 console.log(this.viewers[curK]);
                 console.log(this.viewers[curK].width);
                 if (this.viewers[curK].width) {
                     console.log('wwwwwwwwwwwwwwww');
                     prevWidth = this.viewers[curK].width;
                     prevHeight = this.viewers[curK].height;
                     prevLeft = this.viewers[curK].left;
                     prevTop = this.viewers[curK].top;
                     console.log('this.viewers[curK]', this.viewers[curK]);
                     console.log('prevWidth', prevWidth);
                 }
             }
         }
 console.log('yyyyyyyyyyy transDirection',transDirection, curK, this.viewers, prevWidth);*/
        this.viewers[curK].width = viewerWidth;
        this.viewers[curK].height = viewerHeight;
        this.viewers[curK].left = viewerLeft;
        this.viewers[curK].top = viewerTop;
        this.viewers[curK].closeTop = closeTop;
        this.viewers[curK].closeRight = closeRight;
        this.viewers[curK].padding = conPadding;

        const transExtraDistance = 4;
        const closeXWidth = 40;

        console.log('111111111111 transDirection', transDirection);
        if (transDirection !== null) {
            console.log('222222222222222222');
            const prevK = this.viewerPrevKey;
            this.viewers[curK].transition = {};
            if (prevK !== null) {
                this.viewers[prevK].transition = {};
            }
            console.log('--------2221', prevK);
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
                    console.log('444444444444444444');
                    this.viewers[curK].transition.width = this.viewers[prevK].width;
                    this.viewers[curK].transition.height = this.viewers[prevK].height;
                    this.viewers[curK].transition.left = this.viewers[prevK].left;
                    this.viewers[curK].transition.top = this.viewers[prevK].top;
                }

                console.log(this.viewers[curK].transition);

            }
            console.log('33333333333333333');


            if (this.options.transitionType === 'fade' || this.options.transitionType === 'slidefade') {
                this.viewers[curK].transition.opacity = 0;
                if (prevK !== null) {
                    this.viewers[prevK].transition.opacity = 0;
                }
            }

        }

        console.log(this.viewers, curK);

        //console.log('-=-=-=-=--=-=-=-=-=--=-=-=--=-=-');

        //console.log('calculateViewerPlacement', this.viewers);
    },

    updateImgClassesAndSrc() {
        console.log('updateImgClassesAndSrc() {');
        const item = this.getCurGalItem();
        const curK = this.viewerCurKey;

        let src = this.blankImageSrc;

        if (item.isError) {
            //console.log('a');
            this.elems.imageCons[curK].classList.add('is-error');
            this.elems.imageCons[curK].classList.remove('is-loading');
        } else if (!item.isLoaded) {
            //console.log('b');
            this.elems.imageCons[curK].classList.add('is-loading');
            this.elems.imageCons[curK].classList.remove('is-error');
        } else {
            //console.log('c');
            this.elems.imageCons[curK].classList.remove('is-loading', 'is-error');
            if (item.url) {
                //console.log('d');
                src = item.url;
            }
        }
        this.elems.images[curK].src = item.url;

        
    },

    /*getIsTransitioning() {
        console.log('getIsTransitioning()', 'this.transition', this.transition);
        if (this.transition) {
            //if (this.transition.isTransitioning) {
            return true;
            //}
        }
        return false;
    },*/

    placeImgInPosition() {
        console.log('placeImgInPosition() {');
        //this.endTransition();

        //if (!transType) {
        //    transType = null
        //}





        //const item = this.getCurGalItem();
        //console.log('1178 item', item);

        const curK = this.viewerCurKey;

        if (curK === null) {
            return;
        }

        //const prevK = this.viewerPrevKey;


        //console.log('curK prevK', curK, prevK);

        //isImgLoaded = false;




        //console.log('curK', curK, this.elems.imageCons[curK]);



        const viewer = this.getViewerCur();
        //console.log(this.viewerCurKey, this.elems);
        // image is complete

        //this.elems.images[k].src = item.url;
        //console.log('zzzzzzzz', transType, this.viewerPrevKey);
        //if (transType && this.viewerPrevKey !== null) {
        //    this.transImg(transType);
        //    return;
        //}


        //const viewer = this.viewers[curK];



        /*if (this.viewItemPrev) {
            this.elems.imageCons[curK].classList.remove('is-loading', 'is-error', 'is-displayed');
            this.elems.images[curK].src = this.blankImageSrc;
        }*/
        ///console.log('ttttttttttttttttt', item);



        this.elems.imageCons[curK].classList.add('is-displayed');



        let curLeft = viewer.left;
        let curTop = viewer.top;
        let curWidth = viewer.width;
        let curHeight = viewer.height;
        console.log('CHECK TRANSITIONING');
        if (this.transition) {
            console.log('if (this.getIsTransitioning()) { is TRUE');
            for (var prop in viewer.transition) {
                if (Object.prototype.hasOwnProperty.call(viewer.transition, prop)) {
                    // do stuff
                    console.log(prop, viewer.transition[prop]);
                    //hasTransition = true;
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
        //console.log('isTransitioning', isTransitioning);
        //if (hasTransition) {
        //let doPlaceLeft = true;

        //if (transType) {
        let isNewTransition = false;
        //console.trace();
        console.log('a************************ ', this.transition);
        console.log('b************************ ', viewer.transition);
        
        if (curLeft !== null) {
            if (viewer.transition) {
                if (Object.keys(viewer.transition).length > 0) {
                    isNewTransition = true;
                    console.log('--------------------------------------------------- transition when the new transition starts', this.transition);
                    this.transition = this.getByVal(this.transitionBlank);
                    //this.transition.isTransitioning = true;
                    this.transition.startTimeMs = this.getCurMs();
                    this.transition.endTimeMs = this.transition.startTimeMs + (this.options.transitionSeconds * 1000);
                    console.log('------------- this.transition.jsTnterval = setInterval(function () {');
                    this.transition.jsTnterval = setInterval(function () {
                        RiotGalleryViewer.transitionFrame();
                    }, this.options.transitionFrameSeconds * 1000);
                    console.log('b', this.transition);
                    //console.log('77777777777 viewer', viewer);
                    //console.log('a');
                    if (viewer.transition.hasOwnProperty('left')) {
                        //console.log('b');
                        if (viewer.transition.left !== null) {
                            //console.log('c');
                            curLeft = viewer.transition.left;
                            //console.log('d');
                        }
                    }
                    if (viewer.transition.hasOwnProperty('top')) {
                        //console.log('b');
                        if (viewer.transition.top !== null) {
                            //console.log('c');
                            curTop = viewer.transition.top;
                            //console.log('d');
                        }
                    }
                    if (viewer.transition.hasOwnProperty('width')) {
                        //console.log('b');
                        if (viewer.transition.width !== null) {
                            //console.log('c');
                            curWidth = viewer.transition.width;
                            //console.log('d');
                        }
                    }
                    if (viewer.transition.hasOwnProperty('height')) {
                        //console.log('b');
                        if (viewer.transition.height !== null) {
                            //console.log('c');
                            curHeight = viewer.transition.height;
                            //console.log('d');
                        }
                    }

                    //console.log('placeImgInPosition', viewer);
                    //console.log(this.elems.imageCons);
                }
            }
        }
        //console.log('e', curLeft);
        if (curLeft !== null) {
            this.elems.imageCons[curK].style.left = curLeft + 'px';
        }

        if (this.options.transition === 'fade' && isNewTransition) {
            console.log('if (this.options.transition === \'fade\' && isNewTransition) {');
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



        console.log(this.elems.imageCons);

        this.updateImgClassesAndSrc();

        //this.elems.images[curK].src = item.url;

        if (this.options.transitionType === 'size') {
            this.removePrevViewer();
        }
    },

    updateCaption() {
        const item = this.getCurGalItem();
        //imageFailedCaptionHtml
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

    getViewerCur() {
        if (this.viewerCurKey === null) {
            return null;
        }
        return this.viewers[this.viewerCurKey];
    },

    /*
     * get the value of a
     */
    getOptionVal(option) {
        if (this.options.hasOwnProperty('option')) {
            return this.options['option'];
        }

        return null;
    },

    getGalItem(galKey, itemKey) {

        if (!this.isGalItem(galKey, itemKey)) {
            return null;
        }

        return this.galleries[galKey].items[itemKey];
    },

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

    getCurGalItem() {
        const viewer = this.getViewerCur();
        //console.log(viewer);
        if (viewer === null) {
            return null;
        }
        return this.getGalItem(viewer.galKey, viewer.itemKey);
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


    createXHR() {
        if (window.XMLHttpRequest) { // Modern browsers
            return new XMLHttpRequest();
        } else if (window.ActiveXObject) { // IE 6-8
            try {
                return new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) { }
            }
        }
        throw new Error("This browser does not support XMLHttpRequest or ActiveXObject");
    },

    strReplace(from, to, str) {
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
        //const temp = str; 
        //console.log(temp);
        for (let x = 0; x < from.length; x++) {
            let curFrom = from[x];
            let prev = '';
            while (prev !== str) {
                prev = str;
                str = str.replace(curFrom, to, str);
            }
        }
        //console.log('strReplace', from, to, temp, str);
        return str;
    },

    /*
     * return the value of an object (does NOT return a reference)
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

    /* Helper - END
     *****************************************************************************
     *****************************************************************************/
};


// initialzie gallery/galleries
window.onload = function () {
    RiotGalleryViewer.initialize();
    console.log(RiotGalleryViewer);
}