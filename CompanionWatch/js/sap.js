var gSocket = null;
var gPeerAgent = null;
var gChannel = 107;
var gAgent = null;
var gUnavailable = false;
var gFileTransfer = null;

var PROVIDER_APP_NAME = 'FileTransferReceiver';

var gCurrentRequest = null;

function sapRequest(reqData, successCb, errorCb) {
	if (gSocket == null || !gSocket.isConnected()) {
		throw {
		    name : 'NotConnectedError',
		    message : 'SAP is not connected'
		};
	}

	gSocket.sendData(gChannel, JSON.stringify(reqData));

	gCurrentRequest = {
	    data : reqData,
	    successCb : successCb,
	    errorCb : errorCb
	}
}

function sapFindPeer(successCb, errorCb) {
	if (gAgent != null) {
		try {
			gPeerAgent = null;
			gAgent.findPeerAgents();
			successCb();
		} catch (err) {
			console.log('findPeerAgents exception <' + err.name + '> : ' + err.message);
			errorCb({
			    name : 'NetworkError',
			    message : 'Connection failed'
			});
		}
	} else {
		errorCb({
		    name : 'NetworkError',
		    message : 'Connection failed'
		});
	}
}

function ftCancel(id, successCb, errorCb) {
	if (gAgent == null || gFileTransfer == null || gPeerAgent == null) {
		errorCb({
			name : 'NotConnectedError',
		    message : 'SAP is not connected'
		});
		return;
	}

	try {
		gFileTransfer.cancelFile(id);
		successCb();
	} catch (err) {
		console.log('cancelFile exception <' + err.name + '> : ' + err.message);
		window.setTimeout(function() {
			errorCb({
			    name : 'RequestFailedError',
			    message : 'cancel request failed'
			});
		}, 0);
	}
}

function ftSend(path, successCb, errorCb) {
	if (gAgent == null || gFileTransfer == null || gPeerAgent == null) {
		errorCb({
			name : 'NotConnectedError',
			message : 'SAP is not connected'
		});
		return;
	}
	
	try {
		var transferId = gFileTransfer.sendFile(gPeerAgent, path);
		successCb(transferId);
	} catch (err) {
		console.log('sendFile exception <' + err.name + '> : ' + err.message);
		window.setTimeout(function() {
			errorCb({
				name : 'RequestFailedError',
				message : 'send request failed'
			});
		}, 0);
	}
}

function ftInit(successCb, errorCb) {
	if (gAgent == null) {
		errorCb({
			name : 'NetworkError',
			message : 'Connection failed'
		});
		return;
	}

	var filesendcallback = {
		onprogress : successCb.onsendprogress,
		oncomplete : successCb.onsendcomplete,
		onerror : successCb.onsenderror
	};
	
	try {
		gFileTransfer = gAgent.getSAFileTransfer();
		gFileTransfer.setFileSendListener(filesendcallback);
		successCb.onsuccess();
	} catch (err) {
		console.log('getSAFileTransfer exception <' + err.name + '> : ' + err.message);
		window.setTimeout(function() {
			errorCb({
				name : 'NetworkError',
				message : 'Connection failed'
			});
		}, 0);
	}
}

function sapInit(successCb, errorCb) {
	if (gUnavailable == true) {
		console.log('connection failed previously');
		window.setTimeout(function() {
			errorCb({
				name : 'NetworkError',
				message : 'Connection failed'
			});
		}, 0);
		return;
	}

	if (gSocket != null) {
		console.log('socket already exists');
		window.setTimeout(function() {
			successCb.onsuccess();
		}, 0);
		return;
	}

	try {
		webapis.sa.setDeviceStatusListener(function(type, status) {
			console.log('Changed device status : ' + type + ' ' + status);
			if (status == "DETACHED") {
				gSocket = null;
				gPeerAgent = null;
				successCb.ondevicestatus(status);
			} else if (status == "ATTACHED") {
				gUnavailable = false;
				successCb.ondevicestatus(status);
			}
		});
		webapis.sa.requestSAAgent(function(agents) {
			console.log('requestSAAgent succeeded');

			gAgent = agents[0];

			gAgent.setServiceConnectionListener({
				onconnect : function(sock) {
					console.log('onconnect');

					gSocket = sock;
					gSocket.setDataReceiveListener(function(channel, respDataJSON) {
						console.log('message received : ' + respDataJSON);

						if (gCurrentRequest == null)
							return;

						var currentRequest = gCurrentRequest;
						gCurrentRequest = null;

						var respData = JSON.parse(respDataJSON);

						if (currentRequest.successCb) {
							currentRequest.successCb(respData);
						}
					});
					gSocket.setSocketStatusListener(function(errCode) {
						console.log('socket disconnected : ' + errCode);

						if (errCode == "PEER_DISCONNECTED") {
							errorCb({
								name : 'PEER_DISCONNECTED',
								message : 'the remote peer agent closed'
							});
						}

						if (gCurrentRequest != null) {
							var currentRequest = gCurrentRequest;
							gCurrentRequest = null;

							if (currentRequest.errorCb) {
								currentRequest.errorCb({
										name : 'RequestFailedError',
										message : 'request failed'
								});
							}
							// gSocket.close();
							gSocket = null;
						}
					});
					successCb.onsuccess();
				},
				onerror : function(errCode) {
					console.log('requestServiceConnection error <' + errCode + '>');
					errorCb({
							name : 'NetworkError',
							message : 'Connection failed'
					});
				}
			});

			gAgent.setPeerAgentFindListener({
				onpeeragentfound : function(peerAgent) {
					if (gPeerAgent != null) {
						console.log('already got peer agent');
						return;
					}
					try {
						if (peerAgent.appName == PROVIDER_APP_NAME) {
							console.log('peerAgent found');

							gAgent.requestServiceConnection(peerAgent);
							gPeerAgent = peerAgent;
						} else {
							console.log('not expected app : ' + peerAgent.appName);
						}
					} catch (err) {
						console.log('exception [' + err.name + '] msg[' + err.message + ']');
					}
				},
				onerror : function(errCode) {
					console.log('findPeerAgents error <' + errCode + '>');
					errorCb({
							name : 'NetworkError',
							message : 'Connection failed'
					});
				}
			});

			try {
				gPeerAgent = null;
				gAgent.findPeerAgents();
			} catch (err) {
				console.log('findPeerAgents exception <' + err.name + '> : ' + err.message);
				errorCb({
				    name : 'NetworkError',
				    message : 'Connection failed'
				});
			}

		}, function(err) {
			console.log('requestSAAgent error <' + err.name + '> : ' + err.message);
			errorCb({
			    name : 'NetworkError',
			    message : 'Connection failed'
			});
		});
	} catch (err) {
		console.log('requestSAAgent exception <' + err.name + '> : ' + err.message);
		window.setTimeout(function() {
			errorCb({
			    name : 'NetworkError',
			    message : 'Connection failed'
			});
		}, 0);
		gUnavailable = true;
	}
}
