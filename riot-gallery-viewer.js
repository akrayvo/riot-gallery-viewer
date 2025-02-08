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
        elem: null,
        elemId: null,
        initImages: [],
        items: [],
        isHtmlBuilt: false,
        isLoaded: false,
        isError: false,
        errorMessages: [],
        imageFileUrl: null,
        imageFileUrlIsComplete: false,
    },

    galleryItemBlank: {
        url: null,
        clickElem: null,
        caption: null,
        isError: false,
        isLoaded: false,
        width: null,
        height: null
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

    //     // is the RiotGalleryViewer currently open
    //     isViewerOpen: false,

    //     // width and height of browser window
    //     // set on html initialization and updated on window resize
    //     windowWidth: 0,
    //     windowHeight: 0,

    //     //curGalKey: null,
    //     //curItemKey: null,

    //     loadingImgWidth: 300,
    //     loadingImgHeight: 300,


    //     // "prev" or "next"
    //     //transitionType: null,

    viewItemCur: null,
    viewItemPrev: null,

    viewItemBlank: {
        galKey: null,
        itemKey: null,
        height: null,
        width: null,
        left: null,
        top: null,
        //isError: false,
        //isLoaded: null,
        //caption: false,
        closeRight: null,
        closeTop: null,
        padding: null,
        //imgUrl: null,
        //imgWidth: null,
        //imgHeight: 0,
        transLeftStart: null,
        transLeftEnd: null,
        transDistancePx: null
    },

    transition: {},

        transitionBlank: {
            jsTnterval: null,
            isTransitioning: false,
            type: null, // left, or right
            //totFrameCount: null,
            //curFrameCount: 0,
            startTimeMs: null,
            endTimeMs: null,
            //closeLeftDistance: null,
            //closeTopDistance: null,
        },

    options: {
        // write information to the console log. needed for troubeshooting/testing/development only
        doConsoleLog: false,
        // write a code trace on every console log. needed for troubeshooting/testing/development only
        doConsoleTrace: false,
        transitionMs: 3000,
        transitionFrameMs: 30,
        imageFailedCaptionHtml: '<i>Could Not Load Image</i>',
        loadingSpinnderSize: 300
    },

    closeConDefaultLeft: -38,
    closeConDefaultTop: -38,

    //     /*****************************************************************************
    //      *****************************************************************************
    //      * User Input - START - User functions to build and load galleries */

    //     /*
    //      * add an image to a gallery
    //      * called by user or other function
    //      * gallery is created if needed
    //      * does not validate data, validation is done when gallery is initialized
    //      */
    //     addImage(galleryElemId, url, thumbUrl, caption) {

    //         const galleryKey = this.getGalleryKeyByElemId(galleryElemId); // , false

    //         if (galleryKey === false) {
    //             this.consoleLog('ERROR - addImage failed, could not find gallery', galleryElemId);
    //             return false;
    //         }

    //         if (this.addInitImage(galleryKey, url, thumbUrl, caption)) {
    //             this.consoleLog('image added', url);
    //         } else {
    //             this.consoleLog('ERROR - image added failed', url);
    //         }
    //     },



    //     /*
    //     add a gallery from a file (remote url)
    //     called by user
    //     gallery is created if needed
    //     */
    //     addImagesByFile(galleryElemId, fileUrl) {
    //         if (!fileUrl || typeof fileUrl !== 'string') {
    //             this.consoleLog('addGalleryByString failed, no fileUrl', fileUrl, typeof fileUrl);
    //             return false;
    //         }

    //         const galleryKey = this.getGalleryKeyByElemId(galleryElemId);

    //         if (galleryKey === false) {
    //             this.consoleLog('ERROR - could not add add images to failed gallery', galleryElemId);
    //             return false;
    //         }

    //         this.galleries[galleryKey].imageFileUrl = fileUrl;

    //         this.consoleLog('Image list file set for adding to gallery', galleryElemId, fileUrl);
    //     },

    //     /*
    //     set options to determine the style and behavior of the gallery
    //     called by user
    //     gallery is created if needed
    //     */
    //     setOption(galleryElemId, option, value) {

    //         /*const galleryKey = this.getGalleryKeyByElemId(galleryElemId);

    //         if (galleryKey === false) {
    //             this.console('addGalleryByString failed, could not find gallery', galleryElemId);
    //             return false;
    //         }

    //         if (typeof value === 'undefined') {
    //             console.log('addOption failed, no value passed', option);
    //         }

    //         if (option === 'doConsoleLog' || option === 'doConsoleTrace') {
    //             if (value) {
    //                 this.galleries[galleryKey].options[option] = true;
    //             } else {
    //                 this.galleries[galleryKey].options[option] = false;
    //             }
    //             console.log('gallery option set - ', option, this.galleries[galleryKey].options[option]);
    //             return true;
    //         }

    //         console.log('addOption failed, invalid option passed', option);*/
    //     },

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

    //     /* User Input - END
    //      *****************************************************************************
    //      *****************************************************************************/


    //     /*****************************************************************************
    //      *****************************************************************************
    //      * Initialization - START - code to run after page load to initialize the galleries */

    /*
    called on page load
    begin initialization
    */
    initialize() {
        this.consoleLog('Riot Gallery Viewer - begin initialization of loaded data');

        const isGalleryWithFileRemoteUrl = this.processGalleryFileRemoteUrls();

        if (!isGalleryWithFileRemoteUrl) {
            this.initializeRemoveComplete();
        }
    },

    /*
    2nd part of initialization
    called after remote image urls have been read (if required)
    */
    initializeRemoveComplete() {
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
    },

    //     /* User Input - END
    //      *****************************************************************************
    //      *****************************************************************************/


    //     /*****************************************************************************
    //      *****************************************************************************
    //      * Get images from remote text files - START - either a list or json */

    /*
    process remote urls (files with lists of images for galleries)
    calls function that runs the individual urls
    return whether or not there is a file to process exists.
    */
    processGalleryFileRemoteUrls() {
        //         let isGalleryWithFileRemoteUrl = false;
        //         for (let x = 0; x < this.galleries.length; x++) {
        //             if (this.galleries[x].imageFileUrl) {
        //                 this.processGalleryFileRemoteUrl(x);
        //                 isGalleryWithFileRemoteUrl = true;
        //             }
        //         }
        //         return isGalleryWithFileRemoteUrl;
    },

    //     /*
    //     process a remote url (file with lists of images for a gallery)
    //     send text to a function that processes images or set error
    //     call function that checks if all urls are complete. if so, initialization continues
    //     */
    //     processGalleryFileRemoteUrl(galleryKey) {
    //         // double check that the url exists.
    //         if (!this.galleries[galleryKey]) {
    //             return false;
    //         }
    //         if (!this.galleries[galleryKey].imageFileUrl) {
    //             return false;
    //         }

    //         const xhr = this.createXHR();

    //         xhr.open("GET", this.galleries[galleryKey].imageFileUrl, true);

    //         xhr.galleryKey = galleryKey;

    //         xhr.onreadystatechange = function () {
    //             if (xhr.readyState === 4) {
    //                 if (xhr.status === 200) {
    //                     //console.log(xhr);
    //                     RiotGalleryViewer.addGalleryImagesByText(xhr.galleryKey, xhr.responseText);
    //                     //console.log(RiotGalleryViewer);
    //                     //RiotGalleryViewer.textFilesDone.push(xhr.responseURL);
    //                 } else {
    //                     // failed
    //                     RiotGalleryViewer.galleries[xhr.galleryKey].isError = true;
    //                     RiotGalleryViewer.galleries[xhr.galleryKey].errorMessages.push('could not read file: ' + xhr.responseURL);

    //                     console.log('addGalleryByFile failed. could not read file', xhr.galleryKey, xhr.responseURL, xhr);
    //                     //RiotGalleryViewer.textFilesDone.push(xhr.responseURL);
    //                 }
    //                 RiotGalleryViewer.galleries[xhr.galleryKey].imageFileUrlIsComplete = true;

    //                 // checks if all urls are complete. if so, initialization continues
    //                 RiotGalleryViewer.galleryFileRemoteUrlsComplete();
    //             }
    //         };

    //         xhr.send();
    //     },

    //     /*
    //     process text from a remote url (file with lists of images for a gallery)
    //     either send the text to a function that handles the array parsed from json or a text list
    //     */
    //     addGalleryImagesByText(galleryKey, text) {
    //         //console.log('addGalleryImagesByText(galleryKey, text) {', galleryKey, text);

    //         let parsed = null;

    //         text = this.strReplace(["\r\n", "\n\r", "\r"], "\n", text);
    //         text = text.trim();

    //         if (!text) {
    //             this.galleries[galleryKey].isError = true;
    //             this.galleries[galleryKey].errorMessages.push('addGalleryImagesByText - text file is empty: ' + galleryKey);
    //             return false;
    //         }

    //         const firstChar = text.substring(0, 1);

    //         // initial check so that there is no console log error trying to parse non json as json
    //         if (firstChar === '[') {
    //             parsed = this.parseJson(text);
    //             console.log(parsed);
    //         }

    //         if (parsed) {
    //             for (let x = 0; x < parsed.length; x++) {
    //                 this.addImageByObj(galleryKey, parsed[x]);
    //             }
    //         } else {

    //             const lines = text.split("\n");

    //             for (let x = 0; x < lines.length; x++) {
    //                 //let line = lines[x].trim();
    //                 //console.log('270 ------- lines[x]', lines[x]);
    //                 this.addImageByString(galleryKey, lines[x]);
    //                 //console.log('272 ------- galleries', this.galleries);
    //                 //img = this.strLineToItem(line);
    //                 //if (item) {
    //                 //imgs.push(img);
    //                 //}
    //                 //console.log('abc', line, item);
    //             }
    //         }
    //     },

    //     /*
    //     process an image object (from a remote text file)
    //     */
    //     addImageByObj(galleryKey, obj) {
    //         console.log('addImageByObj(galleryKey, obj) {', galleryKey, obj);

    //         // double check that the gallery exists.
    //         if (!this.galleries[galleryKey]) {
    //             return false;
    //         }

    //         if (typeof obj !== 'object') {
    //             return false;
    //         }

    //         let url = null;
    //         let thumbUrl = null;
    //         let caption = null;

    //         if (Array.isArray(obj)) {
    //             if (obj[0]) {
    //                 url = obj[0].trim();
    //             }
    //             if (obj[1]) {
    //                 thumbUrl = obj[1].trim();
    //             }
    //             if (obj[2]) {
    //                 caption = obj[0].trim();
    //             }
    //         } else {
    //             if (obj.url) {
    //                 url = obj.url.trim();
    //             }
    //             if (obj.thumbUrl) {
    //                 thumbUrl = obj.thumbUrl.trim();
    //             }
    //             if (obj.caption) {
    //                 caption = obj.caption.trim();
    //             }
    //         }
    //         /*if (!url) {

    //             console.log('addImageByObj(galleryKey, obj) { ERROR - no url found', obj);
    //             return false;
    //         }*/

    //         /*const newObj = { url: url, thumbUrl: thumbUrl, caption: caption };
    //         this.galleries[galleryKey].initImages.push(newObj);*/
    //         this.addInitImage(galleryKey, url, thumbUrl, caption);

    //         return true;
    //         //let img = this.strLineToItem(string);
    //         //if (item) {
    //         //imgs.push(img);
    //         //}
    //         //console.log('abc', line, item);
    //     },

    //     /*
    //     process a single image from string (single line from a remote text file)
    //     */
    //     addImageByString(galKey, line) {
    //         //console.log('addImageByString(galKey, line) {', galKey, line);

    //         let url = null;
    //         let thumbUrl = null;
    //         let caption = null;

    //         const strs = line.split("\t");

    //         if (strs.length > 1) {
    //             // tab separated
    //             if (strs[0]) {
    //                 url = this.strStripStartEndQuotes(strs[0]);
    //                 //console.log('---------------if (strs[0]) {', url, strs[0]);
    //             }
    //             if (strs[1]) {
    //                 thumbUrl = this.strStripStartEndQuotes(strs[1]);
    //             }
    //             if (strs[2]) {
    //                 caption = this.strStripStartEndQuotes(strs[2]);
    //             }
    //             this.addInitImage(galKey, url, thumbUrl, caption);
    //         } else {
    //             // strings in quotes (with validation)
    //             //console.log(line);
    //             const strs = this.addImageByStringsWithQuotes(galKey, line);
    //         }

    //         if (!url) {
    //             //console.log('addImageByString(galKey, line) { ERROR - no url found', line);
    //             return false;
    //         }

    //         //const newObj = { url: url, thumbUrl: thumbUrl, caption: caption };
    //         //this.galleries[galKey].initImages.push(newObj);

    //         return true;
    //     },

    //     /*
    //     trim a double quote from the beginning and end of the string
    //     convert an escaped quote so that it does not get removed. ex: \"Have a nice day\"
    //     */
    //     strStripStartEndQuotes(str) {
    //         const tempQuoteReplace = "[~~(quote here, riotgallery)~~]";
    //         str = str.strReplace('\\"', tempQuoteReplace, str).trim();

    //         if (str.length < 1) {
    //             return '';
    //         }

    //         const first = str.substring(0, 1);
    //         if (first === '"') {
    //             // remove 1st character
    //             str = str.substring(1);
    //             if (str.length < 1) {
    //                 return '';
    //             }
    //         }

    //         const last = str.substring(str.length - 1, 1);
    //         if (last === '"') {
    //             // remove last character
    //             str = str.substring(0, str.length - 1);
    //             if (str.length < 1) {
    //                 return '';
    //             }
    //         }

    //         str = str.strReplace(tempQuoteReplace, '\\"', str).trim();
    //         return str;
    //     },

    //     /*
    //     add image to a gallery based on a quoted string ("./image1.jpg", "./image1_thumbnail.jpg", "My Image")
    //     */
    //     addImageByStringsWithQuotes(galleryKey, line) {
    //         //console.log('addImageByStringsWithQuotes(galleryKey, line) {', galleryKey, line);
    //         const tempQuoteReplace = "[~~(quote here, riotgallery)~~]";
    //         line = this.strReplace('\\"', tempQuoteReplace, line);
    //         line = line.trim();

    //         strs = line.split('"');

    //         for (let x = 0; x < strs.length; x++) {
    //             strs[x] = this.strReplace('\\"', tempQuoteReplace, strs[x]);
    //         }

    //         //console.log(strs);

    //         // 0 = [before first quote], 1 = url, 2 = [between quotes], 3 = thumUrl, 4 = [between quotes], 5 = caption

    //         let url = null;
    //         let thumbUrl = null;
    //         let caption = null;

    //         if (strs[1]) {
    //             url = strs[1];
    //         }/* else {
    //             console.log('addImageByStringsWithQuotes(galleryKey, line) {', galleryKey, line);
    //             return false;
    //         }*/
    //         if (strs[3]) {
    //             thumbUrl = strs[3];
    //         }
    //         if (strs[5]) {
    //             caption = strs[5];
    //         }

    //         //const newObj = { url: url, thumbUrl: thumbUrl, caption: caption };
    //         //this.galleries[galleryKey].initImages.push(newObj);

    //         this.addInitImage(galleryKey, url, thumbUrl, caption);

    //         //console.log('453 ------------ ', this.galleries);
    //         return true;
    //     },

    //     /* Get images from remote text files - END
    //      *****************************************************************************
    //      *****************************************************************************/


    //     /*****************************************************************************
    //      *****************************************************************************
    //      * add gallery and image - START - add to the galleries array or the initImages array */

    //     /*
    //     get the key of the galleries array. if it doesn't exist, add it
    //     */
    //     getGalleryKeyByElemId(elemId) {

    //         if (typeof elemId !== 'string') {
    //             this.consoleLog('ERROR - cannot add gallery, invalid elemId type', elemId, typeof elemId);
    //             return false;
    //         }

    //         if (elemId.length < 1) {
    //             this.consoleLog('ERROR - cannot add gallery, elemId is empty', elemId, typeof elemId);
    //             return false;
    //         }

    //         for (let x = 0; x < this.galleries.length; x++) {
    //             if (this.galleries[x].elemId === elemId) {
    //                 if (this.isError) {
    //                     // addGallery error - gallery already created with error
    //                     return false;
    //                 }
    //                 return x;
    //             }
    //         }

    //         // new empty gallery record
    //         let gal = this.getObjByVal(this.galleryBlank);

    //         gal.elemId = elemId;

    //         this.consoleLog('new gallery added', elemId);

    //         // add a new empty gallery to the galleries array. assign so that it is copied by value.
    //         this.galleries.push(gal);

    //         // array key of the current (new) gallery
    //         const galleryKey = this.galleries.length - 1;

    //         return galleryKey;
    //     },

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

    //     /*
    //     add an initImages record to a gallery record
    //     */
    //     addInitImage(galKey, url, thumbUrl, caption) {

    //         // double check that the gallery exists.
    //         if (!this.galleries[galKey]) {
    //             return false;
    //         }

    //         if (!url || typeof url !== 'string') {
    //             return false;
    //         }

    //         this.galleries[galKey].initImages.push({ url: url, thumbUrl: thumbUrl, caption: caption });

    //         return true;
    //     },

    //     /* add gallery and image - END
    //      *****************************************************************************
    //      *****************************************************************************/


    //     buildHtmlGalleries() {
    //         for (let galKey = 0; galKey < this.galleries.length; galKey++) {
    //             if (!this.galleries[galKey].isHtmlBuilt && !this.galleries[galKey].isError) {
    //                 this.buildHtmlGallery(galKey);
    //             }
    //         }
    //     },

    //     buildHtmlGallery(galKey) {
    //         //console.log('buildGallery(gallery) {', galKey, this.galleries[galKey]);

    //         if (!this.galleries[galKey]) {
    //             return false;
    //         }

    //         const gal = this.galleries[galKey];

    //         if (gal.isError) {
    //             return false;
    //         }

    //         if (gal.isHtmlBuilt) {
    //             return false;
    //         }

    //         if (gal.initImages.length < 1) {
    //             return false;
    //         }

    //         this.setGalleryElem(galKey);

    //         if (!this.galleries[galKey].elem) {
    //             return false;
    //         }

    //         this.addGalleryLiItemsFromInitImages(galKey);



    //         /*

    //             for (let y = 0; y < gal.initImages.length; y++) {
    //                 const initImage = gal.initImages[y];

    //                 if (initImage.url && typeof initImage.url === 'string') {
    //                     let obj = { url: initImage.url }

    //                     if (initImage.thumbUrl && typeof initImage.url === 'string') {
    //                         obj.thumbUrl = initImage.thumbUrl;
    //                     } else {
    //                         obj.thumbUrl = obj.url;
    //                     }

    //                     if (initImage.caption && (typeof initImage.caption === 'string')) {
    //                         obj.caption = initImage.thumbUrl;
    //                     } else if (typeof initImage.caption === 'number') {
    //                         obj.caption = initImage.thumbUrl.toString();
    //                     } else {
    //                         obj.caption = null;
    //                     }

    //                     this.galleries[x].items.push(obj);
    //                 }
    //             }
    //         }*/
    //     },



    //     setGalleryElem(galleryKey) {
    //         //console.log('setGalleryElem(gallery) {', galleryKey);

    //         if (!this.galleries[galleryKey]) {
    //             return false;
    //         }

    //         if (!this.galleries[galleryKey].elemId) {
    //             this.galleries[galleryKey].isError = true;
    //             this.galleries[galleryKey].errorMessages.push('setGalleryElem - gallery Elem ID not set');
    //             return false;
    //         }

    //         let elem = document.getElementById(this.galleries[galleryKey].elemId);
    //         if (!elem) {
    //             this.galleries[galleryKey].isError = true;
    //             this.galleries[galleryKey].errorMessages.push('setGalleryElem - gallery Elem ID not found: ' + this.galleries[galleryKey].elemId);
    //             return false;
    //         }

    //         let tagName = this.getElemTagName(elem);

    //         if (!tagName) {
    //             this.galleries[galleryKey].isError = true;
    //             this.galleries.errorMessages.push('setGalleryElem - could not get element tag name: ' + this.galleries[galleryKey].elemId);
    //             return false;
    //         }

    //         tagName = tagName.trim().toLowerCase();

    //         let ulElem = null;

    //         if (tagName === 'ul' || tagName === 'ol') {
    //             // we're already in a list
    //             ulElem = elem;
    //             ulElem = this.elemAddClass(elem, 'riot-gallery-style');
    //         } else if (tagName === 'div') {
    //             // we'e in a div, add a list inside
    //             ulElem = document.createElement('ul');
    //             ulElem.className = 'riot-gallery-style';
    //             elem.innerHTML = '';
    //             elem.appendChild(ulElem);
    //         } else {
    //             // not a list or a div, add the ul after
    //             ulElem = document.createElement('ul');
    //             ulElem.className = 'riot-gallery-style';
    //             this.insertAfter(elem, ulElem);
    //         }

    //         this.galleries[galleryKey].elem = ulElem;

    //         return true;
    //     },

    //     addGalleryLiItemsFromInitImages(galleryKey) {
    //         //console.log('setGalleryItemsFromInitImages(gallery) {', galleryKey);

    //         if (!this.galleries[galleryKey]) {
    //             return false;
    //         }

    //         let isImageAdded = false;
    //         for (let initImageKey = 0; initImageKey < this.galleries[galleryKey].initImages.length; initImageKey++) {
    //             if (this.addGalleryLiItemFromInitImage(galleryKey, initImageKey)) {
    //                 isImageAdded = true;
    //             }
    //         }

    //         if (!isImageAdded) {
    //             this.galleries[galleryKey].isError = true;
    //             this.galleries[galleryKey].errorMessages.push('addGalleryLiItemsFromInitImages - no images set');
    //             return false;
    //         }

    //         this.galleries[galleryKey].isHtmlBuilt = true;

    //         this.galleries[galleryKey].isLoaded = true;

    //         return true;
    //         //this.galleries[x].isHtmlBuilt = true;
    //         //this.galleries[x].images = images;
    //     },

    //     addGalleryLiItemFromInitImage(galleryKey, initImageKey) {
    //         //console.log('addGalleryLiItemFromInitImage(galleryKey, initImageKey)', galleryKey, initImageKey);

    //         if (!this.galleries[galleryKey]) {
    //             return false;
    //         }

    //         if (!this.galleries[galleryKey].initImages[initImageKey]) {
    //             return false;
    //         }

    //         if (!this.galleries[galleryKey].elem) {
    //             return false;
    //         }


    //         const initImage = this.galleries[galleryKey].initImages[initImageKey];

    //         if (typeof initImage.url !== 'string') {
    //             // url is not a string
    //             return false;
    //         }

    //         if (initImage.url.length < 1) {
    //             // url is an empty string
    //             return false;
    //         }

    //         let url = initImage.url;
    //         let thumbUrl = initImage.url;
    //         let caption = null;

    //         if (typeof initImage.thumbUrl === 'string') {
    //             if (initImage.thumbUrl.length > 0) {
    //                 thumbUrl = initImage.thumbUrl;
    //             }
    //         }

    //         if (typeof initImage.caption === 'number') {
    //             caption = caption.toString();
    //         } else if (typeof initImage.caption === 'string') {
    //             if (initImage.caption.length > 0) {
    //                 caption = initImage.caption;
    //             }
    //         }

    //         let liElem = document.createElement('li');
    //         let aElem = document.createElement('a')
    //         aElem.href = url;
    //         aElem.setAttribute('target', '_blank');

    //         if (!this.setGalleryItem(galleryKey, url, aElem, caption)) {
    //             return false;
    //         }

    //         let imgElem = document.createElement('img');
    //         imgElem.src = thumbUrl;
    //         aElem.appendChild(imgElem);
    //         liElem.appendChild(aElem);
    //         if (caption) {
    //             let divCapElem = document.createElement('div');
    //             divCapElem.innerHTML = caption;
    //             divCapElem.className = "riot-gallery-image-caption";
    //             liElem.appendChild(divCapElem);
    //         }

    //         //setGalleryImageByElem(galleryKey, elem) {



    //         this.galleries[galleryKey].elem.appendChild(liElem);



    //         return true;
    //     },

    /*
     * automatically create gallery instances on ui, ol, table, and ld tags with the "riot-gallery-viewer" class
     */
    setGalleriesByClass() {
        //console.log('setGalleriesByClass() {');
        const elems = document.getElementsByClassName('riot-gallery');
        //console.log(elems);
        for (let x = 0; x < elems.length; x++) {
            this.setGalleryByElem(elems[x], null);
        }

    },

    //     setUnloadedGalleries() {
    //         //console.log('setUnloadedGalleries() {');
    //         for (let galleryKey = 0; galleryKey < this.galleries.length; galleryKey++) {
    //             let gal = this.galleries[galleryKey];
    //             //console.log(gal);
    //             if (!gal.isLoaded && !gal.isError && gal.elem) {
    //                 this.setGalleryByElem(gal.elem, galleryKey);
    //             }
    //         }
    //     },

    setGalleryByElem(galElem, galKey) {
        console.log('setGalleryByElem() {', galElem);
        if (galKey === null || galKey === false) {
            galKey = this.getNewGalleryKeyByElem(galElem);
            if (galKey === null || galKey === false) {
                // already set up
                return false;
            }
        }

        if (this.galleries[galKey].isError) {
            return false;
        }

        let elems = galElem.getElementsByClassName('riot-gallery-item');

        if (elems.length < 1) {
            const tagName = this.getElemTagName(galElem);

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

        for (let x = 0; x < elems.length; x++) {
            this.setGalleryItemByElem(galKey, elems[x]);
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
        }

        const caption = this.getCaptionFromContainerElem(elem);

        return this.setGalleryItem(galleryKey, url, clickElem, caption);
    },

    setGalleryItem(galKey, url, clickElem, caption) {
        console.log('setGalleryItem(galleryKey, url, clickElem, caption) {', galKey, url, clickElem, caption);
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

        let item = this.getObjByVal(this.galleryItemBlank);
        item.url = url;
        item.clickElem = clickElem;
        if (caption) {
            item.caption = caption;
        }
        this.galleries[galKey].items.push(item);

        return true;
    },




    /*
     * Get image url and element to bind click action
     * uses several methods to find the image url
     * also returns the clickable element if found
     */
    getImageUrlFromContainerElem(linkContainer) {
        console.log('getImageUrlFromContainerElem(linkContainer) {', linkContainer);
        let url;
        //let elem;

        // data-riot-gallery-image-url set on container or children
        // <li data-riot-gallery-image-url="./image.jpg"><img src="./thumb.jpg"></li>
        // <li><img src="./thumb.jpg" data-riot-gallery-image-url="./image.jpg"></li>
        url = this.getSubElemAttrVal(linkContainer, 'data-riot-gallery-image-url');
        if (url) {
            console.log('a!!!!!!!!!!!!!!!!!!!!', url);
            return url;
        }
        // data-image-url set on li container or children
        // <li data-image-url="./image.jpg"><img src="./thumb.jpg"></li>
        // <li><a href="./image.jpg" data-image-url="./image.jpg"><img src="./thumb.jpg"></a></li>
        url = this.getSubElemAttrVal(linkContainer, 'data-image-url');
        console.log('b!!!!!!!!!!!!!!!!!!!!', url);
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

        let item = elem.querySelector('[' + attr + ']');

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

        let item = elem.querySelector('[' + attr + ']');

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


    //     /*****************************************************************************
    //      ******************************************************************************
    //      * Image Viewer Actions - START */

    //     setImageSize(image, galKey, itemKey) {
    //         console.log('setImageSize(image, galleryKey, itemKey) {');

    //         if (!this.getGalItem(galKey, itemKey)) {
    //             // should not happen
    //             return;
    //         }

    //         this.galleries[galKey].items[itemKey].imgWidth = image.width;
    //         this.galleries[galKey].items[itemKey].imgHeight = image.imgHeight;

    //         // image changed. don't load old one
    //         /*if (this.viewItemCur.galKey != galKey || this.viewItemCur.itemKey !== itemKey) {
    //             return;
    //         }

    //         if (image) {
    //             this.viewItemCur.imgWidth = image.width;
    //             this.viewItemCur.imgHeight = image.height;
    //             this.viewItemCur.imgUrl = image.src;
    //         }*//* else {
    //             this.imgWidth = 0;
    //             this.imgHeight = 0;
    //         }*/
    //     },


    //     imageLoadFailed(galKey, itemKey) {
    //         //this.imgWidth = this.imgHeight = 0;
    //         //this.imgUrl = null;

    //         //this.viewItemCur = null; //this.getViewItemBlank();
    //         //this.viewItemCur.isError = true;

    //         if (!this.getGalItem(galKey, itemKey)) {
    //             // should not happen
    //             return;
    //         }

    //         this.galleries[galKey].items[itemKey].isError = null;
    //         this.galleries[galKey].items[itemKey].width = null;
    //         this.galleries[galKey].items[itemKey].height = null;

    //         if (this.viewItemCur.galKey !== galKey || this.viewItemCur.itemKey !== itemKey) {
    //             // moved on to another image. do not update viewer.
    //             return;
    //         }

    //         this.setImagePosition();
    //         this.placeImageInPosition();
    //         this.elems.imageCon.classList = 'is-error';

    //         this.updateCaption();

    //     },

    updateCaption() {
        const item = this.getCurGalItem();
        let cap = null;
        if (item.isError) {
            if (this.options.imageFailedCaptionHtml) {
                cap = this.options.imageFailedCaptionHtml;
            }
        } else {
            if (item.caption) {
                cap = item.caption;
                console.log(cap);
            }
        }
        console.log(item);
console.log(cap);
        if (cap) {
            this.elems.caption.innerHTML = cap;
            this.elems.captionCon.classList.add('is-displayed');
        } else {
            this.elems.captionCon.classList.remove('is-displayed');
        }
    },


    getObjByVal(obj) {
        console.log(obj);
        if (typeof obj !== 'object') {
            return obj;
        }
        return JSON.parse(JSON.stringify(obj));
    },

    //     /*
    //      * position the main gallery view image and the close button in the top right corner
    //      */
    //     setImagePosition() {
    //         console.log('setImagePosition() {)');

    //         let imgWidth = this.loadingImgWidth;
    //         let imgHeight = this.loadingImgHeight;
    //         let isLoadingImage = true;
    //         let conPadding = 0;

    //         if (this.viewItemCur.imgWidth && this.viewItemCur.imgHeight) {
    //             imgWidth = this.viewItemCur.imgWidth;
    //             imgHeight = this.viewItemCur.imgHeight;
    //             isLoadingImage = false;
    //         }

    //         viewerWidth = imgWidth;
    //         viewerHeight = imgHeight;

    //         const maxWidth = this.windowWidth - 40;
    //         const maxHeight = this.windowHeight - 24;

    //         if (viewerWidth > maxWidth) {
    //             viewerWidth = maxWidth;
    //             viewerHeight = imgHeight / imgWidth * viewerWidth;
    //         }

    //         if (viewerHeight > maxHeight) {
    //             viewerHeight = maxHeight;
    //             viewerWidth = imgWidth / imgHeight * viewerHeight;
    //         }

    //         let viewerLeft = (this.windowWidth - viewerWidth) / 2;
    //         let viewerTop = (this.windowHeight - viewerHeight) / 2;

    //         if (isLoadingImage) {
    //             viewerLeft = viewerLeft - 8;
    //             viewerTop = viewerTop - 8;
    //             //this.elems.imageCon.style.padding = '5px';
    //             conPadding = 5;

    //         }// else {
    //         //    this.elems.imageCon.style.padding = '0';
    //         //}

    //         //console.log(pos);
    //         let closeLeft = viewerLeft + viewerWidth - 25;
    //         let closeTop = viewerTop - 35;
    //         if (closeTop < 10) {
    //             closeTop = 10;
    //         }
    //         if (this.windowWidth - closeLeft < 30) {
    //             closeLeft = this.windowWidth - 30;
    //         }

    //         this.viewItemCur.width = viewerWidth;
    //         this.viewItemCur.height = viewerHeight;
    //         this.viewItemCur.left = viewerLeft;
    //         this.viewItemCur.top = viewerTop;
    //         this.viewItemCur.closeTop = closeTop;
    //         this.viewItemCur.closeLeft = closeLeft;
    //         this.viewItemCur.padding = conPadding;

    //         console.log('this.viewItemCur set ', this.viewItemCur);

    //     },

    getCurGalItem() {
        if (this.viewItemCur === null) {
            return null;
        }
        return this.getGalItem(this.viewItemCur.galKey, this.viewItemCur.itemKey);
    },

    getPrevGalItem() {
        if (this.viewItemPrev === null) {
            return null;
        }
        return this.getGalItem(this.viewItemPrev.galKey, this.viewItemPrev.itemKey);
    },

    getGalItem(galKey, itemKey) {
        console.log(galKey, itemKey, this.galleries);

        if (galKey === null || itemKey === null) {
            return null;
        }

        if (!this.galleries[galKey]) {
            return null;
        }
        console.log('a');
        if (!this.galleries[galKey].items[itemKey]) {
            return null;
        }
        console.log('b');
        return this.galleries[galKey].items[itemKey];
    },

    /*
     * new image displayed in the viewer
     * happens on gallery image and previous/next button click
     */
    loadImage(galKey, itemKey, transType) {
        console.log('loadImage() {');

        const galItem = this.getGalItem(galKey, itemKey);
        //console.log(galItem);
        if (!galItem) {
            // should not happen
            return;
        }
        // if transition is running, stop it
        this.endTransition();

        this.viewItemPrev = this.getObjByVal(this.viewItemCur);
        this.viewItemCur = this.getViewItemBlank(galKey, itemKey); // , transType
        console.log('this.viewItemCur', this.viewItemCur);

        //this.viewItemCur.galKey = galKey;
        //this.viewItemCur.itemKey = itemKey;

        //this.viewItemCur.type = transType;



        //if (!this.isViewerOpen) {
        //    this.resetViewerValues();
        //}


        if (!this.isViewerOpen) {
            if (!this.isViewerHtmlLoaded) {
                this.loadViewerHtml();
            }
            //this.resetViewerValues();
            //console.log('if (!this.isViewerOpen) {');
            this.openViewer();
            this.setWindowSize();
        }

        // if (this.isViewerHtmlLoaded) {
        //     console.log('if (this.isViewerHtmlLoaded) {');

        //     //this.endTransition();
        //     this.resetViewerValues();
        // } else {
        //     console.log('else if (this.isViewerHtmlLoaded) {');


        //     console.log('a');

        // }

        //let doTransitionIn = false;


        console.log(this.viewItemCur);

        if (!galItem.isLoaded) {
            var img = new Image();
            img.src = galItem.url;
            if (img.complete) {
                this.updateGalItem(galKey, itemKey, img, false);
            } else {
                img.galKey = this.viewItemCur.galKey;
                img.itemKey = this.viewItemCur.itemKey;
                //    this.startImageLoad();
                img.onload = function (e) {
                    RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, img, false);
                    RiotGalleryViewer.setImage();
                    RiotGalleryViewer.calculateImgViewPlacement();
                    RiotGalleryViewer.placeImage(this.galKey, this.itemKey);
                }
                img.onerror = function (e) {
                    RiotGalleryViewer.consoleLog('image not found. can not load', item.url);
                    RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, null, true);
                    RiotGalleryViewer.setImage();
                    RiotGalleryViewer.calculateImgViewPlacement();
                    RiotGalleryViewer.placeImage(this.galKey, this.itemKey);
                }
            }

        }
        this.setImage();
        this.calculateImgViewPlacement();
        this.transitionImage(transType);

        //this.viewItemCur.imgUrl = this.galleries[this.viewItemCur.galKey].items[this.viewItemCur.itemKey].url;
        //if (this.galleries[this.viewItemCur.galKey].items[this.viewItemCur.itemKey].caption) {
        //    this.viewItemCur.caption = this.galleries[this.viewItemCur.galKey].items[this.viewItemCur.itemKey].caption;
        //}



        /*if (img.complete) {
            console.log('if (img.complete) {');
            this.galleries[galKey].items[itemKey].isLoaded = true;
            console.log('img.complete');
            console.log(this);
            //this.setImageSize(img, galKey, itemKey),
            this.setImagePosition();
            //this.viewLoadedImage(img, this.viewItemCur.galKey, this.viewItemCur.itemKey);
            this.transitionImage();
        } else {
            console.log('else img.complete');
            this.viewItemCur.isLoaded = false;

            //this.setImageSize(null, this.viewItemCur.galKey, this.viewItemCur.itemKey),
            
            //this.viewLoadedImage(img, this.viewItemCur.galKey, this.viewItemCur.itemKey);
            this.transitionImage();
            //    return;
            ///////////////
            //    this.viewLoadedImage(img, this.viewItemCur.galKey, this.viewItemCur.itemKey);
            //    return;
            ///////

            img.galleryKey = this.viewItemCur.galKey;
            img.itemKey = this.viewItemCur.itemKey;
            //    this.startImageLoad();
            img.onload = function (e) {
                console.log('loaded img.onload = function (e) {');
                //if (this.galleryKey === RiotGalleryViewer.viewItemCur.galKey && this.itemKey === RiotGalleryViewer.viewItemCur.itemKey) {
                    RiotGalleryViewer.imageLoadComplete(img, this.galleryKey, this.itemKey);

                //}
                console.log('loaded 3');
            }
            img.onerror = function (e) {
                console.log('errored img.onerror = function (e) {');
                RiotGalleryViewer.imageLoadFailed(this.galleryKey, this.itemKey);
            }
        }*/

        this.updateCaption();

    },

    updateGalItem(galKey, itemKey, img, isError) {
        this.galleries[galKey].items[itemKey].isLoaded = true;
        if (img && !isError) {
            if (img.width && img.width) {
                this.galleries[galKey].items[itemKey].width = img.width;
                this.galleries[galKey].items[itemKey].height = img.height;
                this.galleries[galKey].items[itemKey].isError = false;
            } else {
                RiotGalleryViewer.consoleLog('invalid image. can not load', img.url);
                this.galleries[galKey].items[itemKey].isError = true;
            }
        } else {
            this.galleries[galKey].items[itemKey].isError = true;
        }
    },

    calculateImgViewPlacement() {
        console.log('setImagePosition() {)');

        const item = this.getCurGalItem();

        let imgWidth = this.options.loadingSpinnderSize;
        let imgHeight = this.options.loadingSpinnderSize;
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
            //this.elems.imageCon.style.padding = '5px';
            conPadding = 5;
        }// else {
        //    this.elems.imageCon.style.padding = '0';
        //}

        //console.log(pos);
        let closeRight= -38;
        let closeTop = -38;
        if (viewerTop < 36) {
            closeTop = closeTop + (36-viewerTop);
        }
        if (viewerLeft < 96) {
            closeRight = closeRight + (96-viewerLeft);
        }





        this.viewItemCur.width = viewerWidth;
        this.viewItemCur.height = viewerHeight;
        this.viewItemCur.left = viewerLeft;
        this.viewItemCur.top = viewerTop;
        this.viewItemCur.closeTop = closeTop;
        this.viewItemCur.closeRight = closeRight;
        this.viewItemCur.padding = conPadding;

        //console.log('zzzzzzzzzzzzzzzzzzzz ', imgWidth, imgHeight);

        //console.log('this.viewItemCur set ', this.viewItemCur);
    },

    /*imageLoadComplete(image, galleryKey, itemKey) {
        console.log('loaded img.onload = function (e) {');
        if (galleryKey !== this.viewItemCur.galKey || itemKey !== this.viewItemCur.itemKey) {
            // current image has already changed. do nothing.
            return false;
        }
        this.setImageSize(image, galleryKey, itemKey),

        console.log('imageLoadComplete');

        console.log(this.viewItemCur);
        this.elems.image.src = this.viewItemCur.imgUrl;
        this.viewItemCur.isLoaded = true;
        this.viewItemCur.imgUrl;
        this.elems.imageCon.classList = '';

        //RiotGalleryViewer.viewLoadedImage(img, this.galleryKey, this.itemKey);
        this.setImagePosition();
        this.placeImageInPosition();
        console.log(this);
    },*/

    setImage() {
        const item = this.getCurGalItem();
        console.log(item);
        if (item.isError) {
            this.elems.imageCon.classList = 'is-error';
            return;
        }
        
        if (!item.isLoaded) {
            this.elems.imageCon.classList = 'is-loading';
            return;
        }
        
        // image is complete
        this.elems.imageCon.classList = '';
        this.elems.image.src = item.url;
    },

    placeImage() {
        this.elems.imageCon.style.left = this.viewItemCur.left + 'px';
        this.elems.imageCon.style.top = this.viewItemCur.top + 'px';
        this.elems.imageCon.style.width = this.viewItemCur.width + 'px';
        this.elems.imageCon.style.height = this.viewItemCur.height + 'px';

        this.elems.imageCon.style.padding = this.viewItemCur.padding + 'px';

        this.elems.closeCon.style.right = this.viewItemCur.closeRight + 'px';
        this.elems.closeCon.style.top = this.viewItemCur.closeTop + 'px';

        console.log('this.viewItemCur', this.viewItemCur);
        console.log(this.elems.imageCon);

        //this.galleries[this.galKey].items[this.itemKey].top = top + 'px';
    },

    transitionImage(transType) {
        // console.log('transitionImage() {');
        // console.log(this.viewItemCur, this.viewItemPrev);
        // const item = this.gaviewItemCur[]

        if (!this.viewItemPrev) {
            this.placeImage();
            return;
        }

        const item = this.getCurGalItem();
        const prevItem = this.getPrevGalItem();

        const extraDistance = 10;

        if (transType === 'prev') {
            console.log('////////BBBBBBBBBB');
            //this.transition.type = 'left';
            this.viewItemCur.transLeftStart = this.windowWidth + extraDistance;
            if (item.width) {
                this.viewItemPrev.transLeftEnd = 0 - item.width - extraDistance;
            } else {
                this.viewItemPrev.transLeftEnd = 0 - this.options.loadingSpinnderSize - extraDistance;
            }
            //console.log('init this.viewItemCur.transLeftStart', this.viewItemCur.transLeftStart);
        } else { // if (this.transitionType === 'next') {
            //this.transition.type = 'right';
            console.log('////////AAAAAAAAA');
            
            if (item.width) {
                this.viewItemCur.transLeftStart = 0 - item.width - extraDistance;
            } else {
                this.viewItemCur.transLeftStart = 0 - this.options.loadingSpinnderSize - extraDistance;
            }
            console.log(item, prevItem);
            this.viewItemPrev.transLeftEnd = this.windowWidth + extraDistance;
            //console.log('init this.viewItemCur.transLeftStart', this.viewItemCur.transLeftStart);
        }

        this.elems.imageCon.style.left = this.viewItemCur.transLeftStart + 'px';
        this.elems.imageCon.style.top = this.viewItemCur.top + 'px';
        this.elems.imageCon.style.width = this.viewItemCur.width + 'px';
        this.elems.imageCon.style.height = this.viewItemCur.height + 'px';

        this.viewItemCur.transDistancePx = this.viewItemCur.transLeftStart - this.viewItemCur.left;
        console.log('sssssssss', this.viewItemCur.transLeftStart, this.viewItemCur.left);



        this.elems.imageTransCon.style.left = this.viewItemPrev.left + 'px';
        this.elems.imageTransCon.style.top = this.viewItemPrev.top + 'px';
        this.elems.imageTransCon.style.width = this.viewItemPrev.width + 'px';
        this.elems.imageTransCon.style.height = this.viewItemPrev.height + 'px';

        this.viewItemPrev.transDistancePx = this.viewItemCur.left - this.viewItemPrev.transLeftEnd;

        //this.transition.closeLeftDistance = this.viewItemPrev.closeLeft - this.viewItemCur.closeLeft;
        //this.transition.closeTopDistance = this.viewItemPrev.closeTop - this.viewItemCur.closeTop;

        this.transition.isTransitioning = true;
        this.transition.startTimeMs = this.getCurMs();
        this.transition.endTimeMs = this.transition.startTimeMs + this.options.transitionMs;
        this.transition.jsTnterval = setInterval(function () {
            RiotGalleryViewer.transitionFrame();
        }, this.options.transitionFrameMs);

        

        if (prevItem.isLoaded) {
            // image loaded
            this.elems.imageTrans.src = prevItem.url;
            this.elems.imageTransCon.classList = 'is-displayed';
        } else if (prevItem.isError) {
            // image loaded
            this.elems.imageTransCon.classList = 'is-displayed is-error';
        } else {
            // image NOT loaded. show spinner
            this.elems.imageTransCon.classList = 'is-displayed is-loading';
        }





/*
        const item = this.getCurGalItem();

        let imgWidth = this.options.loadingSpinnderSize;
        let imgHeight = this.options.loadingSpinnderSize;

        if (item.width && item.height && !item.isError && item.isLoaded) {
            imgWidth = item.width;
            imgHeight = item.height;
        }

        if (!this.transitionType) {
            console.log('// no previous image. show image. do not transition');
            // no previous image. show image. do not transition

            if (this.viewItemCur.isLoaded) {
                // image loaded
                console.log('if (this.isLoaded) {');
                this.elems.image.src = this.viewItemCur.imgUrl;
                this.elems.imageCon.classList = '';
            } else {
                // image NOT loaded. show spinner
                console.log('// image NOT loaded. show spinner');
                this.elems.imageCon.classList = 'is-loading';
            }
            //console.log('aaaaaa');
            this.placeImageInPosition();
            //console.log('bbbbbb');
            return;
        }

        //console.log('transition IT');

        const extraDistance = 40;

        if (this.transitionType === 'prev') {
            this.transition.type = 'left';
            this.viewItemCur.transLeftStart = this.windowWidth + extraDistance;
            this.viewItemPrev.transLeftEnd = 0 - this.viewItemPrev.imgWidth - extraDistance;
            //console.log('init this.viewItemCur.transLeftStart', this.viewItemCur.transLeftStart);
        } else { // if (this.transitionType === 'next') {
            this.transition.type = 'right';
            this.viewItemCur.transLeftStart = 0 - this.viewItemCur.imgWidth - extraDistance;
            this.viewItemPrev.transLeftEnd = this.windowWidth + extraDistance;
            //console.log('init this.viewItemCur.transLeftStart', this.viewItemCur.transLeftStart);
        } /*else {
            //could not find tranistion type. should not happen
            return;
        }* /

        //this.transition.totFrameCount = this.options.transitionMs / this.options.transitionFrameMs;
        //console.log('this.transition.totFrameCount', this.transition.totFrameCount);
        //this.transition.curFrameCount = 1;

        //const distancePx = this.viewItemCur.left - this.viewItemCur.transLeftStart;
        //console.log('set distancePx', distancePx);
        //this.viewItemCur.transPxPerInterval = distancePx / this.transition.totFrameCount;
        //console.log('set this.viewItemCur.transPxPerInterval', this.viewItemCur.transPxPerInterval, distancePx, this.transition.totFrameCount);

        this.elems.imageCon.style.left = this.viewItemCur.transLeftStart + 'px';
        this.elems.imageCon.style.top = this.viewItemCur.top + 'px';
        this.elems.imageCon.style.width = this.viewItemCur.width + 'px';
        this.elems.imageCon.style.height = this.viewItemCur.height + 'px';

        this.viewItemCur.transDistancePx = this.viewItemCur.transLeftStart - this.viewItemCur.left;

        if (this.viewItemCur.isLoaded) {
            // image loaded
            this.elems.image.src = this.viewItemCur.imgUrl;
            this.elems.imageCon.classList = '';
        } else if (this.viewItemCur.isError) {
            // image loaded
            this.elems.imageCon.classList = 'is-error';
        } else {
            // image NOT loaded. show spinner
            this.elems.imageCon.classList = 'is-loading';
        }

        this.elems.imageTransCon.style.left = this.viewItemPrev.left + 'px';
        this.elems.imageTransCon.style.top = this.viewItemPrev.top + 'px';
        this.elems.imageTransCon.style.width = this.viewItemPrev.width + 'px';
        this.elems.imageTransCon.style.height = this.viewItemPrev.height + 'px';

        this.viewItemPrev.transDistancePx = this.viewItemCur.left - this.viewItemPrev.transLeftEnd;

        if (this.viewItemPrev.isLoaded) {
            // image loaded
            this.elems.imageTrans.src = this.viewItemPrev.imgUrl;
            this.elems.imageTransCon.classList = 'is-displayed';
        } else if (this.viewItemPrev.isError) {
            // image loaded
            this.elems.imageTransCon.classList = 'is-displayed is-error';
        } else {
            // image NOT loaded. show spinner
            this.elems.imageTransCon.classList = 'is-displayed is-loading';
        }

        this.elems.closeCon.style.left = this.viewItemPrev.closeLeft + 'px';
        this.elems.closeCon.style.top = this.viewItemPrev.closeTop + 'px';

        this.transition.closeLeftDistance = this.viewItemPrev.closeLeft - this.viewItemCur.closeLeft;
        this.transition.closeTopDistance = this.viewItemPrev.closeTop - this.viewItemCur.closeTop;


        this.transition.isTransitioning = true;
        this.transition.startTimeMs = this.getCurMs();
        this.transition.endTimeMs = this.transition.startTimeMs + this.options.transitionMs;
        this.transition.jsTnterval = setInterval(function () {
            RiotGalleryViewer.transitionFrame();
        }, this.options.transitionFrameMs);
*/ 
    },

    getCurMs() {
        const d = new Date();
        return d.getTime();
    },

    transitionFrame() {
        //console.log('transitionFrame() {');

        //console.log(this.transition, this.viewItemCur);

        //console.log(this.transition.curFrameCount, this.transition.totFrameCount);
        //if (this.transition.curFrameCount >= this.transition.totFrameCount || !this.transition.totFrameCount) {
        const curMs = this.getCurMs();

        //start = 10
        //transition 1000
        //end

        /*if (!this.transition.endTimeMs) {
            console.log('if (!this.transition.endTimeMs) {');
        }

        if (curMs > this.transition.endTimeMs) {
            console.log('if (this.transition.endTimeMs > curMs) {');
        }*/

        if (!this.transition.endTimeMs || curMs > this.transition.endTimeMs) {
            this.endTransition();
            this.placeImage();
            return;
        }

        const timeSinceTransStart = curMs - this.transition.startTimeMs;
        const percentDone = timeSinceTransStart / this.options.transitionMs;
        //console.log('percentDone', percentDone);


        let newLeft = ((1 - percentDone) * this.viewItemCur.transDistancePx) + this.viewItemCur.left;
        //console.log(newLeft, this.viewItemCur.transDistancePx, this.viewItemCur.left);
        this.elems.imageCon.style.left = newLeft + 'px';

        newLeft = ((1 - percentDone) * this.viewItemPrev.transDistancePx) + this.viewItemPrev.transLeftEnd;
        //console.log('newLeft', newLeft, this.viewItemPrev.transDistancePx, this.viewItemPrev.left);
        this.elems.imageTransCon.style.left = newLeft + 'px';
        
        //newLeft = ((1 - percentDone) * this.transition.closeLeftDistance) + this.viewItemCur.closeLeft;
        //this.elems.closeCon.style.left = newLeft + 'px';
        //console.log('newLeft = ((1 - percentDone) * this.transition.closeLeftDistance) + this.viewItemCur.closeLeft;', 
        //    newLeft, percentDone, this.transition.closeLeftDistance, this.viewItemCur.closeLeft);
        //let newTop = ((1 - percentDone) * this.transition.closeTopDistance) + this.viewItemCur.closeTop;
        //this.elems.closeCon.style.top = newTop + 'px';
    },

    endTransition() {
        if (!this.transition) {
            return;
        }
        if (this.transition.isTransitioning) {
            clearInterval(this.transition.jsTnterval);
        }
        this.transition = this.getObjByVal(this.transitionBlank);
        if (this.elems.imageTransCon) {
            this.elems.imageTransCon.classList = '';
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

        //this.viewItemCur = this.getViewItemBlank();
        //this.viewItemPrev = this.getViewItemBlank();

        //this.endTransition();

        if (this.elems.imageCon) {
            this.elems.imageCon.classList = '';
            //this.elems.imageTransCon.classList = '';
            this.elems.caption.innerHTML = '';
            this.elems.captionCon.classList = '';
        }
        if (this.elems.imageTransCon) {
            this.elems.imageTransCon.classList = '';
        }

    },

    getViewItemBlank(galKey, itemKey) { // , transType
        let item = this.getObjByVal(this.viewItemBlank);
        console.log(this.viewItemBlank);
        console.log(item);
        item.galKey = galKey;
        item.itemKey = itemKey;
        //item.transType = transType;
        return item;
    },

    /*
     * set the dimensions of the browser window
     * run on page load and window resize.
     */
    setWindowSize() {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        //this.consoleLog('set window dimensions', this.windowWidth, this.windowHeight);
    },

    //     /* Image Viewer Actions - END
    //     *****************************************************************************
    //     *****************************************************************************/






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
                '<div id="riot-gallery-viewer-close-con"><a href="#">X</a></div>'+
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
            //
            //this.elems.body.append(html);
            ////
            subDivElem = document.createElement('div');
            subDivElem.id = 'riot-gallery-viewer-close-con';
            aElem = document.createElement('a');
            aElem.innerHTML = 'X';
            aElem.href = '#';
            aElem.addEventListener('click', function (event) {
                event.preventDefault();
                RiotGalleryViewer.closeClicked();
            }, false);
            subDivElem.appendChild(aElem);
            this.elems.closeCon = subDivElem;
            divElem.appendChild(subDivElem);
            ////
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
            ////
            this.elems.body.appendChild(divElem);

            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-image-trans-con';
            imgElem = document.createElement('img');
            imgElem.id = 'riot-gallery-viewer-image-trans';
            this.elems.imageTrans = imgElem;
            divElem.appendChild(imgElem);
            this.elems.imageTransCon = divElem;
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

        console.log('elements done');

        this.isViewerHtmlLoaded = true;
    },


    closeClicked() {
        this.closeViewer();
    },

    itemClicked(galKey, itemKey) {
        /*this.consoleLog('item clicked', galleryKey, itemKey);
        this.viewItemCur.galKey = galleryKey;
        this.viewItemCur.itemKey = itemKey;
        this.transitionType = null;
        console.log('transitionType', this.transitionType);*/
        this.loadImage(galKey, itemKey, null);
    },

    prevClicked() {
        //this.transitionType = 'prev';
        this.incrementImageAndLoad(-1, 'prev');

    },

    nextClicked() {
        //this.transitionType = 'next';
        this.incrementImageAndLoad(1, 'next');

    },

    incrementImageAndLoad(increment, transType) {
        if (!increment) {
            // should not happen
            return;
        }

        /*if (increment > 0) {
            this.transitionType = 'next';
        } else {
            this.transitionType = 'prev';
        }*/
        let itemKey = this.viewItemCur.itemKey;
        let galKey = this.viewItemCur.galKey;

        if (galKey === null) {
            // should not happen
            galKey = 0;
        }
        if (this.viewItemCur.itemKey === null) {
            // should not happen
            itemKey = 0;
        } else {
            itemKey = this.viewItemCur.itemKey;
            itemKey += increment;
            if (itemKey >= this.galleries[galKey].items.length) {
                itemKey = 0;
            }
            else if (itemKey < 0) {
                itemKey = this.galleries[galKey].items.length - 1;
            }
        }
        //console.log(181, this.viewItemCur.galKey, this.viewItemCur.itemKey, this.galleries[this.viewItemCur.galKey].items.length);

        this.loadImage(galKey, itemKey, transType);
    },

    windowResized() {
        if (!this.isViewerOpen) {
            return;
        }
        this.setWindowSize();
        
        this.calculateImgViewPlacement();
        //this.setImagePosition();
        this.endTransition();
        this.placeImage();
    },

    //     placeImageInPosition() {
    //         console.log('placeImageInPosition()');
    //         //this.endTransition();


    //         this.elems.imageCon.style.top = this.viewItemCur.top + 'px';
    //         this.elems.imageCon.style.width = this.viewItemCur.width + 'px';
    //         this.elems.imageCon.style.height = this.viewItemCur.height + 'px';

    //         if (!this.transition.isTransitioning) {
    //             this.elems.imageCon.style.left = this.viewItemCur.left + 'px';
    //         }

    //         this.elems.closeCon.style.left = this.viewItemCur.closeLeft + 'px';
    //         this.elems.closeCon.style.top = this.viewItemCur.closeTop + 'px';
    //     },



    //     /*****************************************************************************
    //      *****************************************************************************
    //      * Helper - START - no specific to this program */

    //     createXHR() {
    //         if (window.XMLHttpRequest) { // Modern browsers
    //             return new XMLHttpRequest();
    //         } else if (window.ActiveXObject) { // IE 6-8
    //             try {
    //                 return new ActiveXObject("Msxml2.XMLHTTP");
    //             } catch (e) {
    //                 try {
    //                     return new ActiveXObject("Microsoft.XMLHTTP");
    //                 } catch (e) { }
    //             }
    //         }
    //         throw new Error("This browser does not support XMLHttpRequest or ActiveXObject");
    //     },

    //     parseJson(str) {
    //         let parsed;
    //         try {
    //             parsed = JSON.parse(str);
    //         } catch (e) {
    //             console.log(e);
    //             return false;
    //         }
    //         return parsed;
    //     },

    //     strReplace(from, to, str) {
    //         if (typeof from === 'number') {
    //             from = from.toString();
    //         }
    //         if (typeof to === 'number') {
    //             to = to.toString();
    //         }
    //         if (typeof from === 'string' || typeof from === 'number') {
    //             from = [from];
    //         } else {
    //             if (Array.isArray(from)) {
    //                 return str;
    //             }
    //         }

    //         //const temp = str; 
    //         //console.log(temp);
    //         for (let x = 0; x < from.length; x++) {
    //             let curFrom = from[x];
    //             let prev = '';
    //             while (prev !== str) {
    //                 prev = str;
    //                 str = str.replace(curFrom, to, str);
    //             }
    //         }
    //         //console.log('strReplace', from, to, temp, str);
    //         return str;
    //     },

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

    //     getElemClassArray(elem) {
    //         let classes = [];

    //         if (!elem) {
    //             return classes;
    //         }

    //         if (!elem.className) {
    //             return classes;
    //         }

    //         const classSplit = elem.className.split(' ');

    //         for (let x = 0; x < classSplit.length; x++) {
    //             let c = classSplit[x].trim();
    //             if (c.length > 0) {
    //                 classes.push(c);
    //             }
    //         }
    //         return classes;
    //     },

    //     elemAddClass(elem, classes) {
    //         if (typeof classes == 'string') {
    //             classes = [classes];
    //         }

    //         let setClasses = this.getElemClassArray(elem);

    //         for (let x = 0; x < classes.length; x++) {
    //             if (setClasses.indexOf(classes[x]) < 0) {
    //                 setClasses.push(classes[x]);
    //             }
    //         }

    //         elem.className = setClasses.join(' ');

    //         return elem;
    //     },

    getOptionVal(option, galKey) {
        // check if set globally
        if (this.options[option]) {
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

    //     /* Helper - END
    //      *****************************************************************************
    //      *****************************************************************************/

};

// global variable to store an array of galleries
//let riotGalleryViewerInstances = [];
// initialzie gallery/galleries on page load
window.onload = function () {
    RiotGalleryViewer.initialize();
}