const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "simplenotes.db");

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
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Register API

app.post("/users/", async (request, response) => {
  const { username, email, password, location } = request.body;
  const selectUserQuery = `
    SELECT 
      * 
    FROM 
      Users 
    WHERE 
      username = "${username}"`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password using hash method
    const createUserQuery = `
        INSERT INTO 
        Users (username, email, password, location)
        VALUES 
        (
          "${username}",
          "${email}",
          "${hashedPassword}",
          "${location}"
        )
    `;
    await db.run(createUserQuery);
    response.send("User Created Successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login API

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM Users WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password); // Compare User details using compare method
    console.log(`Password matched: ${isPasswordMatched}`); // Added debugging statement

    if (isPasswordMatched) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
