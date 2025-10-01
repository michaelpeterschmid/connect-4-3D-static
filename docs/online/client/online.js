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
let last_played_position = []

//sockets 
const socket = io("https://connect43d-yfa5.onrender.com/");
//const socket = io("http://localhost:3000/") //for local testing
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
            /*cell.addEventListener("mouseover", () => hover(cell))*/
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
  const i = cell.querySelectorAll('img').length;
  if(i>3 || gamefield[x_y_pos[0]][x_y_pos[1]].length >= 4 || gameOver) return;
  color = counter % 2 === 0 ? 'red' : 'green';

  const img = document.createElement('img');
  img.src = `./img/cube_${color}_last.png`;

  //show who's turn it is currently 
  let nextPlayer = counter % 2 === 0 ? 'green' : 'red';
  document.getElementById("currentPlayer").src = `./img/cube_${nextPlayer}.png`;
  
  //update the gamefield
  img.alt = color;
  img.style.setProperty('--i', i);   // 0,1,2,...
  img.id = `${x_y_pos[0]},${x_y_pos[1]},${i}`;
  cell.appendChild(img);
  gamefield[x_y_pos[0]][x_y_pos[1]].push(color)
  last_played_position.push([img.id, `./img/cube_${color}.png`])
  if(last_played_position.length>1){
    let position = last_played_position.shift()
    document.getElementById(position[0]).src = position[1];
  }

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
  img.src = `./img/cube_${color}_last.png`;
  //show who's turn it is currently 
  let nextPlayer = counter % 2 === 0 ? 'green' : 'red';
  document.getElementById("currentPlayer").src = `./img/cube_${nextPlayer}.png`;
  img.alt = color;
  img.style.setProperty('--i', i);   // 0,1,2,...
  img.id = `${x_y_pos[0]},${x_y_pos[1]},${i}`;
  cell.appendChild(img);
  //update the gamefield
  gamefield[x_y_pos[0]][x_y_pos[1]].push(color)
  last_played_position.push([img.id, `./img/cube_${color}.png`])
  if(last_played_position.length>1){
    let position = last_played_position.shift()
    document.getElementById(position[0]).src = position[1];
  }

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
    let playerlist = []
    let playerpositionlist = []
    // Horizontale Überprüfung 3d
    for(let i=0;i<gamefield.length;i++){  
        for(let x=0; x<gamefield[i].length;x++){
            playerlist = []
            playerpositionlist = []
            for(let y=0; y<gamefield[i][x].length;y++){

                if(gamefield[i][x][y] == color){
                    playerlist.push(color)   
                    playerpositionlist.push(`${i},${x},${y}`)    
                }
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)) return true;
        }
    }

    // horizontale Überprüfung 2d
    for(let ebene = 0; ebene<4; ebene++){
        for(let i=0; i<gamefield.length;i++){
            playerlist = [];
            playerpositionlist = []
            for(let x=0; x<gamefield[i].length; x++){
                if(gamefield[i][x][ebene]==color){
                    playerlist.push(color)
                    playerpositionlist.push(`${i},${x},${ebene}`) 
                }
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }
    }

    // vertikale Überprüfung 2d
    for(let ebene = 0; ebene<4; ebene++){
        for(let i=0; i<gamefield.length;i++){
            playerlist = [];
            playerpositionlist = []
            for(let x=0; x<gamefield[i].length; x++){
                if(gamefield[x][i][ebene]==color){
                    playerlist.push(color)
                    playerpositionlist.push(`${x},${i},${ebene}`) 
                }
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }
    }

    // Diagonale Überprüfung von links nach rechts 2d
    for(let ebene = 0; ebene<4; ebene++){
        playerpositionlist = []
        playerlist = []
        for(let row=0; row<gamefield.length; row++){
            let cell = row;         
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
                playerpositionlist.push(`${row},${cell},${ebene}`) 
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }
    }
    
    // Diagonale Überprüfung von rechts nach links 2d    
    for(let ebene = 0; ebene<4; ebene++){
        playerlist = []      
        playerpositionlist = [] 
        for(let row=0, cell=3; row<gamefield.length; row++,cell--){
            //alert(gamefield[row][cell][ebene])
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
                playerpositionlist.push(`${row},${cell},${ebene}`) 
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }
    }

    // horizontale Überprüfung von links nach rechts 3d
        for(let i=0; i<gamefield.length;i++){
            playerlist = [];
            playerpositionlist = []
            for(let x=0; x<gamefield[i].length; x++){
                let ebene = x
                if(gamefield[i][x][ebene]==color){
                    playerlist.push(color)
                    playerpositionlist.push(`${i},${x},${ebene}`) 
                }
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }

    // Horizontale Prüfung von rechts nach links 3d
        for(let row=0; row<gamefield.length;row++){
            playerlist = [];
            playerpositionlist = []
            for(let cell=0; cell<gamefield[row].length; cell++){
                let ebene = (3 - cell)
                if(gamefield[row][cell][ebene]==color){
                    playerlist.push(color)
                    playerpositionlist.push(`${row},${cell},${ebene}`) 
                }
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }

    // vertikale Überprüfung von oben nach unten 3d
        for(let row=0; row<gamefield.length;row++){
            playerlist = [];
            playerpositionlist = []
            for(let cell=0; cell<gamefield[row].length; cell++){
                let ebene = cell
                if(gamefield[cell][row][ebene]==color){
                    playerlist.push(color)
                    playerpositionlist.push(`${cell},${row},${ebene}`) 
                }
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }

    // vertikale Überprüfung von unten nach oben 3d
    for(let row=0; row<gamefield.length;row++){
        playerlist = [];
        playerpositionlist = []
        for(let cell=0; cell<gamefield[row].length; cell++){
            let ebene = (3 - cell) 
            if(gamefield[cell][row][ebene]==color){
                playerlist.push(color)
                playerpositionlist.push(`${cell},${row},${ebene}`) 
            }
        }
        if(checkPlayerlistLenght(playerlist, playerpositionlist)){
            return true
        }
    }

    // Diagonale Überprüfung von oben links nach unten rechts 3d
        playerlist = []
        playerpositionlist = []
        for(let row=0; row<gamefield.length; row++){
            let cell = row;
            let ebene = row  
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
                playerpositionlist.push(`${row},${cell},${ebene}`) 
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }

    // Diagonale Überprüfung von unten rechts nach oben links 3d
        playerlist = []
        playerpositionlist = []
        for(let row=0; row<gamefield.length; row++){
            let cell = row;
            let ebene = 3-row
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
                playerpositionlist.push(`${row},${cell},${ebene}`) 
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }
    // Diagonale Überprüfung von oben rechts nach unten links 3d
        playerlist = []
        playerpositionlist = []
        for(let row=0; row<gamefield.length; row++){
            let cell = 3-row
            let ebene = row
            
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
                playerpositionlist.push(`${row},${cell},${ebene}`) 
            }
            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }

    // Diagonale Überprüfung von unten links nach oben rechts 3d
        playerlist = []
        playerpositionlist = []
        for(let row=0; row<gamefield.length; row++){
            let cell = 3-row
            let ebene = 3-row
            
            if(gamefield[row][cell][ebene]==color){
                playerlist.push(color)
                playerpositionlist.push(`${row},${cell},${ebene}`) 
            }

            if(checkPlayerlistLenght(playerlist, playerpositionlist)){
                return true
            }
        }
    return false;
}

function checkPlayerlistLenght(playerlist, playerpositionlist){
    if(playerlist.length==4){
        for(let position of playerpositionlist){
            document.getElementById(position).src = `./img/cube_${color}_win.png`; 
        }
        return true
    }
}