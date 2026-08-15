import * as THREE from 'three'
import { SHIP_RADIUS, TOWER_HEIGHT, type SimState } from './sim'

export type RocketScene = {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  ship: THREE.Group
  plumes: THREE.Mesh[]
  chopsticks: THREE.Group
  leftArm: THREE.Mesh
  rightArm: THREE.Mesh
  chopCarriage: THREE.Group
  dispose: () => void
  resize: () => void
  update: (s: SimState, camMode: 'chase' | 'tower' | 'pad') => void
}

export function createRocketScene(canvas: HTMLCanvasElement): RocketScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  renderer.shadowMap.enabled = true
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x7eb6d9)
  scene.fog = new THREE.Fog(0x9ec9e6, 400, 2800)

  const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 5000)

  const hemi = new THREE.HemisphereLight(0xc8e7ff, 0x3d4a32, 0.85)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.35)
  sun.position.set(-180, 320, 120)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -200
  sun.shadow.camera.right = 200
  sun.shadow.camera.top = 220
  sun.shadow.camera.bottom = -80
  scene.add(sun)

  // ground / gulf
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(2400, 64),
    new THREE.MeshStandardMaterial({ color: 0x6b8f4e, roughness: 1 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(2200, 48),
    new THREE.MeshStandardMaterial({ color: 0x2f6f8e, roughness: 0.35, metalness: 0.1 }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(0, -0.2, 900)
  scene.add(water)

  // pad
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(28, 32, 2.2, 32),
    new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.8 }),
  )
  pad.position.y = 1.1
  pad.receiveShadow = true
  scene.add(pad)

  const mount = new THREE.Mesh(
    new THREE.CylinderGeometry(12, 13, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x2b2f34, metalness: 0.4, roughness: 0.55 }),
  )
  mount.position.set(0, 5, 0)
  scene.add(mount)

  // tower lattice
  const tower = new THREE.Group()
  const steel = new THREE.MeshStandardMaterial({ color: 0x8d949c, metalness: 0.65, roughness: 0.4 })
  const postGeo = new THREE.BoxGeometry(2.2, TOWER_HEIGHT, 2.2)
  for (const [x, z] of [[-22, -6], [-22, 6], [-30, -6], [-30, 6]] as const) {
    const p = new THREE.Mesh(postGeo, steel)
    p.position.set(x, TOWER_HEIGHT / 2, z)
    p.castShadow = true
    tower.add(p)
  }
  for (let i = 0; i < 12; i++) {
    const y = 8 + i * 11
    const b = new THREE.Mesh(new THREE.BoxGeometry(10, 0.7, 14), steel)
    b.position.set(-26, y, 0)
    tower.add(b)
  }
  const lightning = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 28, 8), steel)
  lightning.position.set(-26, TOWER_HEIGHT + 12, 0)
  tower.add(lightning)
  scene.add(tower)

  const chopCarriage = new THREE.Group()
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(34, 2.4, 3.2),
    new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 0.7, roughness: 0.35 }),
  )
  leftArm.position.set(6, 0, -10)
  const rightArm = leftArm.clone()
  rightArm.position.set(6, 0, 10)
  const railMat = new THREE.MeshStandardMaterial({ color: 0xffce3a, metalness: 0.5, roughness: 0.4 })
  const lRail = new THREE.Mesh(new THREE.BoxGeometry(28, 0.5, 0.7), railMat)
  lRail.position.set(8, 1.4, -8.4)
  const rRail = lRail.clone()
  rRail.position.set(8, 1.4, 8.4)
  chopCarriage.add(leftArm, rightArm, lRail, rRail)
  scene.add(chopCarriage)

  // starship
  const ship = new THREE.Group()
  const steelBody = new THREE.MeshStandardMaterial({ color: 0xc5c8cc, metalness: 0.85, roughness: 0.28 })
  const tile = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.92, metalness: 0.05 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(SHIP_RADIUS, SHIP_RADIUS, 38, 28), steelBody)
  body.position.y = 19
  body.castShadow = true
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.35, SHIP_RADIUS, 14, 28), steelBody)
  nose.position.y = 45
  const heat = new THREE.Mesh(new THREE.CylinderGeometry(SHIP_RADIUS + 0.05, SHIP_RADIUS + 0.05, 36, 28, 1, true, Math.PI * 0.55, Math.PI * 0.9), tile)
  heat.position.y = 19
  const flapMat = new THREE.MeshStandardMaterial({ color: 0xb7bcc2, metalness: 0.7, roughness: 0.35 })
  const aftL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 7), flapMat)
  aftL.position.set(-5.2, 8, 0)
  const aftR = aftL.clone()
  aftR.position.x = 5.2
  const fwdL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 7, 5.5), flapMat)
  fwdL.position.set(-4.6, 40, 0)
  const fwdR = fwdL.clone()
  fwdR.position.x = 4.6
  // black tiles on windward flap faces
  const tileFace = new THREE.Mesh(new THREE.BoxGeometry(0.08, 8.6, 6.6), tile)
  tileFace.position.set(-5.85, 8, 0)
  const tileFaceR = tileFace.clone()
  tileFaceR.position.x = 5.85

  const bay = new THREE.Mesh(
    new THREE.CylinderGeometry(SHIP_RADIUS - 0.15, SHIP_RADIUS - 0.4, 4.2, 20),
    new THREE.MeshStandardMaterial({ color: 0x2a2d32, metalness: 0.5, roughness: 0.5 }),
  )
  bay.position.y = 1.6

  const plumes: THREE.Mesh[] = []
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0x7ecbff, transparent: true, opacity: 0.75 })
  const enginesSpec = [
    { az: 0, r: 1.15, vac: false },
    { az: (2 * Math.PI) / 3, r: 1.15, vac: false },
    { az: (4 * Math.PI) / 3, r: 1.15, vac: false },
    { az: Math.PI / 3, r: 2.85, vac: true },
    { az: Math.PI, r: 2.85, vac: true },
    { az: (5 * Math.PI) / 3, r: 2.85, vac: true },
  ]
  const bellSL = new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.8, roughness: 0.3 })
  enginesSpec.forEach((e) => {
    const geo = e.vac
      ? new THREE.CylinderGeometry(1.15, 0.55, 3.4, 16)
      : new THREE.CylinderGeometry(0.62, 0.42, 2.2, 14)
    const bell = new THREE.Mesh(geo, e.vac ? new THREE.MeshStandardMaterial({ color: 0x4e555e, metalness: 0.85, roughness: 0.25 }) : bellSL)
    bell.position.set(Math.cos(e.az) * e.r, e.vac ? -1.3 : -0.7, Math.sin(e.az) * e.r)
    ship.add(bell)
    const plume = new THREE.Mesh(
      new THREE.ConeGeometry(e.vac ? 0.85 : 0.48, e.vac ? 10 : 14, 10),
      plumeMat.clone(),
    )
    plume.rotation.x = Math.PI
    plume.position.set(bell.position.x, e.vac ? -7 : -8.5, bell.position.z)
    plume.visible = false
    ship.add(plume)
    plumes.push(plume)
  })

  // catch pins
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.6, roughness: 0.35 })
  const pinL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.4, 10), pinMat)
  pinL.rotation.z = Math.PI / 2
  pinL.position.set(-SHIP_RADIUS - 0.6, 34, 0)
  const pinR = pinL.clone()
  pinR.position.x = SHIP_RADIUS + 0.6

  ship.add(body, nose, heat, aftL, aftR, fwdL, fwdR, tileFace, tileFaceR, bay, pinL, pinR)
  scene.add(ship)

  const dummy = new THREE.Object3D()

  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }

  function update(s: SimState, camMode: 'chase' | 'tower' | 'pad') {
    ship.position.set(s.x, s.y, s.z)
    ship.rotation.order = 'YXZ'
    ship.rotation.y = s.yaw
    ship.rotation.x = s.pitch
    ship.rotation.z = s.roll

    s.engines.forEach((e, i) => {
      const p = plumes[i]
      p.visible = e.on && s.prop > 0 && s.running
      const mat = p.material as THREE.MeshBasicMaterial
      mat.opacity = e.kind === 'vac' ? 0.45 : 0.8
      p.scale.y = 0.85 + s.throttle * 0.5 + Math.random() * 0.12
    })

    const halfGap = 6.2 + s.chopOpen * 8.5
    leftArm.position.z = -halfGap
    rightArm.position.z = halfGap
    chopCarriage.position.set(-8, s.chopHeight, 0)

    dummy.position.copy(ship.position)
    if (camMode === 'chase') {
      const back = new THREE.Vector3(0, 18, 42)
      back.applyEuler(new THREE.Euler(s.pitch * 0.35, s.yaw, 0, 'YXZ'))
      camera.position.lerp(ship.position.clone().add(back).add(new THREE.Vector3(-18, 8, 0)), 0.08)
      camera.lookAt(ship.position.x, ship.position.y + 8, ship.position.z)
    } else if (camMode === 'tower') {
      camera.position.lerp(new THREE.Vector3(-70, s.chopHeight + 18, 55), 0.08)
      camera.lookAt(s.x, s.y, s.z)
    } else {
      camera.position.lerp(new THREE.Vector3(90, 28, 110), 0.08)
      camera.lookAt(0, 40, 0)
    }
    renderer.render(scene, camera)
  }

  resize()

  return {
    renderer,
    camera,
    scene,
    ship,
    plumes,
    chopsticks: chopCarriage,
    leftArm,
    rightArm,
    chopCarriage,
    dispose: () => {
      renderer.dispose()
    },
    resize,
    update,
  }
}
