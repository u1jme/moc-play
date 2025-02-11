#!/bin/bash
set -e
set -u
if test -z $1
then
  exit 2
fi
mocp $1
exit 0

