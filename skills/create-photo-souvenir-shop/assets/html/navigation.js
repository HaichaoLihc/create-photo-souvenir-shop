export const ZONES = {
  overview: {
    pos: [-0.84, 1.67, 4.85],
    target: [0.18, 2.12, -1.2],
    title: "把旅途开成一间店",
    copy: "抬头与回望，都是你的旅途。",
  },
  memories: {
    pos: [-0.73, 1.55, 3.13],
    target: [0.55, 1.03, 2.63],
    title: "旅途，变成小物",
    copy: "个人纪念品，就在这张桌上。",
  },
  photobook: {
    pos: [-1.4, 1.53, 2.22],
    target: [-2.57, 1.5, 2.22],
    title: "把旅途，翻成一页页",
    copy: "左侧书架 · 点击画册封面翻阅。",
  },
  crafts: {
    pos: [-0.72, 1.55, 3.7],
    target: [-1.94, 1.48, 3.64],
    title: "让记忆，有了形状",
    copy: "照片里的形状与细节，变成可以端详的立体小物。",
  },
  cards: {
    pos: [1.72, 1.6, 1.95],
    target: [2.7, 1.61, 1.2],
    title: "每张卡片，都是一次出发",
    copy: "不同的明信片，把旅途印成不同的模样。",
  },
  ceiling: {
    pos: [-0.71, 1.68, 3.88],
    target: [-0.12, 2.85, 0.5],
    title: "抬头，有一座小花园",
    copy: "用纸张和颜色，让记忆挂在空中。",
  },
  back: {
    pos: [-0.44, 1.65, -3.69],
    target: [-0.39, 1.72, -5.58],
    title: "走到窗边",
    copy: "花器、纸物，还有从窗里落下的光。",
  },
};
export function positionAllowed(x, z, colliders, margin = 0.17) {
  if (x < -2.45 || x > 2.16 || z < -5.1 || z > 5.28) return false;
  return !colliders.some((c) =>
    c.r
      ? Math.hypot(x - c.x, z - c.z) < c.r + margin
      : Math.abs(x - c.x) < c.w / 2 + margin &&
        Math.abs(z - c.z) < c.d / 2 + margin,
  );
}
