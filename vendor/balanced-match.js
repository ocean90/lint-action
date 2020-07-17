/**
 * balanced-match
 * v1.0.0
 * https://github.com/juliangruber/balanced-match
 *
 * (MIT)
 *
 * Copyright (c) 2013 Julian Gruber &lt;julian@juliangruber.com&gt;
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
'use strict';
module.exports = balanced;
function balanced(a, b, str) {
	if (a instanceof RegExp) a = maybeMatch(a, str);
	if (b instanceof RegExp) b = maybeMatch(b, str);

	var r = range(a, b, str);

	return r && {
		start: r[0],
		end: r[1],
		pre: str.slice(0, r[0]),
		body: str.slice(r[0] + a.length, r[1]),
		post: str.slice(r[1] + b.length)
	};
}

function maybeMatch(reg, str) {
	var m = str.match(reg);
	return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
	var begs, beg, left, right, result;
	var ai = str.indexOf(a);
	var bi = str.indexOf(b, ai + 1);
	var i = ai;

	if (ai >= 0 && bi > 0) {
		begs = [];
		left = str.length;

		while (i >= 0 && !result) {
			if (i == ai) {
				begs.push(i);
				ai = str.indexOf(a, i + 1);
			} else if (begs.length == 1) {
				result = [ begs.pop(), bi ];
			} else {
				beg = begs.pop();
				if (beg < left) {
					left = beg;
					right = bi;
				}

				bi = str.indexOf(b, i + 1);
			}

			i = ai < bi && ai >= 0 ? ai : bi;
		}

		if (begs.length) {
			result = [ left, right ];
		}
	}

	return result;
}