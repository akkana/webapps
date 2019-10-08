#!/usr/bin/env python3

from __future__ import print_function

import json

import shutil

import sys, os

# form = cgi.FieldStorage()

content_len = int(os.environ["CONTENT_LENGTH"])
req_body = sys.stdin.read(content_len)
req_dict = json.loads(req_body)

print("""Content-type: text/plain
Content-Disposition: inline; filename=delfeeds-out.txt
""")

if 'deleteDirs' not in req_dict:
    print("ERR No deleteDirs", file=sys.stderr)
    print("ERR No deleteDirs")
    sys.exit(0)

if 'feedDir' not in req_dict:
    print("ERR No feedDir", file=sys.stderr)
    print("ERR No feedDir")
    sys.exit(0)

perm_errs = []

feed_dir = req_dict['feedDir']
delete_dirs = req_dict['deleteDirs']
doc_root = os.environ['DOCUMENT_ROOT']
print("DOCUMENT_ROOT:", doc_root, file=sys.stderr)
for d in delete_dirs:
    fullpath = doc_root + feed_dir + d
    print("Removing", fullpath, file=sys.stderr)
    try:
        shutil.rmtree(fullpath)
    except:
        perm_errs.append(d)

if perm_errs:
    print("ERR Couldn't remove", ','.join(perm_errs))
    sys.exit(0)

print("OK")
