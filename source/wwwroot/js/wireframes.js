(() => {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  const NODES = 140;               // total nodes
  const MAX_SPEED = 0.05;          // px/ms (scaled by dpr)
  const LINK_DIST = 170;           // px; connect when closer than this
  const MOUSE_RADIUS = 100;        // px; “locks” nodes to mouse
    const ATTRACT = 0.000002;         // attraction strength to mouse
  const BOUNCE = true;             // bounce off edges
  const FADE_TIME = 9000;          // ms life before respawn
  const SPAWN_MARGIN = 40;         // start slightly off screen to drift in
  const EDGE_RESPAWN = true;       // respawn from an edge

  let w, h, nodes = [], mouse = {x: -9999, y: -9999, active: false};
  let last = performance.now();

  function resize(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max){ return Math.random()*(max-min)+min; }
  function randSign(){ return Math.random()<0.5 ? -1 : 1; }

  function spawn(edgeOnly = EDGE_RESPAWN){
    let x, y, vx, vy;
    if(edgeOnly){
      const edge = Math.floor(Math.random()*4);
      if(edge===0){ x = rand(-SPAWN_MARGIN, -5); y = rand(0, h); vx = rand(0.05, MAX_SPEED); vy = rand(-MAX_SPEED, MAX_SPEED); }
      else if(edge===1){ x = rand(w+5, w+SPAWN_MARGIN); y = rand(0, h); vx = -rand(0.05, MAX_SPEED); vy = rand(-MAX_SPEED, MAX_SPEED); }
      else if(edge===2){ x = rand(0, w); y = rand(-SPAWN_MARGIN, -5); vx = rand(-MAX_SPEED, MAX_SPEED); vy = rand(0.05, MAX_SPEED); }
      else { x = rand(0, w); y = rand(h+5, h+SPAWN_MARGIN); vx = rand(-MAX_SPEED, MAX_SPEED); vy = -rand(0.05, MAX_SPEED); }
    }else{
      x = rand(0, w); y = rand(0, h);
      vx = rand(-MAX_SPEED, MAX_SPEED); vy = rand(-MAX_SPEED, MAX_SPEED);
    }
    return {
      x, y, vx, vy,
      r: rand(1.1, 2.1),
      born: performance.now(),
      life: rand(FADE_TIME*0.6, FADE_TIME*1.2)
    };
  }

  function init(){
    resize();
    nodes = [];
    for(let i=0;i<NODES;i++) nodes.push(spawn(false));
    requestAnimationFrame(tick);
  }

  function tick(t){
    const dt = t - last; last = t;

    // physics
    for(const n of nodes){
      // mouse attraction
      if(mouse.active){
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist2 = dx*dx + dy*dy;
        if(dist2 < MOUSE_RADIUS*MOUSE_RADIUS){
          // “lock onto” cursor: accelerate toward it
          n.vx += dx * ATTRACT * dt;
          n.vy += dy * ATTRACT * dt;
        }
      }

      n.x += n.vx * dt;
      n.y += n.vy * dt;

      // bounce or wrap/respawn
      if(BOUNCE){
        if(n.x < 0){ n.x = 0; n.vx = Math.abs(n.vx); }
        if(n.x > w){ n.x = w; n.vx = -Math.abs(n.vx); }
        if(n.y < 0){ n.y = 0; n.vy = Math.abs(n.vy); }
        if(n.y > h){ n.y = h; n.vy = -Math.abs(n.vy); }
      }else{
        if(n.x < -SPAWN_MARGIN || n.x > w+SPAWN_MARGIN || n.y < -SPAWN_MARGIN || n.y > h+SPAWN_MARGIN){
          Object.assign(n, spawn(true));
        }
      }

      // lifetime fade/respawn
      if(t - n.born > n.life){
        Object.assign(n, spawn(true));
      }
    }

    // draw
    ctx.clearRect(0, 0, w, h);

    // connections (wireframe)
    ctx.lineWidth = 1;
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if(d < LINK_DIST){
          const alpha = 0.18 * (1 - d / LINK_DIST);  // softer near threshold
          ctx.strokeStyle = `rgba(200,210,230,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for(const n of nodes){
      ctx.fillStyle = "rgba(230,235,245,0.85)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  // mouse handlers
  window.addEventListener('pointermove', (e)=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('pointerleave', ()=>{ mouse.active = false; });

    window.addEventListener('resize', resize);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            // tab not active → stop attraction
            mouse.active = false;
            mouse.x = -9999;
            mouse.y = -9999;
        }
    });

  init();
})();
