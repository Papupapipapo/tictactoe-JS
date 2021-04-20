let gameStatus = {
    positions: [],          //Les posicions d'aquesta partida
    actualGameName: "",     //Per a fer cache de quin nom hem de anar fer ping
    lastPassword: "",       //Cache del ultim password utilitzat per a unir la partida. Facilita el restart de partida
    player: "",             //Quin jugador es el jugador actual
    lastPlayer: "",         //El ultim que sabem que ha jugat, ens servirá per a comparar
    // winsThisSession: 0, //atraves de cookies fer si guanya o perd consecutiu
}
let elemBoard;
let elemButtonMenu;
let elemFormContainer;
let elemPopUp;
let elemAlertBox;
let elemChooseSign;

let auxLastChecked; //Aquest auxiliar es qui manega quina es la ultima columna que has fet

window.onload = () => {
    loadCacheElements();
    loadEvents();
}
const loadCacheElements = () => { //Fa cache dels tres main div
    elemBoard = document.getElementById("gameBoard");
    elemButtonMenu = document.getElementById("buttonMenu");
    elemFormContainer = document.getElementById("formContainer");
    elemPopUp = document.getElementById("popUp");
    elemAlertBox = document.getElementById("alertBox");
    elemChooseSign = document.getElementById("chooseSign");

}
const loadEvents = () => {
    document.getElementById("closeButton").addEventListener("click", () => { hideFlex(elemPopUp) }, false);
    document.getElementById("buttonsSign").addEventListener("click", selectSign, false);
    elemBoard.addEventListener("mouseover", previewMove, false);
    elemBoard.addEventListener("click", makeMove, false);
}
//status O OK =TRUE KO = FALSE 
//PLAYER O o X
//response desc de el que ens dona
//gameInfo com esta el tauler actualment

//-------------GET INFO 
const loadInfoGame = (callback) => { //Aixi podrem fer aquesta funcio per a fer simplement check info i d'alli ja el usuari fer el que vulgui
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const infoActual = JSON.parse(this.responseText);
            callback(infoActual);
        }
    };
    xhttp.open("POST", "http://tictactoe.codifi.cat", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(`{"action": "infoGame","gameName": "${gameStatus.actualGameName}"}`);
}
//Funcions que pot fer callback
const joinGameInProgress = (infoActual) => {
    if (checkStatus(infoActual.status)) {
        gameStatus.positions = infoActual["gameInfo"];
        let possiblePlayerOne = infoActual["player"];
        console.log("Joined correctly");
        loadBoard();
        if(infoActual.player == ""){ 
            //CHECK SI HI EL ALTRE JUGADOR ESTA AGAFAT, SINO ESPERAR A el altre player estigui agafat
            enableLoading();
            while(infoActual.player == ""){

            }
        }
        gameStatus.player = newPlayer(possiblePlayerOne)
        //startTimer();
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}
const checkStatus = (status) => { //Mirar si l'status esta ok
    return status == "OK";
}
const newPlayer = (playerSign) => { //Per a dir al jugador que s'uneix quin es el seu simbol;
    if (playerSign == "O") {
        return "X";
    }
    return "O";
}
//------------CREATE
const loadCreateGame = (callback) => { //Aixi podrem fer aquesta funcio per a fer simplement check info i d'alli ja el usuari fer el que vulgui
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const infoActual = JSON.parse(this.responseText);
            callback(infoActual);
        }
    };
    xhttp.open("POST", "http://tictactoe.codifi.cat", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(`{"action": "createGame","gameName": "${gameStatus.actualGameName}","gamePassword": "${gameStatus.lastPassword}"}`);
}
//Funcions que pot fer callback 

const createNewGame = (infoActual) => {
    if (checkStatus(infoActual.status)) {
        gameStatus.positions = infoActual["gameInfo"];
        loadPopUpSign();
        loadBoard();
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}
const loadFormGame = (typeAction) => { //Ensenya el container i ensenya o amaga la field de password i canvia la funció del botó
    hideFlex(elemButtonMenu);
    showFlex(elemFormContainer); //Ensenya el container

    //Que comprovi si es join aixi si no es estalviem que miri fins al final.  
    //Aixó es ja que per defecte esta carregat com a join
    if (typeAction == "join") {
        return;
    }
    showFlex(document.getElementById("passwField"));
    document.getElementById("actionButtonField").innerHTML = `<button type="button" class="btn btn-dark disabled" 
    onclick="createGame()">Crear partida</button>`;

}

/* const joinOrCreate = (typeAction) => { 
    if (typeAction == "join") return "joinGame()";
    return "createGame()";
} */
const setDataGame = () => { //Posara el nom de la partida que volem unir-nos 
    gameStatus.actualGameName = document.getElementById("idGame").value;
}
const createGame = () => { //Creará una nova partida
    setDataGame();
    gameStatus.lastPassword = document.getElementById("passwordGame").value; //Posará la contraseya que utilitzarem fer a crear la partida
    loadCreateGame(createNewGame);
}
const joinGame = () => { //Fará un info agafant quin es l'u
    setDataGame();
    loadInfoGame(joinGameInProgress);
}

const selectSign = (e) => { //Aqui seleccionarem quin signe tindrem com a jugador
    let targetID = e.target.id;
    gameStatus.player = targetID;
    hide(elemChooseSign);
    hideFlex(elemPopUp);
}


//---------GAMEBOARD
const loadBoard = () => {
    hideFlex(elemFormContainer);
    showGrid(elemBoard);
    /* SISTEMA PER A QUE DETECTI ON  FA CLICK
    elemBoard.addEventListener("click",(e) => {
        e.target.style.backgroundColor = "#f2f2f2";
    },false);*/
    refreshGameBoardFields();
}
const refreshGameBoardFields = () => {

}

const loadPreview = (elem) => {
    elem.innerHTML = gameStatus.player;
}
const unloadPreview = () => {
    auxLastChecked.innerHTML = "";
    auxLastChecked.removeEventListener("mouseleave",unloadPreview,false);
}
const previewMove = (e) => {
    let target = e.target;
    console.log("TEST");
    if(target.classList.contains("col-sm") && (/^\s*$/.test(target.textContent))){
        console.log("SUCCESS");
        loadPreview(target);
        auxLastChecked = target;
        target.addEventListener("mouseleave",unloadPreview,false);
    }
}
const makeMove = (e) => {
    //Hacer que pase de gris a color opaco
    auxLastChecked.removeEventListener("mouseleave",unloadPreview,false);
}
//-------------------MISCELANIOUS FUNCTIONS
//---------POP UP
const loadPopUp = () => {
    showFlex(elemPopUp);

}
const loadPopUpInfo = (stringToLoad) => {
    document.getElementById("txtAlert").innerHTML = stringToLoad;
    show(elemAlertBox);
    loadPopUp();
}
const loadPopUpSign = () => {
    show(elemChooseSign);
    loadPopUp();
}

//-----------DISPLAYS

const showFlex = (element) => { //Li donem un element i li dona display de flex
    show(element);
    element.classList.add("d-flex");
}
const hideFlex = (element) => { //Li donem un element flex i l'amaga donantli display none
    hide(element);
    element.classList.remove("d-flex");
}

const showGrid = (element) => { //Li donem un element i li dona display de flex
    show(element);
    element.classList.add("d-grid");
}
const hideGrid = (element) => { //Li donem un element i li dona display de flex
    hide(element);
    element.classList.remove("d-grid");
}
const hide = (element) => {
    element.classList.add("d-none");
}
const show = (element) => {
    element.classList.remove("d-none");
}

const stopLoad = () => { //Amagar la animacio de carregar
    //let elem = document.querySelectorAll(".loading")[0];
    let op = 1;
    var timer = setInterval(function () {
        if (op <= 0.1) {
            clearInterval(timer);
            elem.style.display = 'none';
        }
        elem.style.opacity = op;
        elem.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 10);
}

//AL CONECTARSE DIR CREAR O UNIR
    //SI CREAR LI DIREM QUE POSI EL GAMENAME I GAME PASSWORD
        //AL REQUEST TINDRA {
/*     "action": "createGame",
    "gameName": "xxxxx",
    "gamePassword": "yyyyy"
} */
    //AL CREAR DEMANAR QUIN SIGNE VOLS
    //SI VOL UNIR
        //fara infoGame i veura si dona ok, si ho fa segueix i carrega les dades
            //SI ESTA player buit esperar

    //FUNCIO CARREGAR ESTAT
        //infogame

//AL ESTAR AL JOC
    //Li direm que miri el moviment 

//Interval que comprovi a quin usuari li toca cada 5 usuaris


//EXAMPLE CREACIO
// {"status":"OK","response":"The game has been created."}

//EXAMPLE INFOGAME
/* {"status":"OK","response":"Enjoy the
game.","gameInfo":{"A1":"","A2":"","A3":"","B1":"","B2":"","B3":"","C1":"","C2":"","C3":""},"player":""} */