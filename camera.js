var Camera = function() {
  this.eye = vec3.fromValues(0,0,3);
  this.up = vec3.fromValues(0.0,1,0);
  this.center = vec3.create();

  this.leftMouseDown = false;
  this.rightMouseDown = false;

  this.canvas = document.getElementById("glcanvas");
}

Camera.prototype.getMVMatrix = function() {
  return mat4.lookAt(mat4.create(), this.eye, this.center, this.up);
}

Camera.prototype.getPMatrix = function() {
  return mat4.perspective(mat4.create(), Math.PI/3, this.canvas.width / this.canvas.height, 0.0001, 100.0);
}

Camera.prototype.handleScrollEvent = function(event) {
  console.log(event.deltaY);
  var scale = Math.pow(1.001, event.deltaY);
  var unitEye = vec3.normalize(vec3.create(), this.eye);
  vec3.sub(this.eye, this.eye, unitEye)
  vec3.scale(this.eye, this.eye, scale);
  vec3.add(this.eye, this.eye, unitEye)
}

Camera.prototype.handleMouseDown = function(event) {
    this.basePointOnSphere = this.getPointOnSphere(event.offsetX, event.offsetY);
    this.lastScreenPoint = vec2.fromValues(event.offsetX, event.offsetY);
    if (event.which == 3 || (event.which == 1 && event.ctrlKey)) {
      this.rightMouseDown = true;
    } else if(event.which == 1) {
      this.leftMouseDown = true;
    }
  }

Camera.prototype.handleMouseUp = function(event) {
    this.leftMouseDown = false;
    this.rightMouseDown = false;
  }

Camera.prototype.handleMouseMove = function(event) {
  var newPointOnSphere = this.getPointOnSphere(event.offsetX, event.offsetY);
  
  if(this.basePointOnSphere == null || newPointOnSphere == null) {return;}

  var N = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.basePointOnSphere, newPointOnSphere));

  if(vec3.length(N)==0) { return; } //might happen due to fp error

  

  if (this.leftMouseDown) {
    var dot = Math.min(1.0,vec3.dot(newPointOnSphere, this.basePointOnSphere));
    var theta = Math.acos(dot);
    var rot = mat4.rotate(mat4.create(), mat4.create(), -1*theta, N);
    this.eye = vec3.transformMat4(vec3.create(), this.eye, rot);
  } else if(this.rightMouseDown) {

    var transform = mat4.multiply(mat4.create(), this.getPMatrix(), this.getMVMatrix());
    var transformInv = mat4.invert(mat4.create(), transform);
    var lastScreen = vec3.fromValues(this.lastScreenPoint[0]/this.canvas.width*2-1, 1-this.lastScreenPoint[1]/this.canvas.height*2, .1);
    var lastWorld = vec3.transformMat4(vec3.create(), lastScreen, transformInv);
    var newScreen = vec3.fromValues(event.offsetX/this.canvas.width*2-1, 1-event.offsetY/this.canvas.height*2, .1);
    var newWorld = vec3.transformMat4(vec3.create(), newScreen, transformInv);


    var v1 = vec3.sub(vec3.create(), lastWorld, this.eye);
    vec3.normalize(v1, v1);
    var v2 = vec3.sub(vec3.create(), newWorld, this.eye);
    vec3.normalize(v2, v2);
    var dot = Math.min(1.0,vec3.dot(v1, v2));
    var theta = Math.acos(dot);

    var eyeInverse = vec3.negate(vec3.create(), this.eye);
    var translate1 = mat4.translate(mat4.create(), mat4.create(), this.eye);
    var rot = mat4.rotate(mat4.create(), translate1,theta, N);
    var translate2 = mat4.translate(mat4.create(), rot, eyeInverse);

    this.center = vec3.transformMat4(vec3.create(), this.center, translate2);
  }
  this.lastScreenPoint = vec2.fromValues(event.offsetX, event.offsetY);
}

Camera.prototype.getPointOnSphere = function(x, y) {
    var transform = mat4.multiply(mat4.create(), this.getPMatrix(), this.getMVMatrix());
    var transformInv = mat4.invert(mat4.create(), transform);

    var r = 1;
    var c = vec3.fromValues(0,0,0);

    var screen = vec3.fromValues(x/this.canvas.width*2-1, 1-y/this.canvas.height*2, 0);
    var lineStart = vec3.transformMat4(vec3.create(), screen, transformInv);
    var lineDir = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), lineStart, this.eye));
    var d = lineSphereIntersect(r, c, lineStart, lineDir);
    return d.length > 0 ? vec3.add(vec3.create(), vec3.scale(vec3.create(), lineDir, d[0]), lineStart) : null;
}

function lineSphereIntersect(r, c, lineStart, lineDir) {

    var diff = vec3.sub(vec3.create(), lineStart, c);
    var a = vec3.dot(vec3.normalize(lineDir, lineDir), diff);
    var discriminant = a*a - vec3.sqrLen(diff) + r*r;

    if (discriminant < 0) {
      return [];
    } else {
    return [-a-Math.sqrt(discriminant), -a+Math.sqrt(discriminant)];
  }
}

  