let playing = false;
let audio = null;
let timeoutSet = false;
const barLengthSlider = document.getElementById('barLengthSlider');
const circleRadiusSlider = document.getElementById('circleRadiusSlider');

window.onload = function() {
  audio = document.getElementById('audio');
  audio.crossOrigin = 'anonymous';
  audio.volume = 0.1;
  const canvas = document.getElementById('canvas');
  const file = document.getElementById('file');
  file.onchange = function() {
    if (!playing) {
      startPlaying(URL.createObjectURL(this.files[0]));
      playing = true;
    } else {
      audio.src = URL.createObjectURL(this.files[0]);
      audio.load();
      audio.play();
    }
  }
};

function startPlaying(source) {
  audio.src = source;
  audio.load();
  audio.play();
  var context = new AudioContext();
  var src = context.createMediaElementSource(audio);
  var analyser = context.createAnalyser();

  var canvas = document.getElementById("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 70;
  canvasCentre = {x: canvas.width/2, y: canvas.height/2};
  var ctx = canvas.getContext("2d");

  src.connect(analyser);
  analyser.connect(context.destination);

  analyser.fftSize = 2048;

  var bufferLength = analyser.frequencyBinCount;

  var dataArray = new Uint8Array(bufferLength);

  var WIDTH = canvas.width;
  var HEIGHT = canvas.height;

  const angleMultiplier = (21 * Math.PI) / (bufferLength);

  var barWidth = (WIDTH / bufferLength) * 1.5;
  var barHeight;
  var x = 0;
  let b = 100;
  let bIncrement = 4;

  let pastTotal = null;
  let tdrawCircles = 0;

  circles = [];
  maxCircles = 20;

  function renderFrame() {
    requestAnimationFrame(renderFrame);

    
    const innerRadius = circleRadiusSlider.value * 2;

    x = 0;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = "rgb(255,255,255)";
    ctx.beginPath();
    ctx.arc(canvasCentre.x, canvasCentre.y, innerRadius, 0, 2 * Math.PI);
    ctx.stroke();

    total = 0;
    for (var i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] * 0.03 * barLengthSlider.value;
      total += dataArray[i];

      var r = barHeight + ((1.2 * i/bufferLength));
      var g = ((200 * i/bufferLength));
      colour = "rgb(" + r + "," + g + "," + b + ")";
      drawRotatedRectangle(ctx, (i * angleMultiplier), barHeight, colour, innerRadius);


      x += barWidth + 1;
    }
    b += bIncrement;
    if (b > 255) {
      b = 255;
      bIncrement = -4;
    } else if (b < 0) {
      b = 0;
      bIncrement = 4;
    }
  }
  audio.play();
  renderFrame();
};

function drawRotatedRectangle(ctx, angle, magnitude, colour, innerRadius) {
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = colour;

  startX = Math.ceil(innerRadius * Math.sin(angle));
  startY = Math.ceil(innerRadius * Math.cos(angle));
  endX = Math.ceil((magnitude + innerRadius) * Math.sin(angle));
  endY = Math.ceil((magnitude + innerRadius) * Math.cos(angle));

  ctx.moveTo(canvasCentre.x + startX, canvasCentre.y - startY);
  ctx.lineTo(canvasCentre.x + endX, canvasCentre.y - endY);
  ctx.stroke();
}

function formatAutocompleteTag(tag) {
  const HTML = `
    <div class='search-tag'>
      <p class='name'>${tag.name} by ${tag.artist} </p>
      <p class='previewURL'>${tag.previewURL}</p>
      <img class='search-image' src="${tag.imageURL}"> </img>
      <button onclick='processPreview(this)'>Preview!</button>
    </div>
  `
  return HTML;
}

function processPreview(elem) {
  const url = (elem.previousElementSibling.previousElementSibling.innerText);
  //Hide all boxed;
  const dropdown = $("#search-dropdown");
  dropdown.empty();
  if (!playing) {
    startPlaying(url);
    playing = true;
  } else {
    audio.src = url;
    audio.load();
    audio.play();
  }
}

function updateAutoComplete(matches) {

  const dropdown = $("#search-dropdown");
  dropdown.empty();

  let HTMLString = "";
  for (let i = 0; i < matches.length; i++) {
    HTMLString += formatAutocompleteTag(matches[i]);
  }

  dropdown.append(HTMLString);
  dropdown.css("display", "flex");
  dropdown.css("flex-direction", "column");

  if (!timeoutSet) {
    timeoutSet = true;
    setTimeout(function () {
      const dd = $("#search-dropdown");
      dd.css("display", "none");
      timeoutSet = false;
    }, 10000);
  }
}

$("#search-term").on('keyup', function () {


  const searchTerm = $("#search-term").val();
  const data = { searchTerm }

  const url = window.location.href + "spotify-api";

  if (searchTerm.length < 4) {
    updateAutoComplete([]);
    return;
  } 

  $.ajax({
    url, type: "POST", data,
    success: function(response) {
      updateAutoComplete(response);
    }
  })

});



