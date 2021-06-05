function keyPressed(evt){
  evt = evt || window.event;
  var key = evt.keyCode || evt.which;
  return String.fromCharCode(key); 
}

document.onkeypress = function(evt) {
  var str = keyPressed(evt);
  
  // if(str == 'f')
  //   alert("Apertou o 'w', chamando uma função...");

    switch (str) {
      case 'w':
        arrowUp();
        // alert("Apertou o 'w', chamando uma função...");
        break;
      case 'q':
        arrowUpLeft();
        break;
      case 'e':
        arrowUpRight();
        break;
      case 'd':
        arrowRight();
        // alert("Apertou o 'd', chamando uma função...");
        break;
      case 's':
        arrowDown();
        // alert("Apertou o 's', chamando uma função...");
        break;
      case 'a':
        arrowLeft();
        // alert("Apertou o 'a', chamando uma função...");
        break;
      default:
        console.log(str);
    }
};
      
      
      

  
  