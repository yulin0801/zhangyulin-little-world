let active = false;
let started;

export function setIslandHomeActive(value) {
  active=value;
  if(!active && !started) return;
  started ??= import('./island-scene.js?v=37.0')
    .then(({setupIslandScene})=>setupIslandScene(document.getElementById('home')))
    .catch(error=>console.warn('3D islands unavailable:',error.message));
  started.then(scene=>scene?.setActive(active));
}
