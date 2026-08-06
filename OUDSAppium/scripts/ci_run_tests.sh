#!/bin/bash

# Export the github paths so we can find node in sub-shells
if [ -f "$GITHUB_PATH" ]; then
  export PATH="$(cat $GITHUB_PATH | tr '\n' ':')$PATH"
fi

mkdir -p Test_Results/HTML
mkdir -p Test_Results/Excel

function cleanup {
  if [ ! -f ".wdio-results.jsonl" ]; then
    echo "Tests didn't finish properly. Creating fallback report."
    node utils/generateFallbackReport.js || true
  fi
}
trap cleanup EXIT

set -e

echo "Installing APK to emulator..."
adb install -r "${APK_PATH}"

echo "Starting Appium server in background..."
appium --log-level warn > /tmp/appium.log 2>&1 &
APPIUM_PID=$!

echo "Waiting for Appium to start on port 4723..."
timeout=60
while ! curl -s http://127.0.0.1:4723/status > /dev/null; do
  sleep 2
  timeout=$((timeout - 2))
  if [ $timeout -le 0 ]; then
    echo "Appium failed to start in time!"
    cat /tmp/appium.log
    node utils/generateFallbackReport.js
    exit 1
  fi
done
echo "Appium is running!"

echo "Running WDIO Appium tests..."
export WDIO_CI_SPEC="./tests/12_e2e/mega_android_1100.test.js"
if ! node node_modules/@wdio/cli/bin/wdio.js run wdio.conf.js; then
  echo "WDIO tests encountered failures."
  exit 1
fi

echo "Tests finished!"
kill $APPIUM_PID || true
exit 0
