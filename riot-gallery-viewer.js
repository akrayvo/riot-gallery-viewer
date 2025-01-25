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
        errorMessage: null,

        imageFileUrl: null,
        imageFileUrlIsComplete: false,
        options: {
            // write information to the console log. needed for troubeshooting/testing/development only
            doConsoleLog: false
        },
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
    addImage(galleryElemId, url, thumbUrl, label) {
        console.log('addImage(galleryElemId, url, thumbUrl, label) {', galleryElemId, url, thumbUrl, label);

        const galleryKey = this.getGalleryKeyByElemId(galleryElemId); // , false

        if (galleryKey === false) {
            console.log('addImage failed, could not find gallery', galleryElemId);
            return false;
        }

        /*if (typeof url !== 'string') {
            console.log('addImage failed, url is not a string', url);
            return false;
        }

        if (url.length < 1) {
            console.log('addImage failed, url is empty', url);
            return false;
        }

        if (typeof thumbUrl !== 'string') {
            thumbUrl = null;
        } else {
            if (thumbUrl.length < 1) {
                thumbUrl = null;
            }
        }

        if (typeof label === 'number') {
            label = label.toString();
        }

        if (typeof label !== 'string') {
            label = null;
        } else {
            if (label.length < 1) {
                label = null;
            }
        }*/

        console.log(this.galleries[galleryKey]);
        this.addImageByGalleryKey(galleryKey, url, thumbUrl, label);
    },        



    /*
    add a gallery from a file (remote url)
    called by user
    gallery is created if needed
    */
    addGalleryByFile(galleryElemId, fileUrl) {
        console.log('addGalleryByFile(galleryElemId, fileUrl) {', galleryElemId, fileUrl);
        const galleryKey = this.getGalleryKeyByElemId(galleryElemId);

        if (galleryKey === false) {
            console.log('addGalleryByString failed, could not find gallery', galleryElemId);
            return false;
        }

        if (!fileUrl || typeof fileUrl !== 'string') {
            console.log('addGalleryByString failed, no fileUrl', fileUrl);
            return false;
        }

        //let gal = Object.assign({}, this.galleryTemplate);

        //gal.elemId = elemId;

        this.galleries[galleryKey].imageFileUrl = fileUrl;

        // add a new empty gallery to the galleries array. assign so that it is copied by value.
        //this.galleries.push(gal);

        console.log(this.galleries);

        /*

        */
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
                this.options.doConsoleLog = true;
            } else {
                this.options.doConsoleLog = false;
            }
            console.log('doConsoleLog set to', this.options.doConsoleLog);
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
    begin intiialazations
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
                    RiotGalleryViewer.galleries[xhr.galleryKey].errorMessage = 'could not read file';

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
            this.galleries[galleryKey].isError = 1;
            this.galleries[galleryKey].errorMessage = 'text file is empty';
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
                console.log('lines[x]', lines[x]);
                this.addImageByString(galleryKey, lines[x]);
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
        let label = null;

        if (Array.isArray(obj)) {
            if (obj[0]) {
                url = obj[0].trim();
            }
            if (obj[1]) {
                thumbUrl = obj[1].trim();
            }
            if (obj[2]) {
                label = obj[0].trim();
            }
        } else {
            if (obj.url) {
                url = obj.url.trim();
            }
            if (obj.thumbUrl) {
                thumbUrl = obj.thumbUrl.trim();
            }
            if (obj.label) {
                label = obj.label.trim();
            }
        }
        /*if (!url) {

            console.log('addImageByObj(galleryKey, obj) { ERROR - no url found', obj);
            return false;
        }*/

        /*const newObj = { url: url, thumbUrl: thumbUrl, label: label };
        this.galleries[galleryKey].initImages.push(newObj);*/
        this.addImageByGalleryKey(galleryKey, url, thumbUrl, label);

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
        let label = null;

        const strs = line.split("\t");

        if (strs.length > 1) {
            // tab separated
            if (strs[0]) {
                url = this.strStripStartEndQuotes(strs[0]);
                console.log('---------------if (strs[0]) {', url, strs[0]);
            }
            if (strs[1]) {
                thumbUrl = this.strStripStartEndQuotes(strs[1]);
            }
            if (strs[2]) {
                label = this.strStripStartEndQuotes(strs[2]);
            }
            this.addImageByGalleryKey(galleryKey, url, thumbUrl, label);
        } else {
            // strings in quotes (with validation)
            console.log(line);
            const strs = this.addImageByStringsWithQuotes(galleryKey, line);
        }

        if (!url) {
            console.log('addImageByString(galleryKey, line) { ERROR - no url found', line);
            return false;
        }

        //const newObj = { url: url, thumbUrl: thumbUrl, label: label };
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
        console.log(line);
        const tempQuoteReplace = "[~~(quote here, riotgallery)~~]";
        line = this.strReplace('\\"', tempQuoteReplace, line);
        line = line.trim();

        strs = line.split('"');

        for (let x = 0; x < strs.length; x++) {
            strs[x] = this.strReplace('\\"', tempQuoteReplace, strs[x]);
        }

        console.log(strs);

        // 0 = [before first quote], 1 = url, 2 = [between quotes], 3 = thumUrl, 4 = [between quotes], 5 = label

        let url = null;
        let thumbUrl = null;
        let label = null;

        if (strs[1]) {
            url = strs[1];
        } else {
            console.log('addImageByStringsWithQuotes(galleryKey, line) {', galleryKey, line);
            return false;
        }
        if (strs[3]) {
            thumbUrl = strs[3];
        }
        if (strs[5]) {
            label = strs[5];
        }

        const newObj = { url: url, thumbUrl: thumbUrl, label: label };
        this.galleries[galleryKey].initImages.push(newObj);
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

        //if (typeof canBeNull === 'undefined') {
        //    canBeNull = false;
        // }

        console.log('getGalleryKeyByElemId(elemId) {', elemId);

        //if (elemId === false || (elemId === null) {
        //    elemId = null;
        //}

        // validate element id.
        //if (typeof elemId === 'number') {
        //    // the elemId is a number, convert to string
        //    elemId = elemId.toString();
        //}

        if (typeof elemId !== 'string') {
            console.log('getGalleryKeyByElemId error - invalid elemId type', elemId, typeof elemId);
            return false;
        }

        if (elemId.length < 1) {
            console.log('getGalleryKeyByElemId error - invalid elemId is empty', elemId, typeof elemId);
            return false;
        }
        //     if (typeof elemId !== 'string') {
        //         // id is not null and not a string
        //         console.log('getGalleryKeyByElemId error - invalid elemId type', elemId, typeof elemId);
        //         return false;
        //     }
        //     if (elemId.length < 1) {
        //         elemId = null;
        //     }
        // }

        // if (elemId === null) { // !canBeNull && 
        //     console.log('getGalleryKeyByElemId error - elemId is null, canBeNull not set', elemId, typeof elemId);
        //     return false;
        // }

        for (let x = 0; x < this.galleries.length; x++) {
            if (this.galleries[x].elemId === elemId) {
                if (this.isError) {
                    console.log('addGallery error 2b - gallery already created with error', elemId);
                    return false;
                }
                return x;
            }
        }

        let gal = Object.assign({}, this.galleryTemplate);

        gal.elemId = elemId;

        // add a new empty gallery to the galleries array. assign so that it is copied by value.
        this.galleries.push(gal);

        // array key of the current (new) gallery
        const galleryKey = this.galleries.length - 1;

        return galleryKey;

        // this.galleries[galleryKey].elemId = elemId;

        // if (elemId === null) {
        //     this.galleries[galleryKey].elem = null;
        //     return galleryKey;
        // }

        /*let elem = document.getElementById(elemId);
        if (!elem) {
            // the element is not found
            let matchText = '[riotgalleryviewer' + elemId + ']';
            if (document.body.textContent.includes(matchText)) {
                // the element text in the code, formatted with square brackets, ex "[riotgalleryviewer my-gallery]"
                // replace with an html element
                document.body.innerHTML = document.body.innerHTML.replace(
                    matchText,
                    '<div id="' + elemId + '"></div>');
                elem = document.getElementById(elemId);
            } else {
                matchText = '[rgv ' + elemId + ']';
                if (document.body.textContent.includes(matchText)) {
                    // the element text in the code, formatted with square brackets, ex "[rgv my-gallery]"
                    // replace with an html element
                    document.body.innerHTML = document.body.innerHTML.replace(
                        matchText,
                        '<div id="' + elemId + '"></div>');
                    elem = document.getElementById(elemId);
                }
            }
        }*/

        // if (!elem) {
        //     // the gallery element was not found
        //     this.galleries[galleryKey].isError = true;
        //     this.galleries[galleryKey].errorMessage = 'addGallery - Element ID (' + elemId + ') not found.';
        //     console.log('addGallery error 2 - could not find element', elemId);
        //     return false;
        // }

        // //this.galleries[galleryKey].isReady = true;
        // this.galleries[galleryKey].elem = elem;

        // console.log('galleryKey', galleryKey);

        // return galleryKey;
    },

    /*
    add an initImages record to a gallery record
    */
    addImageByGalleryKey(galleryKey, url, thumbUrl, label)
    {
        // double check that the gallery exists.
        if (!this.galleries[galleryKey]) {
            return false;
        }
        this.galleries[galleryKey].initImages.push({ url: url, thumbUrl: thumbUrl, label: label });
        return true;
    },

    /* add gallery and image - END
     *****************************************************************************
     *****************************************************************************/
    

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

    /* Helper - END
     *****************************************************************************
     *****************************************************************************/     


     





    //     addImageByObj(galleryElemId, obj) {
    //         obj = { url: null, thumbUrl: null, label: null };
    //         if (Array.isArray(temp)) {
    //             if (temp[0]) {
    //                 obj.url = temp[0];
    //             }
    //             if (temp[1]) {
    //                 obj.thumbUrl = temp[1];
    //             }
    //             if (temp[2]) {
    //                 obj.label = temp[2];
    //             }
    //         }
    //         if ()
    //     },



    ///////////











    ///////////

    




    



    

    

    // addImageByString(galleryElemId, string) {
    //     let img = this.strLineToItem(string);
    //             //if (item) {
    //                 //imgs.push(img);
    //             //}
    //             //console.log('abc', line, item);
    // },







    //         /*strLineToItem(str) {
    //             console.log('strLineToItem(line) {', line);
    //             if (str.indexOf("\t") >= 0) {
    //                 console.log('230', 'has tab');
    //                 const allCols = line.split("\t");
    //                 let url = '';
    //                 let thumbUrl = '';
    //                 let label = '';
    //                 let temp = '';
    //                 if (allCols[0]) {
    //                     temp = allCols[0].trim();
    //                     if (temp.length > 0) {
    //                         url = temp;
    //                     } else {
    //                         return false;
    //                     }
    //                 }
    //                 if (allCols[1]) {
    //                     temp = allCols[1].trim();
    //                     if (temp.length > 0) {
    //                         thumbUrl = temp;
    //                     }
    //                 }
    //                 if (allCols[2]) {
    //                     temp = allCols[2].trim();
    //                     if (temp.length > 0) {
    //                         label = temp;
    //                     }
    //                 }
    //                 return { url: line, thumbUrl: thumbUrl, label: label };
    //             } else {

    //             }

    //         },* /



    //     */

    //     // addGallery(elemId, images, options) {
    //     //     console.log('addGallery(elemId, images, options, ) {', elemId, images, options);

    //     //     // add a new empty gallery to the galleries array. assign so that it is copied by value.
    //     //     this.galleries.push(Object.assign({}, this.galleryTemplate));

    //     //     // array key of the current (new) gallery
    //     //     const galleryKey = this.galleries.length - 1;

    //     //     // validate element id.
    //     //     if (typeof elemId === 'number') {
    //     //         // the elemId is a number, convert to string
    //     //         elemId = elemId.toString();
    //     //     }

    //     //     if (typeof elemId !== 'string') {
    //     //         // id must be a string
    //     //         this.galleries[galleryKey].isError = true;
    //     //         this.galleries[galleryKey].errorMessage = 'addGallery - Invalid element ID passed.';
    //     //         console.log('addGallery error 1', typeof elemId);
    //     //         return false;
    //     //     }

    //     //     this.galleries[galleryKey].elemId = elemId;

    //     //     let elem = document.getElementById(elemId);
    //     //     if (!elem) {
    //     //         // the element is not found
    //     //         let matchText = '[riotgalleryviewer' + elemId + ']';
    //     //         if (document.body.textContent.includes(matchText)) {
    //     //             // the element text in the code, formatted with square brackets, ex "[riotgalleryviewer my-gallery]"
    //     //             // replace with an html element
    //     //             document.body.innerHTML = document.body.innerHTML.replace(
    //     //                 matchText,
    //     //                 '<div id="' + elemId + '"></div>');
    //     //             elem = document.getElementById(elemId);
    //     //         } else {
    //     //             matchText = '[rgv ' + elemId + ']';
    //     //             if (document.body.textContent.includes(matchText)) {
    //     //                 // the element text in the code, formatted with square brackets, ex "[rgv my-gallery]"
    //     //                 // replace with an html element
    //     //                 document.body.innerHTML = document.body.innerHTML.replace(
    //     //                     matchText,
    //     //                     '<div id="' + elemId + '"></div>');
    //     //                 elem = document.getElementById(elemId);
    //     //             }
    //     //         }
    //     //     }

    //     //     if (!elem) {
    //     //         // the gallery element was not found
    //     //         this.galleries[galleryKey].isError = true;
    //     //         this.galleries[galleryKey].errorMessage = 'addGallery - Element ID (' + elemId + ') not found.';
    //     //         console.log('addGallery error 2', typeof elemId);
    //     //         return false;
    //     //     }

    //     //     this.galleries[galleryKey].elem = elem;


    //     //     // validate options
    //     //     if (typeof images === 'undefined') {
    //     //         // nothing passed, set to empty object
    //     //         images = [];
    //     //     }

    //     //     if (!Array.isArray(images)) {
    //     //         console.log('addGallery error 3', typeof images);
    //     //         // images are not in an array
    //     //         this.galleries[galleryKey].isError = true;
    //     //         this.galleries[galleryKey].errorMessage = 'addGallery - Passed images must be an array.';
    //     //         return false;
    //     //     }

    //     //     //if (images.length < 1) {
    //     //     //    console.log('addGallery error 4');
    //     //     //    // no images are in the passed array
    //     //     //    this.galleries[galleryKey].isError = true;
    //     //     //    this.galleries[galleryKey].errorMessage = 'addGallery - No Images passed.';
    //     //     //    return false;
    //     //     //}


    //     //     /*this.galleries[galleryKey].initImages = images;


    //     //     // validate options
    //     //     if (typeof options === 'undefined') {
    //     //         // nothing passed, set to empty object
    //     //         options = {};
    //     //     }

    //     //     if (typeof options !== 'object') {
    //     //         console.log('addGallery error 4');
    //     //         // invalid options passed
    //     //         this.galleries[galleryKey].isError = true;
    //     //         this.galleries[galleryKey].errorMessage = 'addGallery - invalid Options passed.';
    //     //         return false;
    //     //     }

    //     //     this.galleries[galleryKey].initOptions = options;*/
    //     //     /*

    //     //     //console.log(this.galleries);
    //     //     //console.log(this.galleryTemplate);
    //     //     / * let elem = $('#' + galleryelemId);

    //     //     const tagName = this.getElementTag(elem);

    //     //     if (!tagName) {
    //     //         // could not get the tag name.
    //     //         return false;
    //     //     }*/

    //     //     return true;
    //     // },
};

// global variable to store an array of galleries
//let riotGalleryViewerInstances = [];
// initialzie gallery/galleries on page load
window.onload = function () {
    RiotGalleryViewer.initialize();
}