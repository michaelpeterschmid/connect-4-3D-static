// script.js
// Encapsulate all logic in a Game class to avoid globals
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registriert:', reg.scope))
      .catch(err => console.error('SW-Fehler:', err));
  });
}










class Game {
  // private fields
  #containerSelector;
  #playerImg;
  #COLS = 4;
  #ROWS = 4;
  #CUBE_W = 200;
  #CUBE_H = 100;
  #HORIZ_OFFSET = 45;
  #VERT_STEP = 25;
  #BASE_Y = 65;
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

  /**
   * Handles the mouseover event on a canvas element.
   * If the game is not over and the stack at the hovered position is not full,
   * it draws a preview piece on the canvas to indicate the current player's move.
   *
   * @param {Event} e - The mouseover event object.
   */

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
    this.#drawStack(ctx, stack);
  }

  // public for click binding
  handleClick(e) {
    if (e.target.tagName !== 'CANVAS') return;
    this.play(e.target.id);
  }

  #drawStack(ctx, stack) {
    stack.forEach((color, lvl) => {
      const img = color === 'rot' ? this.#IMAGES.red : this.#IMAGES.green;
      const y = this.#BASE_Y - lvl * this.#VERT_STEP;
      ctx.drawImage(img, this.#HORIZ_OFFSET, y, this.#CUBE_W, this.#CUBE_H);
    });
  }

  #getCoords(canvasId) {
    const n = parseInt(canvasId.slice(1), 10) - 1;
    return [Math.floor(n/this.#COLS), n % this.#COLS];
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
    const [r,c] = this.#getCoords(canvasId);
    const stack = this.#gamefield[r][c];
    if (stack.length >= this.#ROWS) return;

    this.#player = this.#counter % 2 === 0 ? 'rot' : 'grün';
    stack.push(this.#player);

    // immediately clear preview and redraw real stack
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.#drawStack(ctx, stack);

    const layer = stack.length - 1;
    if (this.#checkWinAt(r, c, layer)) {
      this.#alertWin();
    }

    this.#playerImg.src = this.#player === 'rot'
      ? this.#IMAGES.green.src
      : this.#IMAGES.red.src;

    this.#counter++;
  }

  #alertWin() {
    alert(this.#player + ' Hat das Spiel gewonnen!');
    this.#wincounter();
    this.#gameIsOver = true;
  }

  #wincounter() {
    if (this.#player === 'rot')
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
