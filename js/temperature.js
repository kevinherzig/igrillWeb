const client = new Paho.MQTT.Client("ws://broker.hivemq.com:8000/mqtt", "myClientId" + new Date().getTime());

// const myTopic = "iGrillMon/D4:81:CA:22:AB:97"



const messageTTLSeconds = 10
const imageSize = 300
var messageTTL = messageTTLSeconds
var MyTopic = ""

connectingImage = new Image();
connectingImage.src = 'images/connecting.jpg'
connectingImage.addEventListener('load', e => {
  setLoadingImages()
});

offlineImage = new Image();
offlineImage.src = 'images/offline.jpg';

disconnectedImage = new Image()
disconnectedImage.src = 'images/disconnected.jpg'

function creategauge(canvasElement, title) {
  var gauge = new RadialGauge({
    renderTo: canvasElement,
    dataType: "radial-gauge",
    minValue: "50",
    maxValue: "400",
    width: imageSize,
    height: imageSize,
    majorTicks: [50, 100, 150, 200, 250, 300, 350, 400],
    borders: "false",

    colorBarStroke: "#444",
    colorMajorTicks: "#ffe66a",
    colorMinorTicks: "#ffe66a",
    colorTitle: "#eee",
    colorUnits: "#ccc",
    colorNumbers: "#eee",
    colorPlate: "#2465c0",
    colorPlateEnd: "#327ac0",
    colorValueBoxShadow: "false",
    colorPlate: "#444",
    colorNeedle: "rgba(0,0,0,1)",

    value: "0",
    units: "°F",

    tickSide: "left",
    numberSide: "left",
    needleSide: "left",

    fontValueSize: "50",
    fontNumbersSize: "30",
    needleShadow: "true",
    needleType: "arrow",

    valueInt: "",
    valueDec: "0",
    title: title,
    highlights: [
      { from: 50, to: 225, color: 'rgba(0,0,255,1)' },
      { from: 225, to: 275, color: 'rgba(0,255,0,1)' },
      { from: 275, to: 300, color: 'rgba(255,255,0,1)' },
      { from: 300, to: 400, color: 'rgba(255,0,0,1)' }]
  });

  return gauge;
}

document.addEventListener("DOMContentLoaded", function () {
  var parameters = window.location.search;
  var urlParams = new URLSearchParams(parameters);
  var bluetoothAddress = urlParams.get('address')

  if (bluetoothAddress == null) {
    myTopic = "None"
  }
  else {
    myTopic = "iGrillMon/" + bluetoothAddress.toUpperCase();

    console.debug("topic " + myTopic)
    client.connect({ onSuccess: onConnect })
  }

  if (myTopic == "None") document.getElementById('getAddress').hidden = false;

  let counter = 0
});

var myVar = setInterval(myTimer, 1000);

function myTimer() {
  if (messageTTL > 0) {
    messageTTL -= 1
    if (messageTTL == 0) {
      for (i = 1; i < 5; i++) {
        var gaugeName = "g" + i
        var gauge = document.gauges.get(gaugeName)
        if (gauge != null)
          gauge.destroy();
        gaugeOffline(gaugeName)
      }
    }
  }
}

function gaugeOffline(name) {
  var canvas = document.getElementById(name)
  canvas.width = imageSize
  canvas.height = imageSize
  context = canvas.getContext('2d');
  var startXPos = (canvas.width / 2) - (imageSize / 2)
  context.drawImage(offlineImage, startXPos, 0, imageSize, imageSize);
}

function gaugeDisconnected(name) {
  var canvas = document.getElementById(name)
  canvas.width = imageSize
  canvas.height = imageSize
  context = canvas.getContext('2d');
  var startXPos = (canvas.width / 2) - (imageSize / 2)
  context.drawImage(disconnectedImage, startXPos, 0, 200, 200);
}

function gaugeConnecting(name) {
  var canvas = document.getElementById(name)
  canvas.width = imageSize
  canvas.height = imageSize
  context = canvas.getContext('2d');
  var startXPos = (canvas.width / 2) - (imageSize / 2)
  context.drawImage(disconnectedImage, startXPos, 0, 200, 200);
}

function setLoadingImages() {
  for (i = 1; i < 5; i++) {
    var gaugeName = "g" + i
    var canvas = document.getElementById(gaugeName)
    canvas.width = imageSize
    canvas.height = imageSize
    context = canvas.getContext('2d');
    var startXPos = (canvas.width / 2) - (imageSize / 2)
    context.drawImage(connectingImage, startXPos, 0, 200, 200);
  }
}

function onConnect() {
  console.log("connection successful")
  client.subscribe(myTopic)   //subscribe to our topic
  client.onMessageArrived = onMessageArrived;
}

function onMessageArrived(messageStr) {
  try {
    var message = JSON.parse(messageStr.payloadString)

    messageTTL = messageTTLSeconds
    for (var key in message["temperatures"]) {
      // check if the property/key is defined in the object itself, not in parent
      var probeNumber = key.slice(-1)
      var gaugeName = "g" + probeNumber
      var temp = message["temperatures"][key]
      var gauge = document.gauges.get(gaugeName)

      if (temp != 'N') {
        if (gauge == null) {
          gauge = creategauge(gaugeName, "Probe " + probeNumber);
        }
        gauge.value = temp
      }
      else {
        if (gauge != null)
          gauge.destroy()
        gaugeDisconnected(gaugeName)
      }
    }
  }
  catch (ex) {
    console.log("boooom")
  }

};

client.onConnectionLost = onConnectionLost;

function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:" + responseObject.errorMessage);
  }
  client.connect({ onSuccess: onConnect });
}

function OnAddressButtonClick() {
  window.location.href = 'index.html?address=' + document.getElementById('address').value
}