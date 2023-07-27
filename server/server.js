const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const requestIp = require("request-ip");
const corsOptions = {
  origin: "https://inanimate631.github.io", // Разрешенный источник (origin)
  methods: ["GET", "POST"], // Разрешенные HTTP-методы
};
const cors = require("cors");

const app = express();
const server = http.Server(app);
const io = socketIO(server, {
  cors: {
    origin: "https://inanimate631.github.io",
    methods: ["GET", "POST"],
  },
});

app.set("port", 5000);
app.use("/static", express.static(path.join(__dirname, "public")));
app.use(requestIp.mw());
app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://inanimate631.github.io"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  next();
});
let connectedUsers = [];
let users = [];

let wordArray = [];

let clickOnWord = null;
let blueGameWord = [];
let redGameWord = [];

let clickMoveColor;

let selectCartArray = [];

let isAdmin = true;

let wordsShowed = {
  redWords: [],
  blueWords: [],
  blackWords: -1,
  whiteWords: [],
};

let wordShowedArray = [];

let isTeamMove = false;

let teamEndTurn = [];

let isGameEnd = false;

let isTeamMoveTimer = false;

let time;
let teamColor;

let isGameIsPause = false;

io.on("connection", (socket) => {
  //handshake.headers["x-forwarded-for"].split(", ")[0];
  const userIp = socket.id
  console.log("User connected:", userIp);

  if (connectedUsers.length > 0) {
    isAdmin = false;
  } else if (connectedUsers.length === 0) {
    isAdmin = true;
  }

  let user = users.find((user) => user.id === userIp);
  if (!user) {
    user = {
      id: userIp,
      name: "changeName",
      color: "#fff",
      isMaster: false,
      role: "Spectators",
      isAdmin: isAdmin,
    };
    users.push(user);
  } else {
    user.role = "Spectators";
    user.isMaster = false;
  }
  connectedUsers.push(user);

  socket.emit("currentUser", user);
  io.emit("connectedUsersUpdated", connectedUsers);

  socket.on("disconnect", () => {
    console.log("User disconnected:", userIp);
    connectedUsers = connectedUsers.filter((user) => user.id !== userIp);
    io.emit("connectedUsersUpdated", connectedUsers);
  });

  io.emit("/getWordArray", wordArray);

  io.emit("/getClicksWord", clickOnWord);

  io.emit("/getBlueTeamWord", blueGameWord);
  io.emit("/getRedTeamWord", redGameWord);
  io.emit("/getMasterWords", {
    blueWords: blueWords,
    redWords: redWords,
    blackWords: blackWords,
  });
  io.emit("/getCartSelected", selectCartArray);
  io.emit("/getTeamMoveColor", clickMoveColor);
  io.emit("/getIsTeamMove", isTeamMove);
  io.emit("/getWordsShowed", wordsShowed);
  io.emit("/getTeamEndTurn", teamEndTurn);
  io.emit("/getIsGameEnd", isGameEnd);
  io.emit("/getIsTeamMoveTimer", isTeamMoveTimer);
  io.emit("/getTime", { time: time, teamColor: teamColor });
  io.emit("/getIsGamePause", isGameIsPause);
});

app.post("/updateConnectedUsers", (req, res) => {
  const updateUsers = req.body;
  if (Array.isArray(updateUsers)) {
    connectedUsers = updateUsers;
    updateUsers.forEach((updateUser) => {
      let userIndex = users.findIndex(
        (userInUser) => userInUser.id === updateUser.id
      );
      if (userIndex >= 0) {
        users[userIndex] = updateUser;
      }
    });
    io.emit("connectedUsersUpdated", connectedUsers);
    io.emit("/getMasterWords", {
      blueWords: blueWords,
      redWords: redWords,
      blackWords: blackWords,
    });
    io.emit("/getWordsShowed", wordsShowed);
    res.status(200).json({ message: "Connected users updated successfully" });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
});

app.post("/wordArray", (req, res) => {
  wordArray = req.body;
  blueGameWord = [];
  redGameWord = [];
  clickOnWord = null;
  selectCartArray = [];
  wordsShowed = {
    redWords: [],
    blueWords: [],
    blackWords: -1,
    whiteWords: [],
  };
  wordShowedArray = [];
  isTeamMove = false;
  teamEndTurn = [];
  isGameEnd = false;
  isTeamMoveTimer = false;

  io.emit("/getRedTeamWord", redGameWord);
  io.emit("/getBlueTeamWord", blueGameWord);
  io.emit("/getWordArray", wordArray);
  io.emit("/getCartSelected", selectCartArray);
  io.emit("/getWordsShowed", wordsShowed);
  io.emit("/getWordsShowedArray", wordShowedArray);
  io.emit("/getIsTeamMove", isTeamMove);
  io.emit("/getTeamEndTurn", teamEndTurn);
  io.emit("/getIsGameEnd", isGameEnd);
  io.emit("/getIsTeamMoveTimer", isTeamMoveTimer);

  res.status(200).json({ message: "Массив слов успешно получен на сервере" });
});

let blueWords = [];
let redWords = [];
let blackWords = 0;

app.post("/setMasterWord", (req, res) => {
  try {
    let objWords = req.body;
    blueWords = objWords.blueWords;
    redWords = objWords.redWords;
    blackWords = objWords.blackWords;

    io.emit("/getMasterWords", {
      blueWords: blueWords,
      redWords: redWords,
      blackWords: blackWords,
    });

    res.status(200).json({ message: "Массивы слов созданны" });
  } catch (error) {
    console.error("Error on /setMasterWord:", error);
    res.status(500).json({ message: "Error on /setMasterWord" });
  }
});

app.post("/clickOnWord", (req, res) => {
  clickOnWord = req.body.value;
  io.emit("/getClicksWord", clickOnWord);
  res.status(200).json({ message: "Click on Word" });
});

app.post("/addTeamWord", (req, res) => {
  if (req.body.team === "red") {
    redGameWord.push(req.body.word);
    io.emit("/getRedTeamWord", redGameWord);
  } else if (req.body.team === "blue") {
    blueGameWord.push(req.body.word);
    io.emit("/getBlueTeamWord", blueGameWord);
  }

  isTeamMove = true;
  io.emit("/getIsTeamMove", isTeamMove);

  res.status(200).json({ message: "add team word" });
});

app.post("/userSelectCart", (req, res) => {
  const index = selectCartArray.findIndex(
    (item) => item.user === req.body.userId
  );
  if (index !== -1) {
    selectCartArray[index].id = req.body.cartId;
    selectCartArray[index].color = req.body.color;
  } else {
    selectCartArray.push({
      id: req.body.cartId,
      color: req.body.color,
      user: req.body.userId,
    });
  }
  io.emit("/getCartSelected", selectCartArray);
  res.status(200).json({ message: "cart selected" });
});

app.post("/userDeletedPointerOnCart", (req, res) => {
  selectCartArray = selectCartArray.filter((item) => item.id !== req.body.id);
  io.emit("/getCartSelected", selectCartArray);
  res.status(200).json({ message: "cart selected" });
});

app.post("/changeTeamMoveColor", (req, res) => {
  selectCartArray = [];
  clickMoveColor = req.body.color;
  teamEndTurn = [];
  isTeamMoveTimer = false;

  io.emit("/getTeamMoveColor", clickMoveColor);
  io.emit("/getTeamEndTurn", teamEndTurn);
  io.emit("/getIsTeamMoveTimer", isTeamMoveTimer);
  res.status(200).json({ message: "cart selected" });
});

app.post("/setWordsShowed", (req, res) => {
  let id = req.body.id;

  wordShowedArray.push(id);
  if (redWords.includes(id)) {
    wordsShowed.redWords.push(id);
  } else if (blueWords.includes(id)) {
    wordsShowed.blueWords.push(id);
  } else if (blackWords === id) {
    wordsShowed.blackWords = id;
  } else {
    wordsShowed.whiteWords.push(id);
  }
  io.emit("/getWordsShowed", wordsShowed);
  io.emit("/getWordsShowedArray", wordShowedArray);

  res.status(200).json({ message: "words Showed" });
});

app.post("/setIsTeamMove", (req, res) => {
  isTeamMove = req.body.isTeamMove;
  io.emit("/getIsTeamMove", isTeamMove);

  res.status(200).json({ message: "change Team Move" });
});

app.post("/endTurn", (req, res) => {
  const index = teamEndTurn.findIndex((item) => item.user === req.body.user);
  if (index === -1) {
    teamEndTurn.push(req.body);
  } else {
    teamEndTurn.splice(index, 1);
  }
  io.emit("/getTeamEndTurn", teamEndTurn);

  res.status(200).json({ message: "click on end turn" });
});

app.post("/isGameEnd", (req, res) => {
  isGameEnd = req.body.isGameEnd;
  io.emit("/getIsGameEnd", isGameEnd);

  res.status(200).json({ message: "game end or start" });
});

app.post("/setIsTeamMoveTimer", (req, res) => {
  isTeamMoveTimer = req.body.isTeamMoveTimer;
  io.emit("/getIsTeamMoveTimer", isTeamMoveTimer);

  res.status(200).json({ message: "change team move timer" });
});

//timer
let timerSubscription;

app.post("/setTime", (req, res) => {
  isGameIsPause = false;

  timer(req.body.time, req.body.teamColor);
  io.emit("/getIsGamePause", isGameIsPause);
  res.status(200).json({ message: "set time" });
});

app.post("/clearTime", (req, res) => {
  if (req.body.clearTimer === true) {
    isGameIsPause = true;
    clearInterval(timerSubscription);
    io.emit("/getIsGamePause", isGameIsPause);
  }

  res.status(200).json({ message: "timer stop" });
});

function timer(reqTime, teamColor) {
  if (timerSubscription) {
    clearInterval(timerSubscription);
  }
  time = reqTime;
  teamColor = teamColor;

  io.emit("/getTime", { time: time, teamColor: teamColor });
  timerSubscription = setInterval(() => {
    let [min, sec] = time.split(":").map(Number);

    if (min === 0 && sec === 0) {
      clearInterval(timerSubscription);
      return;
    }

    if (sec === 0) {
      min--;
      sec = 60;
    }

    sec--;
    time = `${min}:${sec < 10 ? "0" + sec : sec}`;
    io.emit("/getTime", { time: time, teamColor: teamColor });
  }, 1000);
}

server.listen(app.get("port"), () => {
  console.log("Server started on port", app.get("port"));
});
