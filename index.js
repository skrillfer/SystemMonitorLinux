const fs = require('fs');
const exec = require('child_process').exec;

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
    socket.on('killingProcess', function(data) {
      killProcess(data.id);
    });
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
  
    */
  
  });

  /* = ==============================MEM INFO======================================= = */
fs.watchFile('/proc/memoria_201213562', { recursive: true }, function(evt, name) {
    try {
        io.sockets.emit('meminfo_change', Meminfo());
        //console.log();
    } catch (error) {
        console.log(error);
    }
});

function Meminfo() {
    var info = {};
    var data = fs.readFileSync('/proc/memoria_201213562').toString();
    try {
        info=JSON.parse(data);
    } catch (error) {
        console.log('error al pasear json');
    }
    
    return info;
}
  /* = ==============================PROCESS INFO======================================= = */
  fs.watchFile('/proc/procesos_201213562', { recursive: true }, function(evt, name) {
    try {
        io.sockets.emit('ReceivingProcess', Processinfo());
    } catch (error) {
        console.log(error);
    }
});

function Processinfo() {
    var info = {};
    var data = fs.readFileSync('/proc/procesos_201213562').toString();
    try {
        info=JSON.parse(data);
    } catch (error) {
        console.log('error al pasear json, process info');
    }
    return info;
}

function killProcess(id)
{
  console.log(id);
  try {
    const child = exec('kill -9 '+id,
            (error, stdout, stderr) => {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                if (error !== null) {
                    console.log(`exec error: ${error}`);
                }
      });
  } catch (error) {
    console.log('error kill process:'+error); 
  }
}
