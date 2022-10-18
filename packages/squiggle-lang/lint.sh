#!/usr/bin/env bash

# Hat tip to @dfalling
# https://forum.rescript-lang.org/t/rescript-9-1-how-can-we-format-to-standard-out/1590/2?u=quinn-dougherty

errors=false

files=`ls src/rescript/**/**/*.res src/rescript/**/*.res src/rescript/*.res`
for file in $files
do
  current=`cat $file`
  linted=`echo "${current}" | rescript format -stdin .res`
  diff=`diff <(echo "$current") <(echo "$linted")`

  if [ ${#diff} -gt 0 ]
  then
    echo "ERROR: $file doesn't pass lint"
    errors=true
  fi
done

files=`ls src/rescript/**/*.resi`  # src/rescript/*/resi
for file in $files
do
  current=`cat $file`
  linted=`echo "${current}" | rescript format -stdin .resi`
  diff=`diff <(echo "$current") <(echo "$linted")`
  if [ ${#diff} -gt 0 ]
  then 
    echo "ERROR: $file doesn't pass lint"
    errors=true
  fi
done


if $errors
then
  exit 1
else
  echo "All files pass lint"
fi
