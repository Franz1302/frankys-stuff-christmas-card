#!/usr/bin/env bash
set -euo pipefail
# Build alpha-preserving Safari media from the existing VP9-alpha Christkind source.
src="dist/assets/christkind_lipsync_transparent.webm"
webp="dist/assets/christkind_lipsync_safari.webp"
mp3="dist/assets/christkind_lipsync_safari.mp3"
test -s "$src"
ffmpeg -hide_banner -loglevel error -nostdin -threads 2 -c:v libvpx-vp9 -i "$src" \
  -vf 'fps=20,scale=960:-2:flags=lanczos,format=yuva420p' \
  -an -c:v libwebp_anim -quality 76 -compression_level 5 -loop 0 \
  -y "$webp"
ffmpeg -hide_banner -loglevel error -nostdin -i "$src" \
  -vn -c:a libmp3lame -b:a 160k -ar 44100 -y "$mp3"
test -s "$webp"
test -s "$mp3"
python3 - <<'PY'
from PIL import Image
import os
filename='dist/assets/christkind_lipsync_safari.webp'
animation=Image.open(filename)
assert animation.n_frames==300, f'unexpected frame count {animation.n_frames}'
assert animation.size==(960,540), f'unexpected dimensions {animation.size}'
for frame in (0,100,200,299):
    animation.seek(frame)
    img=animation.convert('RGBA')
    assert img.getpixel((10,10))[3] <= 8, 'lost transparency in background'
    if frame in (100,200):
        assert img.getchannel('A').getextrema()[1]>=250, 'missing opaque foreground'
print('Safari animation: 15s/300 frames, transparency preserved; bytes',os.stat(filename).st_size)
PY
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$mp3"
