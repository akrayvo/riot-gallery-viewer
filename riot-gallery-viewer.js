let globalVariable = null;

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
      loading: null,
      captionCon: null,
      caption: null
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

  /*****************************************************************************
    * start SET OPTIONS
    ****************************************************************************/

  /*
   * set doConsoleLog option
   * if set, information will be added to the console log
   * generally only needed for testing/development
   * default = false
   */
  setDoConsoleLog(value) {
    this.options.doConsoleLog = this.returnBoolean(value);
    this.consoleLogInfo('set doConsoleLog:');
    this.consoleLogInfo(this.options.doConsoleLog);
  }

  /*
   * set useMaterialIcons option
   * if set, material icons will display for play, stop, previous, and next buttons
   * if unavailable, they will automatically be added from fonts.googleapis.com
   * default = true
   */
  setUseMaterialIcons(value) {
    this.options.useMaterialIcons = this.returnBoolean(value);
    this.consoleLogInfo('set useMaterialIcons:');
    this.consoleLogInfo(this.options.useMaterialIcons);
  }

  /*
   * set theme option
   * current themes are "default", "dark", "pastel"
   * the theme/color sceme of the slider
   * default = normal
   * */
  setTheme(value) {
    value = this.returnString(value, true);
    if (typeof value !== 'string') {
      // return value will be set to null on error
      return;
    }
    if (this.validThemes.indexOf(value) < 0) {
      this.consoleLogInfo('invalid value sent to setTheme: ' + value);
      return;
    }
    this.consoleLogInfo('set theme: ' + value);
    this.options.theme = value;
  }

  /*
   * set swipeMaxSeconds option
  * the max time in seconds between the start and end swipe on a touchscreen
  * can be a decimal (ex: 0.7 or 1.25)
  * if the time is too long, it is likely that the user isn't swiping or there was a missed event
  * value must be between 0.1 (100 milliseconds) and 5
  * default = 0.9 (900 milliseconds)
  */
  setSwipeMaxSeconds(value) {
    value = this.returnFloat(value, 1, 5000);
    if (typeof value !== 'number') {
      return;
    }

    this.consoleLogInfo('set swipeMaxSeconds: ' + value);
    this.options.swipeMaxSeconds = value;
  }

  /*
   * set setSwipeMinPx option
   * the minimum number of pixels for a swipe on touchscreen
   * used with data-swipe-min-percent. if data-swipe-min-px check fails, 
   *  swipe will still work if the data-swipe-min-percent check succeeds
   * value must be between 1 and 3000
   * default = 60
   */
  setSwipeMinPx(value) {
    value = this.returnInt(value, 1, 3000);
    if (typeof value !== 'number') {
      return;
    }

    this.consoleLogInfo('set setSwipeMinPx: ' + value);
    this.options.swipeMinPx = value;
  }

  /*
   * set swipeMinPercent option
   * the minimum percent of horizontal pixels for a swipe on touchscreen
   * the percentage of the swipe compared to the full slider width
   * makes it easier to recognize swipes on smaller screens
   * used with data-swipe-min-px. if data-swipe-min-px check is successful, 
   * 	data-swipe-min-percent is not checked
   * value must be between 1 and 100
   * default = 13
   */
  setSwipeMinPercent(value) {
    value = this.returnInt(value, 1, 100);
    if (typeof value !== 'number') {
      return;
    }

    this.consoleLogInfo('set swipeMinPercent: ' + value);
    this.options.swipeMinPercent = value;
  }

  /*****************************************************************************
    * end SET OPTIONS
    ****************************************************************************/

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
          val = this.getJqElemVal(clickElem, 'data-caption');
          if (val) {
            caption = val;
          }
        }

        if (!caption) {
          val = this.getJqElemVal(linkContainer.find('.caption'), 'text');
          if (val) {
            caption = val;
          }
        }
        if (!caption) {
          val = this.getJqElemVal(linkContainer.find('figcaption'), 'text');
          if (val) {
            caption = val;
          }
        }
        if (!caption) {
          val = this.getJqElemVal(linkContainer.find('span'), 'text');
          if (val) {
            caption = val;
          }
        }

        let imgElem = clickElem.find('img');
        if (imgElem) {
          if (!caption) {
            val = this.getJqElemVal(imgElem, 'alt');
            if (val) {
              caption = val;
            }
          }
          if (!caption) {
            val = this.getJqElemVal(imgElem, 'title');
            if (val) {
              caption = val;
            }
          }
        }

        // bind images in the gallery
        this.galleryImages.push({ url: href, caption: caption });
        console.log(this.galleryImages);
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

    this.elems.image.on('click', { igvThis: this }, function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.data.igvThis.nextClicked();
    });

    let jsImgElem = this.elems.image[ 0 ];
    jsImgElem.params = { igvThis: this };
    jsImgElem.addEventListener("touchstart", function (event) {
      event.preventDefault();
      this.params.igvThis.slideSwipeStartEvent(event);
    });
    jsImgElem.addEventListener("touchend", function (event) {
      event.preventDefault();
      this.params.igvThis.slideSwipeEndEvent(event);
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

    img.src = this.galleryImages[this.currentImageKey].url;
    if (img.complete) {
      this.imageLoaded(img);
    } else {
      this.imageLoadingStart();
      img.rgvThis = this;

      console.log('start load');
      img.onload = function (e) {
        console.log(e);
        console.log(this);
        globalVariable = this;
        setTimeout(function () {
          console.log(globalVariable);
          globalVariable.rgvThis.imageLoaded(globalVariable);
          globalVariable.rgvThis.imageLoadingDone();
        }, 4000);
        //this.rgvThis.imageLoaded(this);
        //this.rgvThis.imageLoadingDone();
      };

    }
  }

  imageLoaded(loadedImage) {
    this.curImgWidth = loadedImage.width;
    this.curImgHeight = loadedImage.height;
    this.positionImage();
    this.elems.image.attr('src', loadedImage.src);
    this.displayCaption();
  };

  displayCaption() {
    if (this.galleryImages[this.currentImageKey].caption) {
      this.elems.caption.html(this.galleryImages[this.currentImageKey].caption);
      this.elems.captionCon.addClass('is-displayed');
    } else {
      this.elems.captionCon.removeClass('is-displayed');
    }
  }

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

    html = '<div id="riot-gallery-viewer-caption-con"><div id="riot-gallery-viewer-caption"></div</div>';
    this.elems.body.append(html);

    this.elems.bg = $('#riot-gallery-viewer-bg');
    this.elems.prevCon = $('#riot-gallery-viewer-prev-con');
    this.elems.nextCon = $('#riot-gallery-viewer-next-con');
    this.elems.imageCon = $('#riot-gallery-viewer-image-con');
    this.elems.image = this.elems.imageCon.find('img');
    this.elems.closeCon = $('#riot-gallery-viewer-close-con');
    this.elems.loading = $('#riot-gallery-viewer-loading');
    this.elems.captionCon = $('#riot-gallery-viewer-caption-con');
    this.elems.caption = $('#riot-gallery-viewer-caption');

    this.bindViewer();

    this.setWindowSize();

    this.isHtmlLoaded = true;
  }

  positionImage() {
    let multiplier = 1;

    let width = this.curImgWidth;
    let height = this.curImgHeight;

    const maxWidth = this.windowWidth - 40;
    const maxHeight = this.windowHeight - 24;

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

    this.elems.body.addClass('riot-gallery-viewer-is-loading');

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
      margin: vMargin + 'px ' + hMargin + 'px'
    });
  }

  imageLoadingDone() {
    this.elems.body.removeClass('riot-gallery-viewer-is-loading');
  }

  /*
  * Touchscreen swipe started
  * save time in milliseconds and the X and Y position
  */
  slideSwipeStartEvent(event) {

    const temp = this.getSwipeXYFromEvent(event);
    const x = temp[0];
    //const y = temp[1];

    if (!x) {
      this.swipeInfoReset();
      this.consoleLogInfo('slideSwipeStartEvent - no position found, stop swipe action;');
      return;
    }

    const d = new Date();

    this.swipeInfo.startX = x;
    //this.swipeInfo.startY = y;
    this.swipeInfo.startTime = d.getTime();

    this.consoleLogInfo('slideSwipeStartEvent - position = ' + x);
  }

  /*
  * Touchscreen swipe ended
  * make sure the time and position is valid
  * go to the next or previous slide
  */
  slideSwipeEndEvent(event) {

    if (!this.swipeInfo.startX || !this.swipeInfo.startTime) {
      this.swipeInfoReset();
      this.consoleLogInfo('slideSwipeEndEvent - end swipe with no start swipe, stop swipe action');
      return;
    }

    const d = new Date();
    const timeDif = d.getTime() - this.swipeInfo.startTime;

    if (timeDif > this.options.swipeMaxSeconds * 1000) {
      this.swipeInfoReset();
      // too much time passed bewteen start and end. either event missed or very slow slide.
      this.consoleLogInfo('slideSwipeEndEvent - slide time too long, stop swipe action, max seconds = '
        + this.options.swipeMaxSeconds + ', seconds taken = ' + (timeDif / 1000));
      return;
    }

    const temp = this.getSwipeXYFromEvent(event);
    const x = temp[0];
    //const y = temp[1];

    if (!x) {
      this.swipeInfoReset();
      this.consoleLogInfo('slideSwipeEndEvent - no position found, stop swipe action');
      return;
    }

    const xDif = Math.abs(x - this.swipeInfo.startX);
    //const yDif = Math.abs(y - this.swipeInfo.startY);

    this.consoleLogInfo('slideSwipeEndEvent - x=' + xDif + 'px, time=' + timeDif + 'MS');


    if (xDif < this.options.swipeMinPx) {
      this.consoleLogInfo('slideSwipeEndEvent - xDif=' + xDif + ', < ' + this.options.swipeMinPx + ', check percednt');

      const windowWidth = this.elems.main.width();
      const widthPercent = xDif / windowWidth * 100;

      if (widthPercent < this.options.swipeMinPercent) {
        this.swipeInfoReset();
        this.consoleLogInfo('slideSwipeEndEvent - xDif=' + xDif + ', windowWidth=' + windowWidth +
          ', percent=' + (Math.round(widthPercent * 100) / 100) + '%, < 20%, stop swipe action');
        return;
      }
    }

    if (x > this.swipeInfo.startX) {
      this.consoleLogInfo('slideSwipeEndEvent - previous');
      this.nextClicked();
    } else {
      this.consoleLogInfo('slideSwipeEndEvent - next');
      this.prevClicked();
    }
  }

  swipeInfoReset() {
    this.swipeInfo.startX = null;
    //this.swipeInfo.startY = null;
    this.swipeInfo.startTime = null;
  }

  getSwipeXYFromEvent(event) {
    if (event.TouchList) {
      if (event.TouchList[0]) {
        if (event.TouchList[0].screenX && event.TouchList[0].screenY) {
          return [event.TouchList[0].pageX, vent.TouchList[0].pageY];
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

    return [null, null];
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
