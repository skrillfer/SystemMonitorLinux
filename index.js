const path  = require('path')

const fs = require('fs');
const exec = require('child_process').exec;

var express = require('express');
var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);

/* _______________________ */
var Procesos_R = 0;
var Procesos_Z = 0;
var Procesos_S = 0;
var Procesos_T = 0;
var Procesos_D = 0;

var pila1=[];
var pila2=[];
var pila3=[];
var pila4=[];
/* _______________________ */

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
    socket.on('getAllProcess', function(data) {
      var arr_Path = getAllProcess("/proc");
      var arr_ProcessSend = [];
      arr_Path.forEach(
        item=>{
          arr_ProcessSend.push(getInfoSingleProcess(item));
        }
      );
      //io.sockets.emit('ReceivingProcess', {'process':arr_ProcessSend});
    });
  
    
  
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
        io.sockets.emit('ProcessInfo', Processinfo());
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




/* = ==============================STAT INFO======================================= = */
fs.watchFile('/proc/stat', { recursive: true }, function(evt, name) {
  try {
    Statinfo();
  } catch (error) {
    console.log(error);
  }
});


function Statinfo() {
  var params = [];
  var info = {};
  
  var infoGeneral = {};
  var data = fs.readFileSync('/proc/stat').toString();
  data.split(/\n/g).forEach(function(line){
      line = line.split(' ');

      // Ignore invalid lines, if any
      if (!line[0].includes('cpu') && !line[0].includes('proc')) {
          return;
      }
      
      if(line[0].includes('cpu')){
        if(line[0]=='cpu'){
          info[line[0]] = [parseInt(line[2].trim(), 10),
                          parseInt(line[3].trim(), 10),
                          parseInt(line[4].trim(), 10),
                          parseInt(line[5].trim(), 10),
                          parseInt(line[6].trim(), 10),
                          parseInt(line[7].trim(), 10),
                          parseInt(line[8].trim(), 10)
                        ];
        }else{
          info[line[0]] = [parseInt(line[1].trim(), 10),
                        parseInt(line[2].trim(), 10),
                        parseInt(line[3].trim(), 10),
                        parseInt(line[4].trim(), 10),
                        parseInt(line[5].trim(), 10),
                        parseInt(line[6].trim(), 10),
                        parseInt(line[7].trim(), 10)
                        ];
        }
      }else{
        if(line[0]=='processes')
        {
          infoGeneral['total'] = parseInt(line[1].trim(), 10);
        }else if(line[0]=='procs_running')
        {
          infoGeneral['running'] = parseInt(line[1].trim(), 10);
        }else if(line[0]=='procs_blocked')
        {
          //https://idea.popcount.org/2012-12-11-linux-process-states/
          Procesos_R = 0;
          Procesos_Z = 0;
          Procesos_S = 0;
          Procesos_T = 0;
          Procesos_D = 0;
          var arr_ProcessSend = [];
          var allProcess =getAllProcess("/proc");
          allProcess.forEach(
            item=>{
              var stat=getInfoSingleProcess(item);
              arr_ProcessSend.push(stat);
              if (stat.State.includes('R')){
                Procesos_R++
              }
              if (stat.State.includes('Z')){
                Procesos_Z++
              }
              if (stat.State.includes('S')){
                Procesos_S++
              }
              if (stat.State.includes('T')){
                Procesos_T++
              }
              if (stat.State.includes('D')){
                Procesos_D++
              }
            }
          );
          infoGeneral['sleep'] = Procesos_S + Procesos_D;
          infoGeneral['zombie'] = Procesos_Z;
          infoGeneral['stopped'] = infoGeneral['total'] - infoGeneral['running']; 

          //io.sockets.emit('ReceivingProcess', {'process':arr_ProcessSend});
          io.sockets.emit('summary', infoGeneral);
        }
      }
      
      
  });

  if(pila1<1)
  {
      pila1.push(info.cpu0);
      pila2.push(info.cpu1);
      pila3.push(info.cpu2);
      pila4.push(info.cpu3);
  }else
  {
      var a=pila1.pop();
      var b=info.cpu0;
      params.push({'id':1,"usage":calculate_PerfomanceCPU(a,b)});
      pila1.push(b);

      a=pila2.pop();
      b=info.cpu1;
      params.push({'id':2,"usage":calculate_PerfomanceCPU(a,b)});
      pila2.push(b);

      a=pila3.pop();
      b=info.cpu2;
      params.push({'id':3,"usage":calculate_PerfomanceCPU(a,b)});
      pila3.push(b);

      a=pila4.pop();
      b=info.cpu3;
      params.push({'id':4,"usage":calculate_PerfomanceCPU(a,b)});
      pila4.push(b);
      io.sockets.emit('statinfo_change', params);
  }
  return info;
}
/* = ========================================================================= = */

function getInfoSingleProcess(path)
{ 
  var ProcessInfo_Return = {};
  var info={};
  var data = fs.readFileSync(path+'/status').toString();
  data.split(/\n/g).forEach(function(line){
    line = line.split(':');

    // Ignore invalid lines, if any
    if (line.length < 2) {
        return;
    }

    // Remove parseInt call to make all values strings
    info[line[0]] = line[1].trim();
  });

  ProcessInfo_Return['Name'] = info.Name;
  ProcessInfo_Return['State'] = info.State;
  ProcessInfo_Return['Pid'] = info.Pid.trim();
  ProcessInfo_Return['VmRSS'] = 0;

  try {
    ProcessInfo_Return['Uid']=getUsername(info.Uid);  
  } catch (error) {
    ProcessInfo_Return['Uid']='';
  }
  
  //ProcessInfo_Return['Uid'] = info.Uid;
  if(info.VmRSS)
  {
    try {
      ProcessInfo_Return['VmRSS'] = parseFloat(info.VmRSS.replace(/kB/g, '').trim());  
    } catch (error) {
      console.log('error al castear VmRSS:'+error);
    }
    
  }
  return ProcessInfo_Return;
}

function getAllProcess(srcpath)
{ 
  const regex = new RegExp('/[0-9]+', 'g');

  return fs.readdirSync(srcpath)
  .map(file => path.join(srcpath, file))
  .filter(path => fs.statSync(path).isDirectory())
  .filter((ruta) => {return ruta.match(regex)});  
}

function calculate_PerfomanceCPU(a,b)
{
    var loadavg = ((b[0]+b[1]+b[2]+b[4]+b[5]+b[6]) - (a[0]+a[1]+a[2]+a[4]+a[5]+a[6])) /((b[0]+b[1]+b[2]+b[3]+b[4]+b[5]+b[6]) - (a[0]+a[1]+a[2]+a[3]+a[4]+a[5]+a[6]));
    loadavg =  loadavg *100;
    return loadavg;
}