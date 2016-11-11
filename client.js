$(document).ready(function(){

	var errorElement = document.querySelector('#errorMsg');

/*
  $('#start').click(function(){
    console.log("Play")
    onStart()

  })
*/

  $('#stop').click(function(){
    console.log("Stop")
    window.stream.getVideoTracks().forEach(function(closeTrack){
      closeTrack.stop();
    })
  })

	$('#send').click(function(){
		console.log("Send")
		window.ldc.send($("#tlocal").val()+'\n')
	})

	var socket = io.connect('localhost:3000');
	window.socket = socket;
  window.name = undefined
  window.room = undefined
  socket.on('connect',function(){
    console.log("Conectado");
		$('#login').prop('disabled', false);
  })
  $('#login').click(function(){
    window.name = $('#name').val();
    window.room = $('#room').val();
    console.log("Loged as "+name+":"+room)
    socket.emit('join',{name:name ,room:room});
  })
  socket.on('err',function(mess){
    console.log(mess.errstr)
  })

	//Hay que cambiar todo lo del peer conection para que sean el mismo y no diferentes
  socket.on('reqinvite',function(mess){

    //Como conseguir el sdp
		prepareLocalConection()
    console.log(mess.name+" se ha unido a la sala, enviando sdp")
  })

  socket.on('invite',function(mess){
		console.log("Recibido SDP de: "+mess.name)
  	prepareRemoteConection()
		launchRemoteNegotiation(mess.sdp)
  })


})



function onStart(){
  prepareLocalConection();
  prepareRemoteConection();
  launch();
}

function prepareLocalConection(){
  var configuration = null;

  var lpc = new webkitRTCPeerConnection(configuration)
	var ldc = lpc.createDataChannel(null)
  window.lpc = lpc;
	window.ldc = ldc;

  lpc.onicecandidate = lOnicecandidate;
  lpc.onnegotiationneeded = lOnnegotiationneeded;

	ldc.onopen = ldcopen;
	ldc.onclose = ldconclose;

}

function lOnicecandidate(event){
    console.log("Local candidate")

    if(event.candidate){
      //Programar ice candidate
			console.log("tienes que programar el local ICE candidate")

    }
}

function lOnnegotiationneeded(){
  console.log("Local negotiation")

  window.lpc.createOffer(null)
  .then(function(sdp){
      lpc.setLocalDescription(sdp)
      .then(function(){

        window.socket.emit('invite',{sdp:sdp ,name:window.name});
      })
      .catch(function(err){
        console.log(err);
      })
  })
  .catch(function(err){
      console.log(err);
  })
}

function ldcopen(){
	console.log("Local Data channel opened")
}

function ldconclose(){
	console.log("Local data channel closed")
}



function prepareRemoteConection(){
  var configuration = null;

  var rpc = new webkitRTCPeerConnection(configuration)
  window.rpc = rpc;

  rpc.onicecandidate = rOnicecandidate;
  rpc.onaddstream = rOnaddStream;
	rpc.ondatachannel = rdcOndataChannel;
}

function rOnicecandidate(){
    console.log("Remote candidate")
    if(event.candidate){
      //Tienes que programar el ice candidate
			console.log("Tienes que programar el remote ICE candidate")
    }
}
function rOnaddStream(event){
    console.log("Remote stream")
    $("#remote")[0].srcObject = event.stream;
}


function rdcOndataChannel(event){
	console.log("OnData Channel")
	var rdc = event.channel;
	window.rdc = rdc;
	rdc.onmessage = rdcOnMessage;
}

function rdcOnMessage(event){
	var data = event.data;
	$("#tremote").append(data);
}

function launch(){

  var lvideo = $('#local')[0];
	var constraints = window.constraints = {
		audio: false,
		video: true
  };
  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream){

    window.stream = stream;
    lvideo.srcObject = stream;

    if(window.lpc == undefined){
      console.log("No hay peerConection")
    }

    window.lpc.addStream(stream);
  })
  .catch(function(error){
    console.log(error);
  })
}


function launchRemoteNegotiation(sdpOffer){
  console.log("Remote Negotiation")
  window.rpc.setRemoteDescription(sdpOffer)
  .then(function(){
    window.rpc.createAnswer()
    .then(finishLocalNegotiation)
    .catch(function(error){
      console.log(error);
    })
  })
  .catch(function(error){
    console.log(error);
  })
}


//Este metodo esta mal hecho,funciona por que es todo en local
function finishLocalNegotiation(sdpAnswer){
  console.log("Finishing Negotiation")

  window.rpc.setLocalDescription(sdpAnswer)
  .then(
		window.socket.emit('ok',{sdp:sdpAnswer,name:window.name})
	)
  .catch(function(error){
    console.log(error);
		window.socket.emit('err',error)
  })

  window.lpc.setRemoteDescription(sdpAnswer)
  .then()
  .catch(function(error){
    console.log(error);
  })
}
















/*

$(document).ready(function(){



  socket.on('err',function(mess){
    console.log(mess.errstr)
  })
  socket.on('reqinvite',function(mess){

    //Como conseguir el sdp

    console.log(mess.name+" se ha unido a la sala, enviando sdp")
  })

  socket.on('invite',function(mess){
    //programar el mensaje ok
  })
})



$('#login').click(function(){
    name = $('#name').val();
    room = $('#room').val();
    console.log(name+":"+room)
    socket.emit('join',{name:name ,room:room});
});
$('#send').click(function(){
    socket.emit('mess',{name:name ,room:room,mess:$('#mess').val()});
    $('#chat').append('<p>'+name+':  '+$('#mess').val()+'</p>');
})
socket.on('update',function(message){
    console.log("Mensaje recibido en el cliente")
    $('#chat').append('<p>'+message.name+':  '+message.mess+'</p>');
})
*/
