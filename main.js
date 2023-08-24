import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import heightMapSrc from './src/texture/height.png'
import { createNoise2D, createNoise3D } from 'simplex-noise'
import alea from 'alea'

const textureLoader = new THREE.TextureLoader()

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * Terrain
 */
const prng = alea('seed')
const noise2D = createNoise2D(prng)
const noise3D = createNoise3D(prng)

const heightMap = textureLoader.load(heightMapSrc)
const material = new THREE.MeshStandardMaterial({
	side: THREE.DoubleSide,
	// wireframe: true,
	// displacementMap: heightMap,
	// displacementScale: 0.5,
	// aoMap: heightMap,
	// aoMapIntensity: 0.5,
})
// const geometry = new THREE.PlaneGeometry(10, 10, 500, 500, 500)
const radius = 5
// const geometry = new THREE.IcosahedronGeometry(radius, 80)
const geometry = new THREE.BoxGeometry(1, 1, 1, 160, 160, 160)
// const geometry = new THREE.SphereGeometry(radius, 251, 251)
// geometry.rotateX(-Math.PI * 0.5)

const position = geometry.getAttribute('position')
console.log(position)
let scale = 10

let offset = 14

const noise = noise3D

for (let i = 0; i < position.count; i++) {
	const ix = position.getX(i)
	const iz = position.getZ(i)
	const iy = position.getY(i)

	const iPos = new THREE.Vector3(ix, iy, iz).normalize().multiplyScalar(radius)
	const [x, y, z] = iPos

	let down =
		(noise(x * 0.01 * scale, z * 0.02 * scale, y * 0.05 * scale + offset) *
			0.5 +
			0.5) *
		0.6
	let low =
		noise(x * 0.02 * scale, z * 0.03 * scale, y * 0.03 * scale + offset) * 0.5 +
		0.5
	let base =
		(noise(x * 0.2 * scale, z * 0.2 * scale, y * 0.2 * scale + offset) * 0.5 +
			0.5) *
		low *
		low
	let high =
		Math.abs(noise(x * 2 * scale, z * 2 * scale, y * 2 * scale + offset)) *
		3 *
		base *
		base
	let medium =
		noise(x * 1.5 * scale, z * 1.5 * scale, y * 1.5 * scale + offset) *
		0.1 *
		base
	// y += noise2D(x * 1.5, z * 1.5) * 3 * y * y
	// y += (noise2D(x * 1.5, z * 1.5) * 0.5 + 0.5) * 0.2

	const pos = new THREE.Vector3(x, y, z).normalize()
	const increment = (low + low + base + base + medium + high - down) / scale

	pos.multiplyScalar(radius + increment)

	// console.log(pos.x, pos.y, pos.z)
	position.setXYZ(i, pos.x, pos.y, pos.z)

	// console.log(x, y, z)
	// position.setY(
	// 	i,
	// 	value
	// )
}
position.needsUpdate = true
geometry.computeVertexNormals()

const mesh = new THREE.Mesh(geometry, material)
mesh.castShadow = true
mesh.receiveShadow = true
scene.add(mesh)

// const seaGeom = new THREE.PlaneGeometry(10, 10, 10, 20, 20, 20)
const seaGeom = new THREE.SphereGeometry(radius + 0.12, 90, 90)
const seaMat = new THREE.MeshPhysicalMaterial({
	color: 0x44b7ff,
	opacity: 0.7,
	transparent: true,
	transmission: 0.5,
	side: THREE.DoubleSide,
})
// seaGeom.rotateX(-Math.PI * 0.5)
const sea = new THREE.Mesh(seaGeom, seaMat)
// sea.position.y = 0.18
mesh.add(sea)

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}
/**
 * Camera
 */
const fov = 75
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)
camera.position.set(0, 2, 12)
camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
const axesHelper = new THREE.AxesHelper(3)
scene.add(axesHelper)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
	logarithmicDepthBuffer: true,
})
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)
handleResize()

/**
 * OrbitControls
 */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const ambientLight = new THREE.AmbientLight(0x6644aa, 0.2)
const dirLight = new THREE.DirectionalLight(0xffddaa, 1)
dirLight.position.set(5, 3, 2)
dirLight.castShadow = true
dirLight.shadow.mapSize.height = 1024
dirLight.shadow.mapSize.width = 1024
dirLight.shadow.bias = -0.005
scene.add(ambientLight)
camera.add(dirLight)
dirLight.position.y = 4
scene.add(camera)

/**
 * Three js Clock
 */
const clock = new THREE.Clock()

/**
 * frame loop
 */
function tic() {
	/**
	 * tempo trascorso dal frame precedente
	 */
	const deltaTime = clock.getDelta()
	/**
	 * tempo totale trascorso dall'inizio
	 */
	const time = clock.getElapsedTime()

	// dirLight.position.x = Math.sin(time * 0.5) * radius * 2
	// dirLight.position.z = Math.cos(time * 0.5) * radius * 2
	mesh.rotation.y += deltaTime * 0.05

	controls.update()

	renderer.render(scene, camera)

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}
