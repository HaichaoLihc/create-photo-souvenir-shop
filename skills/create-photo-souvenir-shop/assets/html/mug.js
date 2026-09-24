import * as T from "./assets/three.module.js";
import {
  cyl,
  lathe,
  ring,
  tube,
  mesh,
  textured,
  cream,
  navy,
} from "./materials.js";
export function makeMug(g, body = cream, inner = navy, photo = null) {
  lathe(
    g,
    [
      [0.065, 0],
      [0.084, 0.009],
      [0.09, 0.025],
      [0.092, 0.205],
      [0.091, 0.23],
      [0.083, 0.231],
      [0.081, 0.217],
      [0.078, 0.034],
      [0.008, 0.032],
    ],
    body,
  );
  cyl(g, 0.079, 0.078, 0.003, 0, 0.034, 0, inner);
  lathe(
    g,
    [
      [0.082, 0.039],
      [0.083, 0.216],
      [0.087, 0.229],
    ],
    inner,
  );
  ring(g, 0.088, 0.003, 0, 0.23, 0, inner);
  const h = mesh(
    g,
    new T.TorusGeometry(0.066, 0.014, 10, 36, Math.PI * 1.7),
    body,
    0.098,
    0.126,
    0,
  );
  h.rotation.z = -Math.PI * 0.85;
  if (photo) {
    const m = textured(photo, 0.29);
    mesh(
      g,
      new T.CylinderGeometry(0.0923, 0.087, 0.174, 56, 1, true, -0.65, 1.3),
      m,
      0,
      0.125,
      0,
    );
  }
}
