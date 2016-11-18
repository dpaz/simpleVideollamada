var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);

var rooms = {}


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/client.js',function(req,res){
  res.sendFile(__dirname+ '/client.js');
})

io.on('connection',function(socket){
  socket.on('join', function(mess){
    if (mess.room in rooms){
      room = rooms[mess.room]
      if (room.length <2) {
          room.push({user:mess.name,socket:socket});
          socket.broadcast.to(mess.room).emit('reqinvite',{name:mess.name});
      }else{
          console.log("Ya hay dos personas en: "+mess.room+" "+mess.name);
          socket.emit('err',{errstr:"Ya hay dos personas en:"+mess.room});
          return
      }
    }else{
      room = [{user:mess.name,socket:socket}];
      rooms[mess.room] = room;
    }
    socket.username = mess.name;
    socket.room = mess.room;
    console.log("Bienvenido "+mess.name+ " a la sala:"+ mess.room)
    console.log(rooms)
    socket.join(mess.room);
  });
  socket.on('invite',function(mess){
    //Programar que hay que hacer antes de reenviar
    console.log("Recibido SDP de oferta de: "+mess.name)
    socket.broadcast.to(socket.room).emit('invite',{sdp:mess.sdp,name:mess.name})
  });
  socket.on('ok',function(mess){
    //PRogramar que hay que hacer antes de reenviar
    console.log("Recibido SDP de respuesta de: "+mess.name)
    socket.broadcast.to(socket.room).emit('ok',{sdp:mess.sdp,name:mess.name})
  });
  socket.on('err',function(mess){
    console.log("Ha ocurrido un error "+mess.errstr)
  });
  socket.on('candidate',function(mess){
    console.log("Recibido canidato de :"+ mess.name)
    socket.broadcast.to(socket.room).emit('candidate',{candidate:mess.candidate,name:mess.name})
  })
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});






/*

socket.on('mess',function(mess){
  console.log("Mensaje recibido: "+ mess.name+":"+mess.room+"  "+ mess.mess )
  console.log(socket.room)
  io.sockets.in(socket.room).emit('update',{name:mess.name ,mess:mess.mess,room:mess.room})

});


*/
