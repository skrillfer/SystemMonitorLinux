var socket = io.connect('http://localhost:3000', { 'forceNew': true });

var pila1=[];
var pila2=[];
var pila3=[];
var pila4=[];

socket.on('meminfo_change', function(data) {
        var memoryData= [ (data.MemTotal-data.MemFree)/1000000,data.MemFree/1000000];
        PlotRAM_Graph(memoryData,data.MemTotal,data.MemFree);
});

socket.on('statinfo_change', function(data) {
        plot_performanceCPU(data);
});

socket.on('ProcessInfo', function(data) {
        paintInfoProcess(data.lista);
});


socket.on('ReceivingProcess', function(data) {
        //paintInfoProcess(data.process);
        
});

socket.on('summary', function(data) {
        paintInfoSummary(data);
});