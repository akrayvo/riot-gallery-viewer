class RiotGallery {
  static jqueryUrl =
    'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
  static materialIconsUrl =
    'https://fonts.googleapis.com/icon?family=Material+Icons';

  static validThemes = ['default'];

  /*
   * initialize all class variables
   *     if the element ID is passed, the slider will be loaded.
   * if the element ID is NOT passed, the slider will not be loaded until the load()
   *     function is called. this will give a chance to set parameters.
   */
  constructor(elem) {
    this.isLoaded = false;
    this.isHtmlLoaded = false;
    this.isOpen = false;
    this.galleryImages = [];
    this.elems = {
      body: null,
      gallery: null,
      linkContainers: null,
      viewerBackground: null
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
   */
  setTheme(value) {
    value = this.returnString(value, true);
    if (typeof value !== 'string') {
      // return value will be set to null on error
      return;
    }
    if (RiotSlider.validThemes.indexOf(value) < 0) {
      this.consoleLogInfo('invalid value sent to setTheme: ' + value);
      return;
    }
    this.consoleLogInfo('set theme: ' + value);
    this.options.theme = value;
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
   * write information to the console if doConsoleLog is true
   */
  consoleLogInfo(info) {
    if (this.options.doConsoleLog) {
      console.log(info);
    }
  }

  /*
   * convert a variable to either true or false
   */
  returnBoolean(value) {

    if (typeof value === 'string') {
      // to lower case for string comparison, so "True" and "TRUE" will be "true"
      value = value.toLowerCase();

      if (value === 'true' || value === 'on' || value === 'yes' || value === '1') {
        return true;
      }
      if (value === 'false' || value === 'off' || value === 'no' || value === '0') {
        return false;
      }
    }

    if (value) {
      return true;
    }
    return false;
  }

  /*
   * convert a variable to an integer
   * note: bigint type will return null since we don't need to handles number that large
   * returns null on failure (not a number, invalid type, etc)
   */
  returnInt(value, min, max) {
    value = this.returnFloat(value, min, max);

    if (typeof value !== 'number') {
      return null;
    }
    
    return Math.round(value);
  }

  /*
   * convert a variable to an float (decimal)
   * note: bigint type will return null since we don't need to handles number that large
   * returns null on failure (not a number, invalid type, etc)
   */
  returnFloat(value, min, max) {
    const valueType = typeof value;

    if (valueType === 'string') {
      if (isNaN(value)) {
        return null;
      }
      value = parseFloat(value);
    } else if (valueType === 'number') {
      // the value is already a number, do nothing
    } else {
      // only a number or string can be passed
      return null;
    }

    if (value >= min && value <= max) {
      return value;
    }

    return null;
  }

  /*
   * convert a variable to a string
   * if doStringCleanup is set, trim and set lower case
   */
  returnString(value, doCleanup) {
    const valueType = typeof value;

    if (valueType === 'string') {
      // already a string
      const doCleanupType = typeof doCleanup;
      if (doCleanupType === 'boolean' || doCleanupType === 'number') {
        if (doCleanup) {
          value = value.trim().toLowerCase();
        }
      }
      return value;
    } else if (valueType === 'number') {
      return value.toString();
    }

    return null;
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

    this.elems.body =  $('body');
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
   * read settings/options from data attributes
   */
  loadOptions(elem) {
    let attrName = 'data-do-console-log';
    if (typeof elem.attr(attrName) !== 'undefined') {
      this.setDoConsoleLog(elem.attr(attrName));
    }

    attrName = 'data-use-material-icons';
    if (typeof elem.attr(attrName) !== 'undefined') {
      this.setUseMaterialIcons(elem.attr(attrName));
    }

    attrName = 'data-theme';
    if (typeof elem.attr(attrName) !== 'undefined') {
      this.setTheme(elem.attr(attrName));
    }

    attrName = 'data-swipe-max-seconds';
    if (typeof elem.attr(attrName) !== 'undefined') {
      this.setSwipeMaxSeconds(elem.attr(attrName));
    }

    attrName = 'data-swipe-min-px';
    if (typeof elem.attr(attrName) !== 'undefined') {
      this.setSwipeMinPx(elem.attr(attrName));
    }

    attrName = 'data-swipe-min-percent';
    if (typeof elem.attr(attrName) !== 'undefined') {
      this.setSwipeMinPercent(elem.attr(attrName));
    }

    // check that additional additional data fields are not set. they could be used by the page, so it is
    // not a definite error, but it is likely that an invalid or misspelled parameter was used
    // ex "data-show-buttons" instead of "data-do-show-buttons"
    // if possible issue is found, disply if console logging is turned on

    const validData = ['data-do-console-log', 'data-use-material-icons', 
      'data-swipe-max-seconds', 'data-swipe-min-px', 'data-swipe-min-percent'];

    const attributes = elem[0].attributes;
    for (const attribute in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, attribute)) {
        // do stuff
        const attr = attributes[attribute].name.toLowerCase();
        if (attr.substring(0, 5) === 'data-') {
          if (validData.indexOf(attr) < 0) {
            this.consoleLogInfo('Possible error - container data field not recognized - ' + attr);
          }
        }
      }
    }
  }

  /*
   * add new HTML elements, add classes to existing elements, and use selectors to save elements
   
  loadHtml(sliderElem) {
    let viewerBackgroundElem = $('.riot-gallery-background');
    let html = '';
    if (viewerBackgroundElem.length > 0) {
      // already loaded
    } else {
      // load now
      html = $('<div></div>')
        .addClass('riot-gallery-background');
    }
  }*/

  /*
   * changes the width of the slide when the browser/window is resized
   */
  updateWidth(isInitial) {
    if (typeof isInitial === 'undefined') {
      isInitial = false;
    }

    let width = this.elems.main.width()
    if (width === this.sliderWidth) {
      return;
    }

    // reset the with of the inner-slider element. this will resize each
    //    slide inside it
    this.sliderWidth = width;
    let sliderInnerWidth = this.sliderWidth * this.slideCount;
    this.elems.slidesInner.css('width', sliderInnerWidth + 'px');

    if (!isInitial) {
      // reposition the slider so that the slide display correctly
      // without this, the position will be wrong until the next slide loads
      this.goToSlide();
    }

    this.consoleLogInfo('Riot Slider width set to ' + sliderInnerWidth);
  }

  /*
   * remove the is-active class from a button after a pause.
   * used on the stop, previous, and next buttons
   */
  removeActiveClassIn1Sec(element) {
    setInterval(
      function (element) {
        element.removeClass('is-active')
      },
      1000,
      element
    );
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
   * Bind actions to buttons and window resize
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

        this.galleryImages.push({ url: href, caption: caption} );
        const key = this.galleryImages.length - 1;
        clickElem.on('click', { igvThis: this, key: key }, function (event) {
          event.preventDefault();
          event.stopPropagation();
          event.data.igvThis.loadImg(event.data.key);
        }); 
      }
    }
  }

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

    /*let spanElem = document.createElement('span');
    spanElem.className = 'material-icons';
    spanElem.style.display = 'none';
    document.body.append(spanElem, document.body.firstChild);*/

    this.isHtmlLoaded = true;
  }

  /*
   * Bind actions to buttons and window resize
   */
  loadImg() {
    if (!this.isOpen) {
      this.loadHtml();
      this.elems.body.addClass('riot-gallery-viewer-open');
      $('body').isOpen = true;
    }
  }

  /*
   * Bind actions to buttons and window resize
   */
  /*bindAll() {
    // browswer window resize
    $(window).on('resize', { rsThis: this }, function (event) {
      event.data.rsThis.updateWidth();
    });

    // vanilla javascript bind on swipe events
    for (const x = 0; x < this.elems.slides.length; x++) {
      this.elems.slides[x].params = { rsThis: this };
      this.elems.slides[x].addEventListener("touchstart", function (event) {
        //this
        //}
        event.preventDefault();
        this.params.rsThis.slideSwipeStartEvent(event);

      });
      this.elems.slides[x].addEventListener("touchend", function (event) {
        event.preventDefault();
        this.params.rsThis.slideSwipeEndEvent(event);
      });
    }
  }*/

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
        + this.options.swipeMaxSeconds + ', seconds taken = ' + (timeDif/1000));
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

    this.stopInterval()
    if (x > this.swipeInfo.startX) {
      this.consoleLogInfo('slideSwipeEndEvent - previous');
      this.incrementSlideNumber(-1);
    } else {
      this.consoleLogInfo('slideSwipeEndEvent - next');
      this.incrementSlideNumber();
    }
    this.goToSlide();
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
          console.log('pageX', event.TouchList[0].pageX, vent.TouchList[0].pageY);
          return [event.TouchList[0].pageX, vent.TouchList[0].pageY];
        }
      }
    }

    if (event.changedTouches) {
      if (event.changedTouches[0]) {
        if (event.changedTouches[0].screenX && event.changedTouches[0].screenX) {
          console.log('pageX', event.changedTouches[0].screenX, event.changedTouches[0].screenY);
          return [event.changedTouches[0].screenX, event.changedTouches[0].screenY];
        }
      }
    }

    return [null, null];
  }

  /*
   * display the current slide
   */
  goToSlide() {
    // change the left margin of the slider container so that that correct slide displays
    const val = (this.currentSlideNumber - 1) * this.sliderWidth;
    this.elems.slidesInner.css('margin-left', '-' + val + 'px');

    if (this.elems.slideLinkNumbers) {
      // remove the "is-active" class from all slide numbers
      this.elems.slideLinkNumbers.removeClass('is-active');

      // add the "is-active" class to the displaying slide number
      $(this.elems.slideLinkNumbers[this.currentSlideNumber - 1]).addClass(
        'is-active'
      );
    }

    this.consoleLogInfo('slide loaded: ' + this.currentSlideNumber);
  }

  /*
   * Increment the slide number
   * usually the optional value is no passed to set +1 (next slide)
   * -1 can be passed to go to the previous slide
   */
  incrementSlideNumber(increment) {
    // set default value if needed
    if (typeof increment === 'undefined') {
      increment = 1;
    }

    // change the current sli
    this.currentSlideNumber += increment;

    // check if before the first slide, go to the last slide
    // will happen when the "previous" button is clicked on the first slide
    if (this.currentSlideNumber < 1) {
      this.currentSlideNumber = this.slideCount;
    }

    // check if after the first slide, go to the first slide
    // will happen when on the last slide and trying to move to the next slide
    if (this.currentSlideNumber > this.slideCount) {
      this.currentSlideNumber = 1;
    }
  }


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

  /*****************************************************************************
   * BUTTON CLICK ACTIONS
   ****************************************************************************/
  /*
   * changes the width of the slide when the browser/window is resized
   */
  slideNumberClicked(buttonClicked) {
    this.stopInterval();
    this.currentSlideNumber = parseInt($(buttonClicked).html());
    this.goToSlide();
  }


  /*
   * the previous button was clicked. got to the next slide
   */
  prevClicked() {
    if (this.elems.prev) {
      this.elems.prev.addClass('is-active');
      this.removeActiveClassIn1Sec(this.elems.prev);
    }
    this.stopInterval();
    this.incrementSlideNumber(-1);
    this.goToSlide();
  }

  /*
   * the previous button was clicked. got to the previous slide
   */
  nextClicked() {
    if (this.elems.next) {
      this.elems.next.addClass('is-active');
      this.removeActiveClassIn1Sec(this.elems.next);
    }
    this.stopInterval();
    this.incrementSlideNumber();
    this.goToSlide();
  }
}

/*
 * check for jquery. load if needed. then load riot slider
 */

// This will check if jQuery has loaded. If not, it will add to <head>
window.onload = function () {
  if (!window.jQuery) {
    let head = document.getElementsByTagName('head')[0];
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = RiotGallery.jqueryUrl;
    head.appendChild(script);

    let waitForJQuery = setInterval(function () {
      if (window.jQuery) {
        clearInterval(waitForJQuery);
        riotGalleryInitAll();
      }
    }, 100);
  } else {
    riotGalleryInitAll();
  }
}

function riotGalleryInitAll() {
  $(document).ready(function () {
    $('.riot-gallery').each(function () {
      new RiotGallery($(this));
    })
  })
}
