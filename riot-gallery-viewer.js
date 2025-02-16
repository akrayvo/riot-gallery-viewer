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

    transition: {},

    transitionBlank: {
        jsTnterval: null,
        isTransitioning: false,
        type: null, // left, or right
        startTimeMs: null,
        endTimeMs: null,
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

    windowWidth: null,
    windowHeight: null,

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

            // background
            // <div id="riot-gallery-viewer-bg"></div>
            divElem = document.createElement('div');
            divElem.id = 'riot-gallery-viewer-bg';
            divElem.addEventListener('click', function (event) {
                event.preventDefault();
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
                    RiotGalleryViewer.nextClicked();
                }, false);
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

        this.isViewerHtmlLoaded = true;
    },

    /* load HTML viewer - END
     *****************************************************************************
     *****************************************************************************/



    /*****************************************************************************
     *****************************************************************************
     * Item/image display - START */

    /*
     * new image displayed in the viewer
     * happens on gallery image and previous/next button click
     */
    loadImage(galKey, itemKey, transType) {
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

        this.viewerPrevKey = this.viewerCurKey;
        //console.log('a', this.viewerCurKey);
        if (this.viewerCurKey == null) {
            this.viewerCurKey = 0;
            //console.log('b', this.viewerCurKey);
        } else {
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

        //console.log('START');
        //console.log('a1');
        if (!galItem.isLoaded) {
            //console.log('b1');
            var img = new Image();
            img.src = galItem.url;
            //console.log(img.src);
            if (img.complete) {
                //console.log('c1');
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
                img.onload = function (e) {
                    //console.log('e1');
                    //console.log('IMAGE LOADED');
                    RiotGalleryViewer.updateGalItem(this.galKey, this.itemKey, img, false);
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
                    }
                }
            }

        }
        //console.log('j1');
        RiotGalleryViewer.calculateViewerPlacement(transType);
        RiotGalleryViewer.placeImgInPosition();
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
        //this.resetViewerValues();
    },

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
            RiotGalleryViewer.consoleLog('invalid image. can not load', img.url);
            return;
        }

        this.galleries[galKey].items[itemKey].width = img.width;
        this.galleries[galKey].items[itemKey].height = img.height;
        this.galleries[galKey].items[itemKey].isError = false;
        this.galleries[galKey].items[itemKey].isLoaded = true;
        console.log('updateGalItem', galKey, itemKey, this.galleries[galKey].items[itemKey]);
    },

    endTransition() {
        /*if (!this.transition) {
            return;
        }
        if (this.transition.isTransitioning) {
            clearInterval(this.transition.jsTnterval);
        }
        this.transition = this.getByVal(this.transitionBlank);*/
    },

    /*
     * set the dimensions of the browser window
     * run on page load and window resize.
     */
    setWindowSize() {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
    },

    calculateViewerPlacement(transType) {
        if (!transType) {
            transType = null;
        }
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
        
        this.viewers[curK].width = viewerWidth;
        this.viewers[curK].height = viewerHeight;
        this.viewers[curK].left = viewerLeft;
        this.viewers[curK].top = viewerTop;
        this.viewers[curK].closeTop = closeTop;
        this.viewers[curK].closeRight = closeRight;
        this.viewers[curK].padding = conPadding;

        const transExtraDistance = 4;
        const closeXWidth = 40;

        const prevK = this.viewerPrevKey;
        console.log('--------1167', this.viewerPrevKey);
        if (transType === 'prev' &&  prevK !== null) {
            this.viewers[curK].transition =  { left: (this.windowWidth + transExtraDistance) };
            this.viewers[prevK].transition = { left: -(this.viewers[prevK].width + transExtraDistance + closeXWidth) };
        }

        console.log(this.viewers);

        //console.log('-=-=-=-=--=-=-=-=-=--=-=-=--=-=-');

        //console.log('calculateViewerPlacement', this.viewers);
    },

    updateImgClassesAndSrc() {
        const item = this.getCurGalItem();
        const curK = this.viewerCurKey;

        let src = this.blankImageSrc;

        if (item.isError) {
            console.log('a');
            this.elems.imageCons[curK].classList.add('is-error');
            this.elems.imageCons[curK].classList.remove('is-loading');
        } else if (!item.isLoaded) {
            console.log('b');
            this.elems.imageCons[curK].classList.add('is-loading');
            this.elems.imageCons[curK].classList.remove('is-error');
        } else {
            console.log('c');
            this.elems.imageCons[curK].classList.remove('is-loading', 'is-error');
            if (item.url) {
                console.log('d');
                src = item.url;
            }
        }
        this.elems.images[curK].src = item.url;
    },

    placeImgInPosition() {
        //this.endTransition();

        //if (!transType) {
        //    transType = null
        //}


        if (this.transition) {
            if (this.transition.isTransitioning) {
                this.updateImgClassesAndSrc();
                return;
            }
        }


        //const item = this.getCurGalItem();
        //console.log('1178 item', item);

        const curK = this.viewerCurKey;
        const prevK = this.viewerPrevKey;

        isImgLoaded = false;
        



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

        /*let hasTransition = false;
        console.log('yyyyyyyyyyyyyyy');
        for (var prop in viewer.transition) {
            if (Object.prototype.hasOwnProperty.call(viewer.transition, prop)) {
                // do stuff
                console.log(prop, viewer.transition[prop]);
                hasTransition = true;
                if (prop === 'left') {
                    //this.elems.imageCons[curK].style.left = viewer.left + 'px';
                }
            }
        }*/

        //if (hasTransition) {
        //let doPlaceLeft = true;
        let curLeft = viewer.left;
        //if (transType) {

        if (Object.keys(viewer.transition).length > 0) {
            this.tranition = this.getByVal(this.transitionBlank);
            this.transition.isTransitioning = true;
            this.transition.startTimeMs = this.getCurMs();
            this.transition.endTimeMs = this.transition.startTimeMs + this.options.transitionMs;
            /*this.transition.jsTnterval = setInterval(function () {
                RiotGalleryViewer.transitionFrame();
            }, this.options.transitionFrameMs);*/
console.log('77777777777 viewer', viewer);
console.log('a');
            if (viewer.transition.hasOwnProperty('left')) {
                console.log('b');
                if (viewer.transition.left !== null) {
                    console.log('c');
                    curLeft = viewer.transition.left;
                    console.log('d');
                }
            }

            //console.log('placeImgInPosition', viewer);
            console.log(this.elems.imageCons);
        }
        console.log('e', curLeft);
        this.elems.imageCons[curK].style.left = curLeft + 'px';
        this.elems.imageCons[curK].style.top = viewer.top + 'px';
        this.elems.imageCons[curK].style.width = viewer.width + 'px';
        this.elems.imageCons[curK].style.height = viewer.height + 'px';

        this.elems.imageCons[curK].style.padding = viewer.padding + 'px';

        this.elems.closeCons[curK].style.right = viewer.closeRight + 'px';
        this.elems.closeCons[curK].style.top = viewer.closeTop + 'px';

        this.updateImgClassesAndSrc();

        //this.elems.images[curK].src = item.url;
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