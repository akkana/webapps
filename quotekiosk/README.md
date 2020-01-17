# quotekiosk.html

This is a kiosk for displaying a mixture of HTML quotations and images.

Define quotes and images in a separate file named quotes.js, like this:

```
var quotelist = [
    "<b>Lorem ipsum dolor sit amet</b>, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "images/img001.jpg",
    "images/img002.jpg",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
];
```

Each quote (HTML) will be displayed in a font that lets it fill the whole
screen. Each image will be rescaled to fit the screen size.
Don't mix images and HTML text; the resizing won't work properly.

There are two versions:
- quotekiosk.html has nice fade animations when switching
- quotekiosk-nofade.html lacks the fade animations, for use on slow
  computers   such as a Raspberry Pi that lack CPU power for the fades.

The list of quotations and image filenames is embedded in the
HTML file, as is most of the Javascript.

The time between new images is controlled by the DELAY constant
defined near the beginning of the file.

Run the kiosk in whatever browser you prefer, in fullscreen mode.
Most major browsers use F11 to toggle fullscreen mode.
For my kiosk, I use gpreso (on Raspberry Pi) or qpreso (any other
Linux machine) from my github scripts repository because they're
lighter weight than a full browser.

