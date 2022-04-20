import {
  BoxGeometry,
  MeshPhongMaterial,
  Color,
  Group,
  Mesh,
} from "three";

/**
 * Creates XYZ axes objects. 
 */
export function createAxes(color = 1, scale = 1) {
  const g = new Group();
  const x = new Mesh(
    new BoxGeometry(),
    new MeshPhongMaterial({ color: new Color(1 * color, 0, 0) })
  );
  x.scale.set(1, 0.1, 0.1)
  x.position.set(0.5, 0, 0);
  const y = new Mesh(
    new BoxGeometry(),
    new MeshPhongMaterial({ color: new Color(0, 1 * color, 0) })
  );
  y.scale.set(0.1, 1, 0.1)
  y.position.set(0, 0.5, 0);
  const z = new Mesh(
    new BoxGeometry(),
    new MeshPhongMaterial({ color: new Color(0, 0, 1 * color) })
  );
  z.scale.set(0.1, 0.1, 1)
  z.position.set(0, 0, 0.5);
  g.add(x);
  g.add(y);
  g.add(z);
  g.scale.multiplyScalar(scale);
  return g;
}