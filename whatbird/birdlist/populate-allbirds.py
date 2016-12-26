#!/usr/bin/env python

# Read birdlist.json, which is a list of North American bird codes,
# names and scientific names; then find files in ../images and ../sounds
# with names that match a bird's name or code,
# and make a javascript-parseable JSON list of birds with associated
# image and sound files that looks like this:
# var pics = [
#   [ CODE : [ "file.jpg", "image" ],
# ];
# var sounds = [
#   [ CODE : [ "file.mp3", "sound" ],
# ];
# plus an allbirds that looks like this:
# var allbirds = {
#   "CODE" : { "name" : "the name", "sciname" : "the sciname" },
# };
# including only birds for which we have media.
# Both of these will be written to birdmedia.js.
#
# You can specify Xeno-Canto sound clips by creating a file sounds/xeno-canto
# containing lines like:
#   287516 American robin
#   287516 AMRO
#
# Specify a copyright message to use for an entire directory
# by creating a Copyright file inside that directory.
#
# Re-run this program (or edit allbirds.js by hand) when adding new media.

import os
import json
import shutil
from difflib import SequenceMatcher

with open("birdlist/birdlist.json") as fp:
    j = fp.read()
    birdlist = json.loads(j)

def add_file(root, f, bird, mediatype):
    global pics_and_sounds, birdsused
    print "Adding:", f, bird
    if "://" not in f:
        f = os.path.join(root, f)
    pics_and_sounds += '  [ "%s", "%s" ],\n' % (bird, f)
    birdsused.add(bird)

def find_media(mediadir, mediatype):
    for root, dirs, files in os.walk(mediadir):
        try:
            with open(os.path.join(root, "Copyright")) as fp:
                print "Found a copyright in", root
                copyrights[root] = fp.read().strip()
        except:
            print "No copyright in", root
            pass

        for f in files:
            name, ext = os.path.splitext(f)
            if not ext:
                 continue
            name = os.path.basename(name)
            name = name.replace('_', ' ')

            # Remove any numbers at the start or end of the filename,
            # since there might be more than one image per bird,
            # and audio files might have a CD sequence number.
            # There might also be things like dashes or underscores.
            while not name[0].isalpha():
                name = name[1:]
            while not name[-1].isalpha():
                name = name[:-1]

            # If the filename starts with four capital letters
            # followed by a non-alphabetic character,
            # it might be a bird code.
            if name[:4].isupper() and not name[4].isalpha():
                trycode = name[0:4]
                if trycode in birdlist:
                    # print "Exact code!", f
                    add_file(root, f, trycode, mediatype)
                    continue

            found = False

            b = match_bird(name)
            if b:
                add_file(root, f, b, mediatype)

def match_bird(name):
    '''Try to match name in birdlist.
       Try for an exact match of either name or code first,
       then try fuzzy matches.
       @return: birdlist key (the 4-letter code), or None.
    '''
    # Does it match a code?
    if name.upper() in birdlist:
        return name

    # Try for an exact common name match:
    for b in birdlist:
        if birdlist[b]["name"].lower() == name.lower():
            # print "Exact common name match"
            return b

    # No exact match. Try for a fuzzy match.
    best_ratio = -1
    best_match = None
    for b in birdlist:
        r = SequenceMatcher(None, birdlist[b]["name"].lower(),
                            name.lower()).ratio()
        if r > best_ratio:
            best_match = b
            best_ratio = r

    if best_ratio > .65:
        # print "Best ratio", best_ratio
        return best_match
    else:
        print "Poor match, %s vs %s is %f" % (birdlist[best_match]["name"],
                                              name, best_ratio)
        return None

def add_xeno_canto(whichdir, mediatype):
    '''Look for a file named xeno-canto.
       If it exists, expect lines inside it like:
         287516 American robin
         287516 AMRO
    '''
    f = "birdlist/xeno-canto"
    if not os.path.exists(f):
        return
    with open(f) as fp:
        for line in fp:
            line = line.strip()
            if not line:
                continue
            space = line.find(' ')
            if line < 0:
                continue
            clipid = line[:space]
            name = line[space+1:]
            b = match_bird(name)
            if b:
                add_file(None, 'http://www.xeno-canto.org/%s/embed' % clipid,
                         b, mediatype)

birdsused = set()
copyrights = {}

pics_and_sounds = "var pics = [\n"
find_media("images", "images")
pics_and_sounds += '];\n\n'

pics_and_sounds += "var sounds = [\n"
find_media("sounds", "sounds")
add_xeno_canto("sounds", "sounds");
pics_and_sounds += '];\n'

# Back up the file:
if os.path.exists("birdmedia.js"):
    shutil.copyfile("birdmedia.js", "birdmedia.js.bak")

# Now write the file
with open("birdmedia.js", "w") as fp:
    print >>fp, 'var allbirds = {'
    for code in birdsused:
        print >>fp, '  "%s" : { "name" : "%s", "sciname" : "%s" },'\
            % (code, birdlist[code]["name"],birdlist[code]["sciname"])
    print >>fp, '};'
    print >>fp, ''
    print >>fp, pics_and_sounds
    print >>fp, ''
    if copyrights:
        print >>fp, 'var copyrights = {'
        for key in copyrights:
            print >>fp, '  "%s" : "%s",' % (key, copyrights[key])
        print >>fp, '};'


