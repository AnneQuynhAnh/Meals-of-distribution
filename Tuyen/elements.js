function generateEarthParticles() {
  particles = [];
  for (let i = 0; i < numParticles; i++) {
    let angle = random(TWO_PI);
    let earthRadius = min(width, height) * 0.25; // 25% of smaller canvas side
    let r = sqrt(random()) * earthRadius;

    let offset = p5.Vector.fromAngle(angle).mult(r);
    particles.push(new Particle(offset, angle, r));
  }
}

function drawEarth() {
  let speed = mouseDir.mag();
  let flyChance = map(speed, 0, 50, 0, 0.1);
  let earthRadius = min(windowWidth, windowHeight) * 0.15; //
  for (let p of particles) {
    if (!p.flying && random(1) < flyChance) {
      p.flyOut(mouseDir.copy().normalize().mult(random(2, 5)));
    }
    p.update();
    p.display();
  }
}

function startSplitToBlobs() {
  let offset = p5.Vector.random2D().mult(random(0, min(width, height) * 0.05));

  let innerRadius = min(width, height) * 0.35;
  let outerRadius = min(width, height) * 0.48;
  outerRing = new ParticleRing(
    createVector(width / 2, height / 2),
    innerRadius,
    outerRadius
  );

  let compassPoints = 36;
  let compassRadius = min(width, height) * 0.06;
  compassRing = new CompassRose(
    createVector(width / 2, height / 2),
    compassPoints,
    compassRadius
  );

  blobs = [];
  let numBlobs = 6;
  let angleIncrement = TWO_PI / numBlobs;
  let radius = min(width, height) * 0.3;
  let blobCenters = [];

  for (let i = 0; i < numBlobs; i++) {
    let angle = angleIncrement * i;
    let x = width / 2 + cos(angle) * radius;
    let y = height / 2 + sin(angle) * radius;
    blobCenters.push(createVector(x, y));
    blobs.push(new BlobParticleGroup(x, y, i));
  }

  for (let i = 0; i < particles.length; i++) {
    let blobCenter = blobCenters[i % blobCenters.length];
    let offset = p5.Vector.random2D().mult(
      random(0, min(width, height) * 0.05)
    );
    let finalTarget = p5.Vector.add(blobCenter, offset);
    particles[i].startTransitionTo(finalTarget);
  }
}

function animateSplitToBlobs() {
  let done = true;
  for (let p of particles) {
    p.updateTransition();
    p.display();
    if (p.transitioning) done = false;
  }

  if (done) {
    for (let blob of blobs) {
      blob.addParticle();
    }

    backgroundSpiral = new SpiralBackground(earthCenter);
    backgroundSpiral.trigger(); // start with first animation
    state = "blobs";
  }
}

function drawBlobs() {
  // Update and show outer ring
  if (outerRing) {
    outerRing.update();
    outerRing.show();
  }

  // Update and show compass ring
  if (compassRing) {
    let rotSpeed = map(mouseX - width / 2, -width / 2, width / 2, -0.02, 0.02);
    compassRing.update(rotSpeed);
    compassRing.show();
  }

  // Update and draw all blobs
  for (let blob of blobs) {
    blob.update();
    blob.display();

    if (blob.spiralActive) {
      stroke("#333");
      strokeWeight(2);
      line(width / 2, height / 2, blob.center.x, blob.center.y);
      blob.displayRaysAndConnections(blobs);
    }
  }

  // Update and draw background spiral if any
  if (backgroundSpiral) {
    backgroundSpiral.update();
    backgroundSpiral.display();
  }

  // 🟢 Auto-trigger blob spiral in Rich mode (0)
  let mode = distributionKnob ? distributionKnob.getValue() : 1;
  if (mode === 0 && frameCount % 30 === 0) {
    // every ~1 second
    let blob = random(blobs);
    if (!blob.spiralActive) {
      blob.activateSpiral();

      // Play spiral sound
      if (blobSounds[blobSoundIndex]) {
        for (let s of blobSounds) s.stop();
        blobSounds[blobSoundIndex].play();
        blobSoundIndex = (blobSoundIndex + 1) % blobSounds.length;
      }
    }
  }
}

class Particle {
  constructor(originOffset, angle, baseRadius) {
    this.originOffset = originOffset.copy();
    this.angle = angle;
    this.baseRadius = baseRadius;
    this.dotSize = random(4, 6);
    this.orbitSpeed = random(0.0005, 0.002);
    this.pos = p5.Vector.add(earthCenter, originOffset);
    this.vel = createVector(0, 0);
    this.transitioning = false;
    this.transitionProgress = 0;
    this.targetPos = null;
    this.flying = false;
    this.flyVel = createVector(0, 0);
  }

  startTransitionTo(target) {
    this.targetPos = target.copy();
    this.startPos = this.pos.copy();
    this.transitioning = true;
    this.transitionProgress = 0;
  }

  updateTransition() {
    if (this.transitioning) {
      this.transitionProgress += 0.02;
      if (this.transitionProgress >= 1) {
        this.transitioning = false;
        this.pos = this.targetPos.copy();
      } else {
        this.pos = p5.Vector.lerp(
          this.startPos,
          this.targetPos,
          this.transitionProgress
        );
      }
    }
  }

  flyOut(force) {
    this.flying = true;
    this.flyVel = force;
  }

  update() {
    if (this.flying) {
      this.pos.add(this.flyVel);
      this.flyVel.mult(0.98);
      if (this.flyVel.mag() < 0.1) {
        this.flying = false;
        this.angle += this.orbitSpeed;
      }
      return;
    }

    this.angle += this.orbitSpeed;
    let orbit = p5.Vector.fromAngle(this.angle).mult(this.baseRadius);
    this.pos = p5.Vector.add(earthCenter, orbit);
  }

  display() {
    fill("#E50004");
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.dotSize);
  }
}

class BlobParticleGroup {
  constructor(x, y, id) {
    this.center = createVector(x, y);
    this.particles = [];
    this.hovered = false;
    this.hoverProgress = 0;
    this.color = color("#E50004");
    this.connections = [];
    this.spiralTightness = random(0.3, 0.7);
    this.spiralGrowth = random(1.5, 2.5);
    this.rotationOffset = random(TWO_PI);
    this.radius = min(width, height) * 0.04; // responsive
    this.spiralActive = false;
    this.spiralTimer = 0;
    this.spiralDuration = 120;
  }

  activateSpiral() {
    this.spiralActive = true;
    this.spiralTimer = this.spiralDuration;
    this.hovered = true;
  }

  addParticle() {
    this.particles = [];
    let rings = 5;
    let ringSpacing = min(width, height) * 0.009; // was 7

    for (let j = 1; j <= rings; j++) {
      let numPerRing = 40 * j;
      let r = j * ringSpacing;
      for (let i = 0; i < numPerRing; i++) {
        let angle = map(i, 0, numPerRing, 0, TWO_PI);
        this.particles.push({
          angleOffset: angle,
          radiusOffset: r,
          size: random(min(width, height) * 0.003, min(width, height) * 0.005), // responsive size
        });
      }
    }
  }

  update() {
    if (this.spiralActive) {
      this.spiralTimer--;
      if (this.spiralTimer <= 0) {
        this.spiralActive = false;
        this.hovered = false;
      }
    }

    let target = this.hovered ? 1 : 0;
    this.hoverProgress = lerp(this.hoverProgress, target, 0.2);
  }

  display() {
    noStroke();
    fill(this.color);

    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];

      let spread = this.hoverProgress;
      let spiralAngle =
        p.angleOffset + i * this.spiralTightness * spread + this.rotationOffset;
      let spiralRadius = p.radiusOffset * (1 + spread * this.spiralGrowth);
      let spiralOffset = p5.Vector.fromAngle(spiralAngle).mult(spiralRadius);
      let pos = p5.Vector.add(this.center, spiralOffset);

      ellipse(pos.x, pos.y, p.size);
    }
  }

  displayRaysAndConnections(others) {
    if (this.hoverProgress < 0.05) return;

    let t = this.hoverProgress;
    let spiralLength = 300;
    let numDots = 300;
    let angleStep = 0.35;
    let baseAngle = millis() * 0.001;

    noStroke();
    fill("#E50004");

    for (let i = 0; i < numDots; i++) {
      let a = i * angleStep + baseAngle;
      let r = i * (spiralLength / numDots) * t;

      let x = this.center.x + cos(a) * r;
      let y = this.center.y + sin(a) * r;

      ellipse(x, y, 6);
    }
  }
}

class ParticleRing {
  constructor(center, radius, count) {
    this.center = center.copy();
    this.radius = radius;
    this.count = count;
    this.particles = [];
    this.visibleProgress = 0;
    this.rotation = 0;
    this.rotationSpeed = 0.002;

    for (let i = 0; i < count; i++) {
      let angle = map(i, 0, count, 0, TWO_PI);
      this.particles.push({
        baseAngle: angle,
        size: random(2, 4),
      });
    }
  }

  update() {
    this.rotation += this.rotationSpeed;
    if (this.visibleProgress < 1) {
      this.visibleProgress += 0.02;
    }
  }

  show() {
    noStroke();
    fill("#E50004");

    for (let p of this.particles) {
      let angle = p.baseAngle + this.rotation;
      let r = this.radius * this.visibleProgress;
      let x = this.center.x + cos(angle) * r;
      let y = this.center.y + sin(angle) * r;

      ellipse(x, y, p.size);
    }
  }
}

class CompassRose {
  constructor(center, radius, count) {
    this.center = center.copy();
    this.radius = radius;
    this.count = count;
    this.particles = [];
    this.rotation = 0;
    this.smoothRotation = 0;

    for (let i = 0; i < count; i++) {
      let angle = map(i, 0, count, 0, TWO_PI);
      let isMajor =
        abs(angle - 0) < 0.1 ||
        abs(angle - HALF_PI) < 0.1 ||
        abs(angle - PI) < 0.1 ||
        abs(angle - 3 * HALF_PI) < 0.1;
      this.particles.push({
        baseAngle: angle,
        size: isMajor ? 12 : 5,
        length: isMajor ? radius * 1.5 : radius,
      });
    }
  }

  update(rotationSpeed) {
    this.smoothRotation = lerp(this.smoothRotation, rotationSpeed, 0.05);
    this.rotation += this.smoothRotation;
  }

  show() {
    noStroke();
    fill("#333");

    for (let p of this.particles) {
      let angle = p.baseAngle + this.rotation;
      let x = this.center.x + cos(angle) * p.length;
      let y = this.center.y + sin(angle) * p.length;

      ellipse(x, y, p.size, p.size);
    }
  }
}

class SpiralBackground {
  constructor(center) {
    this.center = center.copy();
    this.ripples = [];
  }

  trigger() {
    this.ripples.push({
      time: 0,
      angleStep: random(0.1, 0.25),
      radiusStep: random(0.4, 1.2),
      rotationOffset: random(TWO_PI),
      alpha: 0,
      maxAlpha: 150,
      lifespan: 200,
      numDots: 1000,
      growthMultiplier: random(1.5, 2.5),
    });
  }

  update() {
    for (let ripple of this.ripples) {
      ripple.time += 0.01;
      ripple.alpha = min(ripple.alpha + 4, ripple.maxAlpha);
      ripple.lifespan--;
    }

    // Remove finished ripples
    this.ripples = this.ripples.filter((r) => r.lifespan > 0);
  }

  display() {
    noStroke();

    for (let ripple of this.ripples) {
      let col = color(0, ripple.alpha);
      fill(col);

      let growth = 1 + ripple.time * ripple.growthMultiplier;

      for (let i = 0; i < ripple.numDots; i++) {
        let angle = i * ripple.angleStep + ripple.time + ripple.rotationOffset;
        let radius = i * ripple.radiusStep * growth;

        let x = this.center.x + cos(angle) * radius;
        let y = this.center.y + sin(angle) * radius;

        ellipse(x, y, 3);
      }
    }
  }
}
