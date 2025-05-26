function drawCenterPlate() {
  let mode = distributionKnob ? distributionKnob.getValue() : 1; // Default to EQUAL
  const radius = centerPlate.radius;
  
  // Outer ring (salmon/coral color)
  let redColor = color("#E500045E");
  redColor.setAlpha(200); // about 70% opacity
  fill(redColor);
  stroke("rgba(229,0,4,0.73)"); // keeping the stroke fully opaque
  ellipse(centerPlate.x, centerPlate.y, radius * 5);
  
  // Inner white plate
  fill(255);
  stroke(255);
  ellipse(centerPlate.x, centerPlate.y, radius * 4);
  
  // Small dotted circle border
  noFill();
  stroke(200);
  strokeWeight(0.5);
  drawingContext.setLineDash([1, 3]);
  ellipse(centerPlate.x, centerPlate.y, radius * 3.6);
  drawingContext.setLineDash([]);
  strokeWeight(1);
  
  // Use stable particles instead of random generation each frame
  fill(0);
  noStroke();
  
  // Draw the static particles
 if (mode === 0 || mode === 1) { // RICH or EQUAL
  for (let p of centerPlate.particles) {
    let spreadRadius = sqrt(p.spreadFactor || 0.5) * radius * 1.6;
    let x = centerPlate.x + cos(p.angle) * spreadRadius;
    let y = centerPlate.y + sin(p.angle) * spreadRadius;
    ellipse(x, y, p.size);
  }
}

}

function drawPlates() {
  for (let i = 0; i < plates.length; i++) {
    let plate = plates[i];

    // Plate base
    fill("#F7F7F7");
    stroke("#E50004");
    ellipse(plate.x, plate.y, plateRadius * 2.2);

    // Stippled rim
    let numDots = 90;
    let r = plateRadius * 0.9;
    fill(30);
    noStroke();
    for (let d = 0; d < numDots; d++) {
      let angle = TWO_PI * d / numDots + sin(frameCount * 0.005 + d * 0.3) * 0.01;
      let jitter = random(-0.3, 0.3);
      let x = plate.x + (r + jitter) * cos(angle);
      let y = plate.y + (r + jitter) * sin(angle);
      ellipse(x, y, 1);
    }

    // 🍣 Bold & evenly spread red particles
// 🍣 Bold & evenly spread red particles (only in EQUAL and POOR)
let mode = distributionKnob ? distributionKnob.getValue() : 1; // Get current mode
if (mode === 1 || mode === 2) {  // EQUAL or POOR
  for (let p of plateParticles[i]) {
    let t = frameCount * 0.04 + p.offset;
    let breathing = sin(t * 2) * 0.5;

    let maxSpread = plateRadius * 0.9;
    let spreadRadius = sqrt(p.spreadFactor) * maxSpread;
    let x = plate.x + cos(p.angle) * spreadRadius;
    let y = plate.y + sin(p.angle) * spreadRadius;

    fill(p.color || foodColor);
    noStroke();
    ellipse(x, y, p.size * 1 + breathing);
  }
}

  }
}






function movePlates() {
  // Move plates along the path
  let speed = 0.001; // Adjust speed as needed

  for (let plate of plates) {
    plate.position = (plate.position + speed) % 1;
    let pos = getPositionOnPath(plate.position);
    plate.x = pos.x;
    plate.y = pos.y;
  }
}



function setupCenterPlateParticles() {
  centerPlate.particles = [];
  for (let i = 0; i < 200; i++) {
    centerPlate.particles.push({
      angle: random(TWO_PI),
      spreadFactor: random(), // 🧠 Add this for spreading effect
      size: random(2.5, 3.5),
      offset: random(10000)
    });
  }
}




