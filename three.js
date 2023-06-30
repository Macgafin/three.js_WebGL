const geometry = new THREE.InstancedBufferGeometry();

// positions
const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
positions.setXYZ(0, -0.5, 0.5, 0.0);
positions.setXYZ(1, 0.5, 0.5, 0.0);
positions.setXYZ(2, -0.5, -0.5, 0.0);
positions.setXYZ(3, 0.5, -0.5, 0.0);
geometry.addAttribute('position', positions);

// uvs
const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
uvs.setXYZ(0, 0.0, 0.0);
uvs.setXYZ(1, 1.0, 0.0);
uvs.setXYZ(2, 0.0, 1.0);
uvs.setXYZ(3, 1.0, 1.0);
geometry.addAttribute('uv', uvs);

// index
geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([ 0, 2, 1, 2, 3, 1 ]), 1));

const uniforms = {
	uTime: { value: 0 },
	uRandom: { value: 1.0 },
	uDepth: { value: 2.0 },
	uSize: { value: 0.0 },
	uTextureSize: { value: new THREE.Vector2(this.width, this.height) },
	uTexture: { value: this.texture },
	uTouch: { value: null }
};

const material = new THREE.RawShaderMaterial({
	uniforms,
	vertexShader: glslify(require('../../../shaders/particle.vert')),
	fragmentShader: glslify(require('../../../shaders/particle.frag')),
	depthTest: false,
	transparent: true
});

// particle.vert

void main() {
	// displacement
	vec3 displaced = offset;
	// randomise
	displaced.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5) * uRandom;
	float rndz = (random(pindex) + snoise_1_2(vec2(pindex * 0.1, uTime * 0.1)));
	displaced.z += rndz * (random(pindex) * 2.0 * uDepth);

	// particle size
	float psize = (snoise_1_2(vec2(uTime, pindex) * 0.5) + 2.0);
	psize *= max(grey, 0.2);
	psize *= uSize;

	// (...)
}

// particle.frag

void main() {
	// pixel color
	vec4 colA = texture2D(uTexture, puv);

	// greyscale
	float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
	vec4 colB = vec4(grey, grey, grey, 1.0);

	// circle
	float border = 0.3;
	float radius = 0.5;
	float dist = radius - distance(uv, vec2(0.5));
	float t = smoothstep(0.0, border, dist);

	// final color
	color = colB;
	color.a = t;

	// (...)
}

// discard pixels darker than threshold #22
if (discard) {
	numVisible = 0;
	threshold = 34;

	const img = this.texture.image;
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	canvas.width = this.width;
	canvas.height = this.height;
	ctx.scale(1, -1); // flip y
	ctx.drawImage(img, 0, 0, this.width, this.height * -1);

	const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	originalColors = Float32Array.from(imgData.data);

	for (let i = 0; i < this.numPoints; i++) {
		if (originalColors[i * 4 + 0] > threshold) numVisible++;
	}
}

for (let i = 0, j = 0; i < this.numPoints; i++) {
	if (originalColors[i * 4 + 0] <= threshold) continue;

	offsets[j * 3 + 0] = i % this.width;
	offsets[j * 3 + 1] = Math.floor(i / this.width);

	indices[j] = i;

	angles[j] = Math.random() * Math.PI;

	j++;
}

// particle.vert

void main() {
	// (...)

	// touch
	float t = texture2D(uTouch, puv).r;
	displaced.z += t * 20.0 * rndz;
	displaced.x += cos(angle) * t * 20.0 * rndz;
	displaced.y += sin(angle) * t * 20.0 * rndz;

	// (...)
}
