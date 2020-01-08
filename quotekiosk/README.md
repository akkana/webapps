# jsquotekiosk.html

This is a kiosk for displaying a mixture of HTML quotations and images.

Each quote will be displayed in a font that lets it fill the whole
screen. Each image will be rescaled to fit the screen size.

The list of quotations and image filenames is embedded in the
jsquotekiosk.html file, as is most of the Javascript.

It requires jquery, so you will need to download jquery-min.js and put
it in the same directory as jsquotekiosk.html.

The time between new images is controlled by the argument (milliseconds)
set near the end of the file: look for

```
    setTimeout(newquote, 30000);
```

Run the kiosk in whatever browser you prefer, in fullscreen mode.
Most major browsers use F11 to toggle fullscreen mode.
For my kiosk, I use gpreso (on Raspberry Pi) or qpreso (any other
Linux machine) from my github scripts repository because they're
lighter weight than a full browser.

