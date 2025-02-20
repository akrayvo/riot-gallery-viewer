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
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Riot Gallery Viewer - Test</title>
    <link rel="stylesheet" href="./../example-pages-styles.css?x=<?php echo time(); ?>">
    <link rel="stylesheet" href="./../../riot-gallery-viewer.css?x=<?php echo time(); ?>">
</head>

<body>
    <div id="page-content">
        <h1>Riot Gallery Viewer - Test</h1>

        <ul id="gal1"></ul>

        <hr>

        <ul id="gal2"></ul>
        <hr>
        <ul id="gal3" class="riot-gallery-style-dark"></ul>
        <hr>


        <ul class="riot-gallery riot-gallery-style riot-gallery-style-dark">
            <?php
            foreach ($images as $image) {
                echo '<li>' .
                    '<a href="../images/' . htmlentities($image) . '.jpg" target="blank">' .
                    '<img src="../images/' . htmlentities($image) . '_thumb.jpg">' .
                    '</a>' .
                    '<div class="riot-gallery-image-caption">' . ucwords(htmlentities(str_replace(['_', '-'], ' ', $image))) . '</div>' .
                    '</li>' . "\n";
            }
            foreach ($images as $image) {
                echo '<li>' .
                    '<a href="../images/z' . htmlentities($image) . '.jpg" target="blank">' .
                    '<img src="../images/' . htmlentities($image) . '_thumb.jpg">' .
                    '</a>' .
                    '            <div class="riot-gallery-image-caption">this image will no load dude.</div>' .
                    '</li>' . "\n";
                break;
            } ?>
            <li data-riot-gallery-image-url="https://www.streetmachine.com.au/wp-content/uploads/2023/07/greg-eslick-hq-monaro-bonnet-up-wm-2048x1365.jpg?x=<?php echo time(); ?>">
                <a href="#">test</a>
            </li>
        </ul>

        <script src="../../riot-gallery-viewer.js?x=<?php echo time(); ?>"></script>
        <script>
            RiotGalleryViewer.setOption('doConsoleLog', true);
            RiotGalleryViewer.setOption('doConsoleTrace', true);

            RiotGalleryViewer.addImage('gal1', '../images/blue-jay.jpg', '../images/blue-jay_thumb.jpg', 'Blue Jay');
            RiotGalleryViewer.addImage('gal1', '../images/lake-7301021_640.jpg', '../images/lake-7301021_640_thumb.jpg', 'LaKe 7301021');
            RiotGalleryViewer.addImage('gal1', '../images/lake-8257272_1280.jpg', '../images/lake-8257272_1280_thumb.jpg', 'LaKe 8257272');

            RiotGalleryViewer.addImage('gal2', '../images/mountains-8451480_640.jpg', '../images/mountains-8451480_640_thumb.jpg', 'Mountains');
            RiotGalleryViewer.addImage('gal2', '../images/squirrel.jpg', '../images/squirrel_thumb.jpg', 'Squirrel');

            RiotGalleryViewer.addImagesByFile('gal3', './images-quotes.txt?x=<?php echo time(); ?>');
            console.log(RiotGalleryViewer.galleries);
            
        </script>

</body>

</html>