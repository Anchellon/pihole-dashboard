// js Sqlite3 Driver
var sqlite3 = require("sqlite3").verbose();
var exec = require("child_process").exec;
var fs = require("fs");
// var dbFile = "db/gravity_old.db"; //file locations of the sqlite3 db
var dbFile = "/etc/pihole/gravity.db";
var dbExists = fs.existsSync(dbFile);
var focusDbFile = "db/focus.db";
var db = new sqlite3.Database(dbFile);
var focusDb = new sqlite3.Database(focusDbFile);

let createTableQuery =
    "CREATE TABLE IF NOT EXISTS focusdb( id PRIMARY KEY, domain text, startTimeH integer, startTimeM integer, endTimeH integer,endTimeM integer);";
var id = 0;

// Checking if DB Exists
if (!dbExists || !focusDbFile) {
    console.log("DB Doesn't Exist");
} else {
    console.log("connected to db");
    focusDb.run(createTableQuery, [], function (err) {
        if (err) {
            console.log(err.message);
        }
        // get the last insert id
        console.log(`Rows inserted ${this.changes}`);
    });
}

// INSERT INTO MyTable
//     ( Column_foo, Column_CreatedOn)
//     VALUES
//         ('foo 1', '2023-02-20 14:10:00.001'),
//         ('foo 2', '2023-02-20 14:10:00.002'),
//         ('foo 3', '2023-02-20 14:10:00.003')

// INSERT INTO domainlist VALUES
//(3,<linktext>,true, Date.now() / 1000,Date.now() / 1000,"")

// Function to generate Query Strings
// the link submitted are set to regex ie value 3
// The date added and modified are the subsequent fields
// No comments are added by default can improve on it iff required

async function sh(cmd) {
    return new Promise(function (resolve, reject) {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}
async function updatePihole() {
    let { stdout } = await sh("pihole -g");
}

function generateQueryString(links, id) {
    // let links = ["reddit.com", "facebook.com"];
    let str = "";
    // console
    links.forEach((link) => {
        str =
            str +
            `(${++id},3,"${link}",1,"${Date.now().toString()}","${Date.now().toString()}",""),`;
    });
    str = str.slice(0, -1);
    str = str + ";";
    return str;
}

// This method taks in a request with the links
// It is then added into the corresponding gravity db of the pihole so that functioning can take place
exports.link_create_postMethod = async (req, res) => {
    // let links = req.body.links;
    let links = ["reddit.com", "facebook.com"];

    let lastIdQuery = "SELECT * FROM domainlist ORDER BY id DESC LIMIT 1;";
    let lastId = 0;
    result = await db.all(lastIdQuery, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            lastId = row.id;
            console.log("bruh" + lastId + "hi");
        });
    });
    console.log(lastId);

    let queryString =
        "INSERT INTO domainlist VALUES" + generateQueryString(links, lastId);
    console.log(queryString);

    db.run(queryString, [], function (err) {
        if (err) {
            console.log(err.message);
            return res.send(400, "Failled to add");
        }
        // get the last insert id
        console.log(`Rows inserted ${this.changes}`);
    });
    db.close();
    updatePihole();
    res.send(200, "Success");
};
// Further work ability to enable and disable links, Potentially submit cron jobs too
exports.link_create_postMethod2 = (req, res) => {};
// let toggleInternetQuery =
// "SELECT * FROM domainlist WHERE comment LIKE 'toggle-internet;";
exports.toggle_internet = (req, res) => {
    // get current status of internet
    let toggleInternetQuery =
        "SELECT * FROM domainlist WHERE comment LIKE 'toggle-internet;";
    let truth = null;
    let id = null;
    db.each(toggleInternetQuery, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            truth = row.enabled;
            id = row.id;
        });
    });
    if (truth) {
        truth = 0;
    } else {
        truth = 1;
    }
    let toggleQuery = `UPDATE domainlist SET enabled=${truth} WHERE id=${id};`;
    db.run(toggleQuery, [], function (err) {
        if (err) {
            console.log(err.message);
            return res.send(400, "Failled to add");
        }
        // get the last insert id
        console.log(`Rows inserted ${this.changes}`);
    });
    db.close();
    updatePihole();
    res.send(200, "Success");
};

// {
// focusRecord: [
//      {   domainName: string,
//          startTime: HH:MM,
//          endTime: HH:MM
//      }
//  ]
// }
// Work with the python parser
exports.focusMode = (req, res) => {
    let focusRecord = req.body.focusRecord;
    let lastIdQuery = "SELECT * FROM focusdb ORDER BY id DESC LIMIT 1;";
    let lastId = 0;
    // get last id from focus db
    focusDb.all(lastIdQuery, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            lastId = row.id;
        });
    });
    focusRecord.forEach((record) => {
        let insertQuery = `INSERT INTO focusdb VALUES (${++lastId},${
            record.domainName
        },${parseInt(record.startTime.slice(0, 2))},${parseInt(
            record.endTime.slice(2, 4)
        )})`;
        db.run(insertQuery, [], function (err) {
            if (err) {
                console.log(err.message);
                return res.send(400, "Failled to add");
            }
            // get the last insert id
            console.log(`Rows inserted ${this.changes}`);
        });
        if (
            isMorethanCurrentTime(
                parseInt(record.startTime.slice(0, 2)),
                parseInt(record.endTime.slice(2, 4))
            )
        ) {
            let lastIdDomList = 0;
            let lastIdQueryDl =
                "SELECT * FROM domainlist ORDER BY id DESC LIMIT 1;";
            db.all(lastIdQueryDl, [], (err, rows) => {
                if (err) {
                    throw err;
                }
                rows.forEach((row) => {
                    lastIdDomList = row.id;
                });
            });

            let updateQuery = `INSERT INTO domainlist VALUES(${lastIdDomList},3,${
                record.domainName
            },true, ${Date.now() / 1000},${Date.now() / 1000},"");`;
            db.run(updateQuery, [], function (err) {
                if (err) {
                    console.log(err.message);
                    return res.send(400, "Failled to add");
                }
                // get the last insert id
                console.log(`Rows inserted ${this.changes}`);
            });
        }
    });
    focusDb.close();
    db.close();
    updatePihole();
    res.send(200, "Success");
};

let isMorethanCurrentTime = (hour, min) => {
    if (hour >= new Date().getHours() && min > new Date().getMinutes()) {
        return true;
    }
    return false;
};
