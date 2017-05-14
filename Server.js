var socket = require('socket.io'),
http = require('http'),
server = http.createServer(),
socket = socket.listen(server);
var five = require("johnny-five");  
var SerialPort = require("serialport");
var board = new five.Board();
var photo; 
var led1;
var pinRelay; 
//var tempoInnafiatura = 0;
var jsonfile = require('jsonfile');
var jsonUpd = require('json-update');
var file = 'settings.json';
var wateringTime;
var udpSettting;										//Objet writed to "settings.json"
 
board.on("ready", function() { 
	
	jsonfile.readFile(file, function(err, obj) {
	  wateringTime = parseInt(obj.lastWateringTime);
	});
	
	photo = new five.Sensor({
		pin: "A1",
		freq: 500
	}); 
	led1 = new five.Led(13);
	pinRelay = new five.Pin(7);

	socket.on('connection', function(connection) {
		console.log('User Connected');
		socket.emit('wateringTime',wateringTime);		//Emits the last watering duration time for client

		connection.on('sValue', function(value){
			console.log('sValue', value );
			socket.emit('sValue', value);
		});

		photo.on("data", function(){					//LDR Sensor reading
			//console.log(this.scaleTo(100, 0));		//Decomment this for debugging purpose
			var photoValue = this.scaleTo(100, 0);
			socket.emit('photo', photoValue);
		});
		
		connection.on('innafia', function(value){		//Pump management 

			//console.log('Sto innafiando ',value);		//Decomment this for debugging purpose
			tempoInnafiatura =value*1000
			wateringTime = tempoInnafiatura;
			jsonUpd.update('settings.json',{lastWateringTime: tempoInnafiatura})
			.then(function(dat) { 
			  console.log(dat) 
			  });
			console.log("Tempo innfafiatura: ",tempoInnafiatura);			//Decomment this for debugging purpose
			//pinRelay.high();
			setTimeout(function(){
				//pinRelay.low();
				console.log('Finito di innafiare');	//Decomment this for debugging purpose
			}, tempoInnafiatura);
		});
	});
});

server.listen(3000, function(){
    console.log('Server started');
});
