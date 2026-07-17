// Fondo de estrellas del portal (independiente de cualquier juego)
(function(){
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var starsContainer = document.getElementById('stars');
  for (var si=0; si<55; si++){
    var s = document.createElement('span');
    var size = (Math.random()*1.6+0.6).toFixed(2);
    s.style.left = (Math.random()*100)+'%';
    s.style.top = (Math.random()*100)+'%';
    s.style.width = size+'px';
    s.style.height = size+'px';
    if (reducedMotion){
      s.style.opacity = '0.5';
      s.style.animation = 'none';
    } else {
      s.style.animationDelay = (Math.random()*4).toFixed(2)+'s';
      s.style.animationDuration = (2.4+Math.random()*2.4).toFixed(2)+'s';
    }
    starsContainer.appendChild(s);
  }
})();

