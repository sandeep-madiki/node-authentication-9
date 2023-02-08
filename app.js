const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const myApp = express();
myApp.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let database = null;

const initializeServerAndDB = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    myApp.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(error.message);
  }
};
initializeServerAndDB();

myApp.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const checkUsername = `
  SELECT *
  FROM user
  WHERE username = '${username}'`;
  const dbresponse = await database.get(checkUsername);
  if (dbresponse === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = `
          INSERT INTO
            user (username, name, password, gender, location)
          Values
            (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            )`;
      const insertUser = await database.run(insertQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//api2
myApp.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUser = `
     SELECT *
     FROM user
     WHERE username = '${username}'`;
  const dbResponse = await database.get(checkUser);
  if (dbResponse !== undefined) {
    const comparePassword = await bcrypt.compare(password, dbResponse.password);
    if (comparePassword !== true) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//api3
myApp.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userCheck = `
    SELECT * 
    FROM user
    WHERE username = '${username}'`;
  const dbresponse = await database.get(userCheck);
  if (dbresponse !== undefined) {
    const comparePassword = await bcrypt.compare(
      oldPassword,
      dbresponse.password
    );
    if (comparePassword === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `
        UPDATE user
        SET
          password = '${hashedPassword}'`;
        const passwordUpdateRes = await database.run(updatePassword);
        response.status(200);
        response.send("Password updated");
      }
    }
  } else {
    response.status(400);
    response.send("Username doesn't exists");
  }
});

module.exports = myApp;
