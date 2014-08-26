
define(function (require, exports, module) {
   
var Graphics2D = function() {};

Graphics2D.Rect = {
	type: 'Rect',
	init: function(graphics) {
		if (graphics.color.match(/top|right|bottom|left|center/g)) {
			this.style('bgGradient', graphics.color.split(','));
		} else if (graphics.color) {
			this.style('bgColor', graphics.color);
		}
		this.style('size', graphics);
	},
	draw: function(ctx) {
		ctx.fillStyle = this.getFillStyle(ctx);
		ctx.fillRect(0, 0, this.width, this.height);
	}
};

Graphics2D.Circle = {
	type: 'Circle',
	init: function(graphics) {
		this.setBackground(graphics);
		// this.style('bgColor', graphics.color);
		this.style('radius', graphics.radius);
		this.style('angle', typeof(graphics.angle)==='number'?graphics.angle:360);
	},
	draw: function(ctx) {
		ctx.fillStyle = this.getFillStyle(ctx);
		ctx.beginPath();
		var radius = this.radius;
		ctx.arc(radius, radius, radius, 0, Math.PI*2*(this.angle/360), 0);
		ctx.lineTo(radius, radius);
		ctx.fill();
	}
};

Graphics2D.Lines = {
	type: 'Lines',
	init: function(graphics) {
		this.color = graphics.color;
		this.paths = graphics.paths;
		this.lineWidth = 1;
	},
	draw: function(ctx) {
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		
		var paths = this.paths,
			path, line;
		for (var j=0, jl=paths.length; j<jl; j++) {
			path = paths[j];
			if (path.length > 1) {
				for (var i=0,l=path.length; i<l; i++) {
					line = path[i];
					if (i===0) {
						ctx.moveTo(line[0], line[1]);
					} else {
						if (line.length === 2) {
							ctx.lineTo(line[0], line[1]);	
						} else if (line.length === 4) {
							ctx.quadraticCurveTo(line[0], line[1], line[2], line[3]);		
						} else if (line.length === 6) {
							ctx.bezierCurveTo(line[0], line[1], line[2], line[3], line[4], line[5]);		
						}
					}
				}
			}
		}
		ctx.stroke();
	}
};

Graphics2D.Ploygon = {
	type: 'Ploygon',
	init: function() {
		
	},
	draw: function() {
		
	}
};

return Graphics2D;
});