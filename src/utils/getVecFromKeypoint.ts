import { Keypoint } from "@tensorflow-models/hand-pose-detection"
import { Vector2, Vector3 } from "three";


export function getVec3FromKP(keypoint: Keypoint): Vector3 {
  const { x, y, z } = keypoint
  return new Vector3(x, -y, z ? -z : 0)
}

export function getVec2FromKP(keypoint: Keypoint): Vector2 {
  const { x, y } = keypoint
  return new Vector2(x, y)
}