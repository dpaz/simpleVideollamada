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
		launch()
    console.log(mess.name+" se ha unido a la sala, enviando sdp")
  })

  socket.on('invite',function(mess){
		console.log("Recibido SDP de: "+mess.name)
  	prepareRemoteConection()
		launchRemoteNegotiation(mess.sdp)
  })


	socket.on('candidate',function(mess){
		candidate = new RTCIceCandidate(mess.candidate)
		if(window.lpc!= undefined){
			lpc.addIceCandidate(candidate)
			.then(rOnaddStream())
      .catch(function(error){
        console.log(error);
				console.log(mess.candidate)
      })

			console.log("Añadido ICE local")
		}else{
			rpc.addIceCandidate(candidate)
			.then()
      .catch(function(error){
        console.log(error);
      })

			console.log("Añdido ICE Remoto")
		}
	})

	socket.on('ok',function(mess){
		console.log("Recibido mensaje ok")
		lpc.setRemoteDescription(mess.sdp)
		.catch(function(err){
			console.log(err);
		})
	})


})




function prepareLocalConection(){
  var configuration = null;

  var lpc = new webkitRTCPeerConnection(configuration)
	//var ldc = lpc.createDataChannel(null)
  window.lpc = lpc;
	//window.ldc = ldc;

  lpc.onicecandidate = lOnicecandidate;
  lpc.onnegotiationneeded = lOnnegotiationneeded;

	lpc.onaddstream = rOnaddStream;

	//ldc.onopen = ldcopen;
	//ldc.onclose = ldconclose;

}

function lOnicecandidate(event){
    console.log("Local candidate")

		if(event.candidate){
			window.socket.emit('candidate',{name:window.name,candidate:event.candidate})
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
			window.socket.emit('candidate',{name:window.name,candidate:event.candidate})
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

	var constraints = window.constraints = {
		audio: false,
		video: true
  };
  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream){

    window.stream = stream;


    if(window.lpc == undefined){
      console.log("No hay peerConection")
    }

    window.lpc.addStream(stream);
		$("#local")[0].srcObject = stream;
  })
  .catch(function(error){
    console.log(error);
  })
}

function rlaunch(){
	var constraints = window.constraints = {
		audio: false,
		video: true
  };
  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream){
		console.log("Entro dentro de la promesa")
    window.stream = stream;


    if(window.rpc == undefined){
      console.log("No hay peerConection")
    }

    window.rpc.addStream(stream);
		$("#local")[0].srcObject = stream;
  })
  .catch(function(error){
    console.log(error);
  })
}


function launchRemoteNegotiation(sdpOffer){
  console.log("Remote Negotiation")
	rlaunch()
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


}



//MIrar el setLocalDescription

//me falta programar el OK set remote description
