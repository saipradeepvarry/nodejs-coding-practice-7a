const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDetailsDbServer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbServer = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertMatchScoreDbServer = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//1st GET Player API
app.get("/players/", async (request, response) => {
  const totalPlayers = `
  SELECT * FROM player_details`;
  const playersDbQuery = await db.all(totalPlayers);
  response.send(
    playersDbQuery.map((player1) => convertPlayerDetailsDbServer(player1))
  );
});

//2nd GET PlayerID API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIDQuery = `
  SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const playerIDDbQuery = await db.get(getPlayerIDQuery);
  response.send(convertPlayerDetailsDbServer(playerIDDbQuery));
});

//3rd PUT PlayerId API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const totalPlayerIds = request.body;
  const { playerName } = totalPlayerIds;
  const updatePlayerIDQuery = `
  UPDATE player_details SET  player_name = '${playerName}', player_id = '${playerId}'
  WHERE player_id = ${playerId};`;
  await db.run(updatePlayerIDQuery);
  response.send("Player Details Updated");
});

//4th GET Match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const totalMatchIdQuery = `
  SELECT 
    match_id AS matchId,
    match,
    year 
  FROM match_details
  WHERE match_id = ${matchId};`;
  const matchDb2 = await db.get(totalMatchIdQuery);
  response.send(matchDb2);
});

//5th GET PlayerID and Matches API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const totalPlayerQuery = `
  SELECT 
  match_id AS matchId,
  match,
  year 
  FROM player_match_score NATURAL JOIN match_details
  WHERE player_id = ${playerId};`;
  const playerIdMatchQuery = await db.all(totalPlayerQuery);
  response.send(playerIdMatchQuery);
});

//6th GET MatchId and PlayerID API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const totalMatchIdQuerys = `
  SELECT 
  player_match_score.player_id AS playerId, 
  player_name AS playerName 


  FROM player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
  WHERE match_id = ${matchId};`;
  const totalMatchIdDbQuery = await db.all(totalMatchIdQuerys);
  response.send(totalMatchIdDbQuery);
});

//7th GET PlayerId and PlayerScore API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const totalPlayerIdAndPlayerScores = `
  SELECT
  player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(player_match_score.score) AS totalScore,
  SUM(fours) AS  totalFours,
  SUM(sixes) AS totalSixes


  FROM player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id


  WHERE player_details.player_id = ${playerId};`;
  const totalPlayerScoreAndPlayerIDQuery = await db.get(
    totalPlayerIdAndPlayerScores
  );
  response.send(totalPlayerScoreAndPlayerIDQuery);
});
module.exports = app;
