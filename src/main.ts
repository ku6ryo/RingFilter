import {
  AmbientLight,
  DirectionalLight,
  Group,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
  Material,
  MeshStandardMaterial,
  Texture,
} from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./global.css"
import Stats from "stats.js";
import { SupportedModels, createDetector } from "@tensorflow-models/hand-pose-detection"
const { MediaPipeHands } = SupportedModels
import style from "./style.module.scss"
import { Pane } from "tweakpane";
import { getUserMedia } from "./getUserMedia";
import ringModelUrl from "../public/ring.glb"
import { createAxes } from "./createAxes";
import { getVec2FromKP, getVec3FromKP } from "./utils/getVecFromKeypoint";

const stats = new Stats()
document.body.appendChild(stats.dom)

const container = document.createElement("div")
container.className = style.container
document.body.appendChild(container)

const buttonContainer = document.createElement("div")
buttonContainer.className = style.buttonContainer
document.body.appendChild(buttonContainer)

const watchX = 0
const watchY = 0
const watchZ = 0
const watchRX = 97.83
const watchRY = 0
const watchRZ = 86.09

async function loadModel(url: string): Promise<GLTF> {
  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.load(url, (model) => {
      resolve(model)
    },
    undefined,
    (e) => {
      reject(e)
    })
  })
}

function isMesh(child: any): child is Mesh {
  return child.isMesh
}

async function applyOccluderMaterial(model: GLTF) {
  model.scene.traverse((child) => {
    if (isMesh(child)) {
      child.renderOrder = 2;
      if (child.name === "Occluder") {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            m.colorWrite = false
          })
        } else {
          child.material.colorWrite = false
        }
        child.renderOrder = 1;
      }
    }
  })
}

;(async () => {
  const stream = await getUserMedia()
  if (!stream) {
    throw new Error("media stream not available")
  }
  const mainCanvas = document.createElement("canvas")
  mainCanvas.className = style.camera
  const mainContext = mainCanvas.getContext("2d")!
  container.appendChild(mainCanvas)
  const cameraVideo = document.createElement("video");

  cameraVideo.srcObject = stream;
  cameraVideo.play();
  await (new Promise((resolve, reject) => {
    cameraVideo.addEventListener("playing", () => {
      resolve(0)
    })
  }))
  const vw = cameraVideo.videoWidth
  const vh = cameraVideo.videoHeight
  mainCanvas.width = vw
  mainCanvas.height = vh
  mainCanvas.style.maxHeight = `calc(100vw * ${vh / vw})`
  mainCanvas.style.maxWidth = `calc(100vh * ${vw / vh})`

  const renderer = new WebGLRenderer()
  renderer.setClearAlpha(0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(90, vw / vh, 1, 10)
  camera.position.set(0, 0, 2);

  camera.aspect = vw / vh
  renderer.setSize(vw, vh)

  for (let i = 0; i < 6; i++) {
    const light = new DirectionalLight()
    light.position.set(
      Math.cos(Math.PI * 2 / 6 * i + Math.PI / 2) * 6,
      0,
      Math.sin(Math.PI * 2 / 6 * i + Math.PI / 2) * 6
    )
    light.intensity = 1
    light.lookAt(0, 0, 0)
    scene.add(light)
  }
  const amb = new AmbientLight(0xFFFFFF, 1)
  scene.add(amb)

  const ringModel = await loadModel(ringModelUrl)
  const ringContainer = new Group()
  const watch = ringModel.scene

  watch.position.set(watchX, watchY, watchZ)
  watch.scale.set(0.3, 0.3, 0.3)
  watch.rotation.set(
    watchRX / 180 * Math.PI,
    watchRY / 180 * Math.PI,
    watchRZ / 180 * Math.PI,
  )
  applyOccluderMaterial(ringModel)
  ringContainer.add(watch)

  scene.add(ringContainer)

  /*
  const axes = createAxes(1, 1)
  watchContainer.add(axes)
  */

  renderer.render(scene, camera)

  const detector = await createDetector(MediaPipeHands, {
    runtime: "mediapipe",
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/",
  })

  const pane = new Pane()
  pane.addInput({
    x: watchX,
  }, "x", { min: -2, max: 2}).on("change", (e) => {
    watch.position.set(e.value, watch.position.y, watch.position.z)
  })
  pane.addInput({
    y: watchY,
  }, "y", { min: -2, max: 2}).on("change", (e) => {
    watch.position.set(watch.position.x, e.value, watch.position.z)
  })
  pane.addInput({
    z: watchZ,
  }, "z", { min: -2, max: 2 }).on("change", (e) => {
    watch.position.set(watch.position.x, watch.position.y, e.value)
  })
  pane.addInput({
    rx: watchRX,
  }, "rx", { min: 0, max: 360}).on("change", (e) => {
    watch.rotation.set(e.value / 180 * Math.PI, watch.rotation.y, watch.rotation.z)
  })
  pane.addInput({
    ry: watchRY,
  }, "ry", { min: 0, max: 360}).on("change", (e) => {
    watch.rotation.set(watch.rotation.x, e.value / 180 * Math.PI, watch.rotation.z)
  })
  pane.addInput({
    rz: watchRZ,
  }, "rz", { min: 0, max: 360}).on("change", (e) => {
    watch.rotation.set(watch.rotation.x, watch.rotation.y, e.value / 180 * Math.PI)
  })
  pane.element.classList.add(style.control)
  document.body.appendChild(pane.element)

  const loop = async () => {
    stats.begin()
    mainContext.drawImage(cameraVideo, 0, 0, mainCanvas.width, mainCanvas.height)
    const hands = await detector.estimateHands(mainCanvas, {
      flipHorizontal: false,
      staticImageMode: false,
    })
    if (hands.length > 0) {
      console.log("detected")
      const hand = hands[0]
      const p13 = getVec3FromKP(hand.keypoints3D![13])
      const p14 = getVec3FromKP(hand.keypoints3D![14])
      const p15 = getVec3FromKP(hand.keypoints3D![15])

      const v0 = p13.clone().sub(p14)
      const v1 = p15.clone().sub(p14)

      const handX = v0.clone().normalize()
      const handY = (() => {
        if (hand.handedness === "Left") {
          return v1.clone().normalize().cross(v0).normalize()
        } else {
          return v0.clone().normalize().cross(v1).normalize()
        }
      })()

      const modelX = new Vector3(1, 0, 0)
      const modelY = new Vector3(0, 1, 0)

      const ay = modelY.clone().cross(handY).normalize()
      const qy = new Quaternion().setFromAxisAngle(ay, Math.acos(handY.dot(modelY)))

      const rotatedX = modelX.clone().applyQuaternion(qy).normalize()
      const ax = rotatedX.clone().cross(handX).normalize()
      const qx = new Quaternion().setFromAxisAngle(ax, Math.acos(handX.dot(rotatedX)))

      const q = new Quaternion().multiplyQuaternions(qx, qy)
      ringContainer.rotation.setFromQuaternion(q)

      const root2 = getVec2FromKP(hand.keypoints[13])
      const middle2 = getVec2FromKP(hand.keypoints[14])
      const ringPos2 = root2.clone().lerp(middle2, 0.8)
      const fingerRoot = ringPos2
      const pos = new Vector3(
        (fingerRoot.x - cameraVideo.videoWidth / 2) * 4 / cameraVideo.videoHeight,
        - (fingerRoot.y - cameraVideo.videoHeight / 2) * 4 / cameraVideo.videoHeight,
        0
      )
      ringContainer.position.lerp(pos, 0.5)

      const ringSize = root2.distanceTo(middle2) / 4
      const ringScale = ringSize / 60
      ringContainer.scale.set(ringScale, ringScale, ringScale)
    }
    mainContext.drawImage(renderer.domElement, 0, 0, mainCanvas.width, mainCanvas.height)

    renderer.render(scene, camera)
    stats.end()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
})()