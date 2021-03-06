// Module dependencies
var express    = require('express'),
    mysql      = require('mysql'),
    bodyParser = require('body-parser'),
    path       = require('path');
var router = express.Router();



// Application initialization
var app = express();
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
var http = require('http').Server(app);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

// set the view engine to ejs -- momal
app.set('view engine', 'ejs');
//Set up data connection
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'ASSESS_EASY'
});

server.listen(process.env.PORT || 3000);
console.log("Server is running ... ");

//routing the static files. css/js
app.use(express.static(__dirname + '/public'));

/*----------------- No need to make any changes to this part unless any dependency is needed to be added -----------*/

// ------------------SQL Queries----------------------
//----------- Please add all sql strings here

app.get('/', function(req, res) {
    connection.query('select * from classes inner join user_class on user_class.classId = classes.classID inner join users on users.userID = user_class.userId and users.userID = 1;', req.body,
        function (err, result) {

            connection.query('select classes.classID, class_assessment.caID, assessment.totalMarks, assessment.passingMarks from classes inner join class_assessment on class_assessment.classId = classes.classID inner join assessment on assessment.assessmentID = class_assessment.assessmentID;',
                function (err, classAssessment) {
                    if (err) throw err;
                    var classAssessmentJson =JSON.stringify(classAssessment);
                    var jsonData = classAssessmentJson.replace(/\"([^(\")"]+)\":/g,"$1:");
                    res.render('student_dashboard', {classesInfo: result, classassesmentInfo: jsonData});
                });

        });
});


//----------------------------------------------------

// setting the routes (sub js pages)
var teachers = require('./routes/teachers.js');
var index = require('./routes/index.js');
var teacher_dashboard = require('./routes/teacher_dashboard.js');


//-----------------------------------------------------------------------------------
/*
* This is the chat code
* It is the first draft
* This code would be removed from app.js
* and added in its own file once because right now it's being a little b*tch when i add it in www
* */
app.get('/chat', function (req, res) {
    res.render('chat');
});
users = [];
connections = [];
io.sockets.on('connection',function(socket) {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);


    //Disconnect
    socket.on('disconnect', function (data) {

        users.splice(users.indexOf(socket.username),1);
        updateUsernames();
        connections.splice(connections.indexOf(socket, 1));
        console.log('Disconnected: %s sockets connected', connections.length)
    });

    //Send Message
    socket.on('send message', function (data) {
        console.log(data);
        io.sockets.emit('new message',{msg: data, user: socket.username});
    });


    //New User
    socket.on('new user', function (data, callback) {
        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUsernames();
    });

    function updateUsernames() {
        io.sockets.emit('get users', users);
    }


});

// ---------------- CHAT ENDS HERE --------------------------------



app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});




// if there are any pages that start after localhost:8080/ then route them to index
// this includes the main page and/or about page, contact us page etc ...
app.use('/',index);

// if anything comes after localhost:8080/teachers then route to teachers.js
app.use('/teacher',teachers);
app.use('/teacher_dashboard',teacher_dashboard);

// Begin listening

/*

>>>>>>> 5d16213889cf40ec1e10998289d4a0615ec89128
app.listen(3000);
console.log("server started")*/
