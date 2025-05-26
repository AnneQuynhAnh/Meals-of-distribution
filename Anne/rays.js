function createSunburstRays() {
  rays = [];
  let centerX = width / 2;
  let centerY = height / 2;
  let beltRadius = min(width, height) * 0.3;
  let innerRadius = beltRadius * 0.85;
  
  // Create rays with random lengths
  for (let i = 0; i < numRays; i++) {
    let angle = TWO_PI * i / numRays;
    // Randomize ray length within a range
    let length = random(rayMinLength, rayMaxLength);
    // Start ray just outside the inner circle
    let startRadius = innerRadius * 0.9;
    
    rays.push({
      angle: angle,
      length: length,
      startRadius: startRadius,
      width: random(1, 3.5), // Random width for each ray
      offset: random(TWO_PI) // Phase offset for animation
    });
  }
}
function drawSunburstRays() {
  push();
  stroke('black');
  strokeWeight(1);
  noFill();

  let volumeFactor = constrain(vol * 4000, 10, 120); // 💥 boosted for music sync

  for (let r of rays) {
    let a = r.angle;

    // Animate with pulse + volume
   let pulse = abs(sin(frameCount * 0.4 + r.offset)) * volumeFactor;

    let startR = r.startRadius;
    let dynamicLength = r.length + pulse;
    let sx = centerPlate.x + cos(a) * startR;
    let sy = centerPlate.y + sin(a) * startR;
    let ex = centerPlate.x + cos(a) * (startR + dynamicLength);
    let ey = centerPlate.y + sin(a) * (startR + dynamicLength);

    line(sx, sy, ex, ey);
  }

  pop();
}




function drawRipples() {
  noFill();
  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i];
    
    // Calculate opacity - fades as it expands
    let normalizedProgress = (r.radius - centerPlate.radius * 2) / (r.maxRadius - centerPlate.radius * 2);
    r.opacity = 255 * (1 - normalizedProgress);
    
    // Draw the ripple
    stroke(229, 0, 4, r.opacity);
    strokeWeight(r.strokeWeight * (1 - normalizedProgress * 0.7)); // Stroke gets thinner as it expands
    ellipse(centerPlate.x, centerPlate.y, r.radius * 2);
    
    // Increase the radius
    r.radius += 3;
    
    // Remove ripple when it reaches maximum radius
    if (r.radius >= r.maxRadius) {
      ripples.splice(i, 1);
    }
  }
  strokeWeight(1); // Reset stroke weight
}