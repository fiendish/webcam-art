/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2014  Avital Kelman 
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

var current_vectors;
var zoneSize = 16;
var threshold = Math.floor(zoneSize/3);
var prev_vectors = null;
var flow;
var has_camera = true;
var stretch = 2;

var video;
var canvas;
var ctx;
var framebuf;
var framebufctx;
var numTimes;

function setZoneSize (zs) {
   zoneSize = zs;
   prev_vectors = null;
   flow.setZoneSize(zoneSize);
}

function handleVectors (direction) {
   // It seems like oflow.js commonly returns 0,0 frame vectors because it finishes 
   // processing before getting another video frame, so it compares 
   // two identical frames. So punt if we see that.
   var zone, total_u = 0, total_v = 0;
   for (var i = 0; i < direction.zones.length; ++i) {
      zone = direction.zones[i];
      total_u += zone.u;
      total_v += zone.v;
   }
   if (total_u == 0 && total_v == 0) {
      return;
   }
   
   current_vectors = direction.zones;

   ctx.clearRect(0, 0, canvas.width, canvas.height);
   distortFrame();
}

// wait for the video to start playing so that we can see 
// what dimensions the camera has
var matchVideoSize = function() {
   if (video.videoHeight != 0 && video.videoWidth != 0) {
      framebuf.width = video.videoWidth;
      framebuf.height = video.videoHeight;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setZoneSize(Math.floor(canvas.width/40));
      threshold = Math.floor(zoneSize/3);
   } else if (numTimes < 30) {
      numTimes++;
      setTimeout(matchVideoSize, 100);
      return;
   } else {
      framebuf.width = 640;
      framebuf.height = 480;
      canvas.width = 640;
      canvas.height = 480;
   }
   video.removeEventListener('playing', matchVideoSize, false);
};

function beginClip() {
   flow.startCapture();
   //setTimeout(endClip, 5000);
}

function endClip() {
   flow.stopCapture();
   distortFrame();
}

function hypot(var1, var2) {
  return Math.sqrt(var1*var1 + var2*var2);
}

// for sorting the motion vectors by length
function hypot_compare(a,b) {
  if (a.hypot < b.hypot)
     return -1;
  if (a.hypot > b.hypot)
    return 1;
  return 0;
}

function distortFrame() {
   framebufctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
   ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
   var completeImage = new Uint32Array(framebufctx.getImageData(0, 0, framebuf.width, framebuf.height).data.buffer);
   var cellData = ctx.createImageData(2*zoneSize+1, 2*zoneSize+1);

   // sort blocks by motion distance
   for(var i = 0; i != current_vectors.length; i++)
   {
      current_vectors[i].hypot = hypot(current_vectors[i].u, current_vectors[i].v);
   }
   current_vectors.sort(hypot_compare);

   var xLoc, yLoc;
   var numsteps, step_u, step_v;
   for(var i = 0; i != current_vectors.length; i++)
   {
      xLoc = current_vectors[i].x;
      yLoc = current_vectors[i].y;
      cellData.data.set(new Uint8ClampedArray(getImageDataFaster(xLoc-zoneSize, yLoc-zoneSize, 2*zoneSize+1, 2*zoneSize+1, video.videoWidth, video.videoHeight, completeImage).buffer));
      ctx.putImageData(cellData, xLoc-zoneSize, yLoc-zoneSize);
      if (Math.abs(current_vectors[i].u) >= threshold || Math.abs(current_vectors[i].v) >= threshold) 
      {
         numsteps = hypot(current_vectors[i].u, current_vectors[i].v);
         step_u = (current_vectors[i].u / numsteps);
         step_v = (current_vectors[i].v / numsteps);
         for (var step = 1; step < (numsteps*stretch); step++)
         {
            ctx.putImageData(cellData, xLoc-zoneSize+(step*step_u), yLoc-zoneSize+(step*step_v));
         }
      }
   }
}

function attachTestVideo() {
   has_camera = false;
   var source = document.createElement('source');
   source.setAttribute('src', 'test.mp4');
   video.appendChild(source);
   video.load();
   video.play();
   flow = new oflow.VideoFlow(video, zoneSize);
}


function main() {
   video = document.getElementById('video');
   canvas = document.getElementById('canvas');
   ctx = canvas.getContext('2d');
   framebuf = document.createElement('canvas');
   framebufctx = framebuf.getContext('2d');
   numTimes = 0;

   video.addEventListener('playing', matchVideoSize, false);

   flow = new oflow.WebCamFlow(video, zoneSize, attachTestVideo);
   flow.onCalculated(handleVectors);
   beginClip();
}
