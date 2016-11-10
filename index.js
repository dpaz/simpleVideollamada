var app = require('express')();
var http = require('http').Server(app);



app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/client.js',function(req,res){
  res.sendFile(__dirname+ '/client.js');
})


http.listen(3000, function(){
  console.log('listening on *:3000');
});
