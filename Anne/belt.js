function drawBelt() {
  let centerX = width / 2;
  let centerY = height / 2;
  let beltRadius = min(width, height) * 0.3;
  let glowSize = beltRadius * 0.4;
  let innerRadius = beltRadius * 0.85;

  // 🌀 Rotate the entire belt like a disc
  push();
  translate(centerX, centerY); // Move origin to center
  rotate(frameCount * 0.002);  // Slow rotation

  // 🔴 Outer glow rotating with belt
  noStroke();
  for (let i = glowSize; i > 0; i--) {
    let alpha = map(i, glowSize, 0, 2, 20);
    fill(229, 0, 4, alpha * 0.4);
    ellipse(0, 0, (beltRadius + i) * 2);
  }

  // 🔴 Red belt ring
  strokeWeight(1);
  noFill();
  stroke(229, 0, 4);
  ellipse(0, 0, beltRadius * 2);

  // ⚫ Inner black outline
  noFill();
  stroke(94, 88, 86, 60);
  strokeWeight(1);
  ellipse(0, 0, (beltRadius - beltWidth / 5) * 2.5);

  // ⚪ White interior
  fill('#F7F7F7');
  noStroke();
  ellipse(0, 0, innerRadius * 2);

  // ⚫ Rotating dotted circle
  let numDots = 90;
  let dottedRadius = innerRadius * 0.9;
  fill(94, 88, 86);
  noStroke();
  for (let d = 0; d < numDots; d++) {
    let angle = TWO_PI * d / numDots;
    let x = dottedRadius * cos(angle);
    let y = dottedRadius * sin(angle);
    ellipse(x, y, 1.5);
  }

  pop(); // 🛑 Done rotating
}


function drawRotatingOrbits() {
  let centerX = width / 2;
  let centerY = height / 2;
  let numDots = 30; // number of orbiting dots
  let orbitRadius = min(width, height) * 0.3; // slightly smaller than belt
  let angleSpeed = 0.01; // rotation speed

  fill(229, 0, 4, 80); // subtle red
  noStroke();

  for (let i = 0; i < numDots; i++) {
    let angle = TWO_PI * i / numDots + frameCount * angleSpeed;
    let x = centerX + orbitRadius * cos(angle);
    let y = centerY + orbitRadius * sin(angle);
    ellipse(x, y, 3); // small orbiting dot
  }
}


function createBeltPath() {
  path = []; // Clear previous path
  let centerX = width / 2;
  let centerY = height / 2;
  let radius = min(width, height) * 0.35; // Match the belt radius
  let resolution = 200; // Number of points
  for (let i = 0; i < resolution; i++) {
    let angle = TWO_PI * i / resolution;
    let x = centerX + radius * cos(angle);
    let y = centerY + radius * sin(angle);
    path.push({ x, y });
  }
}


function calculatePathLength() {
  let length = 0;
  for (let i = 0; i < path.length - 1; i++) {
    length += dist(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
  }
  // Add the distance from last to first point to close the loop
  length += dist(
    path[path.length - 1].x,
    path[path.length - 1].y,
    path[0].x,
    path[0].y
  );
  return length;
}

function createBeltMarkers() {
  let currentDist = 0;
  let targetDist = 0;
  while (currentDist < totalPathLength) {
    let pos = getPositionOnPath(currentDist / totalPathLength);
    markers.push(pos);
    currentDist += markerSpacing;
  }
}

function getPositionOnPath(t) {
  // Normalize t to be between 0 and 1
  t = ((t % 1) + 1) % 1;
  // Convert to path index
  let targetIndex = t * path.length;
  let index1 = floor(targetIndex) % path.length;
  let index2 = (index1 + 1) % path.length;
  let fraction = targetIndex - index1;
  // Linear interpolation between points
  let x = lerp(path[index1].x, path[index2].x, fraction);
  let y = lerp(path[index1].y, path[index2].y, fraction);
  return { x, y };
}