#!/bin/bash
set -e
set -u
if test -z "$1"
then
  exit 2
fi
if test -z "$2"
then
  exit 2
fi
if [ "$2" = "is_files" ]; then
  find "$1" -maxdepth 1 -type f -printf '%f\n' | sort
elif [ "$2" = "is_dirs" ]; then
  find "$1" -maxdepth 1 -type d -printf '%f\n' | sort
else
  exit 3
fi

