const fs = require('fs');

var express = require('express');
var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname+'/public/src/index.html');
  });
  

server.listen(3000, function() {
	console.log('Example app listening on port 3000!');
});


io.on('connection', function(socket) {
    //socket.emit('messages', messages);
  
    /*socket.on('getAllProcess', function(data) {
      var arr_Path = getAllProcess("/proc");
      var arr_ProcessSend = [];
      arr_Path.forEach(
        item=>{
          arr_ProcessSend.push(getInfoSingleProcess(item));
        }
      );
      io.sockets.emit('ReceivingProcess', {'process':arr_ProcessSend});
    });
  
    socket.on('killingProcess', function(data) {
      killProcess(data.id);
    });
  
    socket.on('saveLogin', function(data) {
      login=true;
    });
  
    socket.on('quitLogin', function(data) {
      login=false;
    });
  
    socket.on('getLogin', function(data) {
      io.sockets.emit('ReceivingLogin', {'login':login});
    });*/
  
  });

  /* = ==============================MEM INFO======================================= = */
fs.watchFile('/proc/memo_201213562', { recursive: true }, function(evt, name) {
    try {
        io.sockets.emit('meminfo_change', Meminfo());
        //console.log();
    } catch (error) {
        console.log(error);
    }
});

function Meminfo() {
    var info = {};
    var data = fs.readFileSync('/proc/memo_201213562').toString();
    try {
        info=JSON.parse(data);
    } catch (error) {
        console.log('error al pasear json');
    }
    
    return info;
}