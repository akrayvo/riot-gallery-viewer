<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Riot Gallery Viewer - PHP code</title>
    <link rel="stylesheet" href="./example-pages-styles.css">
    <link rel="stylesheet" href="../riot-gallery-viewer.min.css?x=<?php echo time(); ?>">
</head>

<body>
    <div id="page-content">
        <h1>Riot Gallery Viewer - PHP code</h1>
        <div><a href="./">back to examples</a></div><br>

        <?php

        // Note: to display this page in a browser, it must be loaded on a server or machine that runs PHP.

        // image file information
        $mainImageUrlPath = './images/';
        $thumbImageUrlPath = './images/';
        $mainImageAppend = '.jpg';
        $thumbImageAppend = '_thumb.jpg';

        $images = array(
            'blue-jay',
            'cat',
            'dog-at-lake',
            'king-tut',
            'lake',
            'mountains',
            'party-lights',
            'pennsylvania-landscape',
            'port-au-prince-haiti',
            'squirrel',
            'waterfall'
        );

        ?>
        <ul class="riot-gallery riot-gallery-style">
            <?php
            foreach ($images as $image) {
                // the caption is the file name; captions could be skipped or added programmatically (another array, 2 dimensional array, etc)
                $caption = ucwords(htmlentities(str_replace(['_', '-'], ' ', $image)));

                echo '<li>' .
                    '<a href="' . htmlentities($mainImageUrlPath . $image . $mainImageAppend) . '" target="blank">' .
                    '<img src="' . htmlentities($thumbImageUrlPath . $image . $mainImageAppend) . '">' .
                    '</a>' .
                    '<div class="riot-gallery-caption">' . htmlentities($caption) . '</div>' .
                    '</li>' . "\n";
            } ?>
        </ul>

        <script src="../riot-gallery-viewer.js?x=<?php echo time(); ?>"></script>
    </div>
</body>

</html>