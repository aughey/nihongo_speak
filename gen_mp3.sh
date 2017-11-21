#!/bin/sh

ffmpeg=~/ffmpeg-git-20171121-64bit-static/ffmpeg

for f in cache/*.wav; do
  mp3=`echo $f | sed 's/\.wav$/.mp3/g'`
  $ffmpeg -i $f -y -codec:a libmp3lame -qscale:a 2 $mp3
done
