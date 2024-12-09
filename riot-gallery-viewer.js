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
    this.curViewerWidth = null;
    this.curViewerHeight = null;
    this.windowWidth = null;
    this.windowHeight = null;
    this.elems = {
      body: null,
      window: null,
      gallery: null,
      linkContainers: null,
      viewerBackground: null,
      bg: null,
      prevCon: null,
      nextCon: null,
      imageCon: null,
      closeCon: null,
      image: null,
      loading: null
    };
    this.swipeInfo = {
      startX: null,
      startY: null,
      startTime: null
    };
    this.options = {
      doConsoleLog: true, // false
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

        // bind images in the gallery
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

    this.elems.window.resize({ igvThis: this }, function (event) {
      event.data.igvThis.consoleLogInfo('window resized');
      event.data.igvThis.setWindowSize();
      event.data.igvThis.positionImage();
    });
  }

  setWindowSize() {
    this.windowWidth = this.elems.window.width();
    this.windowHeight = this.elems.window.height();
    this.consoleLogInfo('set window size, width = ' + this.windowWidth + ' | height=' + this.windowHeight);
  }

  closeViewer() {
    this.elems.body.removeClass('riot-gallery-viewer-open');
    this.isOpen = false;
  }

  prevClicked() {
    this.loadImg(this.currentImageKey - 1);
  }

  nextClicked() {
    this.loadImg(this.currentImageKey + 1);
  }

  /*
   * Bind actions to buttons and window resize
   */
  loadImg(key) {
    if (key < 0) {
      key = this.imageCount - 1;
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

    this.elems.body = $('body');
    this.elems.window = $(window);

    // background
    html = '<div id="riot-gallery-viewer-bg"></div>';
    this.elems.body.append(html);

    // previous button
    html = '<div id="riot-gallery-viewer-prev-con"><a href="#">&laquo;</a></div>';
    this.elems.body.append(html);

    // next button
    html = '<div id="riot-gallery-viewer-next-con"><a href="#">&raquo;</a></div>';
    this.elems.body.append(html);

    html = '<div id="riot-gallery-viewer-image-con">' +
      '<img>' +
      '<div id="riot-gallery-viewer-loading"><div></div></div>' +
      '</div>';
    this.elems.body.append(html);

    html = '<div id="riot-gallery-viewer-close-con"><a href="#">X</a></div>';
    this.elems.body.append(html);

    html = '<div id="riot-gallery-viewer-spinner">' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '<div></div>' +
      '</div>';
    this.elems.body.append(html);

    this.elems.bg = $('#riot-gallery-viewer-bg');
    this.elems.prevCon = $('#riot-gallery-viewer-prev-con');
    this.elems.nextCon = $('#riot-gallery-viewer-next-con');
    this.elems.imageCon = $('#riot-gallery-viewer-image-con');
    this.elems.closeCon = $('#riot-gallery-viewer-close-con');
    this.elems.loading = $('#riot-gallery-viewer-loading');
    this.elems.image = this.elems.imageCon.find('img');

    this.bindViewer();

    this.setWindowSize();

    this.isHtmlLoaded = true;
  }

  positionImage() {
    let multiplier = 1;

    let width = this.curImgWidth;
    let height = this.curImgHeight;

    const maxWidth = this.windowWidth - 14;
    const maxHeight = this.windowHeight - 8;

    if (width > maxWidth) {
      width = maxWidth;
      height = height / this.curImgWidth * width;
    }
    //console.log('width', width, 'height', height, 'maxWidth', maxWidth, 'maxHeight', maxHeight, 'newLeft');

    if (height > maxHeight) {
      height = maxHeight;
      width = width / this.curImgHeight * height;
    }

    let newLeft = (this.windowWidth - width) / 2;
    let newTop = (this.windowHeight - height) / 2;

    this.elems.imageCon.css({ width: width + 'px', height: height + 'px', left: newLeft + 'px', top: newTop + 'px' });

    this.curViewerWidth = width;
    this.curViewerHeight = height;

    //console.log('width', width, 'height', height, 'maxWidth', maxWidth, 'maxHeight', maxHeight, 'newLeft', newLeft, 'newTop', newTop);

    newLeft = newLeft - 30;
    newTop = newTop - 30;
    if (newTop < 10) {
      newTop = 10;
    }
    if (newLeft < 30) {
      newLeft = 30;
    }
    this.elems.closeCon.css({ right: newLeft + 'px', top: newTop + 'px' });
  }

  imageLoadingStart() {

    this.elems.imageCon.addClass('is-loading');

    // defaults, will load if no image has been loaded yeat
    if (!this.curImgHeight || !this.curImgWidth) {
      this.curImgHeight = this.curImgWidth = 200;
      this.positionImage();
    }

    // get shorter dimension
    var minSide = this.curViewerWidth;
    if (this.curViewerHeight < minSide) {
      minSide = this.curViewerHeight;
    }

    const extraPadding = 20;

    minSide = minSide - (extraPadding * 2);

    const hMargin = (this.curViewerWidth - minSide) / 2;
    const vMargin = (this.curViewerHeight - minSide) / 2;

    this.elems.loading.css({
      width: minSide + 'px',
      height: minSide + 'px',
      margin: vMargin + 'px ' + hMargin + 'px ' + vMargin + 'px ' + hMargin + 'px'
    });
  }

  imageLoadingDone() {
    this.elems.imageCon.removeClass('is-loading');
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

var globalRgv;
function riotGalleryViewerInitAll() {
  $(document).ready(function () {
    $('.riot-gallery').each(function () {
      globalRgv = new RiotGalleryViewer($(this));
    })
  })
}
