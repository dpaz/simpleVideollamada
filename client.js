$(document).ready(function(){


	var errorElement = document.querySelector('#errorMsg');


  $('#start').click(function(){
    console.log("Play")
    onStart()

  })


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
      rpc.addIceCandidate(
        new RTCIceCandidate(event.candidate)
      )
      .then()
      .catch(function(error){
        console.log(error);
      })
    }
}

function lOnnegotiationneeded(){
  console.log("Local negotiation")

  window.lpc.createOffer(constraints)
  .then(function(sdp){
      lpc.setLocalDescription(sdp)
      .then(function(){
        launchRemoteNegotiation(sdp)
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
      lpc.addIceCandidate(
        new RTCIceCandidate(event.candidate)
      )
      .then()
      .catch(function(error){
        console.log(error);
      })
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
  .then()
  .catch(function(error){
    console.log(error);
  })

  window.lpc.setRemoteDescription(sdpAnswer)
  .then()
  .catch(function(error){
    console.log(error);
  })
}
