/*
 * RiotGalleryViewer class
 * make items in an image gallery clickable.
 * load a viewer with previous/next buttons to view each image in the gallery
 */

RiotGalleryViewer = {

    galleries: [],

    galleryTemplate: {
        elementId: null,
        elem: null,
        initImages: null,
        images: null,
        initOptions: null,
        options:null,
        isHtmlBuilt: false,
        isLoaded: false
    },

    /*****************************************************************************
     *****************************************************************************
     * Initialization - START */

    initialize() {
        console.log('static initialize() {');
        // include jquery here if not available
        this.buildGalleries();
    },

    buildGalleries() {
        console.log('static buildGalleries() {');
        console.log('this.galleries', this.galleries);
        console.log('this.galleries.length', this.galleries.length);
        for (let x = 0; x < this.galleries.length; x++) {
            if (!this.galleries[x].isHtmlBuilt) {
                console.log('gallery in loop', this.galleries[x]);
                this.buildGallery(x);
            }
        }
    },

    buildGallery(x) {
        if (!this.galleries[x]) {
            return;
        }
        console.log('static buildGallery(gallery) {', this.galleries[x]);
        //let elem = $('#' + gallery.elementId).first();
        let elem = document.getElementById(this.galleries[x].elementId);
        if (!elem) {
            return false;
        }

        const tagName = this.getElementTagName(elem);

        let ulElem = null;

        if (tagName === 'ul' || tagName === 'ol') {
            console.log('we\'re already in a list. make sure class is set');
            ulElem = elem;
            ulElem = this.elemAddClass(elem, 'riot-gallery-style');
            // do nothing. we're already in a list
        } else if (tagName === 'div') {
            console.log('insert here');
            //let tempElem = $('<ul></ul>');
            ulElem = document.createElement('ul');
            ulElem.className = 'riot-gallery-style';
            elem.innerHTML = '';
            elem.appendChild(ulElem);
        } else {
            console.log('not list or div');
            ulElem = document.createElement('ul');
            ulElem.className = 'riot-gallery-style';
            this.insertAfter(elem, ulElem);
        }

        //elem.addClass('riot-gallery-style');
        

        //let html;
        console.log('tagName', tagName);
        
        let images = [];
        console.log('images', images);
        for (let y = 0; y < this.galleries[x].initImages.length; y++) {
            const img = this.buildGalleryImageInfo(this.galleries[x].initImages[y]);
            if (!img) {
                continue;
            }
            console.log(img);

            let liElem = document.createElement('li');
            let aElem = document.createElement('a')
            aElem.href = img.url;
            aElem.setAttribute('target', '_blank');
            let imgElem = document.createElement('img');
            imgElem.src = img.thumbUrl;
            aElem.appendChild(imgElem);
            liElem.appendChild(aElem);
            if (img.caption) {
                let divCapElem = document.createElement('div');
                divCapElem.innerHTML = img.caption;
                divCapElem.className = "riot-gallery-image-caption";
                liElem.appendChild(divCapElem);
            }
            ulElem.appendChild(liElem);

            images.push(img);
            /*html = '<li><a href="' + img.url + '" target="_blank"><img src="' + img.thumbUrl + '"></a>';
            if (img.caption) {
                html += '<div class="riot-gallery-image-caption">'+img.caption+'</div>';    
            }
            html += '</li>';
            elem.append(html);*/
        }
        this.galleries[x].isHtmlBuilt = true;
        this.galleries[x].images = images;
    },

    buildGalleryImageInfo(img) {
        //console.log('---------------');
        //console.log('img', img);
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
        //console.log(info);
        return info;
    },

    /* Initialization - END
    *****************************************************************************
    *****************************************************************************/

    /*****************************************************************************
     *****************************************************************************
     * Create html image gallery through class - START */

    addGallery(elementId, images, options) {

        // validate element id.
        if (typeof elementId !== 'number') {
            // the elementid is a number, convert to string
            elementId = elementId.toString();
        }
        /*const tagName = this.getTagNameFromIdJs(elementId);
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
            // the element is not found
            let pageText = document.body.textContent;
            if (pageText.includes('[' + elementId + ']')) {
                // the element text in the code, formatted with square brackets, ex "[my-gallery]"
                // replace with an html element
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
            // images are not in an array
            return false;
        }
        if (images.length < 1) {
            console.log('addGallery error 4');
            // no images are in the passed array
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

        const info = Object.assign({}, this.galleryTemplate);        
        info.elementId = elementId;
        info.initImages = images;
        info.initOptions = options;

        this.galleries.push(info);
        console.log(this.galleries);
        /*let elem = $('#' + galleryElementId);

        const tagName = this.getElementTag(elem);

        if (!tagName) {
            // could not get the tag name.
            return false;
        }*/
    },

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
    getElementTagName(elem) {
        if (!elem) {
            // invalid jquery element
            return null;
        }

        //if (!(elem instanceof jQuery)) {
        //    // no a jquery object
        //    return null;
        //}

        if (!this.isDomElement(elem)) {
            // not a dom element
            return null;
        }

        console.log(elem);

        /*if (elem.length < 1) {
            // element not found
            return null;
        }*/

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

    //Returns true if it is a DOM element    
    isDomElement(elem) {
        if (elem instanceof Element || elem instanceof HTMLDocument) {
            return true;
        }
        return false;
    },

    insertAfter(previousExistingElem, newNextElem) {
        previousExistingElem.parentNode.insertBefore(newNextElem, previousExistingElem.nextSibling);
    }



    /* Helper Functions - END
    *****************************************************************************
    *****************************************************************************/
};


// global variable to store an array of galleries
//let riotGalleryViewerInstances = [];
// initialzie gallery/galleries on page load
window.onload = function () {
    RiotGalleryViewer.initialize();
}