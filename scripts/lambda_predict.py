#!/usr/bin/env python3
"""
AWS Lambda prediction script for Eye2Gene
"""

import argparse
import base64
import os
import json
import sys
import time
import yaml
import requests
from PIL import Image
#from io import BytesIO

# Args
parser = argparse.ArgumentParser()
parser.add_argument('image')
parser.add_argument('results_file')
parser.add_argument('--config', default='~/.eye2gene_lambda.conf', help='Config file location')
parser.add_argument('--url', help='AWS Lambda URL to contact')
parser.add_argument('--debug', action='store_true', help='Debug')
args = parser.parse_args()

if os.path.exists(args.config):
    with open(args.config, 'r') as stream:
        try:
            config = yaml.safe_load(stream)
        except yaml.YAMLError as ex:
            print(ex)

    url = config.get('url')
else:
    if args.debug:
        print('No config file found at "{}"'.format(args.config))
    url = args.url

if not url:
    print('No URL provided')
    sys.exit(1)

if os.path.exists(args.image):

    # Resize image if needed
    image = Image.open(args.image)
    if image.size != (256, 256):
        if args.debug:
            print('Resizing image from {} to 256,256'.format(image.size))
        image = image.resize((256, 256))
        image.save(args.image)

    # Convert to grayscale if needed
    if image.mode != 'L':
        if args.debug:
            print('Converting image to grayscale')
        image = image.convert('L')
        image.save(args.image)

    # Read in image
    with open(args.image, 'rb') as image_file:
        imstr = base64.b64encode(image_file.read())
    #imstr = base64.b64encode(imbuf.getvalue()).decode('ascii')

    # Create body
    data = {'image_data': imstr.decode('ascii')}

    # Send to lambda function
    start = time.time()
    resp = requests.post(url, json=data, timeout=60)
    end = time.time() - start

    if args.debug:
        # Print response
        print('Time taken: {:.2f} seconds'.format(end))
        print(json.dumps(resp.json(), indent=2))

    # Get response and format into expected result
    result_json = resp.json()
    results = [
        {
            'gene': 'ABCA4',
            'probability': result_json['data'][0],
            'info': ''
        },
        {
            'gene': 'USH2A',
            'probability': result_json['data'][1],
            'info': '',
        }
    ]

    if args.debug:
        print('Original JSON response: ', result_json)
        print('Formatted JSON response: ', results)

    # Write results to requested output file
    with open(args.results_file, 'w') as resultsf:
        resultsf.write(json.dumps(results))
