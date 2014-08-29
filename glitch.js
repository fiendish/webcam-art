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

function main() {
   var video = document.getElementById('video');
   var canvas = document.getElementById('canvas');
   var ctx = canvas.getContext('2d');
   var framebuf = document.createElement('canvas');
   var framebufctx = framebuf.getContext('2d');
   var numTimes = 0;
   var last_vectors;

   // wait for the video to start playing so that we can see 
   // what dimensions the camera has
   var matchVideoSize = function() {
      if (video.videoHeight != 0 && video.videoWidth != 0) {
         framebuf.width = video.videoWidth;
         framebuf.height = video.videoHeight;
         canvas.width = video.videoWidth;
         canvas.height = video.videoHeight;
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
   video.addEventListener('playing', matchVideoSize, false);

   var zoneSize = 16;
   var prev_vectors = null;
   var webCamFlow = new oflow.WebCamFlow(video, zoneSize);

   webCamFlow.onCalculated( function (direction) {
      last_vectors = direction.zones;

      // smooth the motion a bit
      if (prev_vectors != null) {
         for (var i = 0; i < last_vectors.length; ++i) {
            last_vectors[i].x = (last_vectors[i].x + prev_vectors[i].x)/2;
            last_vectors[i].y = (last_vectors[i].y + prev_vectors[i].y)/2;
         }
      }
      prev_vectors = JSON.parse(JSON.stringify(last_vectors));

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      distortFrame();

      /*
      // draw vectors
      for(var i = 0; i < last_vectors.length; ++i) {
         var zone = last_vectors[i];
         ctx.strokeStyle = "#FF0000"
         ctx.beginPath();
         ctx.moveTo(zone.x,zone.y);
         ctx.lineTo((zone.x - zone.u), zone.y + zone.v);
         ctx.stroke();
      }
      */
   });

   function beginClip() {
      webCamFlow.startCapture();
      //setTimeout(endClip, 5000);
   }

   function endClip() {
      webCamFlow.stopCapture();
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
      //ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      var completeImage = new Uint32Array(framebufctx.getImageData(0, 0, framebuf.width, framebuf.height).data.buffer);
      var cellData = ctx.createImageData(2*zoneSize+1, 2*zoneSize+1);

      for(var i = 0; i != last_vectors.length; i++)
      {
         last_vectors[i].hypot = hypot(last_vectors[i].u, last_vectors[i].v);
      }
      last_vectors.sort(hypot_compare);

      var xLoc, yLoc;
      var numsteps, step_u, step_v;
      var threshold = 8;
      for(var i = 0; i != last_vectors.length; i++)
      {
         xLoc = last_vectors[i].x;
         yLoc = last_vectors[i].y;
         cellData.data.set(new Uint8ClampedArray(getImageDataFaster(xLoc-zoneSize, yLoc-zoneSize, 2*zoneSize+1, 2*zoneSize+1, video.videoWidth, video.videoHeight, completeImage).buffer));
         ctx.putImageData(cellData, xLoc-zoneSize, yLoc-zoneSize);
         if (Math.abs(last_vectors[i].u) >= threshold || Math.abs(last_vectors[i].v) >= threshold) 
         {
            numsteps = hypot(last_vectors[i].u, last_vectors[i].v);
            step_u = (last_vectors[i].u / numsteps);
            step_v = (last_vectors[i].v / numsteps);
            for (var step = 1; step < (numsteps*2); step++)
            {
               ctx.putImageData(cellData, xLoc-zoneSize+(step*step_u), yLoc-zoneSize+(step*step_v));
            }
         }
      }
   }

   beginClip();
}
