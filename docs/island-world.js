const mainAngle = 0.63;
const sin = Math.sin(mainAngle);
const cos = Math.cos(mainAngle);

export const sites = [
  {id:'education', u:-6.25, v:-4.4, color:0x997b98, lamp:0xf1b9eb, seed:2, signX:-.52},
  {id:'academic', u:-0.32, v:-6.3, color:0xa88391, lamp:0xffbd9f, seed:3, signX:.48},
  {id:'internships', u:5.72, v:-4.4, color:0x6e819a, lamp:0xaad8fe, seed:4, signX:.40},
  {id:'skills', u:-7.12, v:2.55, color:0x6f928b, lamp:0xa5edd8, seed:5, signX:-.53},
  {id:'life', u:-2.26, v:6.9, color:0x786b8a, lamp:0xffcc91, seed:6, signX:.37},
  {id:'contact', u:5.94, v:4.1, color:0xae7894, lamp:0xffa5c6, seed:7, signX:-.34},
];

function seeded(seed) {
  return () => {
    seed = Math.imul(1664525, seed) + 1013904223 | 0;
    return (seed >>> 0) / 4294967296;
  };
}

export function createIslandWorld(THREE, scene, models, names) {
  const standard = (color, options) => new THREE.MeshStandardMaterial({color,roughness:.82,...options});
  const basic = (color, options) => new THREE.MeshBasicMaterial({color,...options});
  const box = new THREE.BoxGeometry();
  const leaf = new THREE.IcosahedronGeometry(1,0);
  const post = new THREE.CylinderGeometry(.7,1,1,6);
  const rings = new THREE.RingGeometry(.91,1,48);
  const point = new THREE.SphereGeometry(1,8,6);
  const tea = basic(0xffd8ab);
  const wood = standard(0x594454);
  const path = standard(0x77738e,{roughness:.47});
  const treeWarm = [standard(0xe391ab),standard(0xd17a9d),standard(0xffb6bc)];
  const treeCool = [standard(0x679b94),standard(0x537b84),standard(0x91b8a9)];
  const foamMaterial = basic(0xac9eda,{transparent:true,opacity:.26,depthWrite:false});
  const signSupport = standard(0x654958);
  const signTrim = standard(0xd3a887,{metalness:.32,roughness:.69});
  const signFace = new THREE.PlaneGeometry(1,1);
  const glarePaint = document.createElement('canvas');
  glarePaint.width = glarePaint.height = 64;
  const brush = glarePaint.getContext('2d');
  const gradient = brush.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,255,255,.8)');
  gradient.addColorStop(.24,'rgba(255,255,255,.38)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  brush.fillStyle=gradient;
  brush.fillRect(0,0,64,64);
  const glareMap = new THREE.CanvasTexture(glarePaint);

  function shape(parent, geometry, material, x,y,z, width=1,height=1,depth=1) {
    const mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(x,y,z);
    mesh.scale.set(width,height,depth);
    parent.add(mesh);
    return mesh;
  }

  function glare(parent,x,y,z,color,width,height,opacity=.7) {
    const light = new THREE.Sprite(new THREE.SpriteMaterial({map:glareMap,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
    light.scale.set(width,height,1);
    light.position.set(x,y,z);
    parent.add(light);
    return light;
  }

  function worldPoint(u,v) {
    return new THREE.Vector3(u*cos+v*sin,0,-u*sin+v*cos);
  }

  const sky = new THREE.HemisphereLight(0xffe1ea,0x6861a1,2.35);
  scene.add(sky);
  const key = new THREE.DirectionalLight(0xffdbb7,2.22);
  key.position.set(-7,15,10);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0b9ff,1.42);
  rim.position.set(7,6,-15);
  scene.add(rim);

  const waterTime = {value:0};
  const daylight = {value:0};
  const water = new THREE.Mesh(new THREE.PlaneGeometry(86,86),new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, uniforms:{time:waterTime, daylight},
    vertexShader:`varying vec2 sea; varying vec2 screenPoint;
      void main(){sea=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);screenPoint=gl_Position.xy/gl_Position.w;}`,
    fragmentShader:`uniform float time; uniform float daylight; varying vec2 sea; varying vec2 screenPoint;
      void main(){
        vec2 p=sea;
        float wave=sin(screenPoint.y*62.0+sin(screenPoint.x*13.0+time*.35)*.29+time*.36);
        float window=smoothstep(.21,.89,sin(p.x*1.57+p.y*.90)*sin(p.x*.48-p.y*1.36));
        float lines=pow(max(0.0,wave),20.0)*window;
        float light=1.0-smoothstep(0.0,16.0,length(vec2(p.x*.91,p.y)));
        vec3 color=mix(vec3(.080,.084,.16),vec3(.245,.225,.404),light);
        vec3 daySea=mix(vec3(.60,.77,.86),vec3(.34,.64,.75),light);
        color=mix(color,daySea,daylight);
        color+=mix(vec3(.24,.20,.30),vec3(.59,.76,.84),daylight)*lines*.24;
        float vignette=(1.0-smoothstep(.69,1.0,abs(screenPoint.x)))*(1.0-smoothstep(.72,1.0,abs(screenPoint.y)));
        gl_FragColor=vec4(color,.85*(1.0-smoothstep(8.0,19.0,length(p)))*vignette);
      }`,
  }));
  water.rotation.x=-Math.PI/2;
  water.position.y=-1.39;
  water.renderOrder=-2;
  scene.add(water);

  function terrain(group, seed, color, district) {
    const random=seeded(seed);
    const count=14;
    const steps=[{y:-1.43,s:.85},{y:-1.10,s:1.09},{y:-.48,s:1.04},{y:-.13,s:1.025},{y:0,s:1}];
    const radius=Array.from({length:count},(_,i)=>{
      const angle=i*Math.PI*2/count+.18;
      if(district==='life')return 2.05/Math.pow(Math.pow(Math.cos(angle),4)+Math.pow(Math.sin(angle),4),.25);
      return 2.18+random()*.25+Math.sin(angle*3+seed)*.13;
    });
    const vertices=[];
    const colors=[];
    const base=new THREE.Color(color);
    const rock=new THREE.Color(0x59476c);
    const cvec=(level,i)=>{
      const angle=i*Math.PI*2/count+.18;
      const {s,y}=steps[level];
      return [Math.cos(angle)*radius[i]*s,y,Math.sin(angle)*radius[i]*s*.92];
    };
    function triangle(a,b,c,tint) {
      vertices.push(...a,...b,...c);
      for(let k=0;k<3;k++) colors.push(tint.r,tint.g,tint.b);
    }
    for(let i=0;i<count;i++) {
      const j=(i+1)%count;
      for(let level=0;level<steps.length-1;level++) {
        const tint=rock.clone().lerp(base,[.12,.25,.4,.87][level]).multiplyScalar(.76+random()*.48);
        const a=cvec(level,i),b=cvec(level,j),c=cvec(level+1,j),d=cvec(level+1,i);
        triangle(a,d,b,tint);
        triangle(b,d,c,tint.clone().multiplyScalar(.89+random()*.20));
      }
      const cap=base.clone().multiplyScalar(.86+random()*.21);
      triangle([0,0,0],cvec(4,j),cvec(4,i),cap);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geo.computeVertexNormals();
    const ground=shape(group,geo,standard(0xffffff,{vertexColors:true,side:THREE.DoubleSide}),0,0,0);
    const foam=shape(group,rings,foamMaterial,0,-1.375,0,2.62,2.38,1);
    foam.rotation.x=-Math.PI/2;
    foam.renderOrder=1;
    if(!district) return ground;

    const tarmac=shape(group,box,path,0,.015,1.6,3.36,.045,.61);
    tarmac.rotation.y=.06;
    const tint=basic(0xffcdbb,{transparent:true,opacity:.25,depthWrite:false});
    const reflection=shape(group,new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glareMap,transparent:true,color:0xfabca7,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}),.13,.045,1.66,2.55,.70,1);
    reflection.rotation.x=-Math.PI/2;
    reflection.renderOrder=3;
    if(district==='life') {
      shape(group,box,path,1.68,.02,.72,.56,.054,1.74);
      const curb=standard(0xceb1bc);
      const drain=standard(0x493f58);
      shape(group,box,curb,-.33,.046,1.31,2.54,.055,.072);
      shape(group,box,curb,1.405,.045,.38,.075,.055,1.78);
      shape(group,box,drain,1.53,.050,.84,.12,.009,.39);
      for(let i=0;i<5;i++) {
        shape(group,box,tint,-1.24+i*.15,.051,1.715,.083,.006,.34);
        shape(group,box,curb,1.53,.056,.70+i*.07,.113,.009,.019);
      }
      shape(group,box,tint,1.70,.048,.24,.205,.005,.024);
      shape(group,box,tint,1.81,.048,.42,.024,.005,.38);
    }else{
      for(let i=0;i<4;i++)shape(group,box,tint,-.58+i*.39,.045,1.62,.31,.006,.18);
    }
    return ground;
  }

  function tree(group,x,z,scale,blush=false) {
    shape(group,post,wood,x,.26*scale,z,.05*scale,.52*scale,.05*scale);
    const palette=blush?treeWarm:treeCool;
    const top=shape(group,leaf,palette[0],x,.65*scale,z,.29*scale,.46*scale,.30*scale);
    top.rotation.set(.18,.55,.16);
    shape(group,leaf,palette[1],x-.14*scale,.52*scale,z+.02*scale,.23*scale,.29*scale,.22*scale);
    shape(group,leaf,palette[2],x+.11*scale,.76*scale,z-.07*scale,.19*scale,.31*scale,.20*scale);
  }

  function streetlight(group,x,z,color) {
    shape(group,post,wood,x,.49,z,.034,.98,.034);
    shape(group,box,wood,x,.96,z,.20,.078,.16);
    shape(group,box,tea,x,.91,z,.13,.075,.12);
    glare(group,x,.9,z,color,.64,.64,.55);
  }

  function signTexture(label, accent) {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 768;
    textureCanvas.height = 216;
    const ctx = textureCanvas.getContext('2d');
    const wash = ctx.createLinearGradient(0,0,768,216);
    wash.addColorStop(0,'#524155');
    wash.addColorStop(1,'#35273e');
    ctx.fillStyle = wash;
    ctx.fillRect(0,0,768,216);
    ctx.lineWidth = 5;
    ctx.strokeStyle = accent;
    ctx.strokeRect(13,13,742,190);
    ctx.lineWidth = 1.7;
    ctx.strokeRect(22,22,724,172);
    ctx.fillStyle = accent;
    for(const x of [34,734]) {
      for(const y of [32,184]) {
        ctx.beginPath();
        ctx.arc(x,y,4.5,0,Math.PI*2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#fff1e3';
    ctx.font = '500 150px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label,384,109,656);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  function entranceSign(island, site, label) {
    const width = label.length>3 ? 2.06 : 1.70;
    const height = .58;
    const x = site.signX;
    const z = 1.66;
    const bottom = .032;
    const stakeHeight = .61;
    shape(island,box,signSupport,x,bottom+stakeHeight/2,z,.095,stakeHeight,.092);
    shape(island,box,signTrim,x,bottom+.048,z,.15,.09,.16);
    const sign = new THREE.Group();
    sign.position.set(x,.61,z);
    sign.rotation.order = 'YXZ';
    sign.rotation.set(-.51,.19,0);
    island.add(sign);
    shape(sign,box,signTrim,0,0,0,width+.020,height+.020,.072);
    const material = basic(0xffffff,{
      map:signTexture(label,`#${site.lamp.toString(16).padStart(6,'0')}`),
      toneMapped:false,
    });
    shape(sign,signFace,material,0,0,.038,width,height);
    shape(sign,signFace,material,0,0,-.038,width,height).rotation.y = Math.PI;
    island.userData.sign = {object:sign,width,height,material};
  }

  const selectedObjects = new Map();
  const clickable=[];
  for(const site of sites) {
    const group=new THREE.Group();
    group.position.copy(worldPoint(site.u,site.v));
    group.rotation.y=site.id==='life'?.245:.18;
    group.userData.islandId=site.id;
    scene.add(group);
    terrain(group,site.seed,site.color,site.id);
    const model=models[site.id]();
    group.add(model);
    tree(group,-1.64,-.71,.88,site.seed%2===0);
    tree(group,1.63,-.92,.96,site.seed%2===1);
    tree(group,-1.62,.61,.65,true);
    streetlight(group,1.57,1.23,site.lamp);
    entranceSign(group,site,names.get(site.id));
    const haloMaterial=basic(site.lamp,{transparent:true,opacity:0,depthWrite:false});
    const halo=shape(group,rings,haloMaterial,0,-1.37,0,2.72,2.51,1);
    halo.rotation.x=-Math.PI/2;
    halo.renderOrder=1;
    const glimmer=glare(scene,group.position.x,-1.25,group.position.z,site.lamp,5.7,3.7,.19);
    glimmer.renderOrder=-1;
    selectedObjects.set(site.id,{group,model,haloMaterial,glimmer});
    clickable.push(group);
  }

  const beacon = new THREE.Group();
  beacon.position.copy(worldPoint(.86,.28));
  beacon.scale.setScalar(.7);
  beacon.position.y=-.37;
  scene.add(beacon);
  terrain(beacon,22,0xa48a9e);
  const wall=standard(0xe9a295);
  const pale=standard(0xf1ccb3);
  const roof=standard(0xae5e86);
  const base=shape(beacon,post,wall,0,.95,0,.55,1.9,.55);
  base.rotation.y=Math.PI/6;
  shape(beacon,post,pale,0,.08,0,.74,.16,.74);
  shape(beacon,post,pale,0,.88,0,.60,.21,.60);
  shape(beacon,post,pale,0,1.73,0,.62,.17,.62);
  shape(beacon,post,roof,0,1.94,0,.71,.17,.71);
  shape(beacon,post,tea,0,2.28,0,.44,.48,.44);
  shape(beacon,new THREE.ConeGeometry(.69,.55,6),roof,0,2.77,0);
  shape(beacon,point,tea,0,3.11,0,.092,.092,.092);
  const lighthouseGlow=glare(beacon,0,2.31,0,0xffb175,2.14,2.14,.93);
  for(let i=0;i<6;i++) {
    const a=i*Math.PI/3;
    shape(beacon,box,roof,Math.cos(a)*.45,2.25,Math.sin(a)*.45,.055,.52,.055);
  }
  shape(beacon,box,wood,0,.25,.50,.24,.43,.08);
  tree(beacon,-.95,-.53,1,true);
  tree(beacon,1.05,.44,1,true);
  const memories = [0xffc275,0x8bdfd9,0xf5a6d1,0xb6b0ff,0xffa79c].map((color,i)=>{
    const orb=new THREE.Group();
    const radius=[.12,.13,.16,.09,.11][i];
    shape(orb,point,standard(color,{emissive:color,emissiveIntensity:.34,roughness:.2}),0,0,0,radius,radius,radius);
    shape(orb,point,basic(0xffefe5),-.30*radius,.45*radius,.63*radius,.032,.032,.032);
    glare(orb,0,0,0,color,radius*4.6,radius*4.6,.49);
    beacon.add(orb);
    return orb;
  });
  const trail=basic(0xffc99e,{transparent:true,opacity:.76});
  for(const site of sites) {
    const distance=Math.hypot(site.u-.86,site.v-.28);
    if(distance<3.5) continue;
    for(let d=1.45;d<distance-2.4;d+=.48) {
      const t=d/distance;
      const p=worldPoint(THREE.MathUtils.lerp(.86,site.u,t),THREE.MathUtils.lerp(.28,site.v,t)+Math.sin(t*Math.PI)*.39);
      shape(scene,point,trail,p.x,-1.36,p.z,.044,.037,.044);
    }
  }

  const mist=new THREE.Group();
  scene.add(mist);
  const random=seeded(89);
  for(let i=0;i<6;i++) {
    const u=(i%2?1:-1)*(8.8+random()*5.0);
    const p=worldPoint(u,-6.5+i*2.6);
    const cloud=glare(mist,p.x,.45+random()*.8,p.z,i%2?0xd7a5db:0x929add,3.5+random()*2,1.2,.24);
    cloud.material.blending=THREE.NormalBlending;
  }

  const buoys=[];
  const buoyMat = basic(0xffdea9);
  for(const [u,v] of [[-8.8,-.6],[-3.2,.3],[7.1,1.0],[1.1,5.3],[-4.9,5.3],[8.4,-1.6]]) {
    const p=worldPoint(u,v);
    const buoy=new THREE.Group();
    buoy.position.set(p.x,-1.28,p.z);
    scene.add(buoy);
    shape(buoy,post,roof,0,.01,0,.13,.18,.13);
    shape(buoy,point,buoyMat,0,.14,0,.055,.055,.055);
    glare(buoy,0,.13,0,0xffbb93,.49,.49,.74);
    buoys.push(buoy);
  }

  function setDaylight(day) {
    daylight.value = Number(day);
    sky.color.setHex(day ? 0xf3faff : 0xffe1ea);
    sky.groundColor.setHex(day ? 0xb8afaa : 0x6861a1);
    key.color.setHex(day ? 0xfff5e6 : 0xffdbb7);
    rim.color.setHex(day ? 0xffecdb : 0xa0b9ff);
    rim.intensity = day ? .58 : 1.42;
    mist.visible = !day;
  }

  function tick(elapsed,delta,highlight,reduced) {
    waterTime.value=reduced?0:elapsed;
    lighthouseGlow.material.opacity=daylight.value?.18:reduced?.93:(.82+.13*Math.sin(elapsed*1.4));
    if(!reduced) {
      mist.position.x=Math.sin(elapsed*.14)*.31;
      buoys.forEach((buoy,i)=>{buoy.position.y=-1.28+Math.sin(elapsed*1.12+i)*.059;});
    }
    memories.forEach((orb,i)=>{
      const angle=i*Math.PI*2/memories.length+(reduced?.12:elapsed*.23);
      orb.position.set(Math.cos(angle)*1.40,1.69+Math.sin(angle*2)*.35,Math.sin(angle)*1.4);
    });
    for(const [id,{group,model,haloMaterial,glimmer}] of selectedObjects) {
      const hovered=id===highlight;
      const step=reduced?1:1-Math.exp(-delta*10);
      haloMaterial.opacity=THREE.MathUtils.lerp(haloMaterial.opacity,hovered?.72:0,step);
      group.position.y=THREE.MathUtils.lerp(group.position.y,hovered?.17:0,step);
      glimmer.material.opacity=THREE.MathUtils.lerp(glimmer.material.opacity,hovered?.36:.17,step);
      group.userData.sign.material.color.setHex(hovered ? 0xffe6cc : 0xffffff);
      model.userData.animate?.({elapsed,delta,hovered,reduced});
    }
  }

  return {clickable, setDaylight, tick};
}
