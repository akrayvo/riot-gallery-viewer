# riot-gallery-viewer

[View on Github »](https://github.com/akrayvo/riot-gallery-viewer)

A simple, easy-to-implement, flexible image viewer. It displays a modal window with the full-sized image, an optional label, and previous/next buttons. It can also optionally create the HTML for the image gallery.

## Working example

!!!!!!!!!!! FILL THIS OUT LATER


## Requirements

- none (only uses JavaScript, CSS, and HTML; will work on any modern browser)

## Gallery Components and Functionality
A gallery is set up within an HTML tag container. Items are inside the container. Each item can include a full-sized image URL, a clickable element (usually an image thumbnail), and a caption (optional). When an item is clicked/selected in the gallery, the viewer opens with the full-sized image and caption (if set). The viewer also includes a close button, a previous image button, and a next image button.

## Installation

Add **riot-gallery-viewer.min.css** and **riot-gallery-viewer.min.js** files to your project.

## Basic Example (HTML)
An HTML image gallery with a class on that container.

-include the css file, **riot-gallery-viewer.min.css**.
```
<link rel="stylesheet" href="./riot-gallery-viewer.min.css" />
```

- in HTML, add an unordered list (ul) with a class of **riot-gallery**
- add list items (li). Each should contain an image. The easiest way to add captions is to either add
a **title** attribute to the image or add text to a container with a class of **riot-gallery-caption**
 either add your own styles or add the **riot-gallery-style** class to use the default riot gallery gallery styles
```
<ul class="riot-gallery riot-gallery-style">
    <li><img src="./images/blue-jay.jpg" alt="Blue Jay"></li>
    <li><img src="./images/squirrel.jpg"><div class="riot-gallery-caption">squirrel</div></li>
    <li><img src="./images/port-au-prince-haiti.jpg" /></li>
    <li><img src="./images/pennsylvania-landscape.jpg" /></li>
</ul>
```

- include the js file, **riot-gallery-viewer.min.js**.
```
<script src="./riot-gallery-viewer.min.js"></script>
```

## Basic Example (JavaScript)
An HTML empty image gallery with images added in javascript to populate it.

- include the css file, **riot-gallery-viewer.min.css**.
```
<link rel="stylesheet" href="./riot-gallery-viewer.min.css" />
```

- in HTML, add an empty unordered list (ul) with a unique id
```
<ul id="gallery-1"></ul>
```

- include the js file, **riot-gallery-viewer.min.js**
```
<script src="./riot-gallery-viewer.min.js"></script>
```

- use the addImage function to add add images to your gallery.
- parameter 1 is the id of the gallery container
- parameter 2 is the URL of the full size image (loads in viewer)
- parameter 3 is the URL of the thumbnail image (loads in the gallery)
- parameter 43 is the caption (option)
```
<script>
RiotGalleryViewer.addImage('gallery-1', './images/cat.jpg', './images/cat_thumb.jpg', 'White Cat');
RiotGalleryViewer.addImage('gallery-1', './images/king-tut.jpg', './images/king-tut_thumb.jpg', 'King Tut');
RiotGalleryViewer.addImage('gallery-1', './images/dog-at-lake.jpg', './images/dog-at-lake_thumb.jpg');
</script>
```

## Customizations

The gallery viewer is very customizable. use the **setOption** function to customize the functionality. The function parameters are option name and option value. for example:
```
RiotGalleryViewer.setOption("transitionType", "fade");
RiotGalleryViewer.setOption("transitionSeconds", 1.1);
RiotGalleryViewer.setOption("useMaterialIcons", false);
```

# doConsoleLog
- write information to the console log and error log. needed for troubleshooting/testing/development only
- used for troubleshooting/testing/development only.
- boolean (true or false)
- default value: **false**

# doConsoleTrace
- write a code trace on every console and error log. needed for troubleshooting/testing/development
- used for troubleshooting/testing/development only.
- rarely needed, but can help with troubleshooting.
- boolean (true or false)
- default value: **false**

# preloadImagesType
- if and when images should be preloaded
- valid values are = **none**, **prevnext**, **galleryload**, and **pageload**
- **none** = do not preload images. images are only loaded when they are clicked.
- **prevnext** = when an image is viewed, the previous and next images are preloaded.
- **galleryload** = when any image in a gallery is viewed, every other image in the gallery is preloaded.
- **pageload** = when the HTML page is loaded, all images in all galleries are preloaded.
- preloading will make viewing images faster, but could result in images loading that are never viewed. for galleries with many images or large image sizes, it is not recommended to use galleryload or pageload.
- default value: **prevnext**

# useMaterialIcons
- should material icons be loaded?
- boolean (true or false)
- if set, the close, previous, and next buttons will look nicer. if not, the page will load slightly faster
- default value: **true**

# transitionType
- effect when transitioning from one image to another
- valid values are = **none**, **slide**, **fade**, **slidefade**, and **size**
- **none** = load image immediately with no transition effect.
- **slide** = horizontally slide the new image in and the old image out. the direction depends on if the next or previous image is loaded.
- **fade** = fade out the old image and fade in the new image
- **slidefade** = do both the slide and fade transitions
- **size** = move from the old image's size/dimensions to the new image's size/dimensions. will not appear to do anything if images are the same sizes.
- default value: **slide**

# transitionSeconds
- the number of seconds to transition from one image to another. 
- must be between 0.1 and 5
- default value: **0.7**

# transitionFrameSeconds
- the number of seconds between animation updates.
- less time (more frames/updates) will require more processing. more time (time frames/updates) will result in smoother animation.
- must be between 0.02 and 0.25
- default value: **0.04**

# imageFailedCaptionHtml
- text to display in the caption if an image does not load
- can include HTML
- set to empty string or NULL to show no message
- default value: "**<i>Could Not Load Image</i>**"

# defaultImgSize
- default image size in pixels. 
- will be used while an image is loading (spinner) and or fails loading (red background)
- must be between 200 and 1000
- default value: **300**

# doTouchSwipe
- allow users on touch screens (phones, tables) to swipe to the previous or next image.
- in order to avoid false swipes, swipeMinPixels, swipeMinPercent, and swipeMaxSeconds are set and can be customized.
- boolean (true or false)
- default image size. will be used while an image is loading (spinner) and or fails loading (red background)

# swipeMinPixels
- if doTouchSwipe is true, this determines the minimum number of pixels to swipe to change the image
- if a swipe distance is too short, the user most most likely not trying to change images
- must be between 0 and 1000
- default value: **200**

# swipeMinPercent
- if doTouchSwipe is true, this determines the percentage of the screen to swipe to change the image
- if a swipe distance is too short, the user most most likely not trying to change images
- both pixels and percent are both used to accommodate screen sizes (large screens can have swipes with more pixels, but less screen width percent. small screens can have swipes with fewer pixels, but more screen width percent). if both values are set (non zero), the next image will load as long as either value is reached, not both values.
- must be between 0 and 90
- default value: **50**

# swipeMaxSeconds
- if doTouchSwipe is true, this determines the minimum number of seconds to swipe to change the image
- if a swipe is too long, the user most most likely not trying to change images
- must be between 0 and 2
- default value: **0.8**

## HTML setup
The program is very flexible in how to set items in the gallery. For instance, setting up the images in an html table, list, or div.

# Gallery Containers
The gallery container can be any HTML container element. Just add the **riot-gallery** class. A web page can have multiple gallery containers.

# Item Containers
Items (images) containers can be any HTML container element. 
- If an element in the container has the **riot-gallery-item** class, all elements in the gallery container with this calls will be item containers.
- If no element with the **riot-gallery-item** is in the gallery container, the following rules are used to find items:
    - If the container element is a list (**ul** or **ol**), the item containers are list item (**li**)
    elements.
    - If the container element is a table (**table**), the item containers are table cell (**td**)
    elements.
    - If the container element is anything else (not **ul**, **ol**, or **table**), the item containers are figure (**figure**) elements.
    - if no item containers are found in a gallery container, the gallery is not set up.

# Item Image URL (Full Size)
Generally, the best way to set the image URL is to include a link (**a**) tag with the image URL in the **src** attribute, but there are rare instances where another method will be better. If an image is not found, the gallery items is not set up. The following methods (in order) are used to find an image inside an item container:

the data attribute, **data-riot-gallery-image-url**, on the item container or any children
```
<li data-riot-gallery-image-url="./image.jpg"><img src="./thumb.jpg"></li>
```
```
<li><img src="./thumb.jpg" data-riot-gallery-image-url="./image.jpg"></li>
```

href from a link (**a**) tag with a class of **riot-gallery-image-link**
```
<li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
```

src from an image (**img**) tag with a class of **riot-gallery-image-thumb**
```
<li><a href="./image.jpg" class="image-link"><img src="./thumb.jpg"></a></li>
```

href from a link (**a**) tag
```
<li><a href="./image.jpg"><img src="./thumb.jpg"></a></li>
```

src from an image (**img**) tag
```
<li><img src="./image.jpg"></li>
```

## Item Clickable Element
The element that is clicked to load the full sized image in the viewer. 
Generally, the best way to set the image URL is to include a link (**a**) tag around the thumbnail image, but  but there are rare instances where another method will be better. If no other element is found, the item container itself will be clickable, so there will always be a clickable element. The following methods (in order) are used to find a clickable element inside an item container:

any tag with a class of **riot-gallery-item-clickable**
```
<li><span class="riot-gallery-item-clickable"><a href="./image.jpg"><img src="./thumb.jpg"></a></li>
```

a link tag (**a**) with a class of **riot-gallery-image-link**
```
<li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
```

an image tag (**img**) with a class of **riot-gallery-image-thumb**
```
<li><a href="./image.jpg" class="riot-gallery-image-link"><img src="./thumb.jpg"></a></li>
```

an image tag (**img**) with a data attribute of **data-riot-gallery-image-url**
```
<li><img src="./thumb.jpg" data-riot-gallery-image-url="./image.jpg"></li>
```

a link tag (**a**)
```
<li><a href="./image.jpg"><img src="./thumb.jpg"></a></li>
```

an image tag (**img**)
```
<li><img src="./thumb.jpg"></li>
```

the item container itself

## Item Caption (optional)
Text related to the item image that will display with image. The best way to add a caption depends on if you want it do display and the tag type of the item container. The following methods (in order) are used to find a caption inside an item container:

the data attribute, **data-riot-gallery-caption**, on the item container or any children
```
<li data-riot-gallery-caption="My Pic"><img src="./image.jpg"></li>
```
```
<li><img src="./image.jpg" data-riot-gallery-caption="My Pic"></li>
```

text inside a tag with a class of **riot-gallery-caption**
```
<li><img src="./image.jpg"><div class="riot-gallery-caption">My Pic</div></li>
```

text inside a figure caption (**figcaption**)tag
```
<li><figure><img src="./image.jpg"><figcaption>My Pic</figcaption></figure></li>
```

**title** attribute of an image (**img**) tag with a class of **riot-gallery-image-thumb**
```
<li><img src="./image.jpg" class="riot-gallery-image-thumb" title="My Pic"></li>
```

**alt** attribute of an image (**img**) tag with a class of **riot-gallery-image-thumb**
```
<li><img src="./image.jpg" class="riot-gallery-image-thumb" alt="My Pic"></li>
```

**title** attribute of an image (**img**) tag
```
<li><img src="./image.jpg" title="My Pic"></li>
```

**alt** attribute of an image (**img**) tag
```
<li><img src="./image.jpg" alt="My Pic"></li>
```   


## Generate HTML gallery through JavaScript

An image gallery can be added by simply setting up a container element and adding images through JavaScript. Individual images can be added or images can be added by setting up a list of files

Simply create an empty container element in HTML with a unique ID.

```
<ul id="gallery-1"></ul>
```

# Adding images individually in JavaScript
the addImage function takes 4 parameters:
- container ID
- full sized image URL
- thumbnail image URL (optional, but recommended for efficiency)
- caption (optional)

```
<script>
RiotGalleryViewer.addImage('gallery-1', './images/cat.jpg', './images/cat_thumb.jpg', 'White Cat');
RiotGalleryViewer.addImage('gallery-1', './images/lake.jpg', './images/lake_thumb.jpg');
</script>
```

# Adding images in JavaScript by file list

the addImagesByFile function has 2 parameters:
- container ID
- URL of the text file
```
<script>
RiotGalleryViewer.addImagesByFile('gallery-1', './image-list.txt');
</script>
```
The file name and extension do not matter.

The format of the file is very flexible. Each line of the file is a separate image. Image information in each line can be contained in **double quotes**, separated by **tabs**, or both. Each line is processed individually; formatting can be different on each line. Each line can have 3 parameters, additional information will be ignored. blank lines are ignored. double quotes can be escaped with a backslash. ex: Dwayne \"The Rock\" Johnson
- full sized image URL
- thumbnail image URL (optional, but recommended for efficiency)
- caption (optional)
```
"./images/blue-jay.jpg" "./images/blue-jay_thumb.jpg" "Blue Jay"
"./images/cat.jpg" "./images/cat_thumb.jpg"
./images/party-lights.jpg	./images/party-lights_thumb.jpg	Party	\"Lights\"
"./images/pennsylvania-landscape.jpg"	"./images/pennsylvania-landscape_thumb.jpg"	"Landscape"
./images/port-au-prince-haiti.jpg	./images/port-au-prince-haiti_thumb.jpg
```


# Adding images in JavaScript from JSON file info

uses the same addImagesByFile function as adding images through a file list. has 2 parameters:
- container ID
- URL of the file
```
<script>
RiotGalleryViewer.addImagesByFile('gallery-1', './images.json');
</script>
```
The file name and extension do not matter. Note that the same function is used to process a formatted text list or a JSON file. The function checks the formats and processed it appropriately.

Image must be valid JSON that can be parsed by JavaScript's JSON.parse function. an array of images is required. each image can have the full image URL, the thumbnail image url, and the caption . each image can be either an object with **url**, **thumbURL**, can **caption** parameters or an array with values in that order (0=url, 1=thumbURL, 2=caption). these formats can both be used in the same file. thumbURL is optional but recommended and caption is optional.
```
[
{"url":"./images/blue-jay.jpg","thumbUrl":"./images/blue-jay_thumb.jpg","caption":"Blue Jay"},
{"url":"./images/cat.jpg","thumbUrl":"./images/cat.jpg"},
["./images/lake.jpg", "./images/lake_thumb.jpg", "Lake"],
["./images/waterfall.jpg","./images/waterfall_thumb.jpg"]
]
```
