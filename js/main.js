var connected = false;
var recognizing = false;
var recognition;
var total_recognized = 0;
var noRestartReco;
var startTimestamp;
var ros;									                     // this will be the connection to Ros
var topicName = 'pepper/cmd_vel';     					    // topic name for the UR robots
//	var topicName = '/cmd_vel_mux/input/navi'; // topic name for the Stage simulator
//	var topicName = '/turtle1/cmd_vel'; 	    // this allows testing with turtlesim
var useSimulator = false;						       	// whether simulator is used
var speedFactor = 5.0;					            // multiplies or divides speed to go faster or slower
var linearSpeed = 0.5, angularSpeed = 0.5; // initial speed
var linearRepeat = 1, angularRepeat = 1;	// number of times to repeat command
var repeatInterval = 500;					       // wait time between repeats, in ms
var stopMotion = true;
var robotUrl;
var muted = false;
var wakeup = ["robot", "loki", "magni"];
var useWakeup = false;
var showUnrecognized = false;
var mic, micSlash, micBg;
		

/*********************************
 *          Robot Speed
 */
var btnSpeedIncrease = document.getElementById('btn-speed-increase');
var btnSpeedDecrease = document.getElementById('btn-speed-decrease');

btnSpeedIncrease.addEventListener('click', () => {
	var speedValue = document.getElementById('speed-value');

	if(speedValue.value < 5) {
		linearSpeed = linearSpeed + 0.5;
		speedValue.value = linearSpeed;
	}
});

btnSpeedDecrease.addEventListener('click', () => {
	var speedValue = document.getElementById('speed-value');

	if(speedValue.value > 0.5) {
		linearSpeed = linearSpeed - 0.5;
		speedValue.value = linearSpeed;
	}
});

function setMicInactive() {
	var micImg = document.getElementById("mic-img");
	micImg.src = "./assets/images/mic.gif";
	micImg.style.backgroundColor = "lightgray";
}

function setMicActive() {
	var micImg = document.getElementById("mic-img");
	micImg.src = "./assets/images/mic-animate.gif";
	micImg.style.backgroundColor = "#00cc00";
}

function setMicOff() {
	var micImg = document.getElementById("mic-img");
	micImg.src = "./assets/images/mic.gif";
	micImg.style.backgroundColor = "lightgray";
}

function addLog(text, textColor) {
	var table = document.getElementById("commandLog");
	var row = table.insertRow(0);
	var cell1 = row.insertCell(0);

	if (textColor) {
		cell1.style.color = "red";
	}
	cell1.innerHTML = text;
}

/**
* Setup GUI elements when the page is loaded.
*/
function init() {
	var temp;
	micBg = document.getElementById("mic-bg");
	mic =   document.getElementById("mic");
	micSlash = document.getElementById("mic-slash");
	if (localStorage.firstResultOK === undefined) {
		localStorage.firstResultOK = 0;
	}
	if (localStorage.otherResultOK === undefined) {
		localStorage.otherResultOK = 0;
	}
	if (localStorage.robotUrl !== undefined) {
		temp = localStorage.robotUrl;		// use the last robot address
	} else {
		temp = "ws://" + location.hostname + ":9090";  //guess at it
	}
	document.getElementById("robotUrlEntry").value = temp;
	if (window.SpeechSynthesisUtterance === undefined) {
		muted = true;
	}
	showInfo ("info_none");
}	
	
function say (words) {
	var wasRecognizing = false;
	var stowabool;
	if (muted === false) {
		stowabool = noRestartReco;
		if (recognizing) { 
			wasRecognizing = true;
			noRestartReco = true;   //test
			recognition.stop (); 
		}
		var u = new SpeechSynthesisUtterance();
		u.text = words;
		u.lang = 'en-US';
		u.rate = 1.1;
		u.pitch = 1.0;
		u.default = true;
		u.localService = true; 
		u.onend = function(event) { 
			if (wasRecognizing) { 
				recognition.start ();
			}
			noRestartReco = stowabool;
		}
		speechSynthesis.speak(u);
	}
}

/**
 * @returns Makes the connection between the application and the ROS
 */
function connect() {
	var connectButton;
	if (connected) {	// disconnect
		ros.close();
	} else {
		robotUrl = document.getElementById("robotUrlEntry").value.trim();
		if (robotUrl == '') {
			bootbox.alert ("Please supply the robot's URL and port");
			return;
		}
		robotUrl = robotUrl.replace("https:", "wss:");
		robotUrl = robotUrl.replace("http:", "ws:");
		if ((robotUrl.slice (0,5) != "wss://") && (robotUrl.slice (0,4) != "ws://") &&
				(robotUrl.charAt(robotUrl.length - 5) != ":")) {
		
			var r = bootbox.alert 
				("The robot's URL should begin with http, https, ws, or wss, " + 
					"and end with a port number, like ':9090'.");
				return;
		}
		ros = new ROSLIB.Ros({  // Connecting to ROS.
			url: robotUrl 							
		});
	}	

	ros.on('connection', function() {
		var connectButton;
		console.log ('Connected to websocket server.');
		localStorage.robotUrl = robotUrl;
		connectButton = document.getElementById("connectButton");
		connectButton.innerHTML = "Disconnect";
		connectButton.style.background="#00cc00"; // green
		say ('connected');
		connected = true;
	});

	ros.on('error', function(error) {
			console.log (error);
			say ('Darn. We failed to connect.');
			//none of the following work... 
			//alert (error.stack);
			//alert (error.message);
			//alert (JSON.stringify(error));
			bootbox.alert ('Error connecting to websocket server. ' + error);
	});

	ros.on('close', function() {
	var connectButton;	
		if (connected) {			// throw away a second call
			connected = false;
			connectButton = document.getElementById("connectButton");
			connectButton.style.background = "#006dcc";    
			connectButton.innerHTML = "Connect";
			say ('connection closed');   
			console.log('Connection to websocket server closed.');
		}
	});
}	
	
/**  ******************************************************
 *               Voice Commands
 ****************************************************** */

function startRecognition () {

	if (!('webkitSpeechRecognition' in window)) {
		showInfo ('info_upgrade');
	} else {

		recognition = new webkitSpeechRecognition();
		recognition.continuous = true;		
		recognition.interimResults = false;
		recognition.maxAlternatives = 10;		
		showInfo('info_start');

		recognition.onstart = function() {
			recognizing = true;
			showInfo('info_speak_now');
			console.log('onstart');
			setMicActive ();
		};
		recognition.onerror = function(event) {
			console.log('speech recognition error:' + ' ' + event.error);

			if (event.error == 'no-speech') {
				setMicInactive ();
			//    showInfo('info_no_speech');
				noRestartReco = false;
			}
			if (event.error == 'audio-capture') {
				setMicInactive ();
				showInfo('info_no_microphone');
				noRestartReco = true;
			}
			if (event.error == 'not-allowed') {
				if (event.timeStamp - startTimestamp < 100) {
						showInfo('info_blocked');
				} else {
					showInfo('info_denied');
				}
				noRestartReco = true;
			}
		}

		recognition.onend = function() {
			console.log('onend; ' + (noRestartReco ? "dont restart" : "do restart"));
			recognizing = false;
			if (noRestartReco) {
				return;
			}
			showInfo('');
			restartReco();
		}

		recognition.onresult = function(event) {
			console.log('recognition.onresult');
			
			function getDistance (quantity, what) {
				var howmany;
				howmany = Number(quantity);
				if (isNaN(howmany)) {
					if (quantity == "to" || quantity == "too") {
						howmany = 2;
					} else if (quantity == "for") {
						howmany = 4;
					} else {
						return 0;
					}
				}
				if (what == "meters" || what == "meter") {
					return (howmany);
				} else if (what == "centimeters" || what == "centimeter") {
					return howmany * 0.01;	
				} else if (what == "feet" || what == "foot") {
					return howmany * 0.3048;			// converts feet to meters
				} else if (what == "degrees" || what == "degree") {
					return howmany * Math.PI / 180;		// convert to radians
				} else {
					return 0;
				}	
			}
			
			// list commands
			var commands = '';
			var x = 0, y = 0, z = 0; 		// linear x and y movement and angular z movement
		
			var commandFound = false;
			var result;
			var topCandidate = "";		
			var allResults = "";
			var dist = 0;	
			var altNumber;
			if (event.results.length > 0) {		// we have an array of recognition candidates
				result = event.results[0];
				if (recognition.continuous == true)	{recognition.stop ()}	
										
				testAllCandidates:
					for (var i = 0; i < result.length; ++i) {
						candidate = result[i].transcript.toLowerCase().trim();
						var words = candidate.match(/[-\w]+/g); 				// parses candidate to array of words
						if (useWakeup) {
							if (wakeup.indexOf (words[0]) >= 0) {			// if the first word is a wakeup word 
								words.splice (0,1);							// remove it
								if (i == 0) {
									topCandidate = words.join(' ');	
								}
							} else {
								continue;
							}
						}
						if (words.length >= 2) {
							if (words[0] == 'go' && words[1] != 'to' && words[1] != 'home') {
								words.splice (0,1);		// remove superfluous "go"
							}
						}
						commandFound = true;
						testCandidate: switch (words [0]){
							case 'forward':
							case 'foreword':
							case 'race':
							case 'run':
							case 'front':
							case 'go':
								if (words.length == 1) {	
									x = linearSpeed;
									// ---------- loop acao ir para frente
									for(var i=0; i < 1000; i++) {
										//sendTwistMessage (x, z);
										arrowUp();
									}
									// ----------
								} else if (words.length == 3) {
									//alert(words);	
									dist = getDistance (words[1], words[2]);	// accept meters, translate feet --> meters
									commandFound = (dist > 0); 
									if (dist > 0) {                     // move dist meters
										//alert('Falaram GO  if 3');	
										moveRobotFromPose (dist, 0);   // 0
										moveRobotFromPose (dist, 0);  // 0
									}
								} else {
									commandFound = false;
								}
								break testCandidate;
							case 'right':
							case 'go right':
              				case 'turn right':
								if (words.length == 1) {
									//alert("Ir para direita");		
									x = linearSpeed;
									// ---------- loop acao ir para direita
									for(var i=0; i < 100; i++) {
										arrowRight();
									}
									// ----------
								}
								break;
							case 'left':
              				case 'go left':
              				case 'turn left':
								if (words.length == 1) {
									//alert("Ir para esquerda");		
									x = linearSpeed;
									// ---------- loop acao ir para esquerda
									for(var i=0; i < 100; i++) {
										arrowLeft();
									}
									// ----------
								}
								break;
							case "reverse":
							case "return":
							case "back":
							case "go return":
							case "go back":
								if (words.length == 1) {			
									x = -linearSpeed;
										// ---------- loop acao ir para tras
										for(var i=0; i < 500; i++) {
											arrowDown();
										}
										// ----------
								} else if (words.length == 3) {
									dist = -getDistance (words[1], words[2]);			// accept meters, feet --> meter
									commandFound = (dist < 0);
									if (dist < 0) {
										moveRobotFromPose (dist, 0);		// move dist meters 
									}
								} else {
									commandFound = false;
								}
								break testCandidate;
							case "rotate":
								if (words.length == 2 ) {		
									dist = angularSpeed;
								} else if (words.length == 4) {
									dist = getDistance (words[2], words[3]);			// accept number of degrees
								} else {
									commandFound = false;
									break testCandidate;
								}
								if (dist <= 0) {
									commandFound = false;
									break testCandidate;
								}
								break testCandidate;
							case "turn":
								turnswitch: switch (words [1]) {
									case "right":
										z = -angularSpeed;
										break turnswitch;
									case "left":
										z = angularSpeed;
										break turnswitch;
									default:
										commandfound = false;
										break testCandidate;
								}
								x = linearSpeed;
								sendTwistMessage (x, z);
								break testCandidate;
							case "stop":
							case "halt":
								stopMotion = true;
								//sendTwistMessage (0, 0);
								cancelRobotMove ();
								break testCandidate;
							case "faster":
								speedFactor *= 1.1;
								speed_span.innerHTML = "Speed factor " + speedFactor.toFixed(2); 
								break testCandidate;
							case "speed":
								if (words [1] == "up") {
									speedFactor *= 1.1;
									speed_span.innerHTML = "Speed factor " + speedFactor.toFixed(2); 
								} else {
									commandFound = false;
								}
								break testCandidate;
							case "slower":
								speedFactor /= 1.1;
								speed_span.innerHTML = "Speed factor " + speedFactor.toFixed(2); 
								break testCandidate;
							case "slow":
								if (words [1] == "down") { 
									speedFactor /= 1.1;
									speed_span.innerHTML = "Speed factor " + speedFactor.toFixed(2); 
								} else {
									commandFound = false;
								}
								break testCandidate;
							case "help":
								$('#helpModal').modal('show');
								break testAllCandidates;
							default: 
								commandFound = false;
								break testCandidate;
						}

						// it may yet be a waypoint command
						if (!commandFound) {
							if (words && words.length > 1) {
								if (words [0] == "waypoint") {			// it is a waypoint command, to set a waypoint
									commandFound = true;				// prevent the error msg
									var waypoint = words.slice(1).join(" ");
									bootbox.dialog({
										message: waypoint,
										className: "bootbox-msg",
										title: "Please confirm the waypoint name ",
										closeButton: false,
										buttons: {
										danger: {
											label: "No",
											className: "btn-danger",
											callback: function() {
											}
										},
										success: {
											label: "OK",
											className: "btn-success",
											callback: function() {
											setWaypoint (waypoint);
											}
										}
										}
									});
								} else if (words.length > 2 && words[0] == "go" && words[1] == "to") {		// go to waypoint
									commandFound = true;
									goToWaypoint (words.slice(2).join(" "));
								} else if (words.length > 2 && words[0] == "remove" && words[1] == "waypoint") { 	// remove waypoint
									commandFound = true;
									SetWaypointZero (words.slice(2).join(" "));
								} else if (words.length == 2 && words[0] == "list" && words[1] == "waypoints") { 	// list the waypoints
									commandFound = true;
									listWaypoints ();
								} else if (words.length == 2 && words[0] == "go" && words[1] == "home") {	// go home 
									commandFound = true;
									goToWaypoint ("home");
								}
							}
						}
						allResults += "/" + candidate;
						if (commandFound === true) {
							altNumber = i;
							break testAllCandidates;
						}
					}		// end of for loop
	
				console.log (allResults);
				if (showUnrecognized) {addLog (allResults);}
				if (commandFound) {								// publish the command
					commands = candidate + " (alt. #" + (altNumber + 1) + " of " + results.length + ") " + commands;
					commands = commands.slice(0, 50);
					total_recognized++;
					addLog (commands);
					
					// Research: Keep count of how often we used the first result
					if (altNumber == 0) {
						localStorage.firstResultOK = Number(localStorage.firstResultOK) + 1;
					} else {
						localStorage.otherResultOK = Number(localStorage.otherResultOK) + 1;
					} 
					console.log ("First answer recognition rate is " + ((100 * Number(localStorage.firstResultOK)) /
						(Number(localStorage.firstResultOK) + Number(localStorage.otherResultOK))).toFixed(2) + "%");
				} else if (topCandidate != "") {
					addLog (topCandidate.toLowerCase() + " is not recognized as a command", "red");
				}
			} 
		}	// end of onresult
	}   
}		// end of function startRecpgnition       

function showInfo(s) {
	if (s) {
		for (var child = info.firstChild; child; child = child.nextSibling) {
			if (child.style) {
				child.style.display = child.id == s ? 'inline' : 'none';
			}
		}
		info.style.visibility = 'visible';
	} else {
		info.style.visibility = 'hidden';
	}
}

function startButton(event) {
	console.log('startButton event');

	if(recognizing) {
		recognition.stop();
		console.log('recognition stopped');
		noRestartReco = true;
		setMicInactive()
		showInfo('info_none');
		return;
	}

	if (!(recognition || 0)) {
		startRecognition();
	}

	if (recognition || 0) {
		recognition.lang = "en-US"; // Idioma da voz  // en-US
		recognition.start();
		noRestartReco = false;
		setMicOff ()
		showInfo('info_allow');
		// showButtons('none');
		startTimestamp = event.timeStamp;
	}
}

function restartReco() {
	// console.log('restart recognition');
	recognition.start();
	noRestartReco = false;
	recognizing = true;
	setMicActive ();
}

function sendTwistMessage(xMove, zMove) {
	console.log ("sending twist x:" + xMove + " z:" + zMove);
	// linear x and y movement and angular z movement
	
	var cmdVel = new ROSLIB.Topic({
		ros : ros,
		name : topicName,
		messageType : 'geometry_msgs/Twist'
	});

	var twist = new ROSLIB.Message({
		linear: {
			x: xMove*speedFactor,
			y: 0.0,
			z: 0.0
		},
		angular: {
			x: 0.0,
			y: 0.0,
			z: zMove*speedFactor
		}
	});

	var reps = Math.max (1, Math.abs (twist.linear.x) > 0 ? linearRepeat : (Math.abs (twist.angular.z) > 0 ? angularRepeat : 1));
	if (typeof cmdVel.ros != "undefined") {			// this would be if we are not connected
		stopMotion = false;
		publishCmd();
	}

	function publishCmd() {
		if (!stopMotion) {
			cmdVel.publish (twist);
			if (reps > 1) {
				setTimeout (publishCmd, repeatInterval);
				reps = reps - 1;
			}
		}
	}
}

function arrowUp () {
	sendTwistMessage (linearSpeed, 0.0);
	addLog ("forward button");
}
function arrowUpRight () {
	moveRobotFromPose (0, angularSpeed);
	sendTwistMessage (linearSpeed, -0.05);
	addLog ("forward button");
}
function arrowUpLeft () {
	moveRobotFromPose (0, -angularSpeed);
	sendTwistMessage (linearSpeed, 0.05);
	addLog ("forward button");
}
function arrowDown () {
	sendTwistMessage (-linearSpeed, 0.0);
	addLog ("back button");
}
function arrowRight () {
	moveRobotFromPose (0, angularSpeed);
  sendTwistMessage (0, -0.05);
	addLog ("rotate right button");
}
function arrowLeft () {
	moveRobotFromPose (0,  -angularSpeed);
	sendTwistMessage (0, 0.05); // linearSpeed, angle
	addLog ("rotate left button");
}
function stopButton () {
	stopMotion = true;
	cancelRobotMove();
	addLog ("stop button");
	//sendTwistMessage (0.0, 0.0);
}

/* ---------------------- Waypoints ----------------------------------
 Waypoints are stored as parameters using the rosparam functions.   They are <name value> pairs--both strings.
 The values are obtained by stringify from the location--that is, the robot pose.
 A value of 0 indicates that the waypoint has been removed.
---------------------------------------------------------------------- */
	
// ----------------------------------------------------------------------
// Get the value of a waypoint parameter
// -----------------------------------------------
	  
function getWaypointValue(paramname) {
	return new Promise(function(resolve, reject) {
		var waypoint = new ROSLIB.Param({
			ros : ros,
			name : '' 
		});
		waypoint.name = paramname;
		waypoint.get (function(value) {
			if  (value !== "0") {
				resolve (paramname);		// it is an undeleted waypoint 
				// console.log (paramname + " has a value"); 
				}
			else {
				resolve ("0");		// it is an undeleted waypoint 
				// console.log (paramname + " has no value");
			}
		});
	});	
}
		
// ----------------------------------------------------------------------
// List the waypoints
// ----------------------------------------------------------------------		
		
function listWaypoints () {
	if (connected) {
		var count = 0;
		var output = "";
		var promises = [];
		var waypoint = new ROSLIB.Param({
			ros : ros,
			name : '' 
		});
			
		ros.getParams(function(params) {				// first get the list of ROS params
			// console.log("Params: " + params);
			if (params.length == 0) {
				say ("No parameters were found, let alone waypoints.");
			} else {											// look at all the params
				for (var i = 0; i < params.length; i++) {		// for each one: if a waypoint, get the value
					if (params[i].search ("/waypoint/") == 0) {			// "/waypoint/" is found at string [0]
						promises.push(getWaypointValue(params[i]));
						count++;
					}
				}
				if (count == 0) {
					say ("No waypoints were found");
				} else {
					Promise.all(promises).then(function(waypoints) {
						var counter = 0;
						waypoints.forEach(function(data) {
							if (data != "0") {			// this would indicate a waypoint that has been removed
								counter++;
								output = output + ", " + data.substring(10);
							}
						});
						if (counter == 0) {
							say ("No waypoints were found");
						} else if (counter == 1) {
							say ("The only waypoint is " + output);
						} else {
							say ("The waypoints are " + output);
						}
					}).catch(function(err){
						console.log(err);
					});
				}	
			}
		});
	}
}			

function goToWaypoint (waypointName) {
	var waypointPose;
	if (connected) {
		var waypoint = new ROSLIB.Param({
		ros : ros,
		name : '' 
		});
		waypoint.name = "waypoint/" + waypointName;
		waypoint.get(function(value) {
			if  (!value) {
				say ('Waypoint ' + waypointName + ' was not found');
				// alert ('Waypoint ' + waypointName + ' was not found');
				}
			else {
				console.log ('Value of waypoint ' + waypointName + ': ' + value);
				if (value == "0") {
					say ('Waypoint ' + waypointName + ' has been removed');
				} else {
					value = value.replace ('translation', 'position');		// convert tf pose to geometry
					value = value.replace ('rotation', 'orientation');
					waypointPose = JSON.parse(value);
					moveRobotToPose (waypointPose);
				}
			}
		});
	}
}
		
function setWaypoint (waypointName) {
// ----------------------------------------------------------------------
// Sets a rosparam to contain the waypoint
// ----------------------------------------------------------------------	
	if (connected) {
		var waypoint = new ROSLIB.Param({
			ros : ros,
			name : "waypoint/" + waypointName 
		});
		function setWaypointParam (location) {
			console.log ("Set waypoint " + waypoint.name + ": " + location);
			waypoint.set(location);
								paramdump ();
		};
		// console.log ("getting the current pose");
		getPose (setWaypointParam);
	}
}

function SetWaypointZero (waypointName) {
	// ----------------------------------------------------------------------
	// Sets a rosparam to string zero, effectively removing it
	// ----------------------------------------------------------------------	
	if (connected) {
		var waypoint = new ROSLIB.Param({
			ros : ros,
			name : "waypoint/" + waypointName 
		});
		// console.log ("Set waypoint " + waypoint.name + ": 0 ");
		waypoint.set("0");
		paramdump ();
	}
}
		
function getPose(callbackPosition) {	
	// ----------------------------------------------------------------------
	// Subscribing to the robot's Pose-- this method uses tfClient
	// Calls the callback with the stringified pose
	// ----------------------------------------------------------------------
	
	// A ROSLIB.TFClient object is used to subscribe to TFs from ROS. The fixedFrame 
	// is the frame all requested transforms will be relative to. 
	// The thresholds are the amount a TF must change in order to be republished. 
	if (connected) {
		var tfClient = new ROSLIB.TFClient({
		ros : ros,
		fixedFrame : 'map',
		angularThres : 0.01,	// threshold--smaller movements won't be reported
		transThres : 0.01
		});
		var msgString;

		// We subscribe to the TF between the fixed frame ('map') and the 'base_link' frame. 
		// Any transforms between these two frames greater than the specified threshold will 
		// trigger the callback. The message returned is a ROS TF message.
		
		tfClient.subscribe('base_link', function(message) {
			tfClient.unsubscribe('base_link');  			// we only need this once
			msgString = JSON.stringify(message);
			console.log ("tfClient pose in " + tfClient.fixedFrame + ": " + msgString);
			callbackPosition (msgString);		
		});
	}
}
	
function moveRobotToPose (movePose) {	
	var prevStatus = "";
	var statusString;
	var moveToPoseClient = new ROSLIB.ActionClient({
		// object with following keys: * ros - the ROSLIB.Ros connection handle * serverName - the action server name * actionName - the action message name * timeout - the timeout length when connecting to the action server
		ros : ros,
			serverName : 'move_base',
			actionName : 'move_base_msgs/MoveBaseAction'  
	});
																	
	var goal = new ROSLIB.Goal({
		actionClient : moveToPoseClient,
		goalMessage : {
			target_pose : {
				header : {
					frame_id : '/map'
				},
				pose : movePose			// move_base_msg
			}
		}
	});

	goal.on('status', function(status) {
		statusString = 'Move to pose status: ' + JSON.stringify(status);
		if (statusString !== prevStatus) {
			prevStatus = statusString;

			if (status.status == 4) {
				say (status.text);
			}
			console.log (statusString);
		}
		// moveClient.cancel ();  this does not stop the damn messages anyhow
	});
	goal.send();
	console.log ('moveRobotToPose goal sent, movepose: ' + JSON.stringify (movePose));
}
	
/**
 * 
 * @param {*} distance 
 * @param {*} angle 
 */
function moveRobotFromPose (distance, angle) {
	var statusString;
	if (connected) {
		var statusCount = 0;
		var prevStatus = "";
		var moveClient = new ROSLIB.ActionClient({
			ros : ros,
			serverName : 'move_base',
			actionName : 'move_base_msgs/MoveBaseAction'  
		});
		function yawToQuaternion(yaw) {
			return { x : 0,
					y : 0,
					z : Math.sin (yaw/2),
					w : Math.cos (yaw/2)
			};
		};
		var goal = new ROSLIB.Goal({
			actionClient : moveClient,
			goalMessage : {
				target_pose : {
					header : {
							frame_id : '/base_link',  	// '/base_footprint', doesn't seem to work on Loki, tho it does on Stage
					},
					pose : {
						position : {
							x :	distance,
							y : 0,
							z : 0
						},
						orientation : yawToQuaternion (angle)
					}
				}
			}
		});
		
		goal.on('status', function(status) {
			statusCount++;
			statusString = 'Move robot status: ' + JSON.stringify(status);
			if (statusString !== prevStatus) {
				prevStatus = statusString;
				if (status.status == 4) {
					say (status.text);
				}
				console.log (statusCount + ": " + statusString);
			}
			// moveClient.cancel ();  this does not stop the damn messages
		});
			/********	This never seems to be called!
				goal.on('result', function(result) {
					console.log ('Move robot result: ' + JSON.stringify(result));
					console.log ("Result: " + JSON.stringify (result));
					moveClient.cancel ();
				});
			******************/
		goal.send();
		console.log ('moveRobotFromPose goal sent');
	}
}
	
function cancelRobotMove () {
	var statusString;
	if (connected) {
		var moveClient = new ROSLIB.ActionClient({
			ros : ros,
			serverName : 'move_base',
			actionName : 'move_base_msgs/MoveBaseAction'  
		});
		moveClient.cancel ();  //cross fingers and hope?
	}
}
		
function paramdump () {
	console.log ("sending paramdump message");
	var dumpTopic = new ROSLIB.Topic({
		ros : ros,
		name : 'paramdump',
		messageType : 'std_msgs/String'
	});
	var pdumpMsg = new ROSLIB.Message({
		data: 'dump waypoints'
	});
	dumpTopic.publish (pdumpMsg);
}	
		
function mute () {
	if (muted === true) {
		muted = false;
		document.getElementById("muteButton").innerHTML = "Not muted";
	} else {
		muted = true;
		document.getElementById("muteButton").innerHTML = "Muted";
	}
}
	 
function toggleWakeup () {
	useWakeup = !useWakeup;
	setWakeupButton ();
}

function toggleSimulator () {
	if (useSimulator) {
		useSimulator = false;
		document.getElementById("simulatorButton").innerHTML = "Not using topics for simulator";
		topicName = 'pepper/cmd_vel'; 
	} else {
		useSimulator = true;					// topic name for the UR robots
		document.getElementById("simulatorButton").innerHTML = "Using topics for Stage simulator";
		topicName = '/cmd_vel_mux/input/navi'; 	// topic name for the Stage simulator
	}
}

function setWakeupButton () {
	if (useWakeup === false) {
		document.getElementById("wakeupButton").innerHTML = "Wakeup word is not required";
		document.getElementById("commandHeader").innerHTML = "<strong>Commands</strong>";
	} else {
		document.getElementById("wakeupButton").innerHTML = 'Wakeup word "' + wakeup[0] + '" is required' ;
		document.getElementById("commandHeader").innerHTML = '<strong>Commands--must be preceded by the word "Robot"</strong>';
	}
}
	
function toggleUnrecognized () {
	showUnrecognized = !showUnrecognized;
	setshowUnrecognizedButton ();
}
	
function setshowUnrecognizedButton () {
	if (showUnrecognized === false) {
		$('#showUnrecognizedButton').html('Not showing unrecognized speech');
	} else {
		document.getElementById("showUnrecognizedButton").innerHTML = "Showing unrecognized speech";
	}
}
