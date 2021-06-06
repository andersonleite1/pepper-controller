function keyPressed(evt){
  evt = evt || window.event;
  var key = evt.keyCode || evt.which;
  return String.fromCharCode(key); 
}

document.onkeypress = function(evt) {
  var str = keyPressed(evt);

    switch (str) {
      case 'w':
        arrowUp();
        break;
      case 'q':
        arrowUpLeft();
        break;
      case 'e':
        arrowUpRight();
        break;
      case 'd':
        arrowRight();
        break;
      case 's':
        arrowDown();
        break;
      case 'a':
        arrowLeft();
        break;
      default:
        console.log(str);
    }
};

var intervalId = 0;
$(document).on('mouseup', release);
function release() {
  if(intervalId != 0) {
    clearInterval(intervalId); // Limpa o intervalo registrado anteriormente
    intervalId = 0;

    var svgs = document.querySelectorAll("svg");
    for(var i = 0; i < svgs.length; i++) {
      if(svgs[i].classList.contains("on")) svgs[i].classList.remove("on")
    }
  }
}
      
$('#arrowUp').on('mousedown', function() {
  this.children[0].classList.add("on");
  intervalId = setInterval(arrowUp, 500); 
});

$('#arrowRight').on('mousedown', function() {
  this.children[0].classList.add("on");
  intervalId = setInterval(arrowRight, 500); 
});

$('#arrowDown').on('mousedown', function() {
  this.children[0].classList.add("on");
  intervalId = setInterval(arrowDown, 500); 
});

$('#arrowLeft').on('mousedown', function() {
  this.children[0].classList.add("on");
  intervalId = setInterval(arrowLeft, 500); 
});
  