#!/usr/bin/env node
var util = require('util');
var _ = require('lodash');
var argv = require('yargs').argv;

var n = parseInt(argv._[0], 10);

var expansions = 0;

var count = 0;
var perms = 2 << n - 1;
var string, result;

console.time('elapsed');
for(var i = 0; i < perms; i++) {
	string = asString(i, n).split('');
	result = fold(string);

	count += result.score;
}
console.timeEnd('elapsed');

console.log('total H bonds: ' + count);
console.log('nodes expanded: ' + expansions);

function asString(n, len) {
	var mask, i, string = [];
	for(i = 0; i < len; i++) {
		mask = 1 << i;
		string.push( (n & mask) ? 'H' : 'P' );
	}

	return string.join('');
}

function fold(string) {
	if(string.length < 2) return { score: 0 };
	if(string.length <= 3) {
		var x = 0;
		var points = string.map(function(char) {
			return new Point(char, x++, 0);		
		});

		return  {
			string: _.pluck(string, 'char').join(''),
			score: countHPairs(points)
		};
	}

	var best = null;
	var bestScore = -1;

	var queue = [[
		new Point(string[0], 0, 0),
		new Point(string[1], 0, 1)
	]];

	while(queue.length !== 0) {
		var curr = queue.pop();

		if(curr.length === string.length) {
			var score = countHPairs(curr);

			if(score > bestScore) {
				best = curr;
				bestScore = score;
			}
		}
		else {
			Array.prototype.push.apply(queue, expand(curr, string));
		}
	}

	return  {
		points: best,
		score: bestScore
	}
}

function expand(pointArray, string) {
	if(pointArray.length <= string.length) {
		var curr = pointArray[pointArray.length - 1];

		if(anyHBondsLeft(pointArray, string)) {
			var char = string[pointArray.length];
			return expandPointArray(pointArray, char);
		}
		else {
			var tail = fitTail(pointArray, string.length);
			if(tail != null)
				return [ tail ];
		}
	}
	
	return [];
}

function anyHBondsLeft(pointArray, string) {
	for(var i = pointArray.length; i < string.length; i++) {
		if(string[i] === 'H') 
			return true;
	}

	return false;
}

//Fill the rest of the pointArray up to length n with P's
function fitTail(pointArray, n) {
	var queue = [ pointArray.slice() ];
	while(queue.length > 0) {
		var curr = queue.pop();

		if(curr.length == n) 
			return curr;
		else
			Array.prototype.push.apply(queue, expandPointArray(curr, 'P'));	
	}

	return null;
}

function expandPointArray(pointArray, char) {
	var newNodes = [],
		curr = pointArray[pointArray.length - 1];

	tryExpand(1,0);
	tryExpand(0,1);
	tryExpand(-1,0);
	tryExpand(0,-1);

	return newNodes.map(function(node) {
		var array = pointArray.slice();
		array.push(node);

		return array;
	});

	function tryExpand(dx, dy) {
		var x = curr.x + dx;
		var y = curr.y + dy;
		
		if(!overlaps(pointArray, x, y)) {
			newNodes.push(new Point(char, x, y));
			expansions++;
		}
	}
}

function Point(char, x, y) {
	this.char = char;
	this.x = x;
	this.y = y;
}

function countHPairs(pointArray) {
	var count = 0;

	pointArray.forEach(function(point, index, array) {
		if(point.char !== 'H') return;
		
		for(var i = index + 1; i < array.length; i++) {
			var otherPoint = array[i];

			if(otherPoint.char !== 'H') continue;

			var dx = Math.abs(point.x - otherPoint.x);
			var dy = Math.abs(point.y - otherPoint.y);

			if(dx +  dy == 1)
				count++;
		}
	});

	return count;
}

function overlaps(pointArray, x, y) {
	for(var i = 0; i < pointArray.length; i++) {
		var point = pointArray[i];

		if(point.x == x && point.y == y)
			return true;
	}

	return false;
}

function createPointsMap(pointArray) {
	var min = { x: Infinity, y: Infinity };
	var max = { x: -Infinity, y: -Infinity };

	pointArray.forEach(function(point) {
		min.x = Math.min(min.x, point.x);
		min.y = Math.min(min.y, point.y);
		max.x = Math.max(max.x, point.x);
		max.y = Math.max(max.y, point.y);
	});

	var grid = _.times(max.y - min.y + 1, function() {
		return _.times(max.x - min.x + 1, _.constant(' '));
	});

	pointArray.forEach(function(point) {
		var x = point.x - min.x;
		var y = point.y - min.y;

		grid[y][x] = point.char;
	});

	return grid.map(function(row) {
		return row.join('');
	});
}

function printPointMaps(maps, spaces) {
	if(spaces === undefined)
		spaces = 2;

	var space = _.constant(' ');
	var gap = _.times(spaces, space).join('');

	//find the tallest map
	var length = -1;
	var index  = -1;

	maps.forEach(function(map, i) {
		if(map.length > length) {
			length = map.length;
			index = i;
		}
	});

	for(var i = 0; i < length; i++) {
		console.log(makeRow(i));	
	}
	
	function makeRow(n) {
		return maps.map(function(map) {
			return map.length > n ? map[n] : _.times(map[0].length, space).join('');
		}).join(gap);
	}
}

function printPoints(pointArray) {
	createPointsMap(pointArray).forEach(function(row) {
		console.log(row);
	});
}
