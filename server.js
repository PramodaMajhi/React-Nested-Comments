var express = require('express');
var http = require('http');
var morgan = require('morgan');
var firebase = require('firebase');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var firebaseRef = new Firebase("https://jeffrey-xiao-react.firebaseio.com");

var hostname = 'localhost';
var port = 8080;

var srcPath = __dirname + '/assets';
var destPath = __dirname + '/assets';

var app = express();

app.use(morgan('dev'));
app.use(sassMiddleware({
	src: srcPath,
	dest: destPath,
	debug: true,
	force: true,
	outputStyle: 'expanded'
}));
app.use("/", express.static(__dirname + '/'));

app.get("/api/comments", function (req, res, next) {
	var firebaseVal = new Firebase("https://jeffrey-xiao-react.firebaseio.com/comments");
	var getComments = function (callback) {
		firebaseVal.once('value', function (snapshot) {
			callback(snapshot.val());
		});
	};
	
	getComments(function (comments) {
		res.setHeader('Content-Type', 'application/json');
		if (comments)
			res.send(JSON.stringify({'comments': comments}));
		else
			res.send(JSON.stringify({'comments': []}));
		return;
	});
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.post("/api/comments", function (req, res, next) {
	var firebaseCount = new Firebase("https://jeffrey-xiao-react.firebaseio.com/count");
	firebaseCount.once('value', function (snapshot) {
		var key = snapshot.val()['count'];

		firebaseCount.update(
			{count: key + 1}
		);

		var firebaseComment = new Firebase("https://jeffrey-xiao-react.firebaseio.com/comments/" + req.body.url + "/" + key);
		
		var comment = req.body.comment;
		comment['id'] = key;

		firebaseComment.set(comment);
		
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end("Successfully added to firebase database!");
	});
});

app.listen(port, hostname, function () {
	console.log("Server is running at http://" + hostname + "/" + port);
});