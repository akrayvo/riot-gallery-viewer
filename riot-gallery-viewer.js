class RiotGalleryViewer {
  static jqueryUrl =
    'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
  static materialIconsUrl =
    'https://fonts.googleapis.com/icon?family=Material+Icons';

  static validThemes = ['default'];

  /*
   * initialize all class variables
   */
  constructor(elem) {
    this.isLoaded = false;
    this.isHtmlLoaded = false;
    this.isOpen = false;
    this.galleryImages = [];
    this.imageCount = 0;
    this.currentImageKey = null;
    this.curImgWidth = null;
    this.curImgHeight = null;
    this.elems = {
      body: null,
      gallery: null,
      linkContainers: null,
      viewerBackground: null,
      bg: null,
      prevCon: null,
      nextCon: null,
      imageCon: null,
      closeCon: null,
      image: null
    };
    this.swipeInfo = {
      startX: null,
      startY: null,
      startTime: null
    };
    this.options = {
      doConsoleLog: false,
      useMaterialIcons: true,
      theme: 'default',
      swipeMaxSeconds: 0.9,
      swipeMinPx: 60,
      swipeMinPercent: 13
    };

    this.load(elem);
  }

  /*
   * Load/initialize the gallery viewer
   * galleryElem is the jQuery ul element
   */
  load(galleryElem) {
    // check if it was already loaded
    if (this.isLoaded) {
      return false;
    }

    if (typeof galleryElem !== 'object') {
      return false;
    }

    // check that the element is an unordered list
    const tagName = galleryElem.prop('tagName').toLowerCase();
    if (tagName !== 'ul') {
      this.consoleLogInfo(
        'Riot Gallery Viewer not loaded. tag is "' +
        tagName +
        '". must be "ul" (unordered list).'
      );
      return false;
    }

    this.elems.body = $('body');
    this.elems.gallery = galleryElem;

    this.elems.linkContainers = this.elems.gallery.find('li');

    if (this.elems.linkContainers < 1) {
      this.consoleLogInfo('Riot Gallery Viewer not loaded: No "li" (list item) found');
      return false;
    }

    this.loadMaterialIconsIfNeeded();

    //this.loadOptions(galleryElem);

    //this.loadHtml(sliderElem);

    //this.updateWidth(true);

    this.bindGalleryLinks();

    this.isLoaded = true;

    this.consoleLogInfo('Riot Gallery Viewer successfully loaded');

    return true;
  }

  /*
  * Bind clicks to gallery images
  */
  bindGalleryLinks() {
    for (let x = 0; x < this.elems.linkContainers.length; x++) {
      var linkContainer = $(this.elems.linkContainers[x]);

      let href = '';
      let caption = '';
      let val = null;
      let clickElem = null;
      let elem = null;

      if (!href) {
        elem = linkContainer.find('a[target="_blank"]');
        val = this.getJqElemVal(elem, 'href');
        if (val) {
          href = val;
          clickElem = elem;
        }
      }
      if (!href) {
        elem = linkContainer.find('a');
        val = getJqElemVal(elem, 'href');
        if (val) {
          href = val;
          clickElem = elem;
        }
      }
      if (!href) {
        elem = linkContainer.find('img');
        val = this.getJqElemVal(elem, 'src');
        if (val) {
          href = val;
          clickElem = elem;
        }
      }

      if (href && clickElem) {
        // only check for label and add event when link is found
        if (!caption) {
          caption = this.getJqElemVal(linkContainer.find('.caption'), 'text');
          if (val) {
            caption = val;
          }
        }
        if (!caption) {
          caption = this.getJqElemVal(linkContainer.find('figcaption'), 'text');
          if (val) {
            caption = val;
          }
        }
        if (!caption) {
          caption = this.getJqElemVal(linkContainer.find('span'), 'text');
          if (val) {
            caption = val;
          }
        }

        this.galleryImages.push({ url: href, caption: caption });
        const key = this.galleryImages.length - 1;
        clickElem.on('click', { igvThis: this, key: key }, function (event) {
          event.preventDefault();
          event.stopPropagation();
          event.data.igvThis.loadImg(event.data.key);
        });
      }
    }
    this.imageCount = this.galleryImages.length;
  }

  bindViewer() {
    this.elems.prevCon.on('click', { igvThis: this }, function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.data.igvThis.prevClicked();
    });
    this.elems.nextCon.on('click', { igvThis: this }, function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.data.igvThis.nextClicked();
    });
    this.elems.image.on('click', { igvThis: this }, function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.data.igvThis.nextClicked();
    });
    this.elems.closeCon.on('click', { igvThis: this }, function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.data.igvThis.closeViewer();
    });
    this.elems.bg.on('click', { igvThis: this }, function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.data.igvThis.closeViewer();
    });
  }

  closeViewer() {
    this.elems.body.removeClass('riot-gallery-viewer-open');
    this.isOpen = false;
  }

  prevClicked() {
    this.loadImg(this.currentImageKey-1);
  }

  nextClicked() {
    this.loadImg(this.currentImageKey+1);
  }

  /*
   * Bind actions to buttons and window resize
   */
  loadImg(key) {
    if (key < 0) {
      key = this.imageCount-1;
    }
    if (key >= this.imageCount) {
      key = 0;
    }

    this.currentImageKey = key;

    if (!this.isOpen) {
      this.loadHtml();
      this.elems.body.addClass('riot-gallery-viewer-open');
      this.isOpen = true;
    }

    var img = new Image();
    img.caption = '';

    img.src = this.galleryImages[this.currentImageKey].url;
    if (img.complete) {
      this.imageLoaded(img);
    } else {
      this.imageLoadingStart();
      img.rgvThis = this;
      img.onload = function (e) {
        this.rgvThis.imageLoaded(this);
        this.rgvThis.imageLoadingDone();
      };
    }
  }

  imageLoaded(loadedImage) {
    this.curImgWidth = loadedImage.width;
    this.curImgHeight = loadedImage.height;
    this.positionImage();
    this.elems.image.attr('src', loadedImage.src);
  };

  loadHtml() {
    if (this.isHtmlLoaded) {
      return;
    }

    let html;

    // background
    html = '<div id="riot-gallery-viewer-bg"></div>';
    this.elems.body.append(html);

    // previous button
    html = '<div id="riot-gallery-viewer-prev-con"><a href="#">&laquo;</a></div>';
    this.elems.body.append(html);

    // next button
    html = '<div id="riot-gallery-viewer-next-con"><a href="#">&raquo;</a></div>';
    this.elems.body.append(html);

    html = '<div id="riot-gallery-viewer-image-con"><img></div>';
    this.elems.body.append(html);

    html = '<div id="riot-gallery-viewer-close-con"><a href="#">X</a></div>';
    this.elems.body.append(html);

    this.elems.bg = $('#riot-gallery-viewer-bg');
    this.elems.prevCon = $('#riot-gallery-viewer-prev-con');
    this.elems.nextCon = $('#riot-gallery-viewer-next-con');
    this.elems.imageCon = $('#riot-gallery-viewer-image-con');
    this.elems.closeCon = $('#riot-gallery-viewer-close-con');
    this.elems.image = this.elems.imageCon.find('img');

    this.bindViewer();

    this.isHtmlLoaded = true;
  }

  positionImage() {
    let multiplier = 1;
    
    let percent =  (window.innerWidth-(this.displayPadding*2)) / this.curImgWidth;
    if (percent < multiplier)
    {
      multiplier = percent;
    }
    
    percent = (window.innerHeight-(this.displayPadding*2)) / this.curImgHeight;
    if (percent < multiplier)
    {
      multiplier = percent;
    }
    
    const displayWidth = Math.floor(this.curImgWidth * multiplier);
    const displayHeight = Math.floor(this.curImgHeight * multiplier);
    
    const newLeft = 'calc(50vw - ' + (displayWidth /2) + 'px)';
    const newTop =  'calc(50vh - ' + (displayHeight/2) + 'px)';
    this.elems.imageCon.css({width:displayWidth+'px', height:displayHeight+'px', left: newLeft, top: newTop});

    const closeRight = 'max(40px, 50vw - ' + ((displayWidth /2)+30) + 'px)';
    const closeTop =   'max(10px, 50vh - ' + ((displayHeight /2)+30) + 'px)';
    this.elems.closeCon.css({right: closeRight, top: closeTop});
  }

  imageLoadingStart() {

  }

  imageLoadingDone() {
    
  }

  /*****************************************************************************
  * start HELPER FUNCTIONS
  ****************************************************************************/

  /*
   * load material icons from googleapis if needed
   */
  loadMaterialIconsIfNeeded() {
    if (!this.options.useMaterialIcons) {
      return false;
    }

    // not displaying buttons or side links
    if (!this.options.doShowButtons) {
      if (
        this.options.previousNextDisplay !== 'sides' &&
        this.options.previousNextDisplay !== 'both'
      ) {
        return false;
      }
    }

    // Create an element in the DOM for testing if Material Icons are present
    let spanElem = document.createElement('span');
    spanElem.className = 'material-icons';
    spanElem.style.display = 'none';
    document.body.append(spanElem, document.body.firstChild);

    // See if the computed font-family value is material icons
    const needToLoadMaterialIcons =
      window
        .getComputedStyle(spanElem, null)
        .getPropertyValue('font-family') !== 'Material Icons';

    // If it's not, load the resource
    if (needToLoadMaterialIcons) {
      let linkElem = document.createElement('link');
      linkElem.href = RiotSlider.materialIconsUrl;
      linkElem.rel = 'stylesheet';
      document.head.appendChild(linkElem);
    }

    // Cleanup the original <span> we stuck in the DOM
    document.body.removeChild(spanElem);
  }

  /*
   * return the text or attribute from a jquery element
   */
  getJqElemVal(elem, attr, errorReturn) {

    if (elem.length < 1) {
      return errorReturn;
    }

    let val;

    if (attr == 'text') {
      val = elem.text();
      if (!val) {
        return errorReturn;
      }
      val = val.trim();
      if (val.length < 1) {
        return errorReturn;
      }
      return val;
    }

    val = elem.attr(attr);
    if (!val) {
      return errorReturn;
    }
    val = val.trim();
    if (val.length < 1) {
      return errorReturn;
    }
    return val;
  }

  /*
  * write information to the console if doConsoleLog is true
  */
  consoleLogInfo(info) {
    if (this.options.doConsoleLog) {
      console.log(info);
    }
  }

  /*****************************************************************************
  * end HELPER FUNCTIONS
  ****************************************************************************/
}

/*
 * check for jquery. load if needed. then load riot gallery
 */
window.onload = function () {
  if (!window.jQuery) {
    let head = document.getElementsByTagName('head')[0];
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = RiotGalleryViewer.jqueryUrl;
    head.appendChild(script);

    let waitForJQuery = setInterval(function () {
      if (window.jQuery) {
        clearInterval(waitForJQuery);
        riotGalleryViewerInitAll();
      }
    }, 100);
  } else {
    riotGalleryViewerInitAll();
  }
}

function riotGalleryViewerInitAll() {
  $(document).ready(function () {
    $('.riot-gallery').each(function () {
      new RiotGalleryViewer($(this));
    })
  })
}
