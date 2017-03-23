// Dependencies
var express = require('express'),
    OpenTok = require('./lib/opentok'),
    bodyParser = require('body-parser');

//we can connect to MongoDB through the Mongo.Client‘s connect method
const MongoClient = require('mongodb').MongoClient;

// Verify that the API Key and API Secret are defined
var apiKey = '45780652',
    apiSecret = '7a6b6d32492fdfc7f9f59d1ac9871e2668f40a42';
if (!apiKey || !apiSecret) {
  console.log('You must specify API_KEY and API_SECRET environment variables');
  process.exit(1);
}

// Initialize the express app
var app = express();
// set the view engine to ejs
app.set('view engine', 'ejs');


//store databases on cloud services like MongoLab
var db;
MongoClient.connect('mongodb://admin:admin@ds137230.mlab.com:37230/tokbox-test', function(err, database) {
    if (err) return console.log(err)
    db = database;
});


app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: true}));
//The urlencoded method within body-parser tells body-parser
//to extract data from the <form> element and
//add them to the body property in the request object.

// Initialize OpenTok
var opentok = new OpenTok(apiKey, apiSecret);

// Create a session and store it in the express app
opentok.createSession(function(err, session) {
  if (err) throw err;
  app.set('sessionId', session.sessionId);
});

app.get('/', function(req, res) {
    res.render('home.ejs');
});

app.get('/set', function(req, res) {
    // var sessionId = app.get('sessionId');
    db.collection('first').find().toArray( function(err, result) {
        if (err) {
            return console.log(err);
        }
        else console.log(result);
        res.render('set.ejs', {
            // sessionId: sessionId,
            result: result
        });
    });

});

app.post('/setSessId', function(req, res){
    // console.log("response: " +  req.body.id);
    app.set('sessionId', req.body.id);
    res.redirect('/video');
});

app.get('/user', function(req, res) {
    db.collection('first').find().toArray( function(err, result){
        if(err) {
            return console.log(err);
        }
        else console.log(result);
    res.render('userlist.ejs', {result: result});
    })
});

app.get('/update', function(req, res) {
    //generate a fresh sessionId for this client
    opentok.createSession(function(err, session) {
        if (err) throw err;
        app.set('sessionId', session.sessionId);
    });
    // res.redirect('/video');
    res.redirect(req.get('referer'));
});

app.get('/video', function (req,res) {
    var sessionId = app.get('sessionId');
    // generate a fresh token for this client
    var token;
    if(token == undefined) token = opentok.generateToken(sessionId);
    // console.log(sessionId);

    res.render('video.ejs', {
        apiKey: apiKey,
        sessionId: sessionId,
        token: token
    });
});

app.post('/addToDb', function (req, res){
    var sessionId = app.get('sessionId');
    db.collection('first').insert({session: sessionId});
    res.redirect('/video');
});

app.post("/delete", function(req, res){
    var sessionId = app.get('sessionId');
    db.collection('first').remove( {session: sessionId}, true);
});

app.listen(process.env.PORT || 8080, function() {
    console.log('You\'re app is now ready at http://localhost:8080/');
});

