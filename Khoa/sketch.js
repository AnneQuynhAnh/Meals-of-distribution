// Global parameters for the main visual elements
let numMainCircles = 150;
let splatterCount = 200;
let overallScale = 0.25;
let ringNarrowness = 0.6;
let pointsPerMainCircle = 100;
let radiusNoiseScale = 0.05;
let circleRotationSpeed = 0.005;
let splatterMinOmega = -0.015;
let splatterMaxOmega = 0.015;

// Global parameters for the small orbiting circles
let numSmallCircles = 6;
let smallCircleDotCount = 800;
let smallCircleDotAngularSpeed = 0.02;
let smallCirclePathSpeed = 0.002;
let smallCircleDotBaseAlpha = 180;
let smallCircleDotSize = 1.8;

// Hover interaction parameters
let hoverExpandFactor = 1.8;
let hoverLowerFactor = 0.8;
let hoverTransitionSpeed = 0.08;

// Line effect parameters
let lineFadeSpeed = 800;
let lineStrokeWeight = 1.5;

// Center particle parameters
let numInitialCenterParticles = 200;
let centerParticleSpeed = 1.5;
let centerParticleBounce = 0.85;
let centerParticleSize = 4;
let centerParticleAlpha = 200;

// Captured particle parameters
let capturedParticleSpeedFactor = 1.2;
let capturedParticleBounce = 0.9;

// Color definitions
let backgroundColor;
let elementColor;
let mainRingColor;
let largeCircleColor;
let movingTextColor;

// Large circle layout parameters
let largeCircleSpacingFactor = 0.68;
let largeCircleStrokeWeight = 1.5;
let largeCircleAlpha = 0; // Initially invisible

// Gathering animation parameters
let isGathering = false;
let gatherTransitionSpeed = 0.06;
let gatherGroupSpacingFactor = 0.87;
let gatherInnerEdgeFactor = 1.17;

// Small circle radius parameters for gathering
let smallCircleOrbitingRadius;
let smallCircleGatheredRadiusFactor = 0.83;
let smallCircleGatheredRadius;
let smallCircleRadiusTransitionSpeed = 0.08;

// Moving text parameters
let numMovingTexts = 50;
let movingTexts = [];
let minFontSize = 10;
let maxFontSize = 20;
let minTextSpeedX = 1.5;
let maxTextSpeedX = 4.0;
let globalTextSpeedMultiplier = 1.0; // Initial value for speed knob
let textOptions = [
  "ZERO HUNGER",
  "NO MORE HUNGER",
  "EQUAL DISTRIBUTION",
  "NO ONE IS LEFT BEHIND",
  "BETTER WORLD",
  "VALUE EVERY PLATE",
  "WASTE LESS",
  "SHARE MORE",
];
let movingTextAlpha = 50; // Base alpha for text
let movingTextTrailLength = 8;
let movingTextTrailStartAlphaFraction = 0.6;
const ENLARGE_FACTOR = 2.8; // How much bigger the text gets
const ENLARGE_ANIMATION_DURATION = 60; // Frames for one enlarge cycle (grow + shrink)

// Core positional and dimensional variables
let centerX, centerY;
let maxRadius, minRadius;
let splatterMinRadius, splatterMaxRadius;
let splatters = [];
let mainCircleStyles = [];
let smallCircles = [];
let lines = [];
let centerParticles = [];
let radius1, radius2, radius3; // Radii for large orbiting paths
let gatheredPositions = []; // Target positions for small circles when gathered
let largeRadii = [];

// --- Custom Rotary Knob Controls ---
let speedKnob;
let distributionKnob;
let currentDistributionMode = 1; // Start with EQUAL mode
let prevDistributionMode = 0; // Will be synced with currentDistributionMode in setup

// --- Knob Visibility Toggle ---
let knobToggleButton;
let knobsVisible = false;
let knobToggleButtonX, knobToggleButtonY, knobToggleButtonRadius;
let knobOriginalPositions = { speed: {}, distribution: {} };

// Font variable
let myCustomFont;

// Sound variables
let spinningSound;
let radialSound;
let distributedSound1;
let distributedSound2;
let backgroundRhythm;
let followedBeat;
let richSound;
let poorSound;

// --- Beat Detection Variables ---
let fft; // For followedBeat
let fftRich; // For richSound
let fftPoor; // For poorSound  // <<< ADDED
let bassThreshold = 150;
let trebleThreshold = 140;
let beatCooldownFrames = 15;
let beatCooldown = 0;
let lastBassLevel = 0;
let lastTrebleLevel = 0;

// --- ADJUST SPINNING SOUND VOLUMES HERE ---
let spinningSoundLowVolume = 0;
let spinningSoundHighVolume = 0.05;
let currentSpinningSoundVolume = spinningSoundLowVolume;
let volumeTransitionSpeed = 0.05;

// --- ADJUST BACKGROUND RHYTHM VOLUME HERE ---
let backgroundRhythmMaxVolume = 1.2; // This will also be used as max for richSound via knob
let currentBackgroundRhythmVolume;

// For alternating distributed sounds
let playNextDistributedSound1 = true;

// Preload assets (font and sounds)
function preload() {
  myCustomFont = loadFont("font/font.otf");
  spinningSound = loadSound("sound/spinningSound.wav");
  radialSound = loadSound("sound/radialSound.wav");
  distributedSound1 = loadSound("sound/distributed1.wav");
  distributedSound2 = loadSound("sound/distributed2.wav");
  backgroundRhythm = loadSound("sound/rhythm.wav");
  followedBeat = loadSound("sound/followedBeat.wav");
  richSound = loadSound("sound/richSound.wav");
  poorSound = loadSound("sound/poorSound.wav");
}

// RotaryKnob class for interactive controls
class RotaryKnob {
  constructor(
    x,
    y,
    radius,
    minValue,
    maxValue,
    initialValue,
    steps = 0,
    displayFullScaleValue = undefined
  ) {
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;
    this.radius = radius;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.value = initialValue;
    this.steps = steps;
    this.isDragging = false;
    this.displayFullScale =
      displayFullScaleValue !== undefined
        ? displayFullScaleValue
        : this.maxValue;
    this.startAngleVisual = -PI / 2;
    this.totalAngleRangeVisual = TWO_PI;
    this.currentAngle = this.valueToAngle(this.value);
  }

  valueToAngle(val) {
    let valConstrained = constrain(val, this.minValue, this.maxValue);
    let fraction;

    if (this === distributionKnob && this.steps === 3) {
      if (valConstrained === 0) {
        // RICH
        fraction = 1;
      } else if (valConstrained === 1) {
        // EQUAL
        fraction = 0.5;
      } else {
        // POOR (valConstrained === 2)
        fraction = 0;
      }
    } else {
      if (this.displayFullScale > this.minValue) {
        fraction =
          (valConstrained - this.minValue) /
          (this.displayFullScale - this.minValue);
      } else if (
        valConstrained >= this.minValue &&
        this.displayFullScale === this.minValue
      ) {
        fraction = valConstrained === this.minValue ? 0 : 1;
      } else if (valConstrained >= this.minValue) {
        fraction = 1;
      } else {
        fraction = 0;
      }
    }
    fraction = constrain(fraction, 0, 1);
    return this.startAngleVisual + fraction * this.totalAngleRangeVisual;
  }

  updateValueFromMouse(mx, my) {
    let mouseDirectAngle = atan2(my - this.y, mx - this.x);
    let relativeAngle = mouseDirectAngle - this.startAngleVisual;
    while (relativeAngle < 0) {
      relativeAngle += TWO_PI;
    }
    relativeAngle %= TWO_PI;
    let angleFraction = constrain(
      relativeAngle / this.totalAngleRangeVisual,
      0,
      1
    );

    let potentialValue;
    if (this.steps > 0) {
      let numActualSteps = this.steps <= 1 ? 1 : this.steps - 1;
      let stepIndex = round(angleFraction * numActualSteps);

      if (this === distributionKnob && this.steps === 3) {
        if (stepIndex === 0) {
          potentialValue = this.maxValue; // POOR (value 2)
        } else if (stepIndex === 1) {
          potentialValue = this.minValue + (this.maxValue - this.minValue) / 2; // EQUAL (value 1)
        } else {
          potentialValue = this.minValue; // RICH (value 0)
        }
      } else {
        if (numActualSteps === 0) {
          potentialValue = this.minValue;
        } else {
          potentialValue =
            this.minValue +
            (stepIndex * (this.maxValue - this.minValue)) / numActualSteps;
        }
      }
    } else {
      potentialValue =
        this.minValue + angleFraction * (this.maxValue - this.minValue);
    }

    this.value = constrain(potentialValue, this.minValue, this.maxValue);
    if (this.steps > 0 && !(this === distributionKnob && this.steps === 3)) {
      let numActualSteps = this.steps <= 1 ? 1 : this.steps - 1;
      if (numActualSteps === 0) {
        this.value = this.minValue;
      } else {
        let stepSize = (this.maxValue - this.minValue) / numActualSteps;
        if (stepSize === 0 && this.minValue !== this.maxValue) {
          this.value = this.minValue;
        } else if (stepSize !== 0) {
          this.value =
            this.minValue +
            round((this.value - this.minValue) / stepSize) * stepSize;
        } else {
          this.value = this.minValue;
        }
      }
    }
    this.value = constrain(this.value, this.minValue, this.maxValue);
    this.currentAngle = this.valueToAngle(this.value);
  }

  display() {
    if (!knobsVisible) return;
    push();
    translate(this.x, this.y);
    let visualBaseRadius = this.radius * 0.85;
    let ringThickness = this.radius * 0.35;
    strokeCap(ROUND);

    stroke(200);
    strokeWeight(ringThickness);
    noFill();
    arc(0, 0, visualBaseRadius * 2, visualBaseRadius * 2, 0, TWO_PI);

    if (
      this.value > this.minValue ||
      (this === distributionKnob && this.value < this.maxValue) ||
      (!(this === distributionKnob) &&
        this.value === this.minValue &&
        this.maxValue === this.minValue &&
        this.displayFullScale === this.minValue)
    ) {
      let shouldDrawActiveArc = true;
      if (
        this.value === this.minValue &&
        this.currentAngle === this.startAngleVisual &&
        this.maxValue !== this.minValue &&
        !(this === distributionKnob && this.value === this.maxValue)
      ) {
        if (this === distributionKnob && this.value === this.maxValue) {
          shouldDrawActiveArc = false;
        }
      }

      if (shouldDrawActiveArc) {
        stroke(mainRingColor);
        strokeWeight(ringThickness);
        noFill();
        arc(
          0,
          0,
          visualBaseRadius * 2,
          visualBaseRadius * 2,
          this.startAngleVisual,
          this.currentAngle
        );
      }
    }

    let handlePositionRadius = visualBaseRadius;
    let handleDotRadius = ringThickness * 0.55;
    let handleX = cos(this.currentAngle) * handlePositionRadius;
    let handleY = sin(this.currentAngle) * handlePositionRadius;
    fill(60, 60, 70);
    noStroke();
    ellipse(handleX, handleY, handleDotRadius * 2, handleDotRadius * 2);

    let displayText = "";
    let textSizeToUse = this.radius * 0.5;

    if (this === distributionKnob) {
      let functionalValue = this.getValue();
      if (functionalValue === 0) {
        displayText = "RICH";
        textSizeToUse = this.radius * 0.4;
      } else if (functionalValue === 1) {
        displayText = "EQUAL";
        textSizeToUse = this.radius * 0.4;
      } else if (functionalValue === 2) {
        displayText = "POOR";
        textSizeToUse = this.radius * 0.4;
      }
    } else {
      let percentage = 0;
      if (this.displayFullScale > this.minValue) {
        percentage =
          ((this.value - this.minValue) /
            (this.displayFullScale - this.minValue)) *
          100;
      } else if (this.value >= this.minValue) {
        percentage =
          this.value === this.minValue &&
          this.displayFullScale === this.minValue
            ? 0
            : 100;
      }
      displayText = round(constrain(percentage, 0, 100)) + "%";
    }

    fill(mainRingColor);
    noStroke();
    textAlign(CENTER, CENTER);
    if (myCustomFont) {
      textFont(myCustomFont);
    } else {
      textFont("Arial");
    }
    textSize(textSizeToUse);
    text(displayText, 0, -0.1);
    pop();
  }

  getValue() {
    if (this.steps > 0) {
      if (this.maxValue === this.minValue) return this.minValue;
      let numActualSteps = this.steps <= 1 ? 1 : this.steps - 1;
      if (numActualSteps === 0) return this.minValue;

      if (this === distributionKnob && this.steps === 3) {
        return constrain(this.value, this.minValue, this.maxValue);
      }

      let stepSize = (this.maxValue - this.minValue) / numActualSteps;
      if (stepSize === 0 && this.minValue !== this.maxValue)
        return this.minValue;
      if (stepSize === 0 && this.minValue === this.maxValue)
        return this.minValue;

      let snappedValue =
        this.minValue +
        round((this.value - this.minValue) / stepSize) * stepSize;
      return constrain(snappedValue, this.minValue, this.maxValue);
    }
    return this.value;
  }

  handleMousePressed(mx, my) {
    if (!knobsVisible) return false;
    let d = dist(mx, my, this.x, this.y);
    if (d < this.radius * 1.3) {
      this.isDragging = true;
      this.updateValueFromMouse(mx, my);
      return true;
    }
    return false;
  }

  handleMouseDragged(mx, my) {
    if (!knobsVisible) return;
    if (this.isDragging) {
      this.updateValueFromMouse(mx, my);
    }
  }

  handleMouseReleased() {
    this.isDragging = false;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  restorePosition() {
    this.x = this.originalX;
    this.y = this.originalY;
  }
}

// Setup function: initializes canvas, variables, and objects
function setup() {
  createCanvas(windowWidth, windowHeight);
  centerX = width / 2;
  centerY = height / 2;

  angleMode(RADIANS);
  backgroundColor = color("#F7F7F7");
  elementColor = color("#000000");
  mainRingColor = color("#E50004");
  largeCircleColor = color("#E50004");
  movingTextColor = color(80, 80, 100, movingTextAlpha);

  // Initialize knobs
  let knobRadius = 35;
  let knobTopMargin = 40;
  let knobXStart = 60;
  let knobSpacing = 100;

  knobToggleButtonRadius = 25;
  knobToggleButtonX = knobXStart;
  knobToggleButtonY = knobTopMargin + knobRadius;

  let actualKnobXStart = knobToggleButtonX + knobToggleButtonRadius * 2 + 30;

  speedKnob = new RotaryKnob(
    actualKnobXStart,
    knobTopMargin + knobRadius,
    knobRadius,
    0.1,
    5.0,
    globalTextSpeedMultiplier,
    0
  );
  knobOriginalPositions.speed = { x: speedKnob.x, y: speedKnob.y };

  distributionKnob = new RotaryKnob(
    actualKnobXStart + knobSpacing,
    knobTopMargin + knobRadius,
    knobRadius,
    0, // RICH
    2, // POOR
    currentDistributionMode,
    3,
    2
  );
  knobOriginalPositions.distribution = {
    x: distributionKnob.x,
    y: distributionKnob.y,
  };

  // Sound setup
  if (spinningSound && spinningSound.isLoaded()) {
    currentSpinningSoundVolume = spinningSoundLowVolume;
    spinningSound.setVolume(currentSpinningSoundVolume);
    spinningSound.loop();
  }
  if (radialSound && radialSound.isLoaded()) {
    radialSound.setVolume(0.1);
  }
  if (distributedSound1 && distributedSound1.isLoaded()) {
    distributedSound1.setVolume(0.1);
  }
  if (distributedSound2 && distributedSound2.isLoaded()) {
    distributedSound2.setVolume(0.1);
  }

  if (backgroundRhythm && backgroundRhythm.isLoaded()) {
    let sKnobMin = speedKnob ? speedKnob.minValue : 0.1;
    let sKnobMax = speedKnob ? speedKnob.maxValue : 5.0;
    currentBackgroundRhythmVolume = map(
      globalTextSpeedMultiplier,
      sKnobMin,
      sKnobMax,
      0,
      backgroundRhythmMaxVolume
    );
    currentBackgroundRhythmVolume = constrain(
      currentBackgroundRhythmVolume,
      0,
      backgroundRhythmMaxVolume
    );
    backgroundRhythm.setVolume(currentBackgroundRhythmVolume);

    if (currentDistributionMode === 1) {
      // EQUAL mode
      if (!backgroundRhythm.isPlaying()) backgroundRhythm.loop();
    } else {
      if (backgroundRhythm.isPlaying()) backgroundRhythm.stop();
    }
  }

  if (richSound && richSound.isLoaded()) {
    richSound.setVolume(0.7); // Default volume
    if (currentDistributionMode === 0) {
      // RICH mode
      if (!richSound.isPlaying()) richSound.loop();
      let sKnobMin = speedKnob ? speedKnob.minValue : 0.1;
      let sKnobMax = speedKnob ? speedKnob.maxValue : 5.0;
      let initialRichVolume = map(
        globalTextSpeedMultiplier,
        sKnobMin,
        sKnobMax,
        0,
        backgroundRhythmMaxVolume // Reuse max volume from backgroundRhythm
      );
      initialRichVolume = constrain(
        initialRichVolume,
        0,
        backgroundRhythmMaxVolume
      );
      richSound.setVolume(initialRichVolume);
    } else {
      if (richSound.isPlaying()) richSound.stop();
    }
    fftRich = new p5.FFT(0.8, 256);
    fftRich.setInput(richSound);
  }

  if (poorSound && poorSound.isLoaded()) {
    // <<< ADDED poorSound setup
    poorSound.setVolume(0.7); // Default volume, will be adjusted by knob
    if (currentDistributionMode === 2) {
      // POOR mode
      if (!poorSound.isPlaying()) poorSound.loop();
      let sKnobMin = speedKnob ? speedKnob.minValue : 0.1;
      let sKnobMax = speedKnob ? speedKnob.maxValue : 5.0;
      let initialPoorVolume = map(
        globalTextSpeedMultiplier,
        sKnobMin,
        sKnobMax,
        0,
        backgroundRhythmMaxVolume // Reuse max volume from backgroundRhythm for consistency
      );
      initialPoorVolume = constrain(
        initialPoorVolume,
        0,
        backgroundRhythmMaxVolume
      );
      poorSound.setVolume(initialPoorVolume);
    } else {
      if (poorSound.isPlaying()) poorSound.stop();
    }
    fftPoor = new p5.FFT(0.8, 256); // <<< ADDED FFT for poorSound
    fftPoor.setInput(poorSound); // <<< ADDED
  }

  if (followedBeat && followedBeat.isLoaded()) {
    followedBeat.setVolume(0.7);
    fft = new p5.FFT(0.8, 256);
    fft.setInput(followedBeat);
    if (currentDistributionMode === 1) {
      // EQUAL mode
      if (!followedBeat.isPlaying()) followedBeat.loop();
    } else {
      if (followedBeat.isPlaying()) followedBeat.stop();
    }
  } else if (followedBeat) {
    console.warn(
      "followedBeat.wav was not loaded. Beat detection may not work."
    );
  } else {
    console.error("followedBeat sound object undefined. Load in preload.");
  }

  recalculateLayoutDependentVariables();

  mainCircleStyles = [];
  for (let i = 0; i < numMainCircles; i++) {
    mainCircleStyles.push({ weight: random(0.1, 1.0), alpha: 204 });
  }

  splatters = [];
  for (let i = 0; i < splatterCount; i++) {
    let rad = sqrt(random(sq(splatterMinRadius), sq(splatterMaxRadius)));
    let theta = random(TWO_PI);
    let omega = random(splatterMinOmega, splatterMaxOmega);
    while (abs(omega) < 0.001)
      omega = random(splatterMinOmega, splatterMaxOmega);
    let size = random(1, 3.5);
    splatters.push({ rad, theta, omega, size, alpha: random(80, 150) });
  }

  smallCircles = [];
  for (let i = 0; i < numSmallCircles; i++) {
    let targetOrbitRadiusVal;
    let initialAngle;
    let groupIndex = i % 3;
    targetOrbitRadiusVal = largeRadii[groupIndex];
    if (i < 3) initialAngle = PI + random(-0.5, 0.5);
    else initialAngle = 0 + random(-0.5, 0.5);
    let angularSpeed = smallCirclePathSpeed * (groupIndex % 2 === 0 ? 1 : -1);
    let newCirc = {
      x: centerX + targetOrbitRadiusVal * cos(initialAngle),
      y: centerY + targetOrbitRadiusVal * sin(initialAngle),
      r: smallCircleOrbitingRadius,
      targetR: smallCircleOrbitingRadius,
      targetOrbitRadius: targetOrbitRadiusVal,
      pathAngle: initialAngle,
      pathAngularSpeed: angularSpeed,
      isHovered: false,
      wasHovered: false,
      dots: [],
      capturedParticles: [],
    };
    for (let k = 0; k < smallCircleDotCount; k++) {
      newCirc.dots.push({
        angle: random(TWO_PI),
        targetRadius: smallCircleOrbitingRadius, // Initialize targetRadius
        currentRadius: smallCircleOrbitingRadius,
      });
    }
    smallCircles.push(newCirc);
  }

  // Initialize particles based on starting mode
  prevDistributionMode = currentDistributionMode; // Sync prevMode before first particle setup
  if (currentDistributionMode === 2) {
    // POOR
    centerParticles = [];
    smallCircles.forEach((sc) => (sc.capturedParticles = []));
  } else {
    // RICH or EQUAL
    initializeCenterParticles();
    smallCircles.forEach((sc) => (sc.capturedParticles = []));
  }

  movingTexts = [];
  for (let i = 0; i < numMovingTexts; i++) movingTexts.push(createMovingText());

  updateKnobPositions();
  if (myCustomFont) textFont(myCustomFont);
  else {
    console.error("Custom font not loaded. Using Arial fallback.");
    textFont("Arial");
  }
}

function recalculateLayoutDependentVariables() {
  centerX = width / 2;
  centerY = height / 2;
  maxRadius = min(width, height) * overallScale;
  minRadius = maxRadius * ringNarrowness;
  splatterMaxRadius = maxRadius * 1.05;
  splatterMinRadius = minRadius * 0.9;
  smallCircleOrbitingRadius = maxRadius / 3.15;
  smallCircleGatheredRadius =
    smallCircleOrbitingRadius * smallCircleGatheredRadiusFactor;
  let largeCircleSpacing = maxRadius * largeCircleSpacingFactor;
  radius1 = maxRadius + largeCircleSpacing;
  radius2 = maxRadius + 2 * largeCircleSpacing;
  radius3 = maxRadius + 3 * largeCircleSpacing;
  largeRadii = [radius1, radius2, radius3];
  if (smallCircles.length > 0) {
    smallCircles.forEach((sc, i) => (sc.targetOrbitRadius = largeRadii[i % 3]));
  }
  let gatherGroupOffsetX = smallCircleGatheredRadius * gatherGroupSpacingFactor;
  let innerCircleDistFromCenter = minRadius * gatherInnerEdgeFactor;
  let x2 = centerX - innerCircleDistFromCenter,
    x3 = centerX + innerCircleDistFromCenter;
  let x1 = x2 - gatherGroupOffsetX,
    x0 = x1 - gatherGroupOffsetX;
  let x4 = x3 + gatherGroupOffsetX,
    x5 = x4 + gatherGroupOffsetX;
  gatheredPositions = [
    { x: x0, y: centerY },
    { x: x1, y: centerY },
    { x: x2, y: centerY },
    { x: x3, y: centerY },
    { x: x4, y: centerY },
    { x: x5, y: centerY },
  ];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recalculateLayoutDependentVariables();
  movingTexts.forEach((mt) => (mt.y = random(height * 0.1, height * 0.9)));
  updateKnobPositions();
  if (myCustomFont) textFont(myCustomFont);
}

function initializeCenterParticles() {
  centerParticles = [];
  if (numInitialCenterParticles <= 0) return;
  for (let i = 0; i < numInitialCenterParticles; i++) {
    let angle = random(TWO_PI),
      startRad = random(0, minRadius * 0.9);
    let speedVal = random(centerParticleSpeed * 0.5, centerParticleSpeed * 1.5);
    centerParticles.push({
      x: centerX + cos(angle) * startRad,
      y: centerY + sin(angle) * startRad,
      vx: cos(angle) * speedVal,
      vy: sin(angle) * speedVal,
      size: centerParticleSize,
      alpha: centerParticleAlpha,
    });
  }
}

function distributeCenterParticlesToSmallCircles() {
  if (centerParticles.length === 0 || smallCircles.length === 0) return;
  let numToDistribute = centerParticles.length;
  for (let i = 0; i < numToDistribute; i++) {
    if (centerParticles.length === 0) break;
    let p = centerParticles.shift(),
      targetSC = smallCircles[i % numSmallCircles];
    let angle = random(TWO_PI),
      speedVal = random(
        capturedParticleSpeedFactor * 0.5,
        capturedParticleSpeedFactor
      );
    targetSC.capturedParticles.push({
      relX: 0,
      relY: 0,
      relVx: cos(angle) * speedVal,
      relVy: sin(angle) * speedVal,
      size: p.size,
      alpha: p.alpha,
    });
  }
  centerParticles = [];
}

function createMovingText() {
  let textContent = random(textOptions);
  let initialFontSize = random(minFontSize, maxFontSize);
  let direction = random() < 0.5 ? 1 : -1;
  if (myCustomFont) textFont(myCustomFont);
  textSize(initialFontSize);
  let estHalfWidth = textWidth(textContent) * 0.5;
  let initialX =
    direction === 1
      ? -estHalfWidth - random(50, 200)
      : width + estHalfWidth + random(50, 200);
  return {
    text: textContent,
    x: initialX,
    y: random(height * 0.1, height * 0.9),
    speedX: random(minTextSpeedX, maxTextSpeedX),
    originalFontSize: initialFontSize,
    fontSize: initialFontSize,
    direction: direction,
    history: [],
    isEnlarging: false,
    enlargeTimer: 0,
    maxEnlargedFontSize: initialFontSize * ENLARGE_FACTOR,
  };
}

function drawKnobToggleButton() {
  push();
  translate(knobToggleButtonX, knobToggleButtonY);
  noStroke();
  let blurLevels = 15,
    maxBlurOffset = knobToggleButtonRadius * 0.8;
  for (let i = blurLevels; i >= 0; i--) {
    let alpha = map(i, blurLevels, 0, 0, 50);
    let r =
      knobToggleButtonRadius + map(i, blurLevels, 0, maxBlurOffset, 0) * 0.5;
    fill(0, alpha);
    ellipse(0, 0, r * 2, r * 2);
  }
  fill(knobsVisible ? 50 : 0);
  ellipse(0, 0, knobToggleButtonRadius, knobToggleButtonRadius);
  pop();
}

function updateKnobPositions() {
  if (knobsVisible) {
    speedKnob.restorePosition();
    distributionKnob.restorePosition();
  } else {
    speedKnob.setPosition(speedKnob.originalX, -200);
    distributionKnob.setPosition(distributionKnob.originalX, -200);
  }
}

function triggerTextEnlargementOnBeat() {
  let available = movingTexts.filter((mt) => !mt.isEnlarging);
  let numToEnlarge =
    floor(available.length * 0.3) || (available.length > 0 ? 1 : 0);
  shuffle(available, true);
  for (let k = 0; k < numToEnlarge; k++) {
    if (k >= available.length) break;
    available[k].isEnlarging = true;
    available[k].enlargeTimer = 0;
  }
}

function draw() {
  background(backgroundColor);
  let dt = deltaTime / 16.667;
  if (dt > 3 || dt <= 0) dt = 1;

  let beatDetectedThisFrame = false;
  if (beatCooldown > 0) {
    beatCooldown -= dt;
    if (beatCooldown < 0) beatCooldown = 0;
  }

  if (currentDistributionMode === 0) {
    // RICH Mode - Beat Detection
    if (fftRich && richSound && richSound.isLoaded() && richSound.isPlaying()) {
      fftRich.analyze();
      let currentBass = fftRich.getEnergy("bass"),
        currentTreble = fftRich.getEnergy("treble");
      if (
        ((currentBass > bassThreshold && currentBass > lastBassLevel + 10) ||
          (currentTreble > trebleThreshold &&
            currentTreble > lastTrebleLevel + 10)) &&
        beatCooldown === 0
      ) {
        beatDetectedThisFrame = true;
      }
      lastBassLevel = currentBass;
      lastTrebleLevel = currentTreble;
    } else {
      lastBassLevel = 0;
      lastTrebleLevel = 0;
    }
  } else if (currentDistributionMode === 1) {
    // EQUAL Mode - Beat Detection
    if (
      fft &&
      followedBeat &&
      followedBeat.isLoaded() &&
      followedBeat.isPlaying()
    ) {
      fft.analyze();
      let currentBass = fft.getEnergy("bass"),
        currentTreble = fft.getEnergy("treble");
      if (
        ((currentBass > bassThreshold && currentBass > lastBassLevel + 10) ||
          (currentTreble > trebleThreshold &&
            currentTreble > lastTrebleLevel + 10)) &&
        beatCooldown === 0
      ) {
        beatDetectedThisFrame = true;
      }
      lastBassLevel = currentBass;
      lastTrebleLevel = currentTreble;
    } else {
      lastBassLevel = 0;
      lastTrebleLevel = 0;
    }
  } else if (currentDistributionMode === 2) {
    // <<< MODIFIED for POOR mode beat detection
    // POOR Mode - Beat Detection
    if (fftPoor && poorSound && poorSound.isLoaded() && poorSound.isPlaying()) {
      // <<< CHANGED to fftPoor and poorSound
      fftPoor.analyze();
      let currentBass = fftPoor.getEnergy("bass"); // Can use just bass, or bass & treble
      let currentTreble = fftPoor.getEnergy("treble");
      if (
        ((currentBass > bassThreshold && currentBass > lastBassLevel + 10) ||
          (currentTreble > trebleThreshold &&
            currentTreble > lastTrebleLevel + 10)) &&
        beatCooldown === 0
      ) {
        beatDetectedThisFrame = true;
      }
      lastBassLevel = currentBass;
      lastTrebleLevel = currentTreble;
    } else {
      lastBassLevel = 0;
      lastTrebleLevel = 0;
    }
  }

  if (beatDetectedThisFrame) {
    triggerTextEnlargementOnBeat();
    beatCooldown = beatCooldownFrames;
  }

  let dCenterMouse = dist(mouseX, mouseY, centerX, centerY);
  if (spinningSound && spinningSound.isLoaded()) {
    let targetVol =
      dCenterMouse >= minRadius &&
      dCenterMouse <= maxRadius &&
      currentDistributionMode !== 2 // No spinning sound emphasis in POOR mode if main rings absent
        ? spinningSoundHighVolume
        : spinningSoundLowVolume;
    currentSpinningSoundVolume = lerp(
      currentSpinningSoundVolume,
      targetVol,
      volumeTransitionSpeed * dt
    );
    spinningSound.setVolume(currentSpinningSoundVolume);
  }

  if (knobsVisible) {
    globalTextSpeedMultiplier = speedKnob.getValue();
    currentDistributionMode = round(
      constrain(distributionKnob.getValue(), 0, 2)
    );
  }

  let knobControlledTargetVolume = 0;
  if (speedKnob) {
    knobControlledTargetVolume = map(
      globalTextSpeedMultiplier,
      speedKnob.minValue,
      speedKnob.maxValue,
      0,
      backgroundRhythmMaxVolume
    );
    knobControlledTargetVolume = constrain(
      knobControlledTargetVolume,
      0,
      backgroundRhythmMaxVolume
    );
  }

  if (backgroundRhythm && backgroundRhythm.isLoaded()) {
    if (typeof currentBackgroundRhythmVolume === "undefined")
      currentBackgroundRhythmVolume = knobControlledTargetVolume;
    else
      currentBackgroundRhythmVolume = lerp(
        currentBackgroundRhythmVolume,
        knobControlledTargetVolume,
        volumeTransitionSpeed * dt
      );
  }

  if (richSound && richSound.isLoaded()) {
    if (currentDistributionMode === 0) {
      // RICH Mode
      richSound.setVolume(knobControlledTargetVolume);
    }
  }

  if (poorSound && poorSound.isLoaded()) {
    // <<< ADDED poorSound volume control
    if (currentDistributionMode === 2) {
      // POOR Mode
      poorSound.setVolume(knobControlledTargetVolume);
    }
  }

  if (myCustomFont) textFont(myCustomFont);

  // Handle mode switching effects (sounds and particle states)
  if (currentDistributionMode !== prevDistributionMode) {
    // Sound changes based on new mode
    if (richSound && richSound.isLoaded()) {
      if (currentDistributionMode === 0) {
        // Switching TO RICH
        if (!richSound.isPlaying()) richSound.loop();
        richSound.setVolume(knobControlledTargetVolume);
      } else {
        // Switching FROM RICH
        if (richSound.isPlaying()) richSound.stop();
      }
    }
    if (followedBeat && followedBeat.isLoaded()) {
      if (currentDistributionMode === 1) {
        // Switching TO EQUAL
        if (!followedBeat.isPlaying()) followedBeat.loop();
      } else {
        // Switching FROM EQUAL
        if (followedBeat.isPlaying()) followedBeat.stop();
      }
    }
    if (backgroundRhythm && backgroundRhythm.isLoaded()) {
      backgroundRhythm.setVolume(currentBackgroundRhythmVolume);
      if (currentDistributionMode === 1) {
        // Switching TO EQUAL
        if (!backgroundRhythm.isPlaying()) backgroundRhythm.loop();
      } else {
        // Switching FROM EQUAL (or to RICH/POOR)
        if (backgroundRhythm.isPlaying()) backgroundRhythm.stop();
      }
    }
    if (poorSound && poorSound.isLoaded()) {
      // <<< ADDED poorSound loop control
      if (currentDistributionMode === 2) {
        // Switching TO POOR
        if (!poorSound.isPlaying()) poorSound.loop();
        poorSound.setVolume(knobControlledTargetVolume); // Set volume on switch
      } else {
        // Switching FROM POOR
        if (poorSound.isPlaying()) poorSound.stop();
      }
    }

    // Particle state changes based on new mode
    if (currentDistributionMode === 2) {
      // Switched TO POOR
      centerParticles = [];
      smallCircles.forEach((sc) => (sc.capturedParticles = []));
    } else if (currentDistributionMode === 0 || currentDistributionMode === 1) {
      // Switched TO RICH or EQUAL
      smallCircles.forEach((sc) => (sc.capturedParticles = []));
      initializeCenterParticles();
    }
    prevDistributionMode = currentDistributionMode;
  }

  let elR = red(elementColor),
    elG = green(elementColor),
    elB = blue(elementColor);
  let mrR = red(mainRingColor),
    mrG = green(mainRingColor),
    mrB = blue(mainRingColor);
  let lcR = red(largeCircleColor),
    lcG = green(largeCircleColor),
    lcB = blue(largeCircleColor);
  let bTR = red(movingTextColor),
    bTG = green(movingTextColor),
    bTB = blue(movingTextColor);

  noStroke();
  textAlign(CENTER, CENTER);
  for (let i = 0; i < movingTexts.length; i++) {
    let mt = movingTexts[i];
    let currentFontSize = mt.originalFontSize;
    if (mt.isEnlarging) {
      mt.enlargeTimer += dt;
      let halfDur = ENLARGE_ANIMATION_DURATION / 2;
      if (mt.enlargeTimer < halfDur)
        currentFontSize = lerp(
          mt.originalFontSize,
          mt.maxEnlargedFontSize,
          easeInOutCubic(mt.enlargeTimer / halfDur)
        );
      else if (mt.enlargeTimer < ENLARGE_ANIMATION_DURATION)
        currentFontSize = lerp(
          mt.maxEnlargedFontSize,
          mt.originalFontSize,
          easeInOutCubic((mt.enlargeTimer - halfDur) / halfDur)
        );
      else {
        mt.isEnlarging = false;
        mt.enlargeTimer = 0;
        currentFontSize = mt.originalFontSize;
      }
    }
    mt.fontSize = currentFontSize;
    if (myCustomFont) textFont(myCustomFont);
    textSize(mt.originalFontSize);
    for (let j = mt.history.length - 1; j >= 0; j--) {
      fill(
        bTR,
        bTG,
        bTB,
        map(
          j,
          mt.history.length - 1,
          0,
          10,
          movingTextAlpha * movingTextTrailStartAlphaFraction
        )
      );
      text(mt.text, mt.history[j].x, mt.history[j].y);
    }
    textSize(mt.fontSize);
    fill(bTR, bTG, bTB, movingTextAlpha);
    text(mt.text, mt.x, mt.y);
    mt.history.unshift({ x: mt.x, y: mt.y });
    if (mt.history.length > movingTextTrailLength) mt.history.pop();
    let estHalfW = textWidth(mt.text) * 0.5;
    mt.x += mt.speedX * mt.direction * globalTextSpeedMultiplier * dt;
    if (
      (mt.direction === 1 && mt.x - estHalfW > width) ||
      (mt.direction === -1 && mt.x + estHalfW < 0)
    ) {
      movingTexts[i] = createMovingText();
    }
  }

  if (largeCircleAlpha > 0 && currentDistributionMode !== 2) {
    noFill();
    strokeWeight(largeCircleStrokeWeight);
    stroke(lcR, lcG, lcB, largeCircleAlpha);
    ellipse(centerX, centerY, radius1 * 2);
    ellipse(centerX, centerY, radius2 * 2);
    ellipse(centerX, centerY, radius3 * 2);
  }

  // MAIN CIRCLES DRAWING
  if (currentDistributionMode !== 2) {
    // Not in POOR mode
    noFill();
    let rotFactor = frameCount * circleRotationSpeed;
    for (let i = 0; i < numMainCircles; i++) {
      let baseR = map(pow(i / numMainCircles, 0.5), 0, 1, maxRadius, minRadius);
      let style = mainCircleStyles[i];
      strokeWeight(style.weight);
      stroke(mrR, mrG, mrB, style.alpha);
      push();
      translate(centerX, centerY);
      rotate(rotFactor * (i % 2 === 0 ? 1 : -1));
      beginShape();
      for (let a = 0; a < TWO_PI; a += TWO_PI / pointsPerMainCircle) {
        let rVar = map(
          noise(baseR * radiusNoiseScale + a * 0.5 + i * 5),
          0,
          1,
          -baseR * 0.04,
          baseR * 0.04
        );
        vertex((baseR + rVar) * cos(a), (baseR + rVar) * sin(a));
      }
      endShape(CLOSE);
      pop();
    }
  }

  // SMALL CIRCLES LOGIC (Update and Draw based on mode)
  if (currentDistributionMode === 2) {
    // POOR MODE
    smallCircles.forEach((sc, index) => {
      // Orbital Movement
      sc.r = smallCircleOrbitingRadius; // Use consistent orbiting radius
      sc.pathAngle =
        (sc.pathAngle + sc.pathAngularSpeed * dt + TWO_PI) % TWO_PI;
      sc.x = centerX + sc.targetOrbitRadius * cos(sc.pathAngle);
      sc.y = centerY + sc.targetOrbitRadius * sin(sc.pathAngle);

      // Boundary check for small circles
      if (
        sc.x - sc.r < 0 ||
        sc.x + sc.r > width ||
        sc.y - sc.r < 0 ||
        sc.y + sc.r > height
      ) {
        sc.pathAngularSpeed *= -1; // Reverse direction
        sc.x = constrain(sc.x, sc.r, width - sc.r);
        sc.y = constrain(sc.y, sc.r, height - sc.r);
        sc.pathAngle =
          (atan2(sc.y - centerY, sc.x - centerX) + TWO_PI) % TWO_PI;
      }

      sc.isHovered = false; // Not hoverable
      sc.wasHovered = false;
      sc.capturedParticles = []; // No captured particles

      sc.dots.forEach((dot) => {
        dot.currentRadius = sc.r; // Dots conform to circle radius, no hover expansion
        dot.targetRadius = sc.r; // Ensure target matches current
        dot.angle = (dot.angle + smallCircleDotAngularSpeed * dt) % TWO_PI; // Dots can still spin
      });
    });

    // Drawing dots for POOR mode
    noStroke();
    fill(mrR, mrG, mrB, smallCircleDotBaseAlpha); // Use mainRingColor for dots
    smallCircles.forEach((sc) => {
      sc.dots.forEach((d) => {
        ellipse(
          sc.x + d.currentRadius * cos(d.angle),
          sc.y + d.currentRadius * sin(d.angle),
          smallCircleDotSize
        );
      });
    });
  } else if (currentDistributionMode === 1) {
    // EQUAL MODE
    smallCircles.forEach((sc, index) => {
      let targetVisR = isGathering
        ? smallCircleGatheredRadius
        : smallCircleOrbitingRadius;
      sc.r = lerp(sc.r, targetVisR, smallCircleRadiusTransitionSpeed * dt);
      if (isGathering) {
        let targetPos = gatheredPositions[index % gatheredPositions.length];
        sc.x = lerp(sc.x, targetPos.x, gatherTransitionSpeed * dt);
        sc.y = lerp(sc.y, targetPos.y, gatherTransitionSpeed * dt);
      } else {
        sc.pathAngle =
          (sc.pathAngle + sc.pathAngularSpeed * dt + TWO_PI) % TWO_PI;
        sc.x = centerX + sc.targetOrbitRadius * cos(sc.pathAngle);
        sc.y = centerY + sc.targetOrbitRadius * sin(sc.pathAngle);
        if (
          sc.x - sc.r < 0 ||
          sc.x + sc.r > width ||
          sc.y - sc.r < 0 ||
          sc.y + sc.r > height
        ) {
          sc.pathAngularSpeed *= -1;
          sc.x = constrain(sc.x, sc.r, width - sc.r);
          sc.y = constrain(sc.y, sc.r, height - sc.r);
          sc.pathAngle =
            (atan2(sc.y - centerY, sc.x - centerX) + TWO_PI) % TWO_PI;
        }
      }
      sc.isHovered = dist(mouseX, mouseY, sc.x, sc.y) <= sc.r;
      if (
        sc.isHovered &&
        !sc.wasHovered &&
        radialSound &&
        radialSound.isLoaded()
      ) {
        radialSound.play();
      }
      sc.dots.forEach((dot) => {
        let baseDotTR = sc.r;
        if (sc.isHovered && !sc.wasHovered) {
          dot.targetRadius = random(
            sc.r * hoverLowerFactor,
            sc.r * hoverExpandFactor
          );
        } else if (!sc.isHovered && abs(dot.currentRadius - baseDotTR) > 0.1) {
          dot.targetRadius = baseDotTR;
        }
        dot.currentRadius = lerp(
          dot.currentRadius,
          dot.targetRadius,
          hoverTransitionSpeed * dt
        );
        dot.angle = (dot.angle + smallCircleDotAngularSpeed * dt) % TWO_PI;
      });
      sc.wasHovered = sc.isHovered;
    });

    // Drawing dots for EQUAL mode
    noStroke();
    fill(elR, elG, elB, smallCircleDotBaseAlpha); // Use elementColor
    smallCircles.forEach((sc) =>
      sc.dots.forEach((d) =>
        ellipse(
          sc.x + d.currentRadius * cos(d.angle),
          sc.y + d.currentRadius * sin(d.angle),
          smallCircleDotSize
        )
      )
    );

    // Drawing captured particles for EQUAL mode
    noStroke();
    smallCircles.forEach((sc) =>
      sc.capturedParticles.forEach((p) => {
        p.relX += p.relVx * dt;
        p.relY += p.relVy * dt;
        let d = dist(p.relX, p.relY, 0, 0);
        let bR = sc.r - p.size / 2;
        if (d >= bR && bR > 0) {
          let nX = p.relX / d || 1,
            nY = p.relY / d || 0;
          let dotP = p.relVx * nX + p.relVy * nY;
          p.relVx = (p.relVx - 2 * dotP * nX) * capturedParticleBounce;
          p.relVy = (p.relVy - 2 * dotP * nY) * capturedParticleBounce;
          if (d !== 0) {
            p.relX -= nX * (d - bR + 1);
            p.relY -= nY * (d - bR + 1);
          }
        }
        fill(elR, elG, elB, p.alpha);
        ellipse(sc.x + p.relX, sc.y + p.relY, p.size);
      })
    );
  }
  // If currentDistributionMode === 0 (RICH), small circles are not updated or drawn.

  // Splatters (visible in all modes unless explicitly changed)
  if (currentDistributionMode !== 2) {
    // Hide splatters in POOR mode for cleaner look
    noStroke();
    splatters.forEach((p) => {
      p.theta = (p.theta + p.omega * dt) % TWO_PI;
      fill(elR, elG, elB, p.alpha);
      ellipse(
        centerX + p.rad * cos(p.theta),
        centerY + p.rad * sin(p.theta),
        p.size
      );
    });
  }

  // Lines (visible in all modes, but only generated in EQUAL mode interaction)
  if (currentDistributionMode !== 2) {
    // Hide lines in POOR mode
    strokeWeight(lineStrokeWeight);
    for (let i = lines.length - 1; i >= 0; i--) {
      let l = lines[i];
      l.alpha -= lineFadeSpeed * (deltaTime / 1000.0);
      if (l.alpha <= 0) lines.splice(i, 1);
      else {
        stroke(elR, elG, elB, l.alpha);
        line(l.x1, l.y1, l.x2, l.y2);
      }
    }
  }

  // Center Particles (loose, bouncing particles)
  if (currentDistributionMode === 0 || currentDistributionMode === 1) {
    // RICH or EQUAL
    noStroke();
    for (let i = centerParticles.length - 1; i >= 0; i--) {
      let p = centerParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      let d = dist(p.x, p.y, centerX, centerY);
      let bR = minRadius - p.size / 2;
      if (d >= bR && bR > 0 && minRadius > 0) {
        // check minRadius > 0
        let nX = (p.x - centerX) / d || 1,
          nY = (p.y - centerY) / d || 0;
        let dotP = p.vx * nX + p.vy * nY;
        p.vx = (p.vx - 2 * dotP * nX) * centerParticleBounce;
        p.vy = (p.vy - 2 * dotP * nY) * centerParticleBounce;
        if (d !== 0) {
          p.x -= nX * (d - bR + 1);
          p.y -= nY * (d - bR + 1);
        }
      }
      fill(elR, elG, elB, p.alpha);
      ellipse(p.x, p.y, p.size);
    }
  }

  drawKnobToggleButton();
  if (knobsVisible) {
    speedKnob.display();
    distributionKnob.display();
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function mousePressed() {
  if (
    dist(mouseX, mouseY, knobToggleButtonX, knobToggleButtonY) <
    knobToggleButtonRadius
  ) {
    knobsVisible = !knobsVisible;
    updateKnobPositions();
    return;
  }
  if (knobsVisible) {
    if (speedKnob.handleMousePressed(mouseX, mouseY)) return;
    if (distributionKnob.handleMousePressed(mouseX, mouseY)) return;
  }

  let dCM = dist(mouseX, mouseY, centerX, centerY);

  // Particle distribution click (Only in EQUAL mode)
  if (dCM < minRadius && currentDistributionMode === 1) {
    if (centerParticles.length > 0 && smallCircles.length > 0) {
      let numAttempt = Math.min(numSmallCircles, centerParticles.length),
        distCount = 0;
      for (let i = 0; i < numAttempt; i++) {
        if (centerParticles.length === 0) break;
        if (smallCircles.length === 0) break;
        let sc = smallCircles[i % smallCircles.length];

        lines.push({
          x1: centerX,
          y1: centerY,
          x2: sc.x,
          y2: sc.y,
          alpha: 200,
        });
        let pS = centerParticles.splice(
          floor(random(centerParticles.length)),
          1
        )[0];
        let ang = random(TWO_PI),
          sVal = random(
            capturedParticleSpeedFactor * 0.5,
            capturedParticleSpeedFactor
          );
        sc.capturedParticles.push({
          relX: 0,
          relY: 0,
          relVx: cos(ang) * sVal,
          relVy: sin(ang) * sVal,
          size: pS.size,
          alpha: pS.alpha,
        });
        distCount++;
      }
      if (distCount > 0) {
        if (playNextDistributedSound1) {
          if (distributedSound1 && distributedSound1.isLoaded())
            distributedSound1.play();
        } else {
          if (distributedSound2 && distributedSound2.isLoaded())
            distributedSound2.play();
        }
        playNextDistributedSound1 = !playNextDistributedSound1;
      }
    }
    return;
  }

  // Gathering toggle click (Not in POOR mode as main rings are hidden)
  if (dCM >= minRadius && dCM <= maxRadius && currentDistributionMode !== 2) {
    isGathering = !isGathering;
    return;
  }
}

function mouseDragged() {
  if (knobsVisible) {
    let speedDragged =
      speedKnob.handleMouseDragged(mouseX, mouseY) && speedKnob.isDragging;
    let distDragged =
      distributionKnob.handleMouseDragged(mouseX, mouseY) &&
      distributionKnob.isDragging;
    if (speedDragged || distDragged) return false;
  }
}
function mouseReleased() {
  if (knobsVisible) {
    speedKnob.handleMouseReleased();
    distributionKnob.handleMouseReleased();
  }
}
