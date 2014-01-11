#!/bin/bash

# Setup and start Sauce Connect for your TravisCI build
# This script requires your .travis.yml to include the following two private env variables:
# SAUCE_USERNAME
# SAUCE_ACCESS_KEY
# Follow the steps at https://saucelabs.com/opensource/travis to set that up.
#
# Curl and run this script as part of your .travis.yml before_script section:
# before_script:
#   - curl https://gist.github.com/santiycr/5139565/raw/sauce_connect_setup.sh | bash
#
# Script adapted to log to a file

CONNECT_URL="http://saucelabs.com/downloads/Sauce-Connect-latest.zip"
CONNECT_DIR="/tmp/sauce-connect-$RANDOM"
CONNECT_LOG="/tmp/sauce-log-$RANDOM"
CONNECT_DOWNLOAD="Sauce_Connect.zip"
READY_FILE="connect-ready-$RANDOM"
READY_COUNTDOWN=120

# Get Connect and start it
mkdir -p $CONNECT_DIR
cd $CONNECT_DIR
curl $CONNECT_URL > $CONNECT_DOWNLOAD
unzip $CONNECT_DOWNLOAD
rm $CONNECT_DOWNLOAD
java -jar Sauce-Connect.jar --readyfile $READY_FILE \
    --tunnel-identifier $TRAVIS_JOB_NUMBER \
    $SAUCE_USERNAME $SAUCE_ACCESS_KEY >$CONNECT_LOG &

# Wait for Connect to be ready before exiting
while [ ! -f $READY_FILE ]; do
  READY_COUNTDOWN=$(($READY_COUNTDOWN-1))
  if [ $READY_COUNTDOWN -lt 0 ]; then
  	echo "Timeout while waiting for sauce-connect to be ready"
  	cat $CONNECT_LOG
  	exit 1
  fi

  sleep .5
done
