$(document).ready(function(){

	var errorElement = document.querySelector('#errorMsg');

/*
  $('#start').click(function(){
    console.log("Play")
    onStart()

  })
*/

	var ballangley = 0.01*Math.random();
	var ballsumy=Math.random() < 0.5 ? -1 : 1;;
	var ballanglex = 0.01*Math.random();
	var ballsumx=Math.random() < 0.5 ? -1 : 1;;

	var rak1angley = 0.00;
	var rak1anglex = 1.00;
	var rak2angley = 0.00;
	var rak2anglex = -1.00;

	window.rak1angley = rak1angley;
	window.rak1anglex = rak1anglex;
	window.rak2angley = rak2angley;
	window.rak2anglex = rak2anglex;

	window.ballangley= ballangley;
	window.ballsumy = ballsumy;
	window.ballanglex = ballanglex;
	window.ballsumx = ballsumx;
	window.count = 0;



  $('#stop').click(function(){
    console.log("Stop")
    window.stream.getVideoTracks().forEach(function(closeTrack){
      closeTrack.stop();
    })
  })

	$('#login').click(function(){
    window.name = $('#name').val();
    window.room = $('#room').val();
    console.log("Loged as "+name+":"+room)
    socket.emit('join',{name:name ,room:room});

  })
	$('#send').click(function(){
		console.log("Send")
		window.dc.send($("#tlocal").val()+'\n')
	})

	var socket = io.connect('localhost:3000');
	window.socket = socket;
  window.name = undefined
  window.room = undefined
  socket.on('connect',function(){
    console.log("Conectado");
		$('#login').prop('disabled', false);
  })



	socket.on('reqinvite',function(mess){

    //Como conseguir el sdp
		window.leader = true;
		prepareConection()
		launch()
    console.log(mess.name+" se ha unido a la sala, enviando sdp")
  })
	socket.on('invite',function(mess){
		window.leader = false;
		console.log("Recibido SDP de: "+mess.name)
  	prepareConection()
		launchRemoteNegotiation(mess.sdp)
		$('#send').prop('disabled', false);
		initWebGL()
  })
	socket.on('ok',function(mess){
		console.log("Recibido mensaje ok")
		$('#send').prop('disabled', false);
		window.pc.setRemoteDescription(mess.sdp)
		.catch(function(err){
			console.log(err);
		})
		initWebGL()
	})
	socket.on('candidate',function(mess){
		candidate = new RTCIceCandidate(mess.candidate)
		if(window.pc!= undefined){
			pc.addIceCandidate(candidate)
      .catch(function(error){
        console.log(error);
      })
			console.log("Añadido candidato ICE")
		}
	})



	function prepareConection(){
	  var configuration = null;

	  var pc = new webkitRTCPeerConnection(configuration)


	  window.pc = pc;


	  pc.onicecandidate = Onicecandidate;
	  pc.onnegotiationneeded = Onnegotiationneeded;

		pc.onaddstream = OnaddStream;
		if(window.leader == true){
			var dc = pc.createDataChannel(null)
			dc.onopen = dcopen;
			dc.onclose = dconclose;
			dc.onmessage = dcOnMessage;
			window.dc = dc;

			var gc = pc.createDataChannel(null)
			gc.onmessage =  gcOnMessage;
			window.gc = gc;

		}else{
			pc.ondatachannel = dcOndataChannel;
		}
	}

	function dcopen(){
		console.log("Data channel opened")
	}

	function dconclose(){
		console.log("Data channel closed")
	}

	function dcOndataChannel(event){
		if(window.count==0){
			console.log("OnData Channel")
			window.count = window.count+1;
			var dc = event.channel;
			window.dc = dc;
			dc.onmessage = dcOnMessage;
		}else{
			console.log("Game Channel")
			var gc = event.channel;
			window.gc = gc;
			gc.onmessage = gcOnMessage;
		}

	}

	function dcOnMessage(event){
		var data = event.data;
		$("#tremote").append(data);
	}

	function Onicecandidate(event){
	    console.log("Local candidate")

			if(event.candidate){
				window.socket.emit('candidate',{name:window.name,candidate:event.candidate})
			}
	}

	function Onnegotiationneeded(){
		if( window.leader == true){
			console.log("Local negotiation")
			window.pc.createOffer(null)
			.then(function(sdp){
					pc.setLocalDescription(sdp)
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

	}

	function OnaddStream(event){
	    console.log("Remote stream")
	    $("#remote")[0].srcObject = event.stream;
	}

	function launch(){
		var constraints = window.constraints = {
			audio: false,
			video: true
	  };
	  navigator.mediaDevices.getUserMedia(constraints)
	  .then(function(stream){

	    window.stream = stream;


	    if(window.pc == undefined){
	      console.log("No hay peerConection")
	    }

	    window.pc.addStream(window.stream);

			$("#local")[0].srcObject = window.stream;
	  }).catch(function(error){
	    console.log(error);
	  })
	}

	function launchRemoteNegotiation(sdpOffer){
	  console.log("Remote Negotiation")
		launch()
		setTimeout(function(){
			window.pc.setRemoteDescription(sdpOffer)
			.then(function(){
				window.pc.createAnswer()
				.then(finishLocalNegotiation)
				.catch(function(error){
					console.log(error);
				})
			})
			.catch(function(error){
				console.log(error);
			})
		},150)

	}

	//Este metodo esta mal hecho,funciona por que es todo en local
	function finishLocalNegotiation(sdpAnswer){
	  console.log("Finishing Negotiation")
	  window.pc.setLocalDescription(sdpAnswer)
	  .then(
			window.socket.emit('ok',{sdp:sdpAnswer,name:window.name})
		)
	  .catch(function(error){
	    console.log(error);
			window.socket.emit('err',error)
	  })
	}
	function gcOnMessage(event){
		aux =JSON.parse(event.data)
		if(window.leader){
				window.rak2angley = aux.rak2angley
		}else{
				window.rak1angley = aux.rak1angley
				window.ballangley = aux.ballangley
				window.ballanglex = aux.ballanglex
		}

	}










});
