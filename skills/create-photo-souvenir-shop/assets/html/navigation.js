import { COLLECTION } from './collection.js';
export const ZONES = COLLECTION.scene.views;
export function positionAllowed(x,z,colliders,margin=.17) {
  const r=COLLECTION.scene.room;
  if(Math.abs(x)>r.width/2-margin-.06 || Math.abs(z)>r.depth/2-margin-.06) return false;
  return !colliders.some(c=>{
    const a=c.rotation || 0,dx=x-c.x,dz=z-c.z;
    const lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);
    return c.r ? Math.hypot(dx,dz)<c.r+margin : Math.abs(lx)<c.w/2+margin && Math.abs(lz)<c.d/2+margin;
  });
}
