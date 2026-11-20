import * as THREE from './vendor/three.module.min.js';
import {createIslandCamera} from './island-camera.js?v=32.0';
import {createIslandWorld} from './island-world.js?v=33.0';
import {makeAcademicModels} from './island-models-academic.js?v=31.0';
import {makeLifeModels} from './island-models-life.js?v=31.0';

export function setupIslandScene(home) {
  const stage=home.querySelector('[data-island-stage]');
  const canvas=stage.querySelector('canvas');
  const resetButton=home.querySelector('[data-reset-islands]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.13;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,130);
  const models={...makeAcademicModels(THREE),...makeLifeModels(THREE)};
  const labels=[...stage.querySelectorAll('[data-island]')];
  const names=new Map(labels.map(link=>[link.dataset.island,link.textContent.trim()]));
  const world=createIslandWorld(THREE,scene,models,names);
  const islandById=new Map(world.clickable.map(group=>[group.userData.islandId,group]));
  const ray=new THREE.Raycaster();
  const aim=new THREE.Vector2();
  const anchor=new THREE.Vector3();
  let hovered=null;
  let highlightedLink=null;
  let active=false;
  let visible=true;
  let contextLost=false;
  let dirty=true;
  let frame=0;
  let lastTime=0;
  let elapsed=0;
  let width=1,height=1;

  function pick(clientX,clientY) {
    const rect=canvas.getBoundingClientRect();
    aim.set(2*(clientX-rect.left)/rect.width-1,1-2*(clientY-rect.top)/rect.height);
    if(Math.abs(aim.x)>1||Math.abs(aim.y)>1)return null;
    ray.setFromCamera(aim,camera);
    const hits=ray.intersectObjects(world.clickable,true);
    for(const hit of hits) {
      if(hit.object.material?.transparent) continue;
      let node=hit.object;
      while(node && !node.userData.islandId) node=node.parent;
      if(node) return node.userData.islandId;
    }
    return null;
  }

  function setHighlight() {
    canvas.classList.toggle('is-picking',Boolean(hovered));
    dirty=true;
  }

  const orbit=createIslandCamera({
    THREE,camera,canvas,reduced,frame:{width:19.9,height:12.35,center:[0,.15,.18]},
    onPoint:pick,
    onHover(id){hovered=id;setHighlight();},
    onSelect(id){
      if(islandById.has(id)) location.hash='/'+id;
    },
  });

  function updateLabels() {
    for(const label of labels) {
      const sign=islandById.get(label.dataset.island).userData.sign;
      let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
      for (const x of [-sign.width/2,sign.width/2]) {
        for (const y of [-sign.height/2,sign.height/2]) {
          anchor.set(x,y,0).applyMatrix4(sign.object.matrixWorld).project(camera);
          const screenX=(anchor.x*.5+.5)*width;
          const screenY=(.5-anchor.y*.5)*height;
          left=Math.min(left,screenX);
          right=Math.max(right,screenX);
          top=Math.min(top,screenY);
          bottom=Math.max(bottom,screenY);
        }
      }
      const x=(left+right)/2;
      const y=(top+bottom)/2;
      label.classList.toggle('is-out-of-view',x<0||x>width||y<0||y>height);
      label.style.setProperty('--projected-x',`${x.toFixed(1)}px`);
      label.style.setProperty('--projected-y',`${y.toFixed(1)}px`);
      label.style.setProperty('--projected-w',`${(right-left).toFixed(1)}px`);
      label.style.setProperty('--projected-h',`${(bottom-top).toFixed(1)}px`);
    }
  }

  function resize() {
    const rect=stage.getBoundingClientRect();
    if(rect.width===0||rect.height===0)return;
    width=rect.width;
    height=rect.height;
    renderer.setSize(width,height,false);
    orbit.resize(width,height);
    dirty=true;
  }

  function schedule() {
    if(!frame && active && visible && !document.hidden && !contextLost) frame=requestAnimationFrame(draw);
  }

  function draw(now) {
    frame=0;
    if(!active||!visible||contextLost||document.hidden)return;
    const delta=lastTime?Math.min((now-lastTime)/1000,.052):1/60;
    lastTime=now;
    const moved=orbit.tick(delta);
    if(!reduced.matches||moved||dirty) {
      elapsed+=delta;
      world.tick(elapsed,delta,highlightedLink||hovered,reduced.matches);
      renderer.render(scene,camera);
      stage.classList.add('is-ready');
      updateLabels();
      dirty=false;
    }
    resetButton.hidden=orbit.isOverview() && document.activeElement!==resetButton;
    schedule();
  }

  for(const link of labels) {
    link.addEventListener('focus',()=>{
      highlightedLink=link.dataset.island;
      setHighlight();
      if(link.classList.contains('is-out-of-view')) {
        orbit.focus(islandById.get(link.dataset.island).position);
      }
    });
    link.addEventListener('blur',()=>{
      highlightedLink=null;
      setHighlight();
    });
  }

  resetButton.addEventListener('click',()=>{
    orbit.reset();
    canvas.focus({preventScroll:true});
  });
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    if(visible){lastTime=0;schedule();}
  }).observe(stage);
  reduced.addEventListener('change',()=>{dirty=true;});
  document.addEventListener('visibilitychange',()=>{lastTime=0;schedule();});
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    contextLost=true;
    stage.classList.remove('is-ready');
    resetButton.hidden=true;
  });
  canvas.addEventListener('webglcontextrestored',()=>{
    contextLost=false;
    dirty=true;
    schedule();
  });

  return {setActive(value) {
    active=value;
    if(active){lastTime=0;resize();orbit.reset();schedule();}
    else {cancelAnimationFrame(frame);frame=0;hovered=highlightedLink=null;setHighlight();}
  }};
}
