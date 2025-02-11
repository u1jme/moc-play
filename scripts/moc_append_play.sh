#!/bin/bash
set -e
set -u
if test -z "$1"
then
  exit 2
fi
mocp --clear
mocp --append "$1"
mocp --play
exit 0

