#!/bin/bash
set -e
set -u
if test -z $1
then
  exit 2
fi
if [ $# -eq 4 ]
then
  $1 $2 $3 $4
elif [ $# -eq 3 ]
then
  $1 $2 $3
elif [ $# -eq 2 ]
then
  $1 $2
elif [ $# -eq 1 ]
then
  $1
fi
exit 0

