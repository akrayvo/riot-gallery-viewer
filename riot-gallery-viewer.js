/*
 * RiotGalleryViewer class
 * make items in an image gallery clickable.
 * load a viewer with previous/next buttons to view each image in the gallery
 */

RiotGalleryViewer = {

    galleries: [],

    galleryTemplate: {
        elem: null,
        elemId: null,
        initImages: [],
        items: [],
        options: null,
        isHtmlBuilt: false,
        isLoaded: false,
        isError: false,
        errorMessages: [],
        imageFileUrl: null,
        imageFileUrlIsComplete: false,
        options: {},
    },

    elems: {
        body: null,
        bg: null,
        caption: null,
        captionCon: null,
        closeCon: null,
        image: null,
        imageCon: null,
        imageTrans: null,
        imageTransCon: null,
        nextCon: null,
        prevCon: null
    },

    // is the RiotGalleryViewer HTML (main image, background, previous/next butttons, close button, etc) loaded
    isViewerHtmlLoaded: false,

    // is the RiotGalleryViewer currently open
    isViewerOpen: false,

    // width and height of browser window
    // set on html initialization and updated on window resize
    windowWidth: 0,
    windowHeight: 0,

    curImgHeight: 0,
    curImgWidth: 0,

    viewerHeight: 0,
    viewerWidth: 0,
    viewerLeft: 0,
    viewerTop: 0,

    curGalKey: null,
    curItemKey: null,

    loadingImageWidth: 300,
    loadingImageHeight: 300,

    transitionMs: 500,

    options: {
        // write information to the console log. needed for troubeshooting/testing/development only
        doConsoleLog: false,
        // write a code trace on every console log. needed for troubeshooting/testing/development only
        doConsoleTrace: false
    },


    /*****************************************************************************
     *****************************************************************************
     * User Input - START - User functions to build and load galleries */

    /*
    add an image to a gallery
    called by user or other function
    gallery is created if needed
    does not validate data, this is done when gallery is initialized
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
    set options to determine the style and behavior of the gallery
    called by user
    gallery is created if needed
    */
    setOption(galleryElemId, option, value) {

        /*const galleryKey = this.getGalleryKeyByElemId(galleryElemId);

        if (galleryKey === false) {
            this.console('addGalleryByString failed, could not find gallery', galleryElemId);
            return false;
        }

        if (typeof value === 'undefined') {
            console.log('addOption failed, no value passed', option);
        }

        if (option === 'doConsoleLog' || option === 'doConsoleTrace') {
            if (value) {
                this.galleries[galleryKey].options[option] = true;
            } else {
                this.galleries[galleryKey].options[option] = false;
            }
            console.log('gallery option set - ', option, this.galleries[galleryKey].options[option]);
            return true;
        }

        console.log('addOption failed, invalid option passed', option);*/
    },

    /*
    set global options to determine the style and behavior of the gallery
    called by user
    */
    setGlobalOption(option, value) {

        if (typeof value === 'undefined') {
            this.consoleLog('setGlobalOption - ERROR - no value passed', option);
            return false;
        }

        if (option === 'doConsoleLog' || option === 'doConsoleTrace') {
            if (value) {
                this.options[option] = true;
            } else {
                this.options[option] = false;
            }
            this.consoleLog('setGlobalOption - global option set', option, this.options[option]);
            return true;
        }

        this.consoleLog('setGlobalOption - ERROR - invalid option passed', option);
        return false;
    },

    /* User Input - END
     *****************************************************************************
     *****************************************************************************/


    /*****************************************************************************
     *****************************************************************************
     * Initialization - START - code to run after page load to initialize the galleries */

    /*
    called on page load
    begin initialization
    */
    initialize() {

        this.consoleLog('Riot Gallery Viewer - being initialization of loaded data')

        const isGalleryWithFileRemoteUrl = this.processGalleryFileRemoteUrls();

        if (!isGalleryWithFileRemoteUrl) {
            this.galleryFileRemoteUrlsComplete();
        }
    },

    /*
    2nd part of initialization
    called after remote image urls have been read (if required)
    */
    galleryFileRemoteUrlsComplete() {
        for (let x = 0; x < this.galleries.length; x++) {
            const gal = this.galleries[x];
            if (gal.imageFileUrl && !gal.imageFileUrlIsComplete && !gal.isError) {
                // there is still a remote file to process (file set, not complete, and no error)
                // do not continue. function will be called again
                return;
            }
        }
        this.buildHtmlGalleries();
        this.setGalleriesByClass();
        //this.setUnloadedGalleries();
        console.log(this.galleries);
    },

    /* User Input - END
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

        xhr.open("GET", this.galleries[galleryKey].imageFileUrl, true);

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
                RiotGalleryViewer.galleryFileRemoteUrlsComplete();
            }
        };

        xhr.send();
    },

    /*
    process text from a remote url (file with lists of images for a gallery)
    either send the text to a function that handles the array parsed from json or a text list
    */
    addGalleryImagesByText(galleryKey, text) {
        console.log('addGalleryImagesByText(galleryKey, text) {', galleryKey, text);

        let parsed = null;

        text = this.strReplace(["\r\n", "\n\r", "\r"], "\n", text);
        text = text.trim();

        if (!text) {
            this.galleries[galleryKey].isError = true;
            this.galleries[galleryKey].errorMessages.push('addGalleryImagesByText - text file is empty: ' + galleryKey);
            return false;
        }

        const firstChar = text.substring(0, 1);

        // initial check so that there is no console log error trying to parse non json as json
        if (firstChar === '[') {
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
                console.log('270 ------- lines[x]', lines[x]);
                this.addImageByString(galleryKey, lines[x]);
                console.log('272 ------- galleries', this.galleries);
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
    addImageByString(galleryKey, line) {
        console.log('addImageByString(galleryKey, line) {', galleryKey, line);

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
            this.addInitImage(galleryKey, url, thumbUrl, caption);
        } else {
            // strings in quotes (with validation)
            console.log(line);
            const strs = this.addImageByStringsWithQuotes(galleryKey, line);
        }

        if (!url) {
            console.log('addImageByString(galleryKey, line) { ERROR - no url found', line);
            return false;
        }

        //const newObj = { url: url, thumbUrl: thumbUrl, caption: caption };
        //this.galleries[galleryKey].initImages.push(newObj);

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
    add image to a gallery based on a quoted string ("./image1.jpg", "./image1_thumbnail.jpg", "My Image")
    */
    addImageByStringsWithQuotes(galleryKey, line) {
        console.log('addImageByStringsWithQuotes(galleryKey, line) {', galleryKey, line);
        const tempQuoteReplace = "[~~(quote here, riotgallery)~~]";
        line = this.strReplace('\\"', tempQuoteReplace, line);
        line = line.trim();

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

        this.addInitImage(galleryKey, url, thumbUrl, caption);

        console.log('453 ------------ ', this.galleries);
        return true;
    },

    /* Get images from remote text files - END
     *****************************************************************************
     *****************************************************************************/


    /*****************************************************************************
     *****************************************************************************
     * add gallery and image - START - add to the galleries array or the initImages array */

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
        let gal = JSON.parse(JSON.stringify(this.galleryTemplate))

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
    getNewGalleryKeyByElem(elem) { // canBeNull

        console.log('getNewGalleryKeyByElem(elem) {', elem);

        if (!this.getIsElem(elem)) {
            console.log('getGalleryKeyByElem error - tag name not found, not an element', elem);
            return false;
        }

        for (let x = 0; x < this.galleries.length; x++) {
            if (this.galleries[x].elem === elem) {
                if (this.isError) {
                    console.log('addGallery error 2b - gallery already created with error', elemId);
                    return false;
                }
                if (isAddOnly) {
                    return false;
                }
                return x;
            }
        }

        let gal = Object.assign({}, this.galleryTemplate);

        gal.elem = elem;

        // add a new empty gallery to the galleries array. assign so that it is copied by value.
        this.galleries.push(gal);

        // array key of the current (new) gallery
        const galleryKey = this.galleries.length - 1;

        return galleryKey;
    },

    /*
    add an initImages record to a gallery record
    */
    addInitImage(galleryKey, url, thumbUrl, caption) {

        // double check that the gallery exists.
        if (!this.galleries[galleryKey]) {
            return false;
        }

        if (!url || typeof url !== 'string') {
            return false;
        }

        this.galleries[galleryKey].initImages.push({ url: url, thumbUrl: thumbUrl, caption: caption });

        return true;
    },

    /* add gallery and image - END
     *****************************************************************************
     *****************************************************************************/


    buildHtmlGalleries() {
        for (let galleryKey = 0; galleryKey < this.galleries.length; galleryKey++) {
            if (!this.galleries[galleryKey].isHtmlBuilt && !this.galleries[galleryKey].isError) {
                this.buildHtmlGallery(galleryKey);
            }
        }
    },

    buildHtmlGallery(galleryKey) {
        console.log('buildGallery(gallery) {', galleryKey, this.galleries[galleryKey]);

        if (!this.galleries[galleryKey]) {
            return false;
        }

        const gal = this.galleries[galleryKey];

        if (gal.isError) {
            return false;
        }

        if (gal.isHtmlBuilt) {
            return false;
        }

        if (gal.initImages.length < 1) {
            return false;
        }

        this.setGalleryElem(galleryKey);

        if (!this.galleries[galleryKey].elem) {
            return false;
        }

        this.addGalleryLiItemsFromInitImages(galleryKey);



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



    setGalleryElem(galleryKey) {
        console.log('setGalleryElem(gallery) {', galleryKey);

        if (!this.galleries[galleryKey]) {
            return false;
        }

        if (!this.galleries[galleryKey].elemId) {
            this.galleries[galleryKey].isError = true;
            this.galleries[galleryKey].errorMessages.push('setGalleryElem - gallery Elem ID not set');
            return false;
        }

        let elem = document.getElementById(this.galleries[galleryKey].elemId);
        if (!elem) {
            this.galleries[galleryKey].isError = true;
            this.galleries[galleryKey].errorMessages.push('setGalleryElem - gallery Elem ID not found: ' + this.galleries[galleryKey].elemId);
            return false;
        }

        let tagName = this.getElemTagName(elem);

        if (!tagName) {
            this.galleries[galleryKey].isError = true;
            this.galleries.errorMessages.push('setGalleryElem - could not get element tag name: ' + this.galleries[galleryKey].elemId);
            return false;
        }

        tagName = tagName.trim().toLowerCase();

        let ulElem = null;

        if (tagName === 'ul' || tagName === 'ol') {
            // we're already in a list
            ulElem = elem;
            ulElem = this.elemAddClass(elem, 'riot-gallery-style');
        } else if (tagName === 'div') {
            // we'e in a div, add a list inside
            ulElem = document.createElement('ul');
            ulElem.className = 'riot-gallery-style';
            elem.innerHTML = '';
            elem.appendChild(ulElem);
        } else {
            // not a list or a div, add the ul after
            ulElem = document.createElement('ul');
            ulElem.className = 'riot-gallery-style';
            this.insertAfter(elem, ulElem);
        }

        this.galleries[galleryKey].elem = ulElem;

        return true;
    },

    addGalleryLiItemsFromInitImages(galleryKey) {
        console.log('setGalleryItemsFromInitImages(gallery) {', galleryKey);

        if (!this.galleries[galleryKey]) {
            return false;
        }

        let isImageAdded = false;
        for (let initImageKey = 0; initImageKey < this.galleries[galleryKey].initImages.length; initImageKey++) {
            if (this.addGalleryLiItemFromInitImage(galleryKey, initImageKey)) {
                isImageAdded = true;
            }
        }

        if (!isImageAdded) {
            this.galleries[galleryKey].isError = true;
            this.galleries[galleryKey].errorMessages.push('addGalleryLiItemsFromInitImages - no images set');
            return false;
        }

        this.galleries[galleryKey].isHtmlBuilt = true;

        this.galleries[galleryKey].isLoaded = true;

        return true;
        //this.galleries[x].isHtmlBuilt = true;
        //this.galleries[x].images = images;
    },

    addGalleryLiItemFromInitImage(galleryKey, initImageKey) {
        console.log('addGalleryLiItemFromInitImage(galleryKey, initImageKey)', galleryKey, initImageKey);

        if (!this.galleries[galleryKey]) {
            return false;
        }

        if (!this.galleries[galleryKey].initImages[initImageKey]) {
            return false;
        }

        if (!this.galleries[galleryKey].elem) {
            return false;
        }


        const initImage = this.galleries[galleryKey].initImages[initImageKey];

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

        if (!this.setGalleryItem(galleryKey, url, aElem, caption)) {
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

        //setGalleryImageByElem(galleryKey, elem) {



        this.galleries[galleryKey].elem.appendChild(liElem);



        return true;
    },

    /*
     * automatically create gallery instances on ui, ol, table, and ld tags with the "riot-gallery-viewer" class
     */
    setGalleriesByClass() {
        console.log('setGalleriesByClass() {');
        const elems = document.getElementsByClassName('riot-gallery');
        console.log(elems);
        for (let x = 0; x < elems.length; x++) {
            this.setGalleryByElem(elems[x], null);
        }

    },

    setUnloadedGalleries() {
        console.log('setUnloadedGalleries() {');
        for (let galleryKey = 0; galleryKey < this.galleries.length; galleryKey++) {
            let gal = this.galleries[galleryKey];
            console.log(gal);
            if (!gal.isLoaded && !gal.isError && gal.elem) {
                this.setGalleryByElem(gal.elem, galleryKey);
            }
        }
    },

    setGalleryByElem(galleryElem, galleryKey) {
        console.log('setGalleryByElem() {', galleryElem);
        if (galleryKey === null || galleryKey === false) {
            galleryKey = this.getNewGalleryKeyByElem(galleryElem);
            if (galleryKey === null || galleryKey === false) {
                // already set up
                console.log('a');
                return false;
            }
        }

        if (this.galleries[galleryKey].isError) {
            console.log('b');
            return false;
        }

        let elems = galleryElem.getElementsByClassName('riot-gallery-item');

        if (elems.length < 1) {
            const tagName = this.getElemTagName(galleryElem);
            //let subTag = null;
            if (tagName == 'ul' || tagName == 'ol') {
                elems = galleryElem.getElementsByTagName('li');
            } else if (tagName == 'table') {
                elems = galleryElem.getElementsByTagName('td');
            } else {
                elems = galleryElem.getElementsByTagName('figure');
            }
            //elems = galleryElem.getElementsByTagName(subTag);
        }
        if (elems.length < 1) {
            this.galleries[galleryKey].isError = true;
            this.galleries[galleryKey].errorMessages.push('no items (image containers) found');
            return false;
        }

        for (let x = 0; x < elems.length; x++) {
            this.setGalleryItemByElem(galleryKey, elems[x]);
        }

        console.log('this.galleries[galleryKey].items = ', this.galleries[galleryKey].items);
        if (this.galleries[galleryKey].items.length < 1) {
            this.galleries[galleryKey].isError = true;
            this.galleries[galleryKey].errorMessages.push('no items found');
            console.log('c');
            return false;
        }

        this.galleries[galleryKey].isLoaded = true;
        return true;
    },

    setGalleryItemByElem(galleryKey, elem) {

        const url = this.getImageUrlFromContainerElem(elem);
        if (!url) {
            return false;
        }

        const clickElem = this.getClickElemFromContainerElem(elem);
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

            /*clickElem.galleryKey = galleryKey;
            // current length, before adding. this will be the new key
            clickElem.itemKey = this.galleries[galleryKey].items.length;
            clickElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.itemClicked(this.galleryKey, this.itemKey);
            }, false);*/
        }

        const caption = this.getCaptionFromContainerElem(elem);

        //const item = { url: url, clickElem: clickElem, caption: caption };
        //this.galleries[galleryKey].items.push(item);
        return this.setGalleryItem(galleryKey, url, clickElem, caption);
    },

    setGalleryItem(galleryKey, url, clickElem, caption) {
        if (!this.galleries[galleryKey]) {
            return false;
        }

        if (!url) {
            return false;
        }

        if (clickElem) {
            clickElem.galleryKey = galleryKey;
            // current length, before adding. this will be the new key
            clickElem.itemKey = this.galleries[galleryKey].items.length;
            clickElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.itemClicked(this.galleryKey, this.itemKey);
            }, false);
        }

        const item = { url: url, clickElem: clickElem, caption: caption };
        this.galleries[galleryKey].items.push(item);
        return true;
    },

    itemClicked(galleryKey, ItemKey) {
        console.log('itemClicked(galleryKey, ItemKey) {', galleryKey, ItemKey);
        this.curGalKey = galleryKey;
        this.curItemKey = ItemKey;
        this.loadImage();
    },


    /*
     * Get image url and element to bind click action
     * uses several methods to find the image url
     * also returns the clickable element if found
     */
    getImageUrlFromContainerElem(linkContainer) {
        console.log('getImageUrlFromContainerElem(linkContainer) {', linkContainer);
        let url;
        let elem;

        // data-riot-gallery-image-url set on container or children
        // <li data-riot-gallery-image-url="./image.jpg"><img src="./thumb.jpg"></li>
        // <li><img src="./thumb.jpg" data-riot-gallery-image-url="./image.jpg"></li>
        url = this.getSubElemAttrVal(linkContainer, 'data-riot-gallery-image-url');
        if (url) {
            return url;
        }
        // data-image-url set on li container or children
        // <li data-image-url="./image.jpg"><img src="./thumb.jpg"></li>
        // <li><a href="./image.jpg" data-image-url="./image.jpg"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrVal(linkContainer, 'data-image-url');
        if (url) {
            return url;
        }

        // href from a tag (link) with a class of "riot-gallery-image-link"
        // <li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrValBySelector(linkContainer, 'a.riot-gallery-image-link', 'href');
        if (url) {
            return url;
        }

        // href from a tag (link) with a class of "image-link"
        // <li><a href="./image.jpg" class="image-link"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrValBySelector(linkContainer, 'a.image-link', 'href');
        if (url) {
            return url;
        }

        // src from img tag with "riot-gallery-image-thumb" class
        // <li><img src="./image.jpg" class="riot-gallery-image-thumb"></li>
        url = this.getSubElemAttrValBySelector(linkContainer, 'img.riot-gallery-image-thumb', 'src');
        if (url) {
            return url;
        }

        // src from img tag with "image-thumb" class
        // <li><img src="./thumb.jpg" class="image-thumb"></li>
        url = this.getSubElemAttrValBySelector(linkContainer, 'img.image-thumb', 'src');
        if (url) {
            return url;
        }

        // href from a tag (link)
        // <li><a href="./image.jpg"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrValBySelector(linkContainer, 'a', 'href');
        if (url) {
            return url;
        }

        // src from img tag
        // <li><img src="./image.jpg"></li>
        url = this.getSubElemAttrValBySelector(linkContainer, 'img', 'src');
        if (url) {
            return url;
        }

        return null;
    },

    getClickElemFromContainerElem(linkContainer) {
        console.log('getClickElemFromContainerElem(linkContainer) {', linkContainer);

        // a tag (link) with a class of "riot-gallery-image-link"
        // <li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
        let elem = this.getSubElemBySelector(linkContainer, 'a.riot-gallery-image-link');
        if (elem) {
            return elem;
        }

        // img tag with "riot-gallery-image-thumb" class
        // <li><img src="./thumb.jpg" class="riot-gallery-image-thumb"></li>
        elem = this.getSubElemBySelector(linkContainer, 'img.riot-gallery-image-thumb');
        if (elem) {
            return elem;
        }

        // a tag (link) with a class of "image-link"
        // <li><a href="./image.jpg" class="image-link"><img src="./thumb.jpg"></a></li>
        elem = this.getSubElemBySelector(linkContainer, 'a.image-link');
        if (elem) {
            return elem;
        }

        // img tag with "image-thumb" class
        // <li><img src="./thumb.jpg" class="image-thumb"></li>
        elem = this.getSubElemBySelector(linkContainer, 'img.image-thumb');
        if (elem) {
            return elem;
        }

        // data-riot-gallery-image-url set on an img
        // <li><img src="./thumb.jpg" data-riot-gallery-image-url="./image.jpg"></li>
        elem = this.getElemSubByAttr(linkContainer, 'data-riot-gallery-image-url');
        if (elem) {
            return elem;
        }

        // data-image-url set on an img
        // <li><img src="./thumb.jpg" data-image-url="./image.jpg"></li>
        elem = this.getElemSubByAttr(linkContainer, 'data-image-url');
        if (elem) {
            return elem;
        }

        // a tag (link)
        // <li><a href="./image.jpg"><img src="./thumb.jpg"></a></li>
        elem = this.getSubElemBySelector(linkContainer, 'a');
        if (elem) {
            return elem;
        }

        // src from img tag
        // <li><img src="./image.jpg"></li>
        elem = this.getSubElemBySelector(linkContainer, 'img');
        if (elem) {
            return elem;
        }

        // no link or image found
        return linkContainer;
    },

    getCaptionFromContainerElem(linkContainer) {
        console.log('getCaptionFromContainerElem(linkContainer) {', linkContainer);
        // data-riot-gallery-image-caption on the container
        // <li data-riot-gallery-image-caption="My Pic"><img src="./image.jpg"></li>
        // <li><img src="./image.jpg" data-riot-gallery-image-caption="My Pic"></li>
        let caption = this.getSubElemAttrVal(linkContainer, 'data-riot-gallery-image-caption');
        if (caption) {
            return caption;
        }

        // data-image-caption on the container
        // <li data-image-caption="My Pic"><img src="./image.jpg"></li>
        // <li><img src="./image.jpg" data-image-caption="My Pic"></li>
        caption = this.getSubElemAttrVal(linkContainer, 'data-image-caption');
        if (caption) {
            return caption;
        }

        // riot-gallery-image-caption class on any text container
        // <li><img src="./image.jpg"><div class="riot-gallery-image-caption">My Pic</div></li>
        caption = this.getSubElemTextBySelector(linkContainer, '.riot-gallery-image-caption', 'text');
        if (caption) {
            return caption;
        }

        // image-caption class on any text container
        // <li><img src="./image.jpg"><div class="image-caption">My Pic</div></li>
        caption = this.getSubElemTextBySelector(linkContainer, '.image-caption', 'text');
        if (caption) {
            return caption;
        }

        // image-caption class on any text container
        // <li><figure><img src="./image.jpg"><figcaption>My Pic</figcaption></figure></li>
        caption = this.getSubElemTextBySelector(linkContainer, 'figcaption', 'text');
        if (caption) {
            return caption;
        }

        // get all images
        let imgElems = linkContainer.getElementsByTagName('img');

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

    getSubElemAttrVal(elem, attr) {
        if (!elem || !attr) {
            return null;
        }

        let val = elem.getAttribute(attr);
        if (val !== null && val !== false) {
            return val;
        }

        let item = document.querySelector('[' + attr + ']');

        if (!item) {
            return null;
        }

        val = item.getAttribute(attr);

        return val;
    },

    getElemSubByAttr(elem, attr) {
        if (!elem || !attr) {
            return null;
        }

        let val = elem.getAttribute(attr);
        if (val !== null && val !== false) {
            return elem;
        }

        let item = document.querySelector('[' + attr + ']');

        if (!item) {
            return null;
        }

        return item;
    },

    getSubElemAttrValBySelector(elem, selector, attr) {
        if (!elem || !selector || !attr) {
            return null;
        }

        let item = elem.querySelector(selector);
        if (!item) {
            return null;
        }

        let val = item.getAttribute(attr);
        if (val === null || val === false) {
            return null;
        }

        return val;
    },

    getSubElemTextBySelector(elem, selector) {
        if (!elem || !selector) {
            return null;
        }

        let item = elem.querySelector(selector);
        if (!item) {
            return null;
        }

        const text = item.innerHTML;
        if (text === null || text === false) {
            return null;
        }

        return text;
    },

    getSubElemBySelector(elem, selector) {
        if (!elem || !selector) {
            return null;
        }

        let item = elem.querySelector(selector);
        if (!item) {
            return null;
        }

        return item;
    },

    /*getElem(selector, parent) {
        return this.getElems(selector, parent, true)
    },

    getElems(selector, parent, doReturnOne) {
        if (doReturnOne !== true) {
            doReturnOne = false;
        }

        let returnOnError = [];
        if (doReturnOne) {
            returnOnError = null;
        }

        if (!parent) {
            parent = document;
        }
        else if (parent !== document) {
            if (!parent.tagName) {
                return returnOnError;
            }
        }

        if (!selector) {
            return returnOnError;
        }

        const firstChar = selector.substring(0, 1);
        const restOfString = selector.substring(1);
        let elems = null;
        let elem = null;

        if (this.isAlphaNumeric(firstChar, false)) {
            if (!parent) {
                if (this.isAlphaNumeric(restOfString, true)) {
                    // starts with alphanumberic, rest of chars are alphanumeric, dash, or underscore
                    // it's a tag name
                    elems = parent.getElementsByTagName(selector);
                    if (getElems)
                }
            }
        }

        tag
        .class
        #id

        
        //let 
        
            
            
        //}

       // if (firstChar) PageTransitionE
    },

    isAlphaNumeric(str, doAllowDashUnderScore) {

        if (doAllowDashUnderScore !== true) {
            doAllowDashUnderScore = false;
        }

        for (let i = 1, len = str.length; i < len; i++) {

            const code = str.charCodeAt(charAt);

            if (
                (code < 47 || code > 57) && // numeric (0-9)
                (code < 65 || code > 90) && // numeric (0-9)
                (code < 97 || code > 122)) // numeric (0-9)
            {
                if (!doAllowDashUnderScore) {
                    return false;
                } else if (code !== 45 && code !== 137) {
                    // // upper case (A-Z)
                    continue;
                }
            }
        }

        return true;
    },*/




    /*****************************************************************************
     ******************************************************************************
     * Image Viewer Actions - START */

    /*
     * load image that has already been downloaded (no waiting/loading)
     */
    viewLoadedImage(image, galleryKey, itemKey) {

        if (this.curGalKey != galleryKey || this.curItemKey !== itemKey) {
            return;
        }

        console.log('loadAvailableImage(image, imageKey)', image, galleryKey, itemKey);


        /*if (!this.curImgKey) {
            console.log('a this.curImgKey=', this.curImgKey);
            this.curImgKey = imageKey;
            console.log('b this.curImgKey=', this.curImgKey);
            this.curImgWidth = image.width;
            this.curImgHeight = image.height;
            this.elems.image.attr('src', image.src);
            console.log("this.elems.image.attr('url', image.url);", this.elems.image, image.src);
            this.positionMainImage();
            //this.displayCaption();
            this.elems.body.removeClass('riot-gallery-viewer-is-transitioning-both');
            return;
            // no current image, skip transition
            // set url
            // set dimensions
            // show caption
            // set curimgkey, curimgwidth, curimgheight
        }*/

        /*const leftSrc = this.galleryImages[this.curImgKey].url;
        const rightSrc = this.galleryImages[imageKey].url;

        console.log('aaaaaaaaaaaa images', this.curImgKey, imageKey, leftSrc, rightSrc);


        this.elems.transitionBothLeft.css("background-image", "url(" + leftSrc + ")");
        console.log(this.elems.transitionBothLeft);
        this.elems.transitionBothRight.css("background-image", "url(" + rightSrc + ")");

        this.elems.transitionBothLeft.css({ width: this.viewerWidth + 'px', height: this.viewerHeight + 'px' });

        this.curImgKey = imageKey;

        //this.elems.body.addClass('riot-gallery-viewer-is-transitioning-both');*/

        this.elems.imageCon.classList.remove('is-loading');
        this.elems.imageCon.classList.remove('is-error');

        console.log('b itemKey=', itemKey);
        this.curImgWidth = image.width;
        this.curImgHeight = image.height;
        this.positionMainImage();
        //this.elems.transitionBothRight.css({ width: this.viewerWidth, height: this.viewerHeight });
        //return;
        //this.elems.image.attr('src', image.src);
        this.elems.image.src = image.src;
        //console.log("this.elems.image.attr('url', image.url);", this.elems.image, image.src);
        //this.positionLoaderImage();
        //this.displayCaption();
        if (this.galleries[galleryKey].items[itemKey].caption) {
            this.elems.caption.innerHTML = this.galleries[galleryKey].items[itemKey].caption;
            this.elems.captionCon.classList.add('is-displayed');
        } else {
            this.elems.caption.innerHTML = '';
            this.elems.captionCon.classList.remove('is-displayed');
        }

        //this.elems.body.removeClass('riot-gallery-viewer-is-transitioning-both');
    },

    imageLoadFailed() {
        this.curImgWidth = this.curImgHeight = null;
        this.positionMainImage();
        this.elems.imageCon.classList.remove('is-loading');
        this.elems.imageCon.classList.add('is-error');

        this.elems.caption.innerHTML = '<i>IMAGE FAILED TO LOAD</i>';
        this.elems.captionCon.classList.add('is-displayed');
    },

    startImageLoad() {
        this.curImgWidth = this.curImgHeight = null;
        this.positionMainImage();
        this.elems.imageCon.classList.add('is-loading');
        this.elems.imageCon.classList.remove('is-error');
        this.elems.caption.innerHTML = '';
        this.elems.captionCon.classList.remove('is-displayed');
    },


    /*
     * position the main gallery view image and the close button in the top right corner
     */
    positionMainImage(isLoadingImage) {


        console.log('positionImage() {)');
        //  console.log('this.viewerWidth a', this.viewerWidth);

        /*let pos;
        if (this.curImgWidth && this.curImgHeight) {
            pos = this.getPositionForViewer(this.curImgWidth, this.curImgHeight);
            console.log('this.viewerWidth b', this.viewerWidth);
            //let spinnerSize = this.curImgWidth;
            //if (this.curImgHeight < spinnerSize) {

            //}
            //pos = this.getPositionForViewer(this.loadingSpinnerSize, this.loadingSpinnerSize, true);
        }// else {
        //    pos = this.getPositionForViewer(this.defaultViewerWidth, this.defaultViewerHeight);
        //    console.log('this.viewerWidth b', this.viewerWidth);
        //}*/

        let imgWidth = this.loadingImageWidth;
        let imgHeight = this.loadingImageHeight;

        if (this.curImgWidth && this.curImgHeight) {
            imgWidth = this.curImgWidth;
            imgHeight = this.curImgHeight;
        }

        viewerWidth = imgWidth;
        viewerHeight = imgHeight;

        let maxWidth = this.windowWidth - 40;
        let maxHeight = this.windowHeight - 24;

        /*(if (maxWidth < 200) {
            maxWidth = 100;
        }
        if (maxHeight < 200) {
            maxHeight = 100;
        }*/

        console.log('this.windowWidth this.windowHeight', this.windowWidth, this.windowHeight);

        if (viewerWidth > maxWidth) {
            viewerWidth = maxWidth;
            viewerHeight = imgHeight / imgWidth * viewerWidth;
        }

        if (viewerHeight > maxHeight) {
            viewerHeight = maxHeight;
            viewerWidth = imgWidth / imgHeight * viewerHeight;
        }

        console.log('this.viewerWidth set', this.viewerWidth, this.viewerHeight, maxWidth, maxHeight);
        let viewerLeft = (this.windowWidth - viewerWidth) / 2;
        let viewerTop = (this.windowHeight - viewerHeight) / 2;

        /*return {
            width: viewerWidth,
            height: viewerHeight,
            left: newLeft,
            top: newTop
        };*/

        /*let cssSettings = {
            width: viewerWidth + 'px',
            height: viewerHeight + 'px',
            left: newLeft + 'px',
            top: newTop + 'px'
        };*/



        //console.log(pos);
        //if (isTransition) {
        //    this.elems.imageCon.animate(cssSettings, 1001);
        //} else {
        // this.elems.imageCon.css(cssSettings);
        //}

        if (isLoadingImage) {
            viewerLeft = viewerLeft - 8;
            viewerTop = viewerTop - 8;
            this.elems.imageCon.style.padding = '5px';
        } else {
            this.elems.imageCon.style.padding = '0';
        }

        this.elems.imageCon.style.width = viewerWidth + 'px';
        this.elems.imageCon.style.height = viewerHeight + 'px';
        this.elems.imageCon.style.left = viewerLeft + 'px';
        this.elems.imageCon.style.top = viewerTop + 'px';

        this.viewerWidth = viewerWidth;
        this.viewerHeight = viewerHeight;
        this.viewerLeft = viewerLeft;
        this.viewerTop = viewerTop;

        //console.log(pos);
        let closeRight = viewerLeft - 30;
        let closeTop = viewerTop - 30;
        if (closeTop < 10) {
            closeTop = 10;
        }
        if (closeRight < 30) {
            closeRight = 30;
        }

        //cssSettings = { right: newLeft + 'px', top: newTop + 'px' };
        //if (isTransition) {
        //    this.elems.closeCon.animate(cssSettings, 1001);
        //} else {
        //    this.elems.closeCon.css(cssSettings);
        //}

        this.elems.closeCon.style.right = closeRight + 'px';
        this.elems.closeCon.style.top = closeTop + 'px';


    },

    //transitionMove(elem, newval)

    transitionImageOut() {
        //return;      
        


        this.elems.imageTrans.src = this.elems.image.src;
        this.elems.imageTransCon.style.left = this.viewerLeft+'px';
        this.elems.imageTransCon.style.top = this.viewerTop+'px';
        this.elems.imageTransCon.style.width = this.viewerWidth+'px';
        this.elems.imageTransCon.style.height = this.viewerHeight+'px';


        if (this.elems.imageCon.classList.contains('is-error')) {
            this.elems.imageTransCon.className  = 'is-displayed is-error';
        } else {
            this.elems.imageTransCon.className  = 'is-displayed';
        }

        animationFrameMs = 10;
        
        this.transition1FinalLeft = -(this.viewerWidth + 100);
        this.transition1CurLeft = this.viewerLeft;
        this.transition1Interval = (this.transition1CurLeft - this.transition1FinalLeft) / (this.transitionMs/animationFrameMs);

        this.isTransition1SetInterval = true;
        this.transition1SetInterval = setInterval(function () {
            RiotGalleryViewer.transition1CurLeft = RiotGalleryViewer.transition1CurLeft - RiotGalleryViewer.transition1Interval;

            RiotGalleryViewer.elems.imageTransCon.style.left = RiotGalleryViewer.transition1CurLeft+'px';
            if (RiotGalleryViewer.transition1CurLeft < RiotGalleryViewer.transition1FinalLeft) {
                clearInterval(RiotGalleryViewer.transition1SetInterval);
                RiotGalleryViewer.isTransition1SetInterval = false;
                RiotGalleryViewer.elems.imageTransCon.className = '';
                
            }
        }, animationFrameMs);
    },

    transitionImageIn() {
        //return;      
  
        this.transition2FinalLeft = this.viewerLeft;
        this.transition2CurLeft = (this.windowWidth + this.viewerWidth + 100);
        this.transition2Interval = (this.transition2CurLeft - this.transition2FinalLeft) / (this.transitionMs/animationFrameMs);

        //console.log('this.transition2FinalLeft', this.transition2FinalLeft);
        //console.log('this.transition2CurLeft', this.transition2CurLeft);
        //console.log('this.transition2Interval', this.transition2Interval);


        this.elems.imageCon.style.left =  this.transition2CurLeft+'px';
        this.elems.imageCon.style.top = this.viewerTop+'px';
        this.elems.imageCon.style.width = this.viewerWidth+'px';
        this.elems.imageCon.style.height = this.viewerHeight+'px';


        animationFrameMs = 10;
        
        

        this.isTransition2SetInterval = true;
        this.transition2SetInterval = setInterval(function () {
            RiotGalleryViewer.transition2CurLeft = RiotGalleryViewer.transition2CurLeft - RiotGalleryViewer.transition2Interval;
//console.log(RiotGalleryViewer.transition2CurLeft);
            RiotGalleryViewer.elems.imageCon.style.left = RiotGalleryViewer.transition2CurLeft+'px';
            if (RiotGalleryViewer.transition2CurLeft < RiotGalleryViewer.transition2FinalLeft) {
                clearInterval(RiotGalleryViewer.transition2SetInterval);
                RiotGalleryViewer.isTransition2SetInterval = false;
                
            }
        }, animationFrameMs);
    },

    /*
     * new image displayed in the viewer
     * happens on gallery image and previous/next button click
     */
    loadImage() {
        console.log('loadImage(newKey) {');

        if (RiotGalleryViewer.isTransition1SetInterval) {
            clearInterval(RiotGalleryViewer.transition1SetInterval);
            RiotGalleryViewer.isTransition1SetInterval = false;
        }

        if (RiotGalleryViewer.isTransition2SetInterval) {
            clearInterval(RiotGalleryViewer.transition2SetInterval);
            RiotGalleryViewer.isTransition2SetInterval = false;
        }

        if (!this.galleries[this.curGalKey]) {
            // gallery not set. should not happen
            console.log('1240');
            return false;
        }

        if (!this.galleries[this.curGalKey].items[this.curItemKey]) {
            // item not set. should not happen
            console.log('1246');
            return false;
        }

        if (!this.isViewerHtmlLoaded) {
            this.loadViewerHtml();
            //this.bindViewer();
        }

        if (!this.isViewerOpen) {
            // must be done before calculating the image size (loadAvailableImage)
            this.setWindowSize();
        }

        const item = this.galleries[this.curGalKey].items[this.curItemKey];

        var img = new Image();
        img.src = item.url;

        let doTransitionIn = false;

        if (this.isViewerOpen) {
            this.transitionImageOut();
            doTransitionIn = true;
        } else {
            this.openViewer();
        }

        if (img.complete) {
            console.log('if (img.complete) {');
            this.viewLoadedImage(img, this.curGalKey, this.curItemKey);
            //this.setLoadedImage(this, newKey);
        } else {
            img.galleryKey = this.curGalKey;
            img.itemKey = this.curItemKey;
            this.startImageLoad();
            //this.startUnavailableImage(newKey);
            img.onload = function (e) {
                console.log('img.onload this.galleryKey, this.itemKey', this.galleryKey, this.itemKey);
                //riotGalleryInstances[this.instanceKey].completeUnavailableImage(this);
                //riotGalleryViewerInstances[this.instanceKey].loadAvailableImage(this);
                RiotGalleryViewer.viewLoadedImage(img, this.galleryKey, this.itemKey)
            }
            img.onerror = function (e) {
                //RiotGalleryViewer.elems.imageCon.classList.remove('is-loading');
                //RiotGalleryViewer.elems.imageCon.classList.add('is-error');
                RiotGalleryViewer.imageLoadFailed();
            }
        }
        if (doTransitionIn) {
            this.transitionImageIn();
        }
    },

    /*
     * open the viewer if it is not already open
     * load viewer html if not loaded
     * add riot-gallery-viewer-open class to html body
     * set isOpen to true so we do not load twice
     */
    openViewer() {
        console.log('openViewer() {');
        if (this.isViewerOpen) {
            console.log('already open');
            return;
        }
        //this.elems.body.addClass('riot-gallery-viewer-open');
        this.elems.body.classList.add('riot-gallery-viewer-open');
        this.isViewerOpen = true;
    },

    closeViewer() {
        console.log('closeViewer()');
        this.elems.body.classList.remove('riot-gallery-viewer-open');
        this.isViewerOpen = false;
        this.resetViewerValues();
        console.log(this);
    },

    resetViewerValues() {
        this.curImgHeight = 0;
        this.curImgWidth = 0;

        this.viewerHeight = 0;
        this.viewerWidth = 0;
        this.viewerLeft = 0;
        this.viewerTop = 0;

        this.curGalKey = null;
        this.curItemKey = null;
    },

    /*
     * set the dimensions of the browser window
     * run on page load and window resize.
     */
    setWindowSize() {
        console.log('setWindowSize()');
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.consoleLog('set window size, width = ' + this.windowWidth + ' | height=' + this.windowHeight);
    },

    /* Image Viewer Actions - END
    *****************************************************************************
    *****************************************************************************/






    /*
         * load html (image container, previous/next buttons, caption ,etc)
         * set element selector values (this.elems)
         */
    loadViewerHtml() {
        console.log('loadViewerHtml() {');

        // skip if already loaded
        if (this.isViewerHtmlLoaded) {
            return;
        }

        // body and window selectors added.
        // body needed for appending html and setting classes
        this.elems.body = document.body;
        // window needed for handling resizing
        //this.elems.window = $(window);

        // make sure the gallery html isn't already loaded 
        // will not happen if mulitple galleries are on the same page and one has already been loaded
        const checkElem = document.getElementById('riot-gallery-viewer-bg');
        //console.log(checkElem.length);
        if (!checkElem) {

            let divElem = null;
            let aElem = null;
            let subDivElem = null;
            let imgElem = null;


            window.addEventListener('resize', function () {
                RiotGalleryViewer.windowResized();
            });

            // background
            //html = '<div id="riot-gallery-viewer-bg"></div>';
            //this.elems.body.append(html);
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-bg';
            divElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.closeClicked();
            }, false);
            this.elems.bg = divElem;
            this.elems.body.appendChild(divElem);

            // previous button
            //html = '<div id="riot-gallery-viewer-prev-con"><a href="#">&laquo;</a></div>';
            //this.elems.body.append(html);
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-prev-con';
            aElem = document.createElement('a');
            aElem.innerHTML = '&laquo;';
            aElem.href = '#';
            divElem.appendChild(aElem);
            divElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.prevClicked();
            }, false);
            this.elems.prevCon = divElem;
            this.elems.body.appendChild(divElem);

            // next button
            //html = '<div id="riot-gallery-viewer-next-con"><a href="#">&raquo;</a></div>';
            //this.elems.body.append(html);
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-next-con';
            aElem = document.createElement('a');
            aElem.innerHTML = '&raquo;';
            aElem.href = '#';
            divElem.appendChild(aElem);
            divElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.nextClicked();
            }, false);
            this.elems.nextCon = divElem;
            this.elems.body.appendChild(divElem);

            /*html = '<div id="riot-gallery-viewer-image-con">' +
                '<img id="riot-gallery-viewer-image">' +
                '<div id="riot-gallery-viewer-loading"></div>' +
                '<div id="riot-gallery-viewer-transition-both-con">' +
                '<div id="riot-gallery-viewer-transition-both-left"></div>' +
                '<div id="riot-gallery-viewer-transition-both-right"></div>' +
                '</div>' +
                '</div>';
            this.elems.body.append(html);*/
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-image-con';
            imgElem = document.createElement('img');
            imgElem.id = 'riot-gallery-viewer-image';
            this.elems.image = imgElem;
            divElem.appendChild(imgElem);
            subDivElem = document.createElement('div');
            subDivElem.id = 'riot-gallery-viewer-loading';
            divElem.appendChild(subDivElem);
            divElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.nextClicked();
            }, false);
            this.elems.imageCon = divElem;
            this.elems.body.appendChild(divElem);

            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-image-trans-con';
            imgElem = document.createElement('img');
            imgElem.id = 'riot-gallery-viewer-image-trans';
            this.elems.imageTrans = imgElem;
            divElem.appendChild(imgElem);
            this.elems.imageTransCon = divElem;
            this.elems.body.appendChild(divElem);

            //html = '<div id="riot-gallery-viewer-close-con"><a href="#">X</a></div>';
            //this.elems.body.append(html);
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-close-con';
            aElem = document.createElement('a');
            aElem.innerHTML = 'X';
            aElem.href = '#';
            aElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.closeClicked();
            }, false);
            divElem.appendChild(aElem);
            this.elems.closeCon = divElem;
            this.elems.body.appendChild(divElem);

            //html = '<div id="riot-gallery-viewer-caption-con"><div id="riot-gallery-viewer-caption"></div</div>';
            //this.elems.body.append(html);
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-caption-con';
            subDivElem = document.createElement('div');
            subDivElem.id = 'riot-gallery-viewer-caption';
            this.elems.caption = subDivElem;
            divElem.appendChild(subDivElem);
            this.elems.captionCon = divElem;
            this.elems.body.appendChild(divElem);

            console.log('load html complete');
        }

        /*this.elems.bg = $('#riot-gallery-viewer-bg');
        this.elems.prevCon = $('#riot-gallery-viewer-prev-con');
        this.elems.nextCon = $('#riot-gallery-viewer-next-con');

        this.elems.imageCon = $('#riot-gallery-viewer-image-con');
        this.elems.image = $('#riot-gallery-viewer-image');
        this.elems.loading = $('#riot-gallery-viewer-loading');

        this.elems.closeCon = $('#riot-gallery-viewer-close-con');

        this.elems.captionCon = $('#riot-gallery-viewer-caption-con');
        this.elems.caption = $('#riot-gallery-viewer-caption');

        this.elems.transitionBothCon = $('#riot-gallery-viewer-transition-both-con');
        this.elems.transitionBothLeft = $('#riot-gallery-viewer-transition-both-left');
        this.elems.transitionBothRight = $('#riot-gallery-viewer-transition-both-right');
*/
        console.log('elements done');

        this.isViewerHtmlLoaded = true;
    },


    closeClicked() {
        this.closeViewer();
    },

    prevClicked() {
        this.incrementImageAndLoad(-1);
        /*if (this.curGalKey === null) {
            // should not happen
            this.curGalKey = 0;
        }
        if (this.curItemKey === null) {
            // should not happen
            this.curItemKey = 0;
        } else {
            this.curItemKey--;
            if (this.curItemKey < 0)
            {
                this.curItemKey = this.galleries[this.curGalKey].length - 1;
            }
        }
        
        this.loadImage();*/
    },

    nextClicked() {
        this.incrementImageAndLoad(1);
        /*if (this.curGalKey === null) {
            // should not happen
            this.curGalKey = 0;
        }
        if (this.curItemKey === null) {
            // should not happen
            this.curItemKey = 0;
        } else {
            this.curItemKey++;
            if (this.curItemKey >= this.galleries[this.curGalKey].length)
            {
                this.curItemKey = 0;
            }
        }
        
        this.loadImage();*/
    },

    incrementImageAndLoad(increment) {
        if (this.curGalKey === null) {
            // should not happen
            this.curGalKey = 0;
        }
        if (this.curItemKey === null) {
            // should not happen
            this.curItemKey = 0;
        } else {
            this.curItemKey += increment;
            if (this.curItemKey >= this.galleries[this.curGalKey].items.length) {
                this.curItemKey = 0;
            }
            else if (this.curItemKey < 0) {
                this.curItemKey = this.galleries[this.curGalKey].items.length - 1;
            }
        }
        console.log(181, this.curGalKey, this.curItemKey, this.galleries[this.curGalKey].items.length);

        this.loadImage();
    },

    windowResized() {
        console.log('window resize');
        //console.log('event.data.igvThis', event.data.igvThis);
        if (!this.isViewerOpen) {
            return;
        }
        //this.consoleLogInfo('window resized');
        this.setWindowSize();
        this.positionMainImage();
        /*if (this.isImageLoading) {
            this.positionSpinner();
        }*/
    },



    /*****************************************************************************
     *****************************************************************************
     * Helper - START - no specific to this program */

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

    parseJson(str) {
        let parsed;
        try {
            parsed = JSON.parse(str);
        } catch (e) {
            console.log(e);
            return false;
        }
        return parsed;
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

    getIsElem(elem) {
        if (!elem) {
            // invalid element
            return null;
        }

        if (!elem.tagName) {
            // could not retrieve tag name
            return null;
        }

        return true;
    },

    getElemTagName(elem) {
        if (!this.getIsElem(elem)) {
            // not an element
            return null;
        }

        return elem.tagName.trim().toLowerCase();
    },

    getElemClassArray(elem) {
        let classes = [];

        if (!elem) {
            return classes;
        }

        if (!elem.className) {
            return classes;
        }

        const classSplit = elem.className.split(' ');

        for (let x = 0; x < classSplit.length; x++) {
            let c = classSplit[x].trim();
            if (c.length > 0) {
                classes.push(c);
            }
        }
        return classes;
    },

    elemAddClass(elem, classes) {
        if (typeof classes == 'string') {
            classes = [classes];
        }

        let setClasses = this.getElemClassArray(elem);

        for (let x = 0; x < classes.length; x++) {
            if (setClasses.indexOf(classes[x]) < 0) {
                setClasses.push(classes[x]);
            }
        }

        elem.className = setClasses.join(' ');

        return elem;
    },

    getOptionVal(option, galKey) {

        // check if set globally
        if (this.options[option]) {
            return true;
        }

        if (galKey === null || typeof galKey === 'undefined') {
            if (this.curGalKey === null) {
                // not passed or set
                return false;
            }
            if (!this.galleries[galKey]) {
                // gallery not found
                return false;
            }
            galKey = this.curGalKey;
        }

        if (this.galleries[galKey].options[option]) {
            return true;
        }

        return false;
    },

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
    }

    /* Helper - END
     *****************************************************************************
     *****************************************************************************/

};

// global variable to store an array of galleries
//let riotGalleryViewerInstances = [];
// initialzie gallery/galleries on page load
window.onload = function () {
    RiotGalleryViewer.initialize();
}