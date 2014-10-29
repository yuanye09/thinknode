
define(function (require, exports, module) {
	"use strict";
	   
var DisplayObject = require('DisplayObject'),
	THREE = require('../extension/THREE');
	
var GLCanvas = DisplayObject.extend({
	
	_tagName: 'canvas',
	_useElemSize: true,

	init: function(props) {
		this._super(props);
		this._initScene(props);
	},
	
	update: function(delta) {
		var renderer = this._renderer,
			scene = this._scene,
			camera = this._camera;
			
		THREE.AnimationHandler.update(delta / 1000);
		renderer.render( scene, camera );
	},
	
	getCamera: function() {
		return this._camera;
	},
	
	addChild: function(type, data) {
		if (!data) data = {};
		
		var scene = this._scene,
			obj3d;
		// 创建3d显示对象
		switch(type) {
			case 'light': obj3d = this.createLight(data); break;
			case 'plane': obj3d = this.createPlane(data); break;
			case 'cube': obj3d = this.createCube(data); break;
			case 'sphere': obj3d = this.createSphere(data); break;
			case 'sprite': obj3d = this.createSprite(data); break;
			case 'model': obj3d = this.createModel(data, function(obj){ scene.add(obj); 
				data.onload && data.onload(obj); }); break;
		}
		// 添加显示对象
		if (obj3d) {
			scene.add(obj3d);
		}
		
		return obj3d;
	},
	
	createLight: function(data) {
		var light = new THREE.DirectionalLight( 0xffffff, data.strong || 1 );
		
		light.add( new THREE.Mesh( new THREE.SphereGeometry( 3, 9, 9 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } )) )

		return light;
	},
	
	createPlane: function(data) {
		// 构建图形-平面
		var geometry = new THREE.PlaneGeometry( data.width || 500, data.height || 500 );
		// 创建纹理贴图
		var map = data.texture ? THREE.ImageUtils.loadTexture( data.texture ) : null;
		// 构建平面材质
		var material = new THREE.MeshLambertMaterial( { color: 0x808080, map: map } );
		// 生成平面网格
		return new THREE.Mesh( geometry, material );
	},
	
	createCube: function(data) {
		// 构建图形-立方体
		var geometry = new THREE.BoxGeometry( 100, 100, 100 );
		
		for ( var i = 0; i < geometry.faces.length; i += 2 ) {
			// 设置立方体表面颜色
			var hex = data.color || Math.random() * 0xffffff;
			geometry.faces[ i ].color.setHex( hex );
			geometry.faces[ i + 1 ].color.setHex( hex );
		}
		// 构建立方体材质
		var material = new THREE.MeshLambertMaterial( { vertexColors: THREE.FaceColors } );
		// 生成立方体网格
		return new THREE.Mesh( geometry, material );
	},
	
	createSphere: function(data) {
		// 构建图形-球体
		var geometry = new THREE.SphereGeometry( data.radius || 50, 16, 16 );
		// 创建球体表面的材质 
		var material = new THREE.MeshLambertMaterial( { color: data.color || 0x00ff00 } );
		// 生成球体网格
		return new THREE.Mesh( geometry, material );
	},
	
	createSprite: function(data) {
		var program = function( ctx ) {
			ctx.beginPath();
			ctx.arc( 0, 0, 0.5, 0, Math.PI * 2, true );
			ctx.fill();
		}
		// 创建图像表面材质
		var material = new THREE.SpriteCanvasMaterial( { color: 0xff0040, program: program } );
		// 生成图像
		return new THREE.Sprite( material );
	},
	
	createModel: function(data, callback) {
		var loader = new THREE.JSONLoader();
		if (data.dataUrl) {
			loader.load( data.dataUrl, function ( geometry, materials ) {
				var material = new THREE.MeshLambertMaterial( { color: data.color || 0xffdd88 } );
						  // = new THREE.MeshFaceMaterial( materials );
				var mesh = new THREE.SkinnedMesh( geometry, material );
				
				mesh.position.set( 0, 100, 0 );
				mesh.scale.set( 20, 20, 20 );
				callback(mesh);
			});
			return;
		} 
		loader.load( "js/knight.js", function ( geometry, materials ) {
			var x = 0, y = 0, z = 0, s = 15;
			var animation = geometry.animation;
			for ( var i = 0; i < animation.hierarchy.length; i ++ ) {

					var bone = animation.hierarchy[ i ];

					var first = bone.keys[ 0 ];
					var last = bone.keys[ bone.keys.length - 1 ];

					last.pos = first.pos;
					last.rot = first.rot;
					last.scl = first.scl;

				}
				
			geometry.computeBoundingBox();
				var bb = geometry.boundingBox;

				var path = "images/";
				var format = '.jpg';
				var urls = [
						path + 'posx' + format, path + 'negx' + format,
						path + 'posy' + format, path + 'negy' + format,
						path + 'posz' + format, path + 'negz' + format
					];


				for ( var i = 0; i < materials.length; i ++ ) {

					var m = materials[ i ];
					m.skinning = true;
					m.morphTargets = true;

					m.specular.setHSL( 0, 0, 0.1 );

					m.color.setHSL( 0.6, 0, 0.6 );
					m.ambient.copy( m.color );

					m.wrapAround = true;

				}

				var mesh = new THREE.SkinnedMesh( geometry, new THREE.MeshFaceMaterial( materials ) );
				mesh.position.set( x, y - bb.min.y * s, z );
				mesh.scale.set( s, s, s );
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				
				callback( mesh );
				
				var animation = new THREE.Animation( mesh, geometry.animation );
				animation.play();
		});
	},
	
	_initScene: function(data) {
		var scene = new THREE.Scene();
		scene.fog = data.sceneFog ? new THREE.Fog( 0xaaaaee, 800) : null;
		
		var	camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.1, 1000 );
		
		var renderer = new THREE.WebGLRenderer({ canvas: this.elem, antialias: true, alpha: data.clearColor === 'alpha' });
		renderer.setSize( this.width, this.height );
		
		if (data.sceneFog) {
			renderer.setClearColor( scene.fog.color, 1 );
		}
		
		this._scene = scene;
		this._camera = camera;
		this._renderer = renderer;
	}

});

return GLCanvas;
});