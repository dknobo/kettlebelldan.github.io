import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { xyz } from './engine'

export type FocusAxis = 'all' | 'x' | 'y' | 'z'

export type BoardView = {
  size: number
  grid: number[]
  givenMask: boolean[]
  selected: number | null
  hovered: number | null
  conflicts: Set<number>
  related: Set<number>
  completeCells: Set<number>
  won: boolean
  focusAxis: FocusAxis
  focusLayer: number
}

type CellObj = {
  root: THREE.Group
  glass: THREE.Mesh
  glassMat: THREE.MeshPhysicalMaterial
  digit: THREE.Sprite
  digitMat: THREE.SpriteMaterial
  rim: THREE.LineSegments
  rimMat: THREE.LineBasicMaterial
  base: THREE.Vector3
  index: number
}

export type SudokuScene = {
  setView: (view: BoardView) => void
  setExplode: (t: number) => void
  setAutoRotate: (on: boolean) => void
  pick: (clientX: number, clientY: number) => number | null
  resize: () => void
  dispose: () => void
}

const GOLD = new THREE.Color('#e7c37a')
const TEAL = new THREE.Color('#7ee0d6')
const ROSE = new THREE.Color('#ff7d8a')
const VIOLET = new THREE.Color('#c7b3ff')
const WHITE = new THREE.Color('#f4f1ea')

function paintDigit(canvas: HTMLCanvasElement, n: number) {
  const s = canvas.width
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, s, s)
  if (n <= 0) return
  ctx.font = n > 9 ? '700 132px Outfit, Fraunces, system-ui, sans-serif' : '650 168px Outfit, Fraunces, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(255,255,255,0.55)'
  ctx.shadowBlur = 28
  ctx.fillText(String(n), s / 2, s / 2 + 6)
}

function makeDigitTextures(): { textures: THREE.CanvasTexture[]; canvases: HTMLCanvasElement[] } {
  const textures: THREE.CanvasTexture[] = []
  const canvases: HTMLCanvasElement[] = []
  for (let n = 0; n <= 16; n++) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    paintDigit(canvas, n)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    textures.push(tex)
    canvases.push(canvas)
  }
  return { textures, canvases }
}

export function createSudokuScene(canvas: HTMLCanvasElement): SudokuScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x070814, 0.045)

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80)
  camera.position.set(4.2, 3.9, 6.8)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.enablePan = false
  controls.minDistance = 4.2
  controls.maxDistance = 16
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.55
  controls.target.set(-0.95, 0.45, 0)

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  const bloom = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth || 1, canvas.clientHeight || 1), 0.42, 0.55, 0.82)
  const output = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(bloom)
  composer.addPass(output)

  const hemi = new THREE.HemisphereLight(0xb9d4ff, 0x1a1020, 0.7)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff1d2, 1.35)
  key.position.set(6, 9, 4)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x76e0d8, 0.55)
  fill.position.set(-7, 2, -4)
  scene.add(fill)
  const rim = new THREE.PointLight(0xc9a2ff, 2.2, 18, 2)
  rim.position.set(0, -2.5, 4)
  scene.add(rim)

  const bgTex = new THREE.TextureLoader().load('/sudoku3d/nebula.jpg')
  bgTex.colorSpace = THREE.SRGBColorSpace
  bgTex.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = bgTex
  const bgGeo = new THREE.SphereGeometry(28, 48, 32)
  const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, side: THREE.BackSide, depthWrite: false })
  const bg = new THREE.Mesh(bgGeo, bgMat)
  scene.add(bg)

  const starGeo = new THREE.BufferGeometry()
  const starCount = 420
  const starPos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const r = 8 + Math.random() * 18
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    starPos[i * 3 + 2] = r * Math.cos(phi)
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xf4e7c5, size: 0.035, transparent: true, opacity: 0.75, depthWrite: false }),
  )
  scene.add(stars)

  const board = new THREE.Group()
  scene.add(board)

  const { textures: digitTextures, canvases: digitCanvases } = makeDigitTextures()
  void document.fonts.ready.then(() => {
    if (disposed) return
    digitCanvases.forEach((canvas, n) => {
      paintDigit(canvas, n)
      digitTextures[n].needsUpdate = true
    })
  })
  const cellGeo = new RoundedBoxGeometry(0.86, 0.86, 0.86, 3, 0.12)
  const rimGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, 0.9, 0.9))

  const cells: CellObj[] = []
  let view: BoardView | null = null
  let explode = 0.22
  let disposed = false
  let winPulse = 0

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xe8c98a,
    metalness: 0.85,
    roughness: 0.28,
    emissive: 0x3a2a10,
    emissiveIntensity: 0.35,
  })
  const frame = new THREE.Group()
  scene.add(frame)

  function rebuildFrame(size: number, span: number) {
    while (frame.children.length) {
      const child = frame.children.pop()!
      frame.remove(child)
    }
    const half = span / 2
    const edge = new THREE.CylinderGeometry(0.018, 0.018, span + 0.08, 8)
    const corners: [number, number, number][] = []
    for (const x of [-half, half]) for (const y of [-half, half]) for (const z of [-half, half]) corners.push([x, y, z])
    const pairs: [number, number][] = []
    for (let i = 0; i < corners.length; i++) {
      for (let j = i + 1; j < corners.length; j++) {
        let same = 0
        if (corners[i][0] === corners[j][0]) same++
        if (corners[i][1] === corners[j][1]) same++
        if (corners[i][2] === corners[j][2]) same++
        if (same === 2) pairs.push([i, j])
      }
    }
    for (const [a, b] of pairs) {
      const p1 = new THREE.Vector3(...corners[a])
      const p2 = new THREE.Vector3(...corners[b])
      const mid = p1.clone().add(p2).multiplyScalar(0.5)
      const mesh = new THREE.Mesh(edge, frameMat)
      mesh.position.copy(mid)
      mesh.lookAt(p2)
      mesh.rotateX(Math.PI / 2)
      frame.add(mesh)
    }
    void size
  }

  function ensureCells(size: number) {
    const count = size * size * size
    while (cells.length < count) {
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xb7d7ff,
        metalness: 0.05,
        roughness: 0.18,
        transmission: 0.72,
        transparent: true,
        opacity: 1,
        thickness: 0.55,
        ior: 1.42,
        attenuationColor: new THREE.Color('#4f8ea8'),
        attenuationDistance: 1.8,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        emissive: new THREE.Color('#10202c'),
        emissiveIntensity: 0.25,
        envMapIntensity: 1.1,
      })
      const glass = new THREE.Mesh(cellGeo, glassMat)
      const digitMat = new THREE.SpriteMaterial({
        map: digitTextures[0],
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const digit = new THREE.Sprite(digitMat)
      digit.scale.set(0.62, 0.62, 0.62)
      const rimMat = new THREE.LineBasicMaterial({ color: 0xe7c37a, transparent: true, opacity: 0.22 })
      const rimLine = new THREE.LineSegments(rimGeo, rimMat)
      const root = new THREE.Group()
      root.add(glass, digit, rimLine)
      board.add(root)
      const index = cells.length
      cells.push({
        root,
        glass,
        glassMat,
        digit,
        digitMat,
        rim: rimLine,
        rimMat,
        base: new THREE.Vector3(),
        index,
      })
    }
    for (let i = 0; i < cells.length; i++) {
      cells[i].root.visible = i < count
      cells[i].index = i
    }
  }

  function layout(size: number) {
    const spacing = 1.05 + explode * 0.85
    const origin = -((size - 1) * spacing) / 2
    for (let i = 0; i < size * size * size; i++) {
      const { x, y, z } = xyz(i, size)
      const cell = cells[i]
      cell.base.set(origin + x * spacing, origin + y * spacing, origin + z * spacing)
      cell.root.position.copy(cell.base)
    }
    const span = (size - 1) * spacing + 1.15
    rebuildFrame(size, span)
    controls.minDistance = size === 3 ? 4.1 : 5.4
    controls.maxDistance = size === 3 ? 14 : 18
  }

  function applyView() {
    if (!view) return
    const { size, grid, givenMask, selected, hovered, conflicts, related, completeCells, won, focusAxis, focusLayer } = view
    ensureCells(size)
    layout(size)

    for (let i = 0; i < size * size * size; i++) {
      const cell = cells[i]
      const { x, y, z } = xyz(i, size)
      const value = grid[i]
      const given = givenMask[i]
      const isSel = selected === i
      const isHover = hovered === i
      const isConflict = conflicts.has(i)
      const isRelated = related.has(i)
      const isComplete = completeCells.has(i)
      const focused =
        focusAxis === 'all' ||
        (focusAxis === 'x' && x === focusLayer) ||
        (focusAxis === 'y' && y === focusLayer) ||
        (focusAxis === 'z' && z === focusLayer)

      cell.root.visible = true
      cell.root.scale.setScalar(isSel ? 1.08 : isHover ? 1.04 : 1)
      cell.glassMat.opacity = focused ? 1 : 0.16
      cell.glassMat.transmission = focused ? 0.72 : 0.2
      cell.digit.visible = focused && value > 0
      cell.rim.visible = focused

      if (value > 0) {
        cell.digitMat.map = digitTextures[value]
        cell.digitMat.needsUpdate = true
        cell.digitMat.color.copy(given ? GOLD : isConflict ? ROSE : isComplete ? TEAL : WHITE)
        cell.digitMat.opacity = given ? 0.95 : 0.88
      } else {
        cell.digitMat.opacity = 0
      }

      if (won) {
        cell.glassMat.color.set('#f0d7a2')
        cell.glassMat.emissive.set('#e7c37a')
        cell.glassMat.emissiveIntensity = 0.55 + Math.sin(winPulse * 3 + i) * 0.2
        cell.rimMat.color.copy(GOLD)
        cell.rimMat.opacity = 0.7
      } else if (isConflict) {
        cell.glassMat.color.set('#ffb3ba')
        cell.glassMat.emissive.set('#ff5d72')
        cell.glassMat.emissiveIntensity = 0.55
        cell.rimMat.color.copy(ROSE)
        cell.rimMat.opacity = 0.7
      } else if (isSel) {
        cell.glassMat.color.set('#d8fff8')
        cell.glassMat.emissive.set('#4ef0dc')
        cell.glassMat.emissiveIntensity = 0.62
        cell.rimMat.color.copy(TEAL)
        cell.rimMat.opacity = 0.85
      } else if (isHover) {
        cell.glassMat.color.set('#e8ddff')
        cell.glassMat.emissive.set('#b89cff')
        cell.glassMat.emissiveIntensity = 0.42
        cell.rimMat.color.copy(VIOLET)
        cell.rimMat.opacity = 0.55
      } else if (isComplete) {
        cell.glassMat.color.set('#c8fff2')
        cell.glassMat.emissive.set('#2ee0c0')
        cell.glassMat.emissiveIntensity = 0.38
        cell.rimMat.color.copy(TEAL)
        cell.rimMat.opacity = 0.45
      } else if (isRelated) {
        cell.glassMat.color.set('#cdd9ff')
        cell.glassMat.emissive.set('#3a4d88')
        cell.glassMat.emissiveIntensity = 0.32
        cell.rimMat.color.set('#9eb0ff')
        cell.rimMat.opacity = 0.38
      } else if (given) {
        cell.glassMat.color.set('#d9c39a')
        cell.glassMat.emissive.set('#5a4318')
        cell.glassMat.emissiveIntensity = 0.28
        cell.rimMat.color.copy(GOLD)
        cell.rimMat.opacity = 0.35
      } else {
        cell.glassMat.color.set('#9ec4e4')
        cell.glassMat.emissive.set('#10202c')
        cell.glassMat.emissiveIntensity = 0.18
        cell.rimMat.color.set('#d7c399')
        cell.rimMat.opacity = 0.16
      }

      cell.glassMat.transparent = true
      cell.digit.scale.setScalar(size === 4 ? 0.52 : 0.64)
    }
  }

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function pick(clientX: number, clientY: number): number | null {
    if (!view) return null
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const meshes = cells.filter((c) => c.root.visible).map((c) => c.glass)
    const hits = raycaster.intersectObjects(meshes, false)
    if (!hits.length) return null
    const mesh = hits[0].object as THREE.Mesh
    const found = cells.find((c) => c.glass === mesh)
    if (!found) return null
    const { x, y, z } = xyz(found.index, view.size)
    const focused =
      view.focusAxis === 'all' ||
      (view.focusAxis === 'x' && x === view.focusLayer) ||
      (view.focusAxis === 'y' && y === view.focusLayer) ||
      (view.focusAxis === 'z' && z === view.focusLayer)
    return focused ? found.index : null
  }

  const clock = new THREE.Clock()
  let raf = 0
  const loop = () => {
    if (disposed) return
    const t = clock.getElapsedTime()
    winPulse = t
    controls.update()
    bg.rotation.y = t * 0.012
    stars.rotation.y = t * 0.018
    if (view?.won) {
      board.rotation.y = t * 0.35
      const burst = 1 + Math.sin(t * 2) * 0.04
      board.scale.setScalar(burst)
    } else {
      board.rotation.y = 0
      board.scale.setScalar(1)
    }
    if (view) {
      const size = view.size
      for (let i = 0; i < size * size * size; i++) {
        const cell = cells[i]
        const bob = Math.sin(t * 1.3 + i * 0.45) * 0.012
        cell.root.position.y = cell.base.y + bob
        if (view.conflicts.has(i)) {
          cell.glassMat.emissiveIntensity = 0.35 + (Math.sin(t * 8) * 0.5 + 0.5) * 0.45
        }
      }
    }
    composer.render()
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  function resize() {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    bloom.setSize(w, h)
    const wide = w / h > 1.05
    controls.target.set(wide ? -0.95 : 0, wide ? 0.45 : 0.1, 0)
  }
  resize()

  return {
    setView(next) {
      view = next
      applyView()
    },
    setExplode(t) {
      explode = Math.max(0, Math.min(1, t))
      applyView()
    },
    setAutoRotate(on) {
      controls.autoRotate = on
    },
    pick,
    resize,
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      controls.dispose()
      composer.dispose()
      renderer.dispose()
      cellGeo.dispose()
      rimGeo.dispose()
      starGeo.dispose()
      bgGeo.dispose()
      bgTex.dispose()
      bgMat.dispose()
      digitTextures.forEach((tex) => tex.dispose())
      cells.forEach((c) => {
        c.glassMat.dispose()
        c.digitMat.dispose()
        c.rimMat.dispose()
      })
    },
  }
}
