<?php

/********************************************************************************************
 * page to test and develop the gallery viewer.
 * created in php to easily make changes dynamically
 ********************************************************************************************/

$images = array(
  'blue-jay',
  'lake-7301021_640',
  'lake-8257272_1280',
  'mountains-8451480_640',
  'party-lights-5232873_1280',
  'pennsylvania-landscape',
  'pet-8274536_640',
  'port-au-prince-haiti',
  'squirrel',
  'tutankhamun-1038544_1280',
  'waterfall-8445292_1280'
);

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Riot Gallery Viewer - Test</title>
    <link rel="stylesheet" href="./../example-pages.css?x=<?php echo time(); ?>">
    <link rel="stylesheet" href="./../../riot-gallery-viewer.css?x=<?php echo time(); ?>">
</head>

<body>
    <div id="page-content">
        <h1>Riot Gallery Viewer - Test</h1>

        <?php /*<h2>riot-gallery-1 - div - sent an array of images with no caption</h2>
        <ul class="riot-gallery riot-gallery-default">
            <?php
            foreach ($images as $image) {
                $caption = ucwords(str_replace('-', ' ', $image));
                echo '<li><figure><img src="./../images/'.$image.'_thumb.jpg"><figcaption>'.$caption.'</figcaption></li>';
            }
            ?>
        </ul>*/ ?>

        <h2>riot-gallery-1 - ul - sent an array of images strings (not objects)</h2>
        <ul id="riot-gallery-1" class="riot-gallery-dark"></ul>

        <br><br>

        <h2>riot-gallery-1b - div - sent an array of images strings (not objects)</h2>
        <div id="riot-gallery-1b"></div>

        <br><br>        

        <h2>riot-gallery-2 - table - sent an array of images with captions</h2>
        <table id="riot-gallery-2"></table>

        <br><br>
<?php /*
        <h2>riot-gallery-3 - ul - sent an array of images with thumbnails and captions</h2>
        <div id="riot-gallery-3"></div>

        <br><br>

        <h2>riot-gallery-4 - ol - sent an array of images with thumbnails and captions</h2>
        <ul id="riot-gallery-4"></ul>

        <br><br>

        <h2>riot-gallery-5 - dl - sent an array of images with thumbnails and captions</h2>
        <dl id="riot-gallery-5"></dl>

        <br><br>

        <h2>riot-gallery-6 - match text in the page - sent an array of images with thumbnails and captions</h2>
        [riot-gallery-6]
*/ ?>
    </div>
    <?php /*<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>*/ ?>
    <script src="./../../riot-gallery-viewer.js?x=<?php echo time(); ?>"></script>
    <script>
    let images;
    // class
    let options = {};

    images = [];
    <?php
        foreach ($images as $image) {
            echo 'images.push("./../images/'.htmlentities($image).'.jpg");'."\n";
        } ?>
    console.log(images);
    //RiotGalleryViewer.addGallery('riot-gallery-1', images);
    RiotGalleryViewer.addGallery('riot-gallery-1b', images);

    images = [];
    <?php
        foreach ($images as $image) {
            $caption = ucwords(str_replace('-', ' ', $image));
            echo 'images.push(["./../images/'.htmlentities($image).'.jpg", "", "'.htmlentities($caption).'"]);'."\n";
        } ?>
    console.log(images);
    RiotGalleryViewer.addGallery('riot-gallery-2', images);

    images = [];
    <?php
        foreach ($images as $image) {
            $caption = ucwords(str_replace('-', ' ', $image));
            echo 'images.push(["./../images/'.htmlentities($image).'.jpg", "./../images/'.htmlentities($image).'_thumb.jpg", "'.htmlentities($image).'"]);'."\n";
        } ?>
    console.log(images);
    //RiotGalleryViewer.addGallery('riot-gallery-3', images);

    //RiotGalleryViewer.addGallery('riot-gallery-4', images);

    //RiotGalleryViewer.addGallery('riot-gallery-5', images);

    //RiotGalleryViewer.addGallery('riot-gallery-6', images);
    </script>
</body>

</html>