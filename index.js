const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const port = process.env.SIMPLE_PORT || 32323;

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

app.get('/', (req, res) => {
    res.send('OK');
})

app.post('/set/:key', (req, res) => {
    const key = req.params.key;
    const value = req.rawBody;
    let mode = 'SET';

    
    try{
        db.all(`SELECT key FROM variables WHERE key=?`, key, (err, rows) => {
            if(err){
                console.error(err);
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
    }
})

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
                    res.send(err);
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
            res.send(err);
        }
    }
})

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
                res.send(err);
                return;
            }

            if(rows && rows.length > 0){
                let output = [];
                for(const row of rows){
                    keyHash[row.key] = coerce(row.value);
                }

                res.json(keyHash);
            }else{
                res.send('');
            }
        })
    }else{
        res.send('NO KEYS');
    }
})

app.get('/get/:key', (req, res) => {
    db.get(`SELECT key, value FROM variables WHERE key=?`, req.params.key, (err, row) => {
        if(err){
            console.error(err);
            res.send(err);
            return;
        }
        if(row){
            res.send(row.value);
        }else{
            res.send('')
        }
    })
})

app.get('/get/?\?', (req, res) => {
    const keyNames = Object.keys(req.query)[0];
    if(keyNames && keyNames.length > 0){
        let keys = keyNames.split(',');
        let keyHash = {};

        const query = `SELECT key, value FROM variables WHERE key IN (${keys.map((keyName) => `'${keyName}'`).join(',')})`;
        console.log(query);
        db.all(query, (err, rows) => {
            if(err){
                console.error(err);
                res.send(err);
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
        res.send('NO KEYS');
    }
})

app.post('/delete/:key', (req, res) => {
    const key = req.params.key;
    try{
        db.run(`DELETE FROM variables WHERE key=?`, key);
        res.send(`DELETED ${key}`);
    }catch(err){
        console.error('[set] Error deleting variable value', err);
        res.send(err);
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})