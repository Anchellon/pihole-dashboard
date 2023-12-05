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
const { promisify } = require("util");
const focusDbAll = promisify(focusDb.all).bind(focusDb);
const focusDbRun = promisify(focusDb.run).bind(focusDb);
let createTableQuery =
    "CREATE TABLE IF NOT EXISTS focusdb( id PRIMARY KEY, domain text, startTimeH integer, startTimeM integer, endTimeH integer,endTimeM integer);";
var id = 0;

// Checking if DB Exists
if (!dbExists || !focusDbFile) {
    console.log("DB Doesn't Exist");
} else {
    console.log("connected to db");
    let runFocusDbQuery = (createTableQuery) => {
        return new Promise((resolve, reject) => {
            focusDb.run(createTableQuery, [], function (err) {
                if (err) {
                    console.error(err.message);
                    reject(`Failed to run query: ${createTableQuery}`);
                } else {
                    console.log(`Rows inserted ${this.changes}`);
                    resolve(`Rows inserted ${this.changes}`);
                }
            });
        });
    };
    runFocusDbQuery(createTableQuery)
        .then((successMessage) => {
            console.log(successMessage);
            // Do something with the success message
        })
        .catch((errorMessage) => {
            console.error(errorMessage);
            // Handle the error message
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
    let links = ["yelp.com", "airbnb.com"];

    let lastIdQuery = "SELECT * FROM domainlist ORDER BY id DESC LIMIT 1;";
    let lastId = 0;
    let getLastId = () => {
        return new Promise((resolve, reject) => {
            db.get(lastIdQuery, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    let lastId = 0;
                    // rows.forEach((row) => {
                    lastId = row.id;
                    console.log("bruh" + lastId + "hi");
                    // });
                    resolve(lastId);
                }
            });
        });
    };
    try {
        // Await the promise to get the lastId
        let lastId = await getLastId();

        console.log("bombastic" + lastId);

        let queryString =
            "INSERT INTO domainlist VALUES" +
            generateQueryString(links, lastId);
        console.log(queryString);

        db.run(queryString, [], function (err) {
            if (err) {
                console.log(err.message);
                return res.status(400).send("Failed to add");
            }
            // get the last insert id
            console.log(`Rows inserted ${this.changes}`);
        });
        db.close();
        updatePihole();
        res.status(200).send("Success");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};
// Further work ability to enable and disable links, Potentially submit cron jobs too
exports.link_create_postMethod2 = (req, res) => {};
// let toggleInternetQuery =
// "SELECT * FROM domainlist WHERE comment LIKE 'toggle-internet;";
exports.toggle_internet = async (req, res) => {
    let toggleInternetQuery =
        "SELECT * FROM domainlist WHERE comment LIKE 'toggle-internet%';"; // Properly close the LIKE clause
    let getInternetStatus = () => {
        return new Promise((resolve, reject) => {
            db.get(toggleInternetQuery, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    let truth = 0;
                    // rows.forEach((row) => {
                    truth = row.enabled;
                    id = row.id;
                    console.log("bruh" + truth + "hi");
                    // });
                    resolve([truth, id]);
                }
            });
        });
    };
    try {
        // Await the promise to get the lastId
        let result = await getInternetStatus();
        let truth = result[0];
        let id = result[1];
        console.log("bombastic truth " + truth + "id " + id);
        console.log(truth);
        console.log(id);
        // Toggle the truth value
        truth = truth ? 0 : 1;

        let toggleQuery = `UPDATE domainlist SET enabled = ? WHERE id = ?;`;
        db.run(toggleQuery, [truth, id], function (err) {
            // Use parameters to prevent SQL injection
            if (err) {
                console.log(err.message);
                return res.status(400).send("Failed to update");
            }
            // get the last insert id cause why not
            console.log(`Rows updated ${this.changes}`);
        });
        db.close();
        updatePihole();
        res.status(200).send("Success");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
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
exports.focusMode = async (req, res) => {
    try {
        let focusRecord = req.body.focusRecord;
        console.log(focusRecord);
        let lastIdQuery = "SELECT * FROM focusdb ORDER BY id DESC LIMIT 1;";
        let lastId = 0;

        // get last id from focus db
        const rows = await focusDbAll(lastIdQuery);
        rows.forEach((row) => {
            lastId = row.id;
        });

        for (record of focusRecord) {
            // console.log(record.startTime);
            let insertQuery = `INSERT INTO focusdb VALUES (
                ${++lastId},
                ${record.domainName},
                ${parseInt(record.startTime.slice(0, 2))},
                ${parseInt(record.startTime.slice(2, 4))},
                ${parseInt(record.endTime.slice(0, 2))},
                ${parseInt(record.endTime.slice(2, 4))})`;
            console.log(insertQuery);

            await focusDbRun(insertQuery);

            if (
                isMorethanCurrentTime(
                    parseInt(record.startTime.slice(0, 2)),
                    parseInt(record.endTime.slice(2, 4))
                )
            ) {
                let lastIdDomList = 0;
                let lastIdQueryDl =
                    "SELECT * FROM domainlist ORDER BY id DESC LIMIT 1;";

                const rowsDomList = await dbAll(lastIdQueryDl);
                rowsDomList.forEach((row) => {
                    lastIdDomList = row.id;
                });

                let updateQuery = `INSERT INTO domainlist VALUES(${lastIdDomList},3,${
                    record.domainName
                },true, ${Date.now() / 1000},${Date.now() / 1000},"");`;

                await dbRun(updateQuery);
            }
        }

        focusDb.close();
        db.close();
        updatePihole();
        res.status(200).send("Success");
    } catch (error) {
        console.error(error.message);
        res.status(400).send("Failed to add");
    }
};

let isMorethanCurrentTime = (hour, min) => {
    if (hour >= new Date().getHours() && min > new Date().getMinutes()) {
        return true;
    }
    return false;
};
