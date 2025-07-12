#!/bin/bash
mocp --exit
if [ -f /root/.moc/pid ]; then
  rm /root/.moc/pid
fi
mocp --server
exit 0

