attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

varying vec4 vFinalColor;

const int octaves = 7;
const float alpha = .50;
const float amp = .03;
const float freq = 10.0;
const float normalDelta = .0001;

varying vec4 normalWorldSpace;


float hash( float n ) { 
    return fract(sin(n)*753.5453123); 
}

float noiseF( in vec3 x ) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);

    float n = p.x + p.y*157.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
}

float noise(float x, float y, float z) {
    float noise = 0.0;
    float frequency = freq;
    for(int i = 0; i < octaves; i++) {
        float amplitude = pow(alpha, float(i));
        noise += amplitude*noiseF(vec3(x*frequency, y*frequency, z*frequency));
        frequency *= 2.0;
    }
    return amp*noise;
}

vec3 terrain(float x, float y, float z) {
    vec3 pos = normalize(vec3(x, y, z));
    float n = noise(pos.x, pos.y, pos.z);
    pos*=(1.0+n);
    return pos;
}

vec3 polarToCartesian(vec3 v) {
    return vec3(cos(v.x)*sin(v.y)*v.z, cos(v.y)*v.z, sin(v.x)*sin(v.y)*v.z);
}

vec3 cartesianToPolar(vec3 v) {
    float radius = sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    return vec3(atan(v.z,v.x), acos(v.y/radius), radius);
}

vec3 terrainNormal(float x, float y, float z) {
    vec3 polar = cartesianToPolar(vec3(x, y, z));
    vec3 polar1 = vec3(polar.x, polar.y+normalDelta, polar.z);
    vec3 polar2 = vec3(polar.x+normalDelta, polar.y, polar.z);

    vec3 cart = terrain(x, y, z);
    vec3 cart1 = polarToCartesian(polar1);
    cart1 = terrain(cart1.x, cart1.y, cart1.z);
    vec3 cart2 = polarToCartesian(polar2);
    cart2 = terrain(cart2.x, cart2.y, cart2.z);

    return normalize(cross(cart1-cart, cart2-cart));
}



void main(void) {
    vec4 worldPos = uMMatrix * vec4(aVertexPosition, 1.0);
    vec3 terrain = terrain(worldPos.x, worldPos.y, worldPos.z);
    gl_Position = uPMatrix * uVMatrix * vec4(terrain, 1.0);
}