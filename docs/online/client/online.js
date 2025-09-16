const joinRoomForm = document.getElementById("joinRoomForm");
const joinQueueBtn = document.getElementById("joinQueueBtn");
const gameFieldDiv = document.getElementById("gamefield");
const gameSize = 4;
let counter = 0;
let gamefield = [
    [[], [], [], []], 
    [[], [], [], []],
    [[], [], [], []],
    [[], [], [], []]]
let gameOver = false;
let color;
let yourTurn = true
let enoughPlayersInQueue = false

//sockets 
const socket = io("https://connect43d-yfa5.onrender.com/");
let room;

joinRoomForm.addEventListener("submit", joinRoom);

function joinRoom(event){
    event.preventDefault()
    room = document.getElementById("roomid").value
    if(room.trim()===""){
        alert("You must enter a valid room to join!")
        return
    }

    socket.emit("join-room", room, ({ok, message}) => {
        alert(message);
        if(ok){
            let room_h3 = `roomid: ${room}`;
            document.getElementById("roomcontainer").innerHTML = room_h3;
            document.getElementById("roomid").remove();
            document.getElementById("joinRoomBtn").remove();
            document.getElementById("joinQueueBtn").remove();
        }
    })
}

joinQueueBtn.addEventListener("click", joinQueue);

function joinQueue(event){
    event.preventDefault()
    socket.emit("join-queue", ({ok, message}) => {
        alert(message);

    })
    document.getElementById("roomid").remove();
    document.getElementById("joinRoomBtn").remove();
    document.getElementById("joinQueueBtn").remove();
    document.getElementById("roomcontainer").innerHTML = "Waiting for other player to join queue...";
}

socket.on("connect", () => {
    console.log(`Your socket ID: ${socket.id}`)
})

socket.on("leave", () => {
    if(!gameOver){
        alert("your opponent left the game you win.");
        gameOver = true;
    }
})

socket.on("ready-to-start", () => {
    alert("Two players are in this room. You may start playing!");
    initGameField()
})

socket.on("queue-success", queueRoom => {
    alert("Two players are in this room. You may start playing!");
    enoughPlayersInQueue = true;
    room = queueRoom;
    let room_h3 = `roomid: ${queueRoom}`;
    document.getElementById("roomcontainer").innerHTML = room_h3;
    initGameField()

})

socket.on("receive-data", (cellId) => {
    let opponentTurn = document.getElementById(cellId);
    replicate(opponentTurn);
})

function initGameField(){
        // reset and set up grid
    gameFieldDiv.innerHTML = "";
    gameFieldDiv.style.display = "grid";
    gameFieldDiv.style.gridTemplateColumns = `repeat(${gameSize}, 1fr)`;
    
        for(let row = 0; row<gameSize; row++){
            for(let col = 0; col<gameSize; col++){
                gameFieldDiv.innerHTML += `<div id="${row}.${col}" class="cell"></div>`;
            }
        }

        let cells = document.getElementsByClassName("cell");
        cells = Array.from(cells);

        cells.forEach(cell => {
            cell.addEventListener("click", () => play(cell)) /*Need to write like this so that it is not executet right away but only after click*/
            cell.addEventListener("mouseover", () => hover(cell))
        });
}

async function play(cell){

  if(gameOver){
    alert(`${color} has already won. Exit this game to start a new game.`)
    return;
  }

  if(!yourTurn){
    alert("Wait for other user to play a cell.")
    return;
  }

  let x_y_pos = cell.id.split(".")
  const i = cell.querySelectorAll('img').length-1;
  if(i>3 || gamefield[x_y_pos[0]][x_y_pos[1]].length >= 4 || gameOver) return;
  color = counter % 2 === 0 ? 'red' : 'green';

  const img = document.createElement('img');
  img.src = `./img/cube_${color}.png`;

  //show who's turn it is currently 
  let nextPlayer = counter % 2 === 0 ? 'green' : 'red';
  document.getElementById("currentPlayer").src = `./img/cube_${nextPlayer}.png`;
  
  //update the gamefield
  img.alt = color;
  img.style.setProperty('--i', i);   // 0,1,2,...
  cell.appendChild(img);
  gamefield[x_y_pos[0]][x_y_pos[1]].push(color)

  //send data to the server
  socket.emit("send-data", room, cell.id)

  /* Draw first before  checking win*/
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  if(checkwin()){
    alert(`${color} won the game!`)
    gameOver = true;
    return
  }
  counter++;
  yourTurn = false
}

async function replicate(cell){
  let x_y_pos = cell.id.split(".")
  const i = cell.querySelectorAll('img').length;
  if(i>3 || gamefield[x_y_pos[0]][x_y_pos[1]].length >= 4 || gameOver) return;
  color = counter % 2 === 0 ? 'red' : 'green';

  const img = document.createElement('img');
  img.src = `./img/cube_${color}.png`;
  //show who's turn it is currently 
  let nextPlayer = counter % 2 === 0 ? 'green' : 'red';
  document.getElementById("currentPlayer").src = `./img/cube_${nextPlayer}.png`;
  img.alt = color;
  img.style.setProperty('--i', i);   // 0,1,2,...

  cell.appendChild(img);

  //update the gamefield
  gamefield[x_y_pos[0]][x_y_pos[1]].push(color)

  /* Draw first before  checking win*/
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  
  if(checkwin()){
    alert(`${color} won the game!`)
    gameOver = true;
    return
  }
  counter++;
  yourTurn = true
}

function hover(cell){
  const i = cell.querySelectorAll('img').length;
  if(i>3 || gameOver || !yourTurn) return;
  color = counter % 2 === 0 ? 'red' : 'green';

  const img = document.createElement('img');
  img.src = `./img/cube_${color}_preview.png`;
  img.alt = color;
  img.style.setProperty('--i', i);   // 0,1,2,...

  cell.appendChild(img);
  cell.addEventListener("mouseout", () => {cell.removeChild(img)})
}

function checkwin(){
    // Horizontale Überprüfung 3d
    for(var i=0;i<gamefield.length;i++){  
        for(var x=0; x<gamefield[i].length;x++){
            var playerlist = [];
            for(var y=0; y<gamefield[i][x].length;y++){

                if(gamefield[i][x][y] == color){
                    playerlist.push(color)       
                }
            }
            if(checkPlayerlistLenght(playerlist)) return true;
        }
    }

    // horizontale Überprüfung 2d
    for(var ebene = 0; ebene<4; ebene++){
        for(var i=0; i<gamefield.length;i++){
            var playerlist = [];
            for(var x=0; x<gamefield[i].length; x++){
                if(gamefield[i][x][ebene]==color){
                    playerlist.push(color)
                }
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }
    }

    // vertikale Überprüfung 2d
    for(var ebene = 0; ebene<4; ebene++){
        for(var i=0; i<gamefield.length;i++){
            var playerlist = [];
            for(var x=0; x<gamefield[i].length; x++){
                if(gamefield[x][i][ebene]==color){
                    playerlist.push(color)
                }
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }
    }

    // Diagonale Überprüfung von links nach rechts 2d
    for(var ebene = 0; ebene<4; ebene++){
        var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = row;         
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }
    }
    
    // Diagonale Überprüfung von rechts nach links 2d    
    for(var ebene = 0; ebene<4; ebene++){
        var playerlist = []       
        for(var row=0, cell=3; row<gamefield.length; row++,cell--){
            //alert(gamefield[row][cell][ebene])
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }
    }

    // horizontale Überprüfung von links nach rechts 3d
        for(var i=0; i<gamefield.length;i++){
            var playerlist = [];
            for(var x=0; x<gamefield[i].length; x++){
                var ebene = x
                if(gamefield[i][x][ebene]==color){
                    playerlist.push(color)
                }
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }

    // Horizontale Prüfung von rechts nach links 3d
        for(var row=0; row<gamefield.length;row++){
            var playerlist = [];
            for(var cell=0; cell<gamefield[row].length; cell++){
                var ebene = (3 - cell)
                if(gamefield[row][cell][ebene]==color){
                    playerlist.push(color)
                }
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }

    // vertikale Überprüfung von oben nach unten 3d
        for(var row=0; row<gamefield.length;row++){
            var playerlist = [];
            for(var cell=0; cell<gamefield[row].length; cell++){
                var ebene = cell
                if(gamefield[cell][row][ebene]==color){
                    playerlist.push(color)
                }
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }

    // vertikale Überprüfung von unten nach oben 3d
    for(var row=0; row<gamefield.length;row++){
        var playerlist = [];
        for(var cell=0; cell<gamefield[row].length; cell++){
            var ebene = (3 - cell) 
            if(gamefield[cell][row][ebene]==color){
                playerlist.push(color)
            }
        }
        if(checkPlayerlistLenght(playerlist)){
            return true
        }
    }

    // Diagonale Überprüfung von oben links nach unten rechts 3d
        var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = row;
            var ebene = row  
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }

    // Diagonale Überprüfung von unten rechts nach oben links 3d
        var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = row;
            var ebene = 3-row
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }
    // Diagonale Überprüfung von oben rechts nach unten links 3d
    var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = 3-row
            var ebene = row
            
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
            }
            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }

    // Diagonale Überprüfung von unten links nach oben rechts 3d
    var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = 3-row
            var ebene = 3-row
            
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
            }

            if(checkPlayerlistLenght(playerlist)){
                return true
            }
        }
    return false;
}

function checkPlayerlistLenght(playerlist){
    console.log(playerlist)
    if(playerlist.length==4){
        return true
    }
}