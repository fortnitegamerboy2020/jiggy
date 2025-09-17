const headerCanvas = document.getElementById("header-canvas");
if (headerCanvas) {
    const ctx = headerCanvas.getContext("2d");
    let w, h;

    function resize() {
        w = headerCanvas.width = headerCanvas.offsetWidth;
        h = headerCanvas.height = headerCanvas.offsetHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    const spacing = 35;
    const points = [];
    for (let y = 0; y <= h; y += spacing) {
        for (let x = 0; x <= w; x += spacing) {
            points.push({
                x,
                y,
                baseY: y,
                offset: Math.random() * Math.PI * 2,
            });
        }
    }

    function animate(t) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.fillStyle = "rgba(255,255,255,0.25)";

        for (let p of points) {
            const wave = Math.sin(t / 1200 + p.offset) * 3;
            const py = p.baseY + wave;

            // dot
            ctx.beginPath();
            ctx.arc(p.x, py, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // connect horizontally
            const right = points.find(q => q.y === p.baseY && q.x === p.x + spacing);
            if (right) {
                ctx.beginPath();
                ctx.moveTo(p.x, py);
                ctx.lineTo(right.x, right.baseY + Math.sin(t / 1200 + right.offset) * 3);
                ctx.stroke();
            }
        }
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}
