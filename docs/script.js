

class Game {
  // private fields
  #containerSelector;
  #playerImg;
  #COLS = 4;
  #ROWS = 4;
  #CUBE_W = 200;
  #CUBE_H = 92;
  #HORIZ_OFFSET = 45;
  #VERT_STEP = 23;
  #BASE_Y = 62;
  #DIRECTIONS = [
    [1,0,0], [0,1,0], [0,0,1],
    [1,1,0], [1,-1,0], [1,0,1], [1,0,-1], [0,1,1], [0,1,-1],
    [1,1,1], [1,1,-1], [1,-1,1], [1,-1,-1]
  ];
  #IMAGES = {
    red:   Object.assign(new Image(), { src: 'cube_red.png' }),
    redP:  Object.assign(new Image(), { src: 'cube_red_preview.png' }),
    green: Object.assign(new Image(), { src: 'cube_green.png' }),
    greenP:Object.assign(new Image(), { src: 'cube_green_preview.png' })
  };
  #gamefield;
  #counter = 0;
  #player = '';
  #gameIsOver = false;
  #lastMove = null; // { r, c, l }


  /**
   * @param {String} containerSelector - CSS selector for the parent element of the game board
   * @param {String} playerImgSelector - CSS selector for the <img> element that shows the current player
   */
  constructor(containerSelector, playerImgSelector) {
    this.#containerSelector = containerSelector;
    this.#playerImg = document.querySelector(playerImgSelector);
    this.#gamefield = Array.from({ length: this.#ROWS }, () =>
      Array.from({ length: this.#COLS }, () => [])
    );
    this.#initStorage();
    this.#initCanvases();
  }

  // private helpers
  #initStorage() {
    if (!sessionStorage.getItem('wincounter_red'))
      sessionStorage.setItem('wincounter_red', 0);
    if (!sessionStorage.getItem('wincounter_green'))
      sessionStorage.setItem('wincounter_green', 0);
  }

  #initCanvases() {
    // Try container first, otherwise all canvases in document
    let canvases;
    const container = document.querySelector(this.#containerSelector);
    if (container) canvases = container.querySelectorAll('canvas');
    else canvases = document.querySelectorAll('canvas');

    canvases.forEach(canvas => {
      canvas.addEventListener('mouseover', e => this.#handleMouseOver(e));
      canvas.addEventListener('mouseout',  e => this.#handleMouseOut(e));
      canvas.addEventListener('click',     e => this.handleClick(e));
    });
  }

  #handleMouseOver(e) {
    if (this.#gameIsOver) return;
    const canvas = e.target;
    const [r,c] = this.#getCoords(canvas.id);
    const stack = this.#gamefield[r][c];
    if (stack.length >= this.#ROWS) return;

    const ctx = canvas.getContext('2d');
    const img = this.#counter % 2 === 0 ? this.#IMAGES.redP : this.#IMAGES.greenP;
    const y = this.#BASE_Y - stack.length * this.#VERT_STEP;
    ctx.drawImage(img, this.#HORIZ_OFFSET, y, this.#CUBE_W, this.#CUBE_H);
  }

  #handleMouseOut(e) {
    if (this.#gameIsOver) return;
    const canvas = e.target;
    const [r,c] = this.#getCoords(canvas.id);
    const stack = this.#gamefield[r][c];
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.#drawStack(ctx, stack, r, c);

  }

  // public for click binding
  handleClick(e) {
    if (e.target.tagName !== 'CANVAS') return;
    this.play(e.target.id);
  }

  #drawStack(ctx, stack, r, c) {
    stack.forEach((color, lvl) => {
      const img = color === 'red' ? this.#IMAGES.red : this.#IMAGES.green;
      const y = this.#BASE_Y - lvl * this.#VERT_STEP;
      ctx.drawImage(img, this.#HORIZ_OFFSET, y, this.#CUBE_W, this.#CUBE_H);

      // highlight the last placed block
      if (this.#lastMove &&
          r === this.#lastMove.r &&
          c === this.#lastMove.c &&
          lvl === this.#lastMove.l) {
        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFD54A';               // warm yellow
        ctx.shadowColor = 'rgba(255,213,74,0.8)';  // glow
        ctx.shadowBlur = 12;
        // draw a slightly inset rectangle to avoid clipping
        ctx.strokeRect(this.#HORIZ_OFFSET + 2, y + 2, this.#CUBE_W - 4, this.#CUBE_H - 4);
        ctx.restore();
      }
    });
  }


  #getCoords(canvasId) {
    const n = parseInt(canvasId.slice(1), 10) - 1;
    return [Math.floor(n/this.#COLS), n % this.#COLS];
  }

  #canvasId(r, c) {
    return 'c' + (r * this.#COLS + c + 1);
  }


  /**
   * Handles a player's move by adding a piece to the stack on the
   * specified canvas element and updating the game state.
   *
   * @param {String} canvasId - The id of the canvas element where the
   *                            player wants to drop the piece.
   */
  play(canvasId) {
    if (this.#gameIsOver) return;

    // coords and stack for this click
    const [r, c] = this.#getCoords(canvasId);
    const stack = this.#gamefield[r][c];
    if (stack.length >= this.#ROWS) return;

    // remember previous highlighted move (if any)
    const prev = this._lastMove || null;

    // push the new piece
    this.#player = this.#counter % 2 === 0 ? 'red' : 'green';
    stack.push(this.#player);

    // layer index for the new piece + store as "last move"
    const layer = stack.length - 1;
    this._lastMove = { r, c, l: layer };

    // if previous highlight was on a different canvas, redraw that canvas (no highlight)
    if (prev && (prev.r !== r || prev.c !== c)) {
      const prevId = 'c' + (prev.r * this.#COLS + prev.c + 1);
      const pCanvas = document.getElementById(prevId);
      if (pCanvas) {
        const pctx = pCanvas.getContext('2d');
        pctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        this.#drawStack(pctx, this.#gamefield[prev.r][prev.c]); // no highlight here
      }
    }

    // redraw the current canvas and add a glow on the newest block
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.#drawStack(ctx, stack);

    // draw highlight rectangle for the newest block
    const y = this.#BASE_Y - layer * this.#VERT_STEP;
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFD54A';
    ctx.shadowColor = 'rgba(255,213,74,0.8)';
    ctx.shadowBlur = 12;
    ctx.strokeRect(this.#HORIZ_OFFSET + 10, y + 9, this.#CUBE_W - 10, this.#CUBE_H - 15);
    ctx.restore();

    // win check
    if (this.#checkWinAt(r, c, layer)) {
      this.#alertWin();
    }

    // flip current player image
    this.#playerImg.src = this.#player === 'red'
      ? this.#IMAGES.green.src
      : this.#IMAGES.red.src;

    // counters / draw detection
    this.#counter++;
    if (this.#counter === 64) {
      alert('Draw!');
      this.#gameIsOver = true;
    }

  if (this.#counter === 1) {
    const aiMode = document.getElementById('aiMode');
    if (aiMode) aiMode.disabled = true;

    const aiLevel = document.getElementById('aiLevel');
    if (aiLevel) aiLevel.disabled = true;

    const aiSide = document.getElementById('aiSide');
    if (aiSide) aiSide.disabled = true;

    // keep aiControls visible → no style.display change
  }


  }


  #alertWin() {
    alert(this.#player + ' wins!');
    this.#wincounter();
    this.#gameIsOver = true;
  }

  #wincounter() {
    if (this.#player === 'red')
      sessionStorage.wincounter_red++;
    else
      sessionStorage.wincounter_green++;
  }

  #countDir(r,c,l, dr,dc,dl) {
    let cnt = 0;
    let nr=r+dr, nc=c+dc, nl=l+dl;
    while (
      nr>=0 && nr<this.#ROWS &&
      nc>=0 && nc<this.#COLS &&
      nl>=0 && nl<this.#gamefield[nr][nc].length &&
      this.#gamefield[nr][nc][nl] === this.#player
    ) {
      cnt++;
      nr+=dr; nc+=dc; nl+=dl;
    }
    return cnt;
  }

  #checkWinAt(r,c,l) {
    for (const [dr,dc,dl] of this.#DIRECTIONS) {
      const total = 1 +
        this.#countDir(r,c,l, dr,dc,dl) +
        this.#countDir(r,c,l, -dr,-dc,-dl);
      if (total >= 4) return true;
    }
    return false;
  }
}

// Instantiate and start the game
document.addEventListener('DOMContentLoaded', () => {
  new Game('#boardContainer', '#playerimg');
});
