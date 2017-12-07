#!/bin/bash

tar cvzf build.tar.gz node_modules index.js portfolio
aws s3 cp build.tar.gz s3://johnny-stocker/build.tar.gz
sam deploy --template-file packaged-template.yaml --stack-name Stock --capabilities CAPABILITY_IAM
