const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require("fs");

const dbFileName = 'simple-store.sqlite';
const dbPath = path.resolve(__dirname, './' + dbFileName);

let db;

if(fs.existsSync(dbPath)){
    db = new sqlite3.Database(dbPath, (err) => {
        if(err){
            console.error("[db] Error connecting to database: ", err);
            exit(1);
        }
        console.log('Connected to the database');
    })
}else{
    createDB();
}

function createDB(){
    console.log('Creating database');
    db = new sqlite3.Database(path.resolve(__dirname, './' + dbFileName), (err) => {
        if(err){
            console.error("[createDB] Error Creating DB: ", err);
        }

        createTables();
    })
}

function createTables(){
    console.log('Creating table');
    db.exec(`CREATE TABLE variables (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL, value TEXT)`);
}

module.exports = db;