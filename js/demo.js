var canvas;
var gl;
var squareVerticesBuffer;
var squareVerticesColorBuffer;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;
var squareRotation = 0.0;
var lastSquareUpdateTime;
var mvMatrixStack = [];

function start() {
	canvas = document.getElementById("glcanvas");

	initWebGL(canvas);

	initShaders();
	
	initBuffers();
	
	initTextures();
	
	setInterval(drawScene,15);
}
function initTextures(){
	texture = gl.createTexture();
	image = new Image();
	image.onload = function(){
		handleTextureLoaded(image,texture);
	};
	image.src = "res/images/eff.png";
}
function handleTextureLoaded(img,texture){
	gl.bindTexture(gl.TEXTURE_2D,texture);
	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D,null);
}
function mvPushMatrix(m){
	if(m){
		mvMatrixStack.push(m.dup());
		mvMatrix = m.dup();
	}else{
		mvMatrixStack.push(mvMatrix.dup());
	}
}
function mvRotate(angle,v){
	var inRadians = angle*Math.PI/180.0;
	
	var m = Matrix.Rotation(inRadians,$V([v[0],v[1],v[2]])).ensure4x4();
	multMatrix(m);
}
function mvPopMatrix(){
	if(!mvMatrixStack.length){
		throw("Can't pop");
	}
	mvMatrix = mvMatrixStack.pop();
	return mvMatrix;
}
function loadIdentity(){
	mvMatrix = Matrix.I(4);
}

function multMatrix(m){
	mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}
x = 0;
function drawScene(){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	perspectiveMatrix = makePerspective(45,1024.0/760.0,0.1,100.0);
	                    
	loadIdentity();
	mvTranslate([0.0,0.0,-5]);
	
	//mvPushMatrix();
	//mvRotate(squareRotation,[1,0,0]);
	
	gl.bindBuffer(gl.ARRAY_BUFFER,squareVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute,3,gl.FLOAT,false,0,0);
	
	//gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
	//gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesImageBuffer);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
  
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,texture);
	gl.uniform1i(gl.getUniformLocation(shaderProgram,"uSampler"),0);
	
	setMatrixUniforms();
	
	
	//console.log(gl.TRIANGLE_FAN);
	gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
	//gl.drawElements(gl.TRIANGLES, 4, gl.UNSIGNED_SHORT, 0);
	
	//mvPopMatrix();
	
	var currentTime = (new Date()).getTime();
	if(lastSquareUpdateTime){
		var delta = currentTime - lastSquareUpdateTime;
		squareRotation+=(30*delta)/1000.0;
	}
	lastSquareUpdateTime = currentTime;
}

function initBuffers(){
	squareVerticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,squareVerticesBuffer);
	
	var vertices = [
		1.0,1.0,0.0,
		-1.0,1.0,0.0,
		1.0,-1.0,0.0,
		-1.0,-1.0,0.0
	];
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
	
	var colors = [
		1.0,1.0,1.0,1.0,
		1.0,0.0,0.0,1.0,
		0.0,1.0,0.0,1.0,
		0.0,0.0,1.0,1.0
	];
	
	//squareVerticesColorBuffer = gl.createBuffer();
	//gl.bindBuffer(gl.ARRAY_BUFFER,squareVerticesColorBuffer);
	//gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
	
	var textureCoordinates = [
	0.0,0.0,
	1.0,0.0,
	1.0,1.0,
	0.0,1.0
	];
	squareVerticesImageBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,squareVerticesImageBuffer);
	//gl.bindData(gl.ARRAY_BUFFER,new WebGLFloatArray(textureCoordinates),gl.STATIC_DRAW);
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(textureCoordinates),gl.STATIC_DRAW);
}
function getShader(gl, id) {
	var shaderScript, theSource, currentChild, shader;
  
	shaderScript = document.getElementById(id);
  
	if (!shaderScript) {
		return null;
	}
  
	theSource = "";
	currentChild = shaderScript.firstChild;
  
	while(currentChild) {
		if (currentChild.nodeType == currentChild.TEXT_NODE) {
		  theSource += currentChild.textContent;
		}
		
		currentChild = currentChild.nextSibling;
	}
	
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		 // Unknown shader type
		 return null;
	}
	
	gl.shaderSource(shader, theSource);
    
	// Compile the shader program
	gl.compileShader(shader);  

	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
	  alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));  
	  return null;  
	}

	return shader;
}
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  gl.useProgram(shaderProgram);
  
  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  //vertexColorAttribute = gl.getAttribLocation(shaderProgram,"aVertexColor");
  //gl.enableVertexAttribArray(vertexColorAttribute);
  
  textureCoordAttribute = gl.getAttribLocation(shaderProgram,"aTextureCoord");
  gl.enableVertexAttribArray(textureCoordAttribute);
}

function initWebGL(canvas){
	gl = canvas.getContext("webgl",{antialias:true}) || canvas.getContext("experimental-webgl",{antialias:true});
	if(!gl){
		alert("WEBGL does not support");
	}
	gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // 设置擦除颜色为黑色，不透明
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);                               // 开启“深度测试”, Z-缓存
    gl.depthFunc(gl.LEQUAL);                                //这里设置深度测试，满足（深度小或相等的时候才渲染）
	gl.viewport(0, 0, canvas.width, canvas.height);
}