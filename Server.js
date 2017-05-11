var socket = require('socket.io'),
http = require('http'),
server = http.createServer(),
socket = socket.listen(server);
var five = require("johnny-five");  
var SerialPort = require("serialport");
var msgProva = 70;
var board = new five.Board();
var photo; 
var led1;
var pinRelay; 
var tempoInnafiatura = 0;

board.on("ready", function() { 
	photo = new five.Sensor({
		pin: "A1",
		freq: 5000
	}); 
	led1 = new five.Led(13);
	pinRelay = new five.Pin(7);

	socket.on('connection', function(connection) {
		console.log('User Connected');
		socket.emit('prova', msgProva);

		connection.on('message', function(msg){
			socket.emit('message', msg);
		});
		
		connection.on('sValue', function(value){
			console.log('sValue', value );
			socket.emit('sValue', value);
		});
		connection.on('slampa', function(value){
			console.log('slampando');
			led1.blink(value);
		});
		connection.on('stopslampa', function(){
			console.log('stop slampando');
			led1.stop();
		});
		photo.on("data", function(){
			console.log(this.scaleTo(100, 0));
			var photoValue = this.scaleTo(100, 0);
			socket.emit('photo', photoValue);
		});
		connection.on('innafia', function(value){
			console.log('Sto innafiando ',value);
			tempoInnafiatura =value*1000;
			console.log(tempoInnafiatura);
			pinRelay.high();
			setTimeout(function(){
				pinRelay.low();
				console.log('Finito di innafiare');
			}, tempoInnafiatura);
		});
	});
});

server.listen(3000, function(){
    console.log('Server started');
});
