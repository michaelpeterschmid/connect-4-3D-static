/* ai.js — Play vs AI (Easy / Intermediate / Hard / Expert)
   Non-intrusive: no wrapping Game, no blocking clicks.
   We observe canvas clicks, then mirror ONLY if the player image flips.
*/
(() => {
  if (window.C4AI && window.C4AI.loaded) { console.warn("[C4AI] already loaded"); return; }
  window.C4AI = { loaded: true };

  const ROWS = 4, COLS = 4, MAX_LEVEL = 4;
  const DIRECTIONS = [
    [1,0,0],[0,1,0],[0,0,1],
    [1,1,0],[1,-1,0],[1,0,1],[1,0,-1],[0,1,1],[0,1,-1],
    [1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1]
  ];

  // Difficulty presets
  const PRESETS = {
    supereasy:    { type: 'random' },
    easy:         { type: 'minimax', depth: 1 },
    intermediate: { type: 'minimax', depth: 2 },
    hard:         { type: 'minimax', depth: 4 },
    expert:       { type: 'iterative', maxDepth: 9, time: 1200 } // ms cap
  };

  // Local mirror + counter of accepted moves
  const board = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => []));
  let acceptedCounter = 0;

  // Precompute all 4-in-a-row lines in 4x4x4
  const LINES = (() => {
    const lines = [];
    const inb = (r,c,l)=> r>=0&&r<ROWS&&c>=0&&c<COLS&&l>=0&&l<MAX_LEVEL;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) for (let l=0;l<MAX_LEVEL;l++) {
      for (const [dr,dc,dl] of DIRECTIONS) {
        const pr=r-dr, pc=c-dc, pl=l-dl;
        if (inb(pr,pc,pl)) continue; // start only at minimal predecessor
        const line=[[r,c,l]];
        for (let k=1;k<4;k++){
          const rr=r+dr*k, cc=c+dc*k, ll=l+dl*k;
          if (!inb(rr,cc,ll)) { line.length=0; break; }
          line.push([rr,cc,ll]);
        }
        if (line.length===4) lines.push(line);
      }
    }
    return lines;
  })();

  // Helpers
  function idFromRC(r,c){ return 'c'+(r*COLS+c+1); }
  function rcFromId(id){ const n=parseInt(id.slice(1),10)-1; return [Math.floor(n/COLS), n%COLS]; }

  function legalMoves(b=board){
    const ms=[]; for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (b[r][c].length<MAX_LEVEL) ms.push([r,c]); return ms;
  }
  function hasWin(b, who){
    for (const line of LINES){
      let ok=true;
      for (const [r,c,l] of line) { if ((b[r][c][l]||null)!==who){ ok=false; break; } }
      if (ok) return true;
    }
    return false;
  }
  function cloneBoard(b=board){ return b.map(row=>row.map(col=>col.slice())); }
  function makeMove(b,[r,c],who){ b[r][c].push(who); }
  function undoMove(b,[r,c]){ b[r][c].pop(); }

  function scoreBoard(b, me){
    const opp = me==='red' ? 'green' : 'red';
    if (hasWin(b, me))  return  1e9;
    if (hasWin(b, opp)) return -1e9;
    let score=0;
    for (const line of LINES){
      let m=0,o=0;
      for (const [r,c,l] of line){ const v=b[r][c][l]||null; if (v===me) m++; else if (v===opp) o++; }
      if (m>0 && o===0) score += [0,1,10,50,0][m];
      else if (o>0 && m===0) score -= [0,1,10,50,0][o];
    }
    // tiny center bias
    const centers=[[1,1],[1,2],[2,1],[2,2]];
    for (const [r,c] of centers) score += (b[r][c].length)*0.2;
    return score;
  }

  function orderedMoves(b){
    const ms = legalMoves(b);
    const key = ([r,c]) => Math.min(r,ROWS-1-r)+Math.min(c,COLS-1-c);
    return ms.sort((a,b)=> key(a)-key(b));
  }

  function minimax(b, depth, me, toMove, alpha, beta){
    const opp = me==='red'?'green':'red';
    if (depth===0 || hasWin(b, me) || hasWin(b, opp) || legalMoves(b).length===0){
      return { score: scoreBoard(b, me), move: null };
    }
    const maximizing = (toMove===me);
    let bestMove=null;

    if (maximizing){
      let best=-Infinity;
      for (const mv of orderedMoves(b)){
        makeMove(b,mv,toMove);
        const sc = minimax(b, depth-1, me, opp, alpha, beta).score;
        undoMove(b,mv);
        if (sc>best){ best=sc; bestMove=mv; }
        alpha=Math.max(alpha,best);
        if (beta<=alpha) break;
      }
      return { score: best, move: bestMove };
    } else {
      let best=Infinity;
      for (const mv of orderedMoves(b)){
        makeMove(b,mv,toMove);
        const sc = minimax(b, depth-1, me, me, alpha, beta).score;
        undoMove(b,mv);
        if (sc<best){ best=sc; bestMove=mv; }
        beta=Math.min(beta,best);
        if (beta<=alpha) break;
      }
      return { score: best, move: bestMove };
    }
  }

  function chooseMove(preset, b, aiColor){
    const ms = legalMoves(b);
    if (ms.length===0) return null;
    if (preset.type==='random') return ms[Math.floor(Math.random()*ms.length)];
    if (preset.type==='minimax'){
      const { move } = minimax(cloneBoard(b), preset.depth, aiColor, aiColor, -Infinity, Infinity);
      return move || ms[0];
    }
    if (preset.type==='iterative'){
      const start=performance.now(); let best=ms[0];
      for (let d=2; d<= (preset.maxDepth||9); d++){
        if (performance.now()-start > (preset.time||1000)) break;
        const { move } = minimax(cloneBoard(b), d, aiColor, aiColor, -Infinity, Infinity);
        if (move) best = move;
      }
      return best;
    }
    return ms[0];
  }

  // --- UI helpers ---
  function $(id){ return document.getElementById(id); }
  function uiStatus(t){ const s=$('aiStatus'); if (s) s.textContent = t||''; }
  function currentPreset(){ const el=$('aiLevel'); const v=el?el.value:'easy'; return PRESETS[v]||PRESETS.easy; }
  function aiSide(){ const el=$('aiSide'); return el?el.value:'green'; }
  let aiEnabled=true;

  // SHOW difficulty on button when AI mode is on
  function updateToggleLabel(){ 
    const sel = $('aiLevel');
    const diff = sel ? sel.value : ''; // "easy" | "intermediate" | "hard" | "expert"

    const b = $('aiToggleBtn');
    if (b) b.textContent = aiEnabled ? `Mode: vs AI (${diff})` : 'Mode: vs Friend';

    const el = $('aiControls'); // keep your existing id
    if (el) el.style.display = aiEnabled ? 'block' : 'none';
  }

  // Determine the player-to-move from #playerimg
  function readPlayerFromImg(){
    const img = document.getElementById('playerimg');
    if (!img || !img.src) return null;
    const path = new URL(img.src, location.href).pathname.toLowerCase();
    if (path.indexOf('cube_red.png') !== -1)   return 'red';
    if (path.indexOf('cube_green.png') !== -1) return 'green';
    return null;
  }

  function toMoveNow(){ return readPlayerFromImg(); }

  // Simulate a human click on (r,c); Game.handleClick handles it.
  function clickRC(r,c){
    const el = document.getElementById(idFromRC(r,c));
    if (!el) return false;
    el.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window }));
    return true;
  }

  // After each accepted human move, consider AI move
  function maybeAIMove(){
    if (!aiEnabled) return;
    const side = aiSide();
    const turn = toMoveNow();
    if (turn !== side) return; // not AI's turn
    if (hasWin(board,'red') || hasWin(board,'green') || legalMoves(board).length===0) return;

    const preset = currentPreset();
    const best = chooseMove(preset, board, side);
    const fallback = orderedMoves(board).filter(m => !best || m[0]!==best[0] || m[1]!==best[1]);
    const queue = best ? [best, ...fallback] : fallback;

    const before = acceptedCounter;
    let i=0;

    const tryNext = () => {
      if (acceptedCounter > before) { uiStatus(''); return; }                 // a move was accepted
      if (i >= Math.min(queue.length, 16)) { uiStatus(''); return; }          // safety
      const [r,c] = queue[i++];
      uiStatus('thinking…');
      if (!clickRC(r,c)) { setTimeout(tryNext, 30); return; }
      setTimeout(() => {
        if (acceptedCounter > before) { uiStatus(''); return; }               // accepted
        tryNext();                                                            // try another
      }, 60);
    };
    tryNext();
  }

  // Observe canvas clicks (capture), let Game run, then detect acceptance by image flip
  document.addEventListener('click', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLCanvasElement)) return;
    const beforeImg = readPlayerFromImg();
    const id = el.id;

    // Let your Game's handler run first; then check if image flipped
    setTimeout(() => {
      const afterImg = readPlayerFromImg();
      const accepted = beforeImg && afterImg && beforeImg !== afterImg;
      if (!accepted) return;

      // Mirror the real move
      const mover = beforeImg;
      const [r,c] = rcFromId(id);
      if (board[r][c].length < MAX_LEVEL) {
        board[r][c].push(mover);
        acceptedCounter++;
      }

      // Now maybe let AI play
      setTimeout(maybeAIMove, 10);
    }, 0);
  }, true); // capture but do NOT stop/modify the event

  // Wire UI
  function boot(){
    const t=$('aiToggleBtn');
    if (t){
      t.addEventListener('click', () => {
        aiEnabled = !aiEnabled;
        updateToggleLabel();
        // If AI is red and it's red to move now, start
        if (aiEnabled) setTimeout(maybeAIMove, 20);
      });
      updateToggleLabel();
    }
    const lvl=$('aiLevel'); if (lvl) lvl.addEventListener('change', ()=> { if (aiEnabled) maybeAIMove(); updateToggleLabel(); });
    const side=$('aiSide'); if (side) side.addEventListener('change', ()=> aiEnabled && maybeAIMove());
    const ng=$('newGameBtn'); if (ng) ng.addEventListener('click', ()=> { /* reload resets everything */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
