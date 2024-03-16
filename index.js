const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const port = process.env.SIMPLE_PORT || 32323;

/**
 * Takes a stringy value and determines if it's numbery or booleany and formats it accordingly
 * @param {string} value - a stringy value
 * @returns float|int|bool|string
 */
const coerce = (value) => {
    if(parseFloat(value).toString() == value){
        return parseFloat(value);
    }else if(parseInt(value).toString() == value){
        return parseInt(value);
    }else if(value.toLowerCase() === 'true'){
        return true;
    }else if(value.toLowerCase() === 'false'){
        return false;
    }else{
        return value;
    }
}


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
}));

app.use(bodyParser.json());

/**
 * Handles reading the raw body of an Express Request body. Appends a `rawBody` property to the Request object
 */
app.use(function(req, res, next) {
    var contentType = req.headers['content-type'] || '', mime = contentType.split(';')[0];

    if (mime != 'text/plain') {
        return next();
    }

    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
        data += chunk;
    });
    req.on('end', function() {
        req.rawBody = data;
        next();
    });
});

/**
 * A little health check endpoint
 */
app.get('/', (req, res) => {
    res.send('OK');
})

/**
 * Set a variable. Uses URLs in the format /set/variable and
 * takes the raw POST body and stores that as the variable's value.
 * If a variable with the same key already exists, its value will
 * be updated with the supplied value in the POST body
 * Example Response: SET some_var TO "112324234"
 */
app.post('/set/:key', (req, res) => {
    const key = req.params.key;
    const value = req.rawBody;
    let mode = 'SET';
    
    try{
        db.all(`SELECT key FROM variables WHERE key=?`, key, (err, rows) => {
            if(err){
                console.error(err);
                res.send('ERROR: ' + err);
                return; 
            }
            if(rows.length > 0){
                mode = "UPDATE";
                db.run(`UPDATE variables SET value=? WHERE key=?`, value, key);
            }else{
                db.run(`INSERT INTO variables (key, value) VALUES (?, ?)`, key, value);
            }

            res.send(`${mode} ${key} TO "${value}"`);
        })
    }catch(err){
        console.error('[set] Error setting variable value', err);
        res.send('ERROR: ' + err);
    }
})

/**
 * Stores one or more values in the database.
 * Uses a URL format of /set?some_var=123&another_var=some+text
 * If a key with the same name already exists, its value will be
 * updated with the supplied value
 * Example Response: SET some_var TO "123"\nUPDATED another_var TO "some text"
 */
app.post('/set/?\?', (req, res) => {
    let output = '';
    const varsToSet = Object.keys(req.query).length;
    let varsSet = 0;

    for(const key in req.query){
        const value = req.query[key];
        try{
            db.all(`SELECT key FROM variables WHERE key=?`, key, (err, rows) => {
                if(err){
                    console.error(err);
                    res.send('ERROR: ' + err);
                    return; 
                }
                if(rows.length > 0){
                    mode = "UPDATE";
                    db.run(`UPDATE variables SET value=? WHERE key=?`, value, key);
                }else{
                    mode = "SET";
                    db.run(`INSERT INTO variables (key, value) VALUES (?, ?)`, key, value);
                }
    
                output +=`${mode} ${key} TO "${value}"` + "\n";
                varsSet++;

                if(varsToSet === varsSet){
                    res.send(output);
                }
            })
        }catch(err){
            console.error('[set] Error setting variable value', err);
            res.send('ERROR: ' + err);
        }
    }
})

/**
 * Retrieves the value of one or more variables and returns 
 * the result as a JSON response.
 * URL format: /get/json?some_var,anotherVar,thisVar
 * If a key does not exist in the database, it will be omitted
 * from the JSON response object
 */
app.get('/get/json/?\?', (req, res) => {
    const keyNames = Object.keys(req.query)[0];
    if(keyNames && keyNames.length > 0){
        let keys = keyNames.split(',');
        let keyHash = {};

        const query = `SELECT key, value FROM variables WHERE key IN (${keys.map((keyName) => `'${keyName}'`).join(',')})`;
        console.log(query);
        db.all(query, (err, rows) => {
            if(err){
                console.error(err);
                res.send('ERROR: ' + err);
                return;
            }

            if(rows && rows.length > 0){
                for(const row of rows){
                    keyHash[row.key] = coerce(row.value);
                }

                res.json(keyHash);
            }else{
                res.send('');
            }
        })
    }else{
        res.send('ERROR: NO KEYS');
    }
})

/**
 * Retrieves the value of a variable. 
 * URL format: /get/some_var
 * If there is not value for the var, an empty response is sent.
 */
app.get('/get/:key', (req, res) => {
    db.get(`SELECT key, value FROM variables WHERE key=?`, req.params.key, (err, row) => {
        if(err){
            console.error(err);
            res.send('ERROR: ' + err);
            return;
        }
        if(row){
            res.send(row.value);
        }else{
            res.send('')
        }
    })
})

/**
 * Retrieves the value of one or more variables and returns
 * the values as a comma separated list.
 * URL format: /get?some_var,anotherVar,thisVar
 * If a value for a key has not been set, it will be returned 
 * as UNDEFINED in the list.
 * Example Response: 123,UNDEFINED,some words
 */
app.get('/get/?\?', (req, res) => {
    const keyNames = Object.keys(req.query)[0];
    if(keyNames && keyNames.length > 0){
        let keys = keyNames.split(',');
        let keyHash = {};

        const query = `SELECT key, value FROM variables WHERE key IN (${keys.map((keyName) => `'${keyName}'`).join(',')})`;
        db.all(query, (err, rows) => {
            if(err){
                console.error(err);
                res.send('ERROR: ' + err);
                return;
            }

            if(rows && rows.length > 0){
                let output = [];
                for(const row of rows){
                    keyHash[row.key] = row.value;
                }

                for(const key of keys){
                    if(keyHash.hasOwnProperty(key)){
                        output.push(keyHash[key]);
                    }else{
                        output.push('UNDEFINED');
                    }
                }

                res.send(output.join(','));
            }else{
                res.send('');
            }
        })
    }else{
        res.send('ERROR: NO KEYS');
    }
})

/**
 * Deletes a key/value pair from the database.
 * URL format: /delete/some_var
 * Example Response: DELETED some_var
 */
app.post('/delete/:key', (req, res) => {
    const key = req.params.key;
    try{
        db.run(`DELETE FROM variables WHERE key=?`, key);
        res.send(`DELETED ${key}`);
    }catch(err){
        console.error('[set] Error deleting variable value', err);
        res.send('ERROR: ' + err);
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})