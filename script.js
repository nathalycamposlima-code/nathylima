/* ============================================================
   ESQUIVA.JS - jogo em JavaScript puro (sem dependências)
   Uso:  <div id="meu-jogo"></div>
         <script src="game.js"></script>
   (se a div não existir, o jogo é criado no lugar do script)
   ============================================================ */
(function () {
  "use strict";
  var W = 360, H = 540;                       // resolução interna do canvas
  var cur = document.currentScript;
  // ---------- monta o canvas ----------
  var host = document.getElementById("meu-jogo");
  if (!host) {
    host = document.createElement("div");
    if (cur && cur.parentNode) cur.parentNode.insertBefore(host, cur);
    else document.body.appendChild(host);
  }
  host.style.cssText = "display:flex;justify-content:center";
  var cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  cv.style.cssText = "width:100%;max-width:360px;display:block;border-radius:16px;" +
    "background:#0b1020;touch-action:none;box-shadow:0 12px 40px rgba(0,0,0,.45)";
  host.innerHTML = ""; host.appendChild(cv);
  var c = cv.getContext("2d");
  // ---------- estado ----------
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var player, blocks, coins, parts, stars, t, spawn, score, over, playing, target = null, keys = {};
  var best = +(localStorage.getItem("esquiva_best") || 0);
  stars = [];
  for (var i = 0; i < 40; i++) stars.push({ x: rnd(0, W), y: rnd(0, H), s: rnd(.4, 1.6) });
  function reset() {
    player = { x: W / 2, y: H - 62, r: 13 };
    blocks = []; coins = []; parts = [];
    t = 0; spawn = .4; score = 0; over = false;
  }
  reset();
  function start() { if (!playing || over) { reset(); playing = true; } }
  // ---------- controles ----------
  addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (e.key === " " || e.key.indexOf("Arrow") === 0) { if (playing) e.preventDefault(); }
    if (!playing || over) start();
  });
  addEventListener("keyup", function (e) { keys[e.key] = false; });
  function aim(e) { var r = cv.getBoundingClientRect(); target = (e.clientX - r.left) / r.width * W; }
  cv.addEventListener("pointerdown", function (e) { aim(e); start(); });
  cv.addEventListener("pointermove", function (e) { if (playing) aim(e); });
  cv.addEventListener("pointerleave", function () { target = null; });
  // ---------- lógica ----------
  function boom(x, y, col) {
    for (var i = 0; i < 16; i++) parts.push({ x: x, y: y, vx: rnd(-150, 150), vy: rnd(-150, 150), l: 1, c: col });
  }
  function update(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt * 1.6;
      if (p.l <= 0) parts.splice(i, 1);
    }
    for (var s = 0; s < stars.length; s++) {
      stars[s].y += (20 + stars[s].s * 40) * dt * (playing && !over ? 1 : .25);
      if (stars[s].y > H) { stars[s].y = -2; stars[s].x = rnd(0, W); }
    }
    if (!playing || over) return;
    t += dt;
    var sp = 150 + t * 7;                       // velocidade cresce com o tempo
    score += dt * 8;
    // movimento do jogador
    var dx = 0;
    if (keys.ArrowLeft || keys.a || keys.A) dx--;
    if (keys.ArrowRight || keys.d || keys.D) dx++;
    if (dx) { player.x += dx * 280 * dt; target = null; }
    else if (target !== null) player.x += (target - player.x) * Math.min(1, dt * 14);
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    // spawn
    spawn -= dt;
    if (spawn <= 0) {
      spawn = Math.max(.3, rnd(.55, .9) - t * .006);
      var w = rnd(50, 130);
      blocks.push({ x: rnd(0, W - w), y: -28, w: w, h: 22 });
      if (Math.random() < .5) coins.push({ x: rnd(18, W - 18), y: -60, r: 8 });
    }
    // blocos
    for (var b = blocks.length - 1; b >= 0; b--) {
      var o = blocks[b]; o.y += sp * dt;
      var cx = Math.max(o.x, Math.min(player.x, o.x + o.w));
      var cy = Math.max(o.y, Math.min(player.y, o.y + o.h));
      if ((player.x - cx) * (player.x - cx) + (player.y - cy) * (player.y - cy) < player.r * player.r) {
        over = true; boom(player.x, player.y, "#ff4d6d");
        best = Math.max(best, Math.floor(score));
        localStorage.setItem("esquiva_best", best);
      }
      if (o.y > H) { blocks.splice(b, 1); score += 5; }
    }
    // moedas
    for (var k = coins.length - 1; k >= 0; k--) {
      var m = coins[k]; m.y += sp * dt;
      if (Math.hypot(m.x - player.x, m.y - player.y) < m.r + player.r) {
        score += 25; boom(m.x, m.y, "#ffd166"); coins.splice(k, 1);
      } else if (m.y > H) coins.splice(k, 1);
    }
  }
  // ---------- desenho ----------
  function txt(s, x, y, size, col, al) {
    c.font = "700 " + size + "px system-ui,Segoe UI,Roboto,sans-serif";
    c.fillStyle = col; c.textAlign = al || "left"; c.fillText(s, x, y);
  }
  function draw() {
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0b1020"); g.addColorStop(1, "#141a35");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(255,255,255,.5)";
    for (var s = 0; s < stars.length; s++) c.fillRect(stars[s].x, stars[s].y, stars[s].s, stars[s].s * 2);
    c.shadowBlur = 14;
    for (var b = 0; b < blocks.length; b++) {
      var o = blocks[b]; c.shadowColor = "#7c5cff"; c.fillStyle = "#7c5cff";
      c.fillRect(o.x, o.y, o.w, o.h);
      c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(o.x, o.y, o.w, 4);
    }
    for (var k = 0; k < coins.length; k++) {
      var m = coins[k]; c.shadowColor = "#ffd166"; c.fillStyle = "#ffd166";
      c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fill();
    }
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i]; c.globalAlpha = Math.max(0, p.l); c.shadowColor = p.c; c.fillStyle = p.c;
      c.fillRect(p.x - 2, p.y - 2, 4, 4); c.globalAlpha = 1;
    }
    if (!over) {                                  // nave
      c.shadowColor = "#38e8ff"; c.fillStyle = "#38e8ff";
      c.beginPath();
      c.moveTo(player.x, player.y - 16);
      c.lineTo(player.x + 13, player.y + 12);
      c.lineTo(player.x, player.y + 5);
      c.lineTo(player.x - 13, player.y + 12);
      c.closePath(); c.fill();
    }
    c.shadowBlur = 0;
    txt(Math.floor(score), 14, 32, 22, "#fff");
    txt("REC " + best, W - 14, 32, 14, "rgba(255,255,255,.55)", "right");
    if (!playing || over) {
      c.fillStyle = "rgba(5,8,20,.72)"; c.fillRect(0, 0, W, H);
      if (over) {
        txt("FIM DE JOGO", W / 2, H / 2 - 40, 30, "#ff4d6d", "center");
        txt("pontos: " + Math.floor(score), W / 2, H / 2, 20, "#fff", "center");
        txt("clique ou tecla para jogar de novo", W / 2, H / 2 + 36, 14, "rgba(255,255,255,.6)", "center");
      } else {
        txt("ESQUIVA", W / 2, H / 2 - 30, 38, "#38e8ff", "center");
        txt("desvie dos blocos · pegue as moedas", W / 2, H / 2 + 6, 14, "rgba(255,255,255,.7)", "center");
        txt("← →  /  mouse  /  toque", W / 2, H / 2 + 30, 14, "rgba(255,255,255,.45)", "center");
        txt("clique para começar", W / 2, H / 2 + 72, 16, "#ffd166", "center");
      }
    }
  }
  // ---------- loop ----------
  var last = performance.now();
  (function loop(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  })(last);
})();