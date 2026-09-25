import * as T from './assets/three.module.js';
import { box,cyl,ring,tube,mesh,lathe,rounded,plane,mat,textured,cream,silver } from './materials.js';

export const EXTENDED_FAMILIES=['tray','bowl','vase','candle','tea-towel','scarf','pouch','bookmark','ornament','print','relief'];
export function buildExtended(g,d,tex,accent) {
  const finish=d.finish || 'ceramic';
  const roughness={wood:.85,ceramic:.28,metal:.3,textile:.96,paper:.9}[finish] ?? .6;
  const surface=mat(d.color || '#c99e6b',roughness,finish==='metal'?.65:0);
  const face=(p,w,h,z,y=h/2)=> {
    const ratio=tex.image.width/tex.image.height,width=Math.min(w,h*ratio);
    return plane(p,width,width/ratio,tex,0,y,z);
  };
  switch(d.slug) {
    case 'tray': {
      box(g,.34,.014,.23,0,.012,0,surface);
      for(const x of [-.166,.166]) box(g,.013,.04,.23,x,.027,0,surface);
      for(const z of [-.11,.11]) box(g,.32,.04,.013,0,.027,z,surface);
      const p=face(g,.30,.19,0); p.rotation.x=-Math.PI/2; p.position.set(0,.02,0);
      for(const x of [-.19,.19]) {const h=ring(g,.037,.006,x,.035,0,silver); h.scale.x=.6;}
      break;
    }
    case 'bowl': case 'vase': {
      const vase=d.slug==='vase';
      lathe(g,d.profile || (vase ? [[.05,0],[.08,.01],[.10,.12],[.065,.24],[.044,.31],[.038,.31],[.055,.24],[.084,.12],[.065,.025],[0,.025]] :
        [[.045,0],[.06,.01],[.12,.06],[.145,.12],[.136,.13],[.112,.064],[.048,.024],[0,.024]]),surface);
      // A separate source-derived ceramic decal; the silhouette remains editable via profile.
      const patch=face(g,vase?.085:.10,vase?.13:.065,vase?.098:.124,vase?.14:.078);
      patch.rotation.x=vase?0:-.35;
      break;
    }
    case 'candle':
      cyl(g,.065,.061,.15,0,.075,0,surface);
      cyl(g,.059,.059,.006,0,.151,0,cream);
      cyl(g,.0015,.0015,.018,0,.16,0,mat('#393126'),8);
      face(g,.078,.105,.064,.076);
      // Separate lid, visibly part of the vessel rather than a printed box.
      cyl(g,.068,.068,.013,.12,.01,0,surface);
      break;
    case 'tea-towel': case 'scarf': {
      const w=d.slug==='scarf'?.42:.31,h=d.slug==='scarf'?.7:.42;
      const geo=new T.PlaneGeometry(w,h,20,24),p=geo.attributes.position;
      for(let i=0;i<p.count;i++) p.setZ(i,Math.sin(p.getX(i)*65)*.014);
      geo.computeVertexNormals();
      mesh(g,geo,textured(tex,.96,{side:T.DoubleSide}),0,h/2,0);
      for(let i=0;i<16;i++) tube(g,[[-w/2+i*w/15,0,0],[-w/2+i*w/15,-.024,0]],.0014,cream);
      break;
    }
    case 'pouch':
      rounded(g,.28,.18,.065,.035,mat(d.color || '#c99e6b',.96));
      face(g,.235,.14,.035,.09);
      tube(g,[[-.10,.181,0],[.10,.181,0]],.003,silver);
      ring(g,.012,.0025,.105,.172,.021,silver,false);
      break;
    case 'bookmark':
      rounded(g,.065,.26,.002,.008,surface); face(g,.055,.24,.002,.13);
      tube(g,[[0,.25,0],[.02,.30,0],[.03,.23,.014]],.002,accent);
      for(let i=0;i<6;i++) tube(g,[[.03,.235,.014],[.025+i*.002,.19,.014]],.0009,accent);
      break;
    case 'ornament': {
      const shape=new T.Shape(),points=d.outline || [[.5,1],[1,.5],[.5,0],[0,.5]];
      points.forEach(([x,y],i)=>i?shape.lineTo((x-.5)*.2,y*.24):shape.moveTo((x-.5)*.2,y*.24)); shape.closePath();
      mesh(g,new T.ExtrudeGeometry(shape,{depth:.01,bevelEnabled:false}),surface);
      face(g,.11,.13,.011,.12);
      ring(g,.015,.002,0,.265,0,silver,false);
      tube(g,[[0,.278,0],[-.025,.35,0],[.025,.35,0],[0,.278,0]],.0018,cream);
      break;
    }
    case 'print':
      box(g,.38,.48,.026,0,.24,0,surface);
      box(g,.35,.45,.008,0,.24,.015,cream); face(g,.315,.415,.02,.24);
      break;
    case 'relief': {
      box(g,.26,.24,.035,0,.12,0,surface);
      const shape=new T.Shape(),points=d.outline || [[0,0],[1,0],[.8,.6],[.5,1],[.2,.4]];
      points.forEach(([x,y],i)=>i?shape.lineTo((x-.5)*.23,y*.20):shape.moveTo((x-.5)*.23,y*.20)); shape.closePath();
      mesh(g,new T.ExtrudeGeometry(shape,{depth:.022,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2}),accent,0,.025,.016);
      face(g,.11,.10,.043,.10);
      break;
    }
    default:return false;
  }
  return true;
}
