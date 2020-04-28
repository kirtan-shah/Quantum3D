uniform sampler2D tex1;
uniform sampler2D tex2;

varying vec2 vUv;

vec4 getTexture(sampler2D texelToLinearTexture) {
    return mapTexelToLinear(texture2D(texelToLinearTexture, vUv));
}

void main() {
    gl_FragColor = getTexture(tex1) + vec4(1.0) * getTexture(tex2);
}