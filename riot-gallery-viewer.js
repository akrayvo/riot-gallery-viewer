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
        addOptions: null,
        options: null,
        // is the gallery already in the HTML, will only be false for new galleries
        // that require the class to build the html ()
        //isReady: false,
        isHtmlBuilt: false,
        isLoaded: false,
        isError: false,
        errorMessages: [],

        imageFileUrl: null,
        imageFileUrlIsComplete: false,
        options: {
            // write information to the console log. needed for troubeshooting/testing/development only
            doConsoleLog: false
        },
    },

    // is the RiotGalleryViewer HTML (main image, background, previous/next butttons, close button, etc) loaded
    isViewerHtmlLoaded: false,


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
        console.log('addImage(galleryElemId, url, thumbUrl, caption) {', galleryElemId, url, thumbUrl, caption);

        const galleryKey = this.getGalleryKeyByElemId(galleryElemId); // , false

        if (galleryKey === false) {
            console.log('addImage failed, could not find gallery', galleryElemId);
            return false;
        }

        //console.log(this.galleries[galleryKey]);
        this.addInitImage(galleryKey, url, thumbUrl, caption);
    },



    /*
    add a gallery from a file (remote url)
    called by user
    gallery is created if needed
    */
    addImagesByFile(galleryElemId, fileUrl) {
        if (!fileUrl || typeof fileUrl !== 'string') {
            console.log('addGalleryByString failed, no fileUrl', fileUrl);
            return false;
        }
        
        console.log('addImagesByFile(galleryElemId, fileUrl) {', galleryElemId, fileUrl);
        const galleryKey = this.getGalleryKeyByElemId(galleryElemId);

        if (galleryKey === false) {
            console.log('addGalleryByString failed, could not find gallery', galleryElemId);
            return false;
        }

        

        //let gal = Object.assign({}, this.galleryTemplate);

        //gal.elemId = elemId;

        this.galleries[galleryKey].imageFileUrl = fileUrl;

        // add a new empty gallery to the galleries array. assign so that it is copied by value.
        //this.galleries.push(gal);
    },

    /*
    set options to determine the style and behavior of the gallery
    called by user
    gallery is created if needed
    */
    setOption(galleryElemId, option, value) {

        const galleryKey = this.getGalleryKeyByElemId(galleryElemId);

        if (galleryKey === false) {
            console.log('addGalleryByString failed, could not find gallery', galleryElemId);
            return false;
        }

        if (typeof value === 'undefined') {
            console.log('addOption failed, no value passed', option);
        }

        if (option === 'doConsoleLog') {
            if (value) {
                this.galleries[galleryKey].options.doConsoleLog = true;
            } else {
                this.galleries[galleryKey].options.doConsoleLog = false;
            }
            console.log('doConsoleLog set to', this.galleries[galleryKey].doConsoleLog);
            return true;
        }

        console.log('addOption failed, invalid option passed', option);
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
        this.setUnloadedGalleries();
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
                    console.log(xhr);
                    RiotGalleryViewer.addGalleryImagesByText(xhr.galleryKey, xhr.responseText);
                    console.log(RiotGalleryViewer);
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
    getGalleryKeyByElemId(elemId) { // canBeNull

        console.log('getGalleryKeyByElemId(elemId) {', elemId);

        if (typeof elemId !== 'string') {
            console.log('getGalleryKeyByElemId error - invalid elemId type', elemId, typeof elemId);
            return false;
        }

        if (elemId.length < 1) {
            console.log('getGalleryKeyByElemId error - elemId is empty', elemId, typeof elemId);
            return false;
        }

        for (let x = 0; x < this.galleries.length; x++) {
            if (this.galleries[x].elemId === elemId) {
                if (this.isError) {
                    console.log('addGallery error 2b - gallery already created with error', elemId);
                    return false;
                }
                return x;
            }
        }

        //let gal = Object.assign({}, this.galleryTemplate);
        let gal = JSON.parse(JSON.stringify(this.galleryTemplate))

        gal.elemId = elemId;

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

        const tagName = this.getElemTagName(elem);

        if (!tagName) {
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
        console.log('++++++++++++ addInitImage(galleryKey, url, thumbUrl, caption) {', galleryKey, url, thumbUrl, caption);
        // double check that the gallery exists.
        if (!this.galleries[galleryKey]) {
            return false;
        }

        if (!url || typeof url !== 'string') {
            return false;
        }

        this.galleries[galleryKey].initImages.push({ url: url, thumbUrl: thumbUrl, caption: caption });
        console.log('=============', galleryKey, this.galleries[galleryKey]);
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

        const tagName = this.getElemTagName(elem);

        if (!tagName) {
            this.galleries[galleryKey].isError = true;
            this.galleries.errorMessages.push('setGalleryElem - could not get element tag name: ' + this.galleries[galleryKey].elemId);
            return false;
        }

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
            this.setGalleryImageByElem(galleryKey, elems[x]);
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

    setGalleryImageByElem(galleryKey, elem) {
        const url = this.getImageUrlFromContainerElem(elem);
        const clickElem = this.getClickElemFromContainerElem(elem);
        if (!url || !clickElem) {
            return false;
        }
        const caption = this.getCaptionFromContainerElem(elem);

        const item = { url: url, clickElem: clickElem, caption: caption };
        this.galleries[galleryKey].items.push(item);
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
            return url;
        }

        // data-image-url set on an img
        // <li><img src="./thumb.jpg" data-image-url="./image.jpg"></li>
        elem = this.getElemSubByAttr(linkContainer, 'data-image-url');
        if (elem) {
            return url;
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

    getElemTagName(elem) {
        if (!elem) {
            // invalid jquery element
            return null;
        }

        if (!elem.tagName) {
            // could not retrieve tag name
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