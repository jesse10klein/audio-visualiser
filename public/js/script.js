let playing = false;
let audio = null;
let angleTimeout = false;
const barLengthSlider = document.getElementById('barLengthSlider');
const circleRadiusSlider = document.getElementById('circleRadiusSlider');
const rotationSlider = document.getElementById('rotationSlider');
const spreadSlider = document.getElementById('spreadSlider');
const sampleSlider = document.getElementById('sampleSlider');
const spreadSliderValues = [10, 15, 23, 71, 200];
const sampleSizeValues = [256, 512, 1024, 2048, 4096];
let bufferLength = 1;
let angleIncrement = 0.001;
let canvas = null;
let canvasCentre = null;
let ctx = null;
let angleMultiplier = 1;
let analyser = null;

//Need to make width and height global cause they could change when window is resized

function invertAngleIncrement() {
  angleIncrement = angleIncrement > 0? -0.001: 0.001;
}

sampleSlider.onchange = () => {
  analyser.fftSize = sampleSizeValues[sampleSlider.value];
}

spreadSlider.onchange = () => {
  angleMultiplier = (spreadSliderValues[spreadSlider.value] * Math.PI) / (bufferLength);
}

function paint() {
  //Welcome message on canvas
  ctx.clearRect(0, 0, 2000, 2000);
  ctx.fillStyle = "white";
  if (window.innerWidth > 700) {
    ctx.font = "50px Arial";
    ctx.fillText("github.com/jesse10klein", canvas.width/2 - 265, canvas.height/2 - 75);
    ctx.fillText("Email: jesse10klein@gmail.com", canvas.width/2 - 350, canvas.height/2 + 50);
  } else {
  ctx.font = "25px Arial";
  ctx.fillText("github.com/jesse10klein", canvas.width/2 - 140, canvas.height/2);
  ctx.fillText("Email: jesse10klein@gmail.com", canvas.width/2 - 180, canvas.height/2 + 50);
  }
}


let angle = 0;

window.onload = function() {
  audio = document.getElementById('audio');
  audio.crossOrigin = 'anonymous';
  audio.volume = 0.1;
  canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 70;
  canvasCentre = {x: canvas.width/2, y: canvas.height/2};
  const file = document.getElementById('file');
  
  ctx = canvas.getContext("2d");
  
  paint();


  file.onchange = function() {
    updateTitle(`Playing a song from your library`)
    if (!playing) {
      startPlaying(URL.createObjectURL(this.files[0]));
    } else {
      audio.src = URL.createObjectURL(this.files[0]);
      audio.load();
      audio.play();
    }
    playing = true;
  }
};

window.onresize = function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 70;
  canvasCentre = {x: canvas.width/2, y: canvas.height/2};
  paint();
}

function startPlaying(source) {
  playing = true;
  audio.src = source;
  audio.load();
  audio.play();
  var context = new AudioContext();
  var src = context.createMediaElementSource(audio);
  analyser = context.createAnalyser();

  src.connect(analyser);
  analyser.connect(context.destination);

  analyser.fftSize = 512;

  bufferLength = analyser.frequencyBinCount;

  var dataArray = new Uint8Array(bufferLength);

  var WIDTH = canvas.width;
  var HEIGHT = canvas.height;

  angleMultiplier = (21 * Math.PI) / (bufferLength)

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
    if (playing) {
      requestAnimationFrame(renderFrame);
    }
    if (!angleTimeout) {
      angleTimeout = true;
      setTimeout(function () {
        angle += angleIncrement * rotationSlider.value;
        angleTimeout = false;
      }, 20);
    }
    if (angle > 6.28) {
      angle = 0;
    }

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
      drawRotatedRectangle(ctx, (i * angleMultiplier) + angle, barHeight, colour, innerRadius);


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
  const songTitle = (elem.previousElementSibling.previousElementSibling.previousElementSibling.innerText); 
  //Hide all boxed;
  const dropdown = $("#search-dropdown");
  dropdown.empty();
  const searchTerm = $("#search-term");
  searchTerm.val("");
  if (!playing) {
    startPlaying(url);
    playing = true;
  } else {
    audio.src = url;
    audio.load();
    audio.play();
  }
  updateTitle(`Now Playing: ${songTitle}`);
}

function updateTitle(newText) {
  const title= $("#title");
  title.text(newText);
  title.css('font-size', 10);
  title.css('margin-top', 17);
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
}

$("#search-term").on('keyup', function () {


  const searchTerm = $("#search-term").val();
  const data = { searchTerm }

  const url = window.location.href + "spotify-api";

  if (searchTerm.length < 3) {
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

const dropdown = document.getElementById('dropdown');
const dropdownContent = document.getElementById('dropdownContent');
dropdown.onmouseover = () => {
  dropdownContent.style.display = 'block';
}

dropdown.onmouseleave = () => {
  dropdownContent.style.display = 'none';
}

const searchDropdown = document.getElementById('search-dropdown');

searchDropdown.onmouseleave = () => {
  searchDropdown.style.display = 'none';
}


