var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/log.log', {flags : 'w'});
var log_stdout = process.stdout;
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
var pinValve1;
var pinValve2;
var jsonfile = require('jsonfile');
var jsonUpd = require('json-update');
var file = 'settings.json';
var wateringTime;
var udpSettting;	//Objet writed to "settings.json"
var valve1;
var valve2;

 
board.on("ready", function() { 
	pinValve1 = new five.Pin(8);
	pinValve2 = new five.Pin(2);
	pinValve1.high();
	pinValve2.high();
	
	jsonfile.readFile(file, function(err, obj) {
	  wateringTime = parseInt(obj.lastWateringTime);
	});
	
	photo = new five.Sensor({
		pin: "A1",
		freq: 500
	}); 
	led1 = new five.Led(13);
	pinRelay = new five.Pin(7);
	pinRelay.high();
	socket.on('connect', function(connection) {
		console.log('User Connected');
		log("User Connected", socket.id);
		socket.emit('wateringTime',wateringTime);		//Emits the last watering duration time for client

		connection.on('sValue', function(value){
			console.log('sValue', value );
			socket.emit('sValue', value);
		});
		
/* 		connection.on('valveSett', function(value){
			console.log(value);
			if(value.valvolaId == "checkbox"){
				console.log("si puo' fare");
				}
		}); */

		photo.on("data", function(){					//LDR Sensor reading
			//console.log(this.scaleTo(100, 0));		//Decomment this for debugging purpose
			var photoValue = this.scaleTo(100, 0);
			socket.emit('photo', photoValue);
		});
		
		connection.on('innafia', function(value, valveSetts){		//Pump management 

			//c onsole.log('Sto innafiando ',value);		//Decomment this for debugging purpose
			tempoInnafiatura =value*1000
			wateringTime = tempoInnafiatura;
			jsonUpd.update('settings.json',{lastWateringTime: tempoInnafiatura})
			.then(function(dat) { 
			  console.log(dat) 
			  });
			console.log("Tempo innfafiatura: ",tempoInnafiatura);			//Decomment this for debugging purpose
			console.log("Valole: ", valveSetts);
			if (valveSetts.valv1 == true && valveSetts.valv2 == false){
				pinValve1.low();
				pinRelay.low();
				setTimeout(function(){
					pinValve1.high();
					pinRelay.high(); 
					console.log('Valvola 1 APERTA, Valvola 2 CHIUSA');	//Decomment this for debugging purpose
				}, tempoInnafiatura);
			};
			if (valveSetts.valv1 == false && valveSetts.valv2 == true){
				pinValve2.low();
				pinRelay.low();
				setTimeout(function(){
					pinValve2.high();
					pinRelay.high();
					console.log('Valvola 1 CHIUSA, Valvola 2 APERTA');	//Decomment this for debugging purpose
				}, tempoInnafiatura);
			};

		});
	});
	
	function log(value, session){
		var date = new Date();
		log_file.write(date.toString() + ": " + value +" SessionId: "+session+' \n');
	};
});

server.listen(3000, function(){
    console.log('Server started');
});
