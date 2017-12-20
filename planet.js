var Sphere = function() {
}

Sphere.MAX_LEVEL = 1;
Sphere.PLANET_DETAIL = 8; //number of triangle strips used
Sphere.SPLIT_DIST = 1;
Sphere.vertexPositionBuffer = null;
Sphere.model = mat4.create();

8

Sphere.draw = function(shaderProgram, camera) {
    Sphere.drawFace(shaderProgram, camera, 0, 0, 1, Sphere.frontFaceTransform());
    Sphere.drawFace(shaderProgram, camera, 0, 0, 1, Sphere.backFaceTransform());
    Sphere.drawFace(shaderProgram, camera, 0, 0, 1, Sphere.topFaceTransform());
    Sphere.drawFace(shaderProgram, camera, 0, 0, 1, Sphere.bottomFaceTransform());
    Sphere.drawFace(shaderProgram, camera, 0, 0, 1, Sphere.leftFaceTransform());
    Sphere.drawFace(shaderProgram, camera, 0, 0, 1, Sphere.rightFaceTransform());
}

Sphere.frontFaceTransform = function() {
    return mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0,0,1));
}

Sphere.backFaceTransform = function() {
    var out = mat4.rotate(mat4.create(), mat4.create(), Math.PI, vec3.fromValues(0,1,0));
    return mat4.translate(mat4.create(), out, vec3.fromValues(0,0,1));
}

Sphere.topFaceTransform = function() {
    var out = mat4.rotate(mat4.create(), mat4.create(), Math.PI/2, vec3.fromValues(1,0,0));
    return mat4.translate(mat4.create(), out, vec3.fromValues(0,0,1));
}

Sphere.bottomFaceTransform = function() {
    var out = mat4.rotate(mat4.create(), mat4.create(), Math.PI/2, vec3.fromValues(-1,0,0));
    return mat4.translate(mat4.create(), out, vec3.fromValues(0,0,1));
}

Sphere.leftFaceTransform = function() {
    var out = mat4.rotate(mat4.create(), mat4.create(), Math.PI/2, vec3.fromValues(0,1,0));
    return mat4.translate(mat4.create(), out, vec3.fromValues(0,0,1));
}

Sphere.rightFaceTransform = function() {
    var out = mat4.rotate(mat4.create(), mat4.create(), Math.PI/2, vec3.fromValues(0,-1,0));
    return mat4.translate(mat4.create(), out, vec3.fromValues(0,0,1));
}

Sphere.drawFace = function(shaderProgram, camera, x, y, level, transform) {

    var eye = camera.eye;

    //find distance to closest point of tile
    var topLeft = vec3.normalize(vec3.create(), vec3.transformMat4(vec3.create(), vec3.fromValues(-1.0, 1.0, 0), transform));
    var topRight = vec3.normalize(vec3.create(), vec3.transformMat4(vec3.create(), vec3.fromValues(1.0, 1.0, 0), transform));
    var bottomLeft = vec3.normalize(vec3.create(), vec3.transformMat4(vec3.create(), vec3.fromValues(-1.0, -1.0, 0), transform));
    var bottomRight = vec3.normalize(vec3.create(), vec3.transformMat4(vec3.create(), vec3.fromValues(1.0, -1.0, 0), transform));
    var center = vec3.normalize(vec3.create(), vec3.transformMat4(vec3.create(), vec3.fromValues(0, 0, 0), transform));

    var topLeftDist = vec3.distance(topLeft, eye);
    var topRightDist = vec3.distance(topRight, eye);
    var bottomLeftDist = vec3.distance(bottomLeft, eye);
    var bottomRightDist = vec3.distance(bottomRight, eye);
    var centerDist = vec3.distance(center, eye);

    var minDist = Math.min(Math.min(Math.min(Math.min(topLeftDist, topRightDist), bottomLeftDist), bottomRightDist), centerDist);
    var tileLevel = -Math.log(minDist)/Math.log(2) + Sphere.SPLIT_DIST;

    if(tileLevel < level || tileLevel > Sphere.MAX_LEVEL) {
        Sphere.drawPlane(shaderProgram, camera, transform);
    } else {
        var halfScale = vec3.fromValues(0.5,0.5,0.5);
        
        var topLeftTransform = mat4.scale(mat4.create(), transform, halfScale);
        mat4.translate(topLeftTransform, topLeftTransform, vec3.fromValues(-1.0, 1.0, 0.0));


        var topRightTransform = mat4.scale(mat4.create(), transform, halfScale);
        mat4.translate(topRightTransform, topRightTransform, vec3.fromValues(1.0, 1.0, 0.0));

        var bottomLeftTransform = mat4.scale(mat4.create(), transform, halfScale);
        mat4.translate(bottomLeftTransform, bottomLeftTransform, vec3.fromValues(-1.0, -1.0, 0.0));

        var bottomRightTransform = mat4.scale(mat4.create(), transform, halfScale);
        mat4.translate(bottomRightTransform, bottomRightTransform, vec3.fromValues(1.0, -1.0, 0.0));


        Sphere.drawFace(shaderProgram, camera, x*2, y*2, level+1, topLeftTransform);
        Sphere.drawFace(shaderProgram, camera, x*2+1, y*2, level+1, topRightTransform);
        Sphere.drawFace(shaderProgram, camera, x*2, y*2+1, level+1, bottomLeftTransform);
        Sphere.drawFace(shaderProgram, camera, x*2+1, y*2+1, level+1, bottomRightTransform);
    }

}


Sphere.initBuffers = function(gl) {
	Sphere.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.vertexPositionBuffer);
    var vertices = [];
    for(var i = 0; i < Sphere.PLANET_DETAIL; i++) {
        for(var j = 0; j<=Sphere.PLANET_DETAIL; j++) {
            vertices.push(-1 + 2*j/Sphere.PLANET_DETAIL);
            vertices.push(-1 + 2*(i+1)/Sphere.PLANET_DETAIL);
            vertices.push(0);
            vertices.push(-1 + 2*j/Sphere.PLANET_DETAIL);
            vertices.push(-1 + 2*i/Sphere.PLANET_DETAIL);
            vertices.push(0);
        }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    Sphere.vertexPositionBuffer.itemSize = 3;
    Sphere.vertexPositionBuffer.numItemsPerStrip = 2*(Sphere.PLANET_DETAIL+1);
    Sphere.vertexPositionBuffer.numItems = Sphere.vertexPositionBuffer.numItemsPerStrip*Sphere.PLANET_DETAIL;
}

Sphere.drawPlane = function(shaderProgram, camera, transform) {
    var modelAndCubeTransform = mat4.multiply(mat4.create(), this.model, transform);

    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, Sphere.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, camera.getPMatrix());
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, camera.getMVMatrix());
    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, modelAndCubeTransform);

    for(var i = 0; i < Sphere.vertexPositionBuffer.numItems; i += Sphere.vertexPositionBuffer.numItemsPerStrip) {
        gl.drawArrays(gl.TRIANGLE_STRIP, i, Sphere.vertexPositionBuffer.numItemsPerStrip);
    }

}

