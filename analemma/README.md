# Draw the analemma

## URL parameters:

- incremental: don't draw automatically, user must hit Enter for each new sun
- labels:      draw labels automatically, else user must hit z to see them
- bloopers:    draw in the wrong place for first DST sun, then X it out
               (to illustrate why you need to use standard time)
- nextPage:    page to jump to if user hits spacebar
- startDate:   date to start on, in some form JS Date can parse
- lat:         earth latitude of viewer, in decimal degrees
- hour:        hour to use, if not 12 noon (use 24-hour format)
- year:        start from Jan 1 of specified year (default: current year)
- bg:          URL of a background image to use, else will use black

## Example URLs:

- analemma/?bg=background.jpg&blooper&incremental
- analemma/?lat=60&hour=10

Uses equations from Meeus by way of
[suncalc.js](https://github.com/mourner/suncalc).

