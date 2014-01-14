#!/bin/bash

TUNNEL_IDENTIFIER=$RANDOM

SAUCE_USERNAME="istjs"
SAUCE_ACCESS_KEY="51465978-455e-45f1-b5fa-4acdfc2b49e3"

CONNECT_URL="http://saucelabs.com/downloads/Sauce-Connect-latest.zip"
CONNECT_DIR="/tmp/sauce-connect"
CONNECT_LOG="/tmp/sauce-log"
CONNECT_DOWNLOAD="Sauce_Connect.zip"
READY_FILE="connect-ready-$TUNNEL_IDENTIFIER"
READY_COUNTDOWN=120

# Get Connect and start it
if [ ! -d $CONNECT_DIR ]; then
	mkdir -p $CONNECT_DIR
	cd $CONNECT_DIR
	curl $CONNECT_URL > $CONNECT_DOWNLOAD
	unzip $CONNECT_DOWNLOAD
	rm $CONNECT_DOWNLOAD
else
	cd $CONNECT_DIR
fi

java -jar Sauce-Connect.jar --readyfile $READY_FILE \
    --tunnel-identifier $TUNNEL_IDENTIFIER \
    $SAUCE_USERNAME $SAUCE_ACCESS_KEY >$CONNECT_LOG &

CONNECT_PID=$!

# Wait for Connect to be ready before exiting
echo "Waiting for sauce-connect to be ready..."
while [ ! -f $READY_FILE ]; do
  READY_COUNTDOWN=$(($READY_COUNTDOWN-1))
  if [ $READY_COUNTDOWN -lt 0 ]; then
  	echo "Timeout while waiting for sauce-connect to be ready"
  	kill $CONNECT_PID
  	cat $CONNECT_LOG
  	exit 1
  fi

  sleep .5
done
echo "Sauce-connect is ready"

DIR=$(dirname $0)

if [ $? -eq 0 ]; then
	echo "Done, you can run tests by running:"
	echo "   TUNNEL_ID=$TUNNEL_IDENTIFIER karma start $DIR/karma-sauce-conf.js <karma options>"
	echo "When finished, kill sauce-connect with:"
	echo "   kill $CONNECT_PID"
fi
