#!/bin/bash
set -e
set -u
if test -z $1
then
  exit 2
fi
if [ $# -eq 1 ]
then
  mocp $1
else
  mocp $1 $2
fi
exit 0

