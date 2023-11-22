var sqlite3 = require("sqlite3").verbose();
var fs = require("fs");
var dbFile = "/etc/pihole/gravity.db"; //file locations of the sqlite3 db
var dbExists = fs.existsSync(dbFile);
if (!dbExists) {
    console.log("DB Doesn't Exist");
}
var db = new sqlite3.Database(dbFile);

// INSERT INTO MyTable
//     ( Column_foo, Column_CreatedOn)
//     VALUES
//         ('foo 1', '2023-02-20 14:10:00.001'),
//         ('foo 2', '2023-02-20 14:10:00.002'),
//         ('foo 3', '2023-02-20 14:10:00.003')

// INSERT INTO domainlist VALUES
//(3,<linktext>,true, Date.now() / 1000,Date.now() / 1000,"")

function generateQueryString(links) {
    // let links = ["reddit.com", "facebook.com"];
    let str = "";
    // console
    links.forEach((link) => {
        str =
            str +
            "(3," +
            link +
            ",1," +
            Date.now().toString() +
            "," +
            Date.now().toString() +
            ',""),';
    });
    str = str.slice(0, -1);
    str = str + ";";
    return str;
}

exports.link_create_postMethod = async (req, res) => {
    // let links = req.body.links;
    let links = ["reddit.com", "facebook.com"];
    let queryString =
        "INSERT INTO domainlist VALUES" + generateQueryString(links);

    db.run(queryString, [], function (err) {
        if (err) {
            console.log(err.message);
            return res.send(400, "Failled to add");
        }
        // get the last insert id
        console.log(`Rows inserted ${this.changes}`);
    });
    db.close();
    res.send(200, "Success");
};
