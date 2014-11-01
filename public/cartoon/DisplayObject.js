//git test, I'm zhulei
define(function (require, exports, module) {
	"use strict";
	
var EventDispatcher = require('EventDispatcher'),
	PrivateData = require('PrivateData'),
	StyleSheet = require('StyleSheet'),
	Matrix2D = require('Matrix2D'),
	Tween = require('Tween');
   
var supportCanvas = !!document.createElement('canvas').getContext;
   	
var DisplayObject = EventDispatcher.extend({

	x: 0, // 坐标
	y: 0,
	
	width: 0, // 尺寸
	height: 0,
	
	visible: true, // 基础样式
	overflow: 'visible',
	alpha: 1,
	shadow: null,
	
	transform: null, // 2d&3d变换
	transform3d: null,
	
	parent: null, // 关联节点&元素
	elem: null,
	elemStyle: null,

	renderMode: 0, // 渲染模式,  0: dom,  1: canvas,  2: webgl
	blendMode: 'source-over',
	mouseEnabled: true,
	
	_tagName: 'div', // 私有属性
	_children: null,
	_matrix2d: null,
	_privateData: null,

	init: function(props) {
		if (!props) props = {};
		// 设置渲染模式
		if (props.renderMode) {
			this.renderMode = props.renderMode;
		}
		if (this.renderMode === 0) {
			// 初始化dom节点
			var elem = props.elem;
			if (elem && typeof(elem) === 'string') {
				elem = document.querySelector ? document.querySelector(elem) : null;
			}
			this.elem = elem || document.createElement(this._tagName);
			this.elem.displayObj = this;
			this.elemStyle = this.elem.style;
			// 绑定jQuery
			if (jQuery) {
				this.$ = jQuery(this.elem);
			}
		} else {
			// 设置混色模式
			if (props.blendMode) {
				this.blendMode = props.blendMode;
			}
		}
		// 初始化私有属性
		this._children = [];
	    this._matrix2d = new Matrix2D();
		this._privateData = new PrivateData();
		// 初始化样式
		for (var i in props) {
			if (StyleSheet.has(i)) {
				this.style(i, props[i]);
			}
		}
		// 初始化2d变换
		if (!this.transform) {
			StyleSheet.init(this, 'transform');
		}
	},
	
	addChild: function(displayObj) {
		if (displayObj.parent) {
			displayObj.parent.removeChild(displayObj);
		}
		displayObj.parent = this;
		// 添加子节点
		if (displayObj.renderMode === 0) {
			if (this.elem) {
				this.elem.appendChild(displayObj.elem);
			}
		} else {
			this._children.push(displayObj);
		}
	},
	
	removeChild: function(displayObj) {
		if (displayObj.parent === this) {
			displayObj.parent = null;
			// 移除子节点
			if (displayObj.renderMode === 0) {
				if (this.elem) {
					this.elem.removeChild(displayObj.elem);
				}
			} else {
				var children = this._children;
				for (var i=children.length-1; i>=0; i--) {
					if (children[i] === displayObj) {
						children.splice(i, 1);
						break;
					}
				}
			}
		}
	},
	
	removeAllChildren: function() {
		var children, child;
		// 遍历移除子节点
		if (this.renderMode === 0) {
			var elem = this.elem;
			children = elem.children;
			while (children.length) {
				child = children[children.length - 1];
				if (child.displayObj) {
					child.displayObj.parent = null;
				}
				elem.removeChild(child);
			}
		} else {
			var index = -1;
			children = this._children;
			while (children.length) {
				index = children.length - 1;
				child = children[index];
				child.parent = null;
				children.splice(index, 1);
			}
		}
	},
	
	eachChildren: function(fn) {
		var children = this.renderMode === 0 ? 
					   this.elem.children : this._children,
			child;
		// 遍历执行函数	
		for (var i=0,l=children.length; i<l; i++) {
			child = this.renderMode === 0 ? 
					children[i].displayObj : children[i];
			if (child) {
				fn(child, i);
			}
		}
	},
	
	enableEvents: function(enabled) {
		// 启用或禁用鼠标事件
		this.mouseEnabled = enabled ? true : false;
		if (this.renderMode === 0) {
			this.elemStyle.pointerEvents = enabled ? 'auto' : 'none';
		}
	},
	
	style: function(key, value) {
		// 设置样式，参见 jQuery.css()
		if (value === undefined) {
			if (typeof(key) === 'object') {
				for (var i in key) {
					StyleSheet.set(this, i, key[i]);
				}
			} else {
				return StyleSheet.get(this, key);	
			}
		} else {
			StyleSheet.set(this, key, value);
		}
	},
	
	data: function(key, value) {
		// 设置私有数据，参见 jQuery.data()
		if (value === undefined) {
			if (typeof(key) === 'object') {
				for (var i in key) {
					this._privateData.set(i, key[i]);
				}
			} else {
				return this._privateData.get(key);
			}
		} else {
			this._privateData.set(key, value);
		}
	},

	to: function(props, duration, easing, callback, frameDone) {
		// 创建补间动画，参见 jQuery.animate()
		Tween.get(this).addTween(props, duration, easing, callback, frameDone);
		
		return this;
	},

	draw: function(ctx) {
		// canvas模式下绘制自己
		if (!this._children.length) return;
		
		if (this.overflow === 'hidden') {
			// 剪切溢出部分
		}
		
		var children = this._children, 
			child;
		// 遍历绘制子节点
		for (var i=0,l=children.length; i<l; i++) {
			child = children[i];
			// 判断是否可见
			if (child.visible) {
				ctx.save();
				child._drawCanvas(ctx);
				ctx.restore();
			}
		}
	},

	cache: function() {
		// 开启缓存，后期加入多缓存模式
		if (supportCanvas) {
			var canvas = document.createElement('canvas');
			canvas.width = this.width;
			canvas.height = this.height;
			
			this.draw(canvas.getContext('2d'));
			this._cacheCanvas = canvas;
		}
	},
	
	uncache: function() {
		// 关闭缓存
		this._cacheCanvas = null;
	},

	_stepStyle: function(key, fx) {
		// 补间动画逐帧更新样式
		StyleSheet.step(this, key, fx);
	},

	_updateTransform: function(key, value) {
		// 更新2d变换
		if (key === 'scale') {
			this.transform.scale = this.transform.scaleX = this.transform.scaleY = value;
		} else if (key in this.transform) {
			this.transform[key] = value;
		}
	},
	
	_updateTransform3D: function(key, value) {
		// 更新3d变换	
		if (key in this.transform3d) {
			this.transform3d[key] = value;
		}
	},
	
	_mergeTransformText: function() {
		// 合成2d变换的css样式
		var t2d = this.transform,
			value = '';
		if (t2d.translateX !== 0 || t2d.translateY !== 0) {
			value += 'translate('+t2d.translateX+'px,'+t2d.translateY+'px'+')';
		}
		if (t2d.rotate !== 0) {
		    value += ' rotate('+t2d.rotate+'deg)';
		}
		if (t2d.scaleX !== 1 || t2d.scaleY !== 1) {
			value += ' scale('+t2d.scaleX+','+t2d.scaleY+')';	
		}
		if (t2d.skewX !== 0 || t2d.skewY !== 0) {
			value += ' skew('+t2d.skewX+'deg,'+t2d.skewY+'deg)';
		}
		return value;
	},
	
	_mergeTransform3DText: function() {
		// 合成3d变换的css样式
		var t3d = this.transform3d,
			value = '';
		if (t3d.perspective !== 0) {
			value += 'perspective('+t3d.perspective+'px)';
		}
		if (t3d.translateX !== 0 || t3d.translateY !== 0 || t3d.translateZ !== 0) {
		    value += ' translate3d('+t3d.translateX+'px,'+t3d.translateY+'px,'+t3d.translateZ+'px)';
		}
		if (t3d.rotateX !== 0) {
		    value += ' rotateX('+t3d.rotateX+'deg)';
		}
		if (t3d.rotateY !== 0) {
		    value += ' rotateY('+t3d.rotateY+'deg)';
		}
		if (t3d.rotateZ !== 0) {
		    value += ' rotateZ('+t3d.rotateZ+'deg)';
		}
		if (t3d.scaleX !== 1 || t3d.scaleY !== 1 || t3d.scaleZ !== 1) {
			value += ' scale3d('+t3d.scaleX+','+t3d.scaleY+','+t3d.scaleZ+')';	
		}
		return value;
	},
	
	_drawCanvas: function(ctx) {
		// 更新上下文
		this._updateCanvasContext(ctx);
		// 绘制canvas
		if (this._cacheCanvas) {
			ctx.drawImage(this._cacheCanvas, 0, 0);
		} else {
			this.draw(ctx);
		}
	},
	
	_updateCanvasContext: function(ctx) {
		// 更新2d上下文
		var mtx = this._updateMatrix2D(),
			dx = this._getAnchorX(),
			dy = this._getAnchorY(),
			shadow = this.shadow;
		// 设置2d变换	
		if (dx === 0 && dy === 0) {
			ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
		} else {
			ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx+dx, mtx.ty+dy);
			ctx.transform(1, 0, 0, 1, -dx, -dy);
		}
		// 设置透明度&混色模式
		ctx.globalAlpha *= this.alpha;
		ctx.globalCompositeOperation = this.blendMode;
		// 设置阴影
		if (shadow) {
			ctx.shadowOffsetX = shadow.offsetX;
			ctx.shadowOffsetY = shadow.offsetY;
			ctx.shadowBlur = shadow.blur;
			ctx.shadowColor = shadow.color;	
		}
	},

	_getAnchorX: function() {
		// 获取x轴锚点
		return this.width * this.transform.originX;
	},

	_getAnchorY: function() {
		// 获取y轴锚点
		return this.height * this.transform.originY;
	},

	_updateMatrix2D: function(ieMatrix) {
		// 计算2d矩阵
		var mtx = this._matrix2d.identity(),
			t2d = this.transform;
		if (ieMatrix) {
			return mtx.rotate(-t2d.rotate%360*Matrix2D.DEG_TO_RAD).scale(t2d.scaleX, t2d.scaleY);
		} else {
			return mtx.appendTransform(this.x+t2d.translateX, this.y+t2d.translateY, t2d.scaleX, t2d.scaleY, t2d.rotate, t2d.skewX, t2d.skewY);
		}
	}
	
});

return DisplayObject;
});
