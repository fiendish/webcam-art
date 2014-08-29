/*
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (c) 2013 Nicholas Ortenzio (nicholas.ortenzio@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this 
 * software and associated documentation files (the "Software"), to deal in the Software 
 * without restriction, including without limitation the rights to use, copy, modify, merge, 
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
 * to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or 
 * substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE 
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

/*
 * a faster alternative to canvas getImageData()
 *
 * parameters
 * --------
 * x - starting x coordinate
 * y - starting y coordinate
 * w - width of rectangle to get data from
 * h - height of rectangle to get data from
 * W - width of the original image data
 * H - height of th original image data
 * d - image data (cache this once)
 *
 * Usage:
 * -------
 * var completeImage = new Uint32Array(ctx.getImageData(0,0,W,H).data.buffer),
 *     imageData = getImageDataFaster(x,y,w,h,W,H,completeImage);
 */
    
var getImageDataFaster = function (x, y, w, h, W, H, d) {
	var arr = new Uint32Array(w*h), i=0;

	for (var r=y; r<h+y; r+=1) {
		for (var c=x; c<w+x; c+=1) {
			var O = ((r*W) + c); 
			if (c<0 || c>=W || r<0 || r>=H) {
				arr[i++] = 0;
			} else {
				arr[i++] = d[O];
			}
		}
	}

	return arr;
};

