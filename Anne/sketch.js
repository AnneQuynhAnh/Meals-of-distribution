// Full Sushi Conveyor Belt Circuit Visualization
let plateColor;
let beltColor;
let accentColor;

// Array to store plate positions
let plates = [];
let numPlates = 6;
let plateRadius = 30;
let beltWidth = 100;
let plateParticles = [];
let particlesPerPlate = 30;
let foodColor;
// Belt path parameters
let path = [];
let beltCornerRadius = 60;
let totalPathLength;
let leftX, rightX, topY, bottomY;

// Belt markers
let markers = [];
let markerSpacing = 60;
let centerPlate = {
  x: 960,
  y: 540,
  radius: 30,
  particles: []
};

// Add these variables to your existing variables
let rays = []; // Array to store ray lines
let numRays = 60; // Number of rays in the sunburst pattern
let rayMinLength = 10; // Minimum ray length
let rayMaxLength = 60; // Maximum ray length

// Ripples
let ripples = [];
let centerPulse = {
  active: false,
  radius: 0,
  maxRadius: 0,
  duration: 30, // frames
  currentFrame: 0,
};

// Font
let boldFont;
let regularFont;
let BGfont;

// Sound
let sound1;       // sound file
let sound2;  
let sound3;  
let amplitude;      // amplitude analyzer
let currentMode = 1;
let vol = 0; // Global volume variable
let micStarted = false;
let mic;

// GUI knobs
let volumeKnob, distributionKnob;
let knobXStart = 60;
let knobTopMargin = 40;
let knobRadius = 35;
let knobToggleButtonX, knobToggleButtonY, knobToggleButtonRadius;
let knobsVisible = false; // start hidden




function preload() {
  boldFont = loadFont('Font/HVD Fonts - NiveauGroteskBold.otf');
  regularFont = loadFont('Font/HVD Fonts - NiveauGroteskRegular.otf');
    BGfont = loadFont('Font/BGfont.otf');
    sound1 = loadSound('sound/equal.mp3');
    sound2 = loadSound('sound/rich.mp3');
   sound3 = loadSound('sound/poor.mp3');
}

function setup() {

  createCanvas(windowWidth, windowHeight,);
  frameRate(30);
    // Start sound and analyzer
currentMode = 1; // Set initial mode manually

  // Knobs
// Position toggle button
knobToggleButtonRadius = 30;
knobToggleButtonX = knobXStart;
knobToggleButtonY = knobTopMargin + knobRadius;

// Create knobs with proper spacing
volumeKnob = new RotaryKnob(knobXStart + 60, knobToggleButtonY, knobRadius, 0, 100, 32);
distributionKnob = new RotaryKnob(knobXStart + 160, knobToggleButtonY, knobRadius, 0, 2, 1, 3);
  updateKnobPositions(); // So they start hidden




  
    setupBackgroundText(); // Initialize background text system
  
  
 /* let saveButton = select("#myButton");
saveButton.mousePressed(() => {
  save("sushi_belt.svg");
});*/



  
  // Set visual styles
  plateColor = color("#F7F7F7");
  beltColor = color("rgb(229,0,4)");
  accentColor = color("#E50004");
  foodColor = color('#E50004');

  // Belt layout positions
  leftX = width * 0.2;
  rightX = width * 0.8;
  topY = height * 0.25;
  bottomY = height * 0.75;

  // Generate conveyor belt path and markers
  createBeltPath();
  totalPathLength = calculatePathLength();
  createBeltMarkers();

  // Initialize plates and their particles
for (let i = 0; i < numPlates; i++) {
  let t = i / numPlates;
  let pos = getPositionOnPath(t);
  plates.push({ position: t, x: pos.x, y: pos.y });
  plateParticles[i] = []; // All plates start empty
}

  // Initialize center plate
  centerPlate = {
    x: width / 2,
    y: height / 2,
    radius: plateRadius * 1.5,
    particles: []
  };
  setupCenterPlateParticles();

  // Create ripples (initially empty)
  ripples = [];

  // ✅ Optional: Sunburst rays setup
  createSunburstRays();  // Make sure `numRays`, `rayMinLength`, `rayMaxLength` are declared globally

  noStroke();
}





function draw() {
  background("#F7F7F7");

  // ✅ STEP 1: Get music volume FIRST
  if (amplitude && micStarted) {
    vol = amplitude.getLevel();
  } else {
    vol = 0;
  }

  // ✅ STEP 2: Now vol is correct, use it anywhere
  drawBackgroundText();
  drawKnobToggleButton();

  let knobVolume = volumeKnob.getValue() / 100;
  updateAllVolumes(knobVolume);

  let mode = distributionKnob.getValue();
  switchSound(mode);

  drawBelt();
  drawRotatingOrbits();
  drawPlates();
  drawRipples();
  drawCenterPlate();
  drawSunburstRays(); // ✅ Now vol is correct here
  movePlates();

  if (knobsVisible) {
    volumeKnob.updateAnimation();
    distributionKnob.updateAnimation();
    volumeKnob.display(boldFont);
    distributionKnob.display(boldFont);
  }
}


function mousePressed() {
  // 🟢 Start mic + audio on first interaction
  if (!micStarted) {
    if (sound1 && sound1.isLoaded()) {
      sound1.loop();
      amplitude = new p5.Amplitude();
      amplitude.setInput(sound1); // ✅ connect analyzer to music
      micStarted = true;
    }
  }
  
  // 🧠 First, check GUI knob interactions
  let dToggle = dist(mouseX, mouseY, knobToggleButtonX, knobToggleButtonY);
if (dToggle < knobToggleButtonRadius) {
  knobsVisible = !knobsVisible;
  updateKnobPositions();
  return;
}

  if (volumeKnob.handleMousePressed(mouseX, mouseY)) return;
  if (distributionKnob.handleMousePressed(mouseX, mouseY)) return;

  let mode = distributionKnob ? distributionKnob.getValue() : 1;

  // ❌ In RICH mode, no interactions allowed
  if (mode === 0) return;

  // 🌊 Ripple effect
  let dCenter = dist(mouseX, mouseY, centerPlate.x, centerPlate.y);
  if (dCenter <= centerPlate.radius && centerPlate.particles.length > 0) {
    ripples.push({
      radius: centerPlate.radius * 2,
      maxRadius: centerPlate.radius * 5,
      strokeWeight: 3,
      opacity: 255
    });

    if (mode === 1) { // ✅ EQUAL mode: Distribute particles to all plates
      let particlesToTransfer = 12; // total particles to share
      let perPlate = Math.floor(particlesToTransfer / plates.length);

      for (let i = 0; i < plates.length; i++) {
        for (let j = 0; j < perPlate; j++) {
          if (centerPlate.particles.length === 0) break;
          let p = centerPlate.particles.pop();
          let newParticle = {
            angle: random(TWO_PI),
            spreadFactor: random(),
            size: random(2, 4),
            offset: random(10000),
            color: foodColor
          };
          plateParticles[i].push(newParticle);
        }
      }

      console.log(`Shared ${perPlate} particles to each plate. Remaining in center: ${centerPlate.particles.length}`);
      return; // ✅ Done: don't continue to check side plates
    }
  }

  // 🍱 Clicking a specific plate (EQUAL and POOR mode)
  for (let i = 0; i < plates.length; i++) {
    let plate = plates[i];
    let d = dist(mouseX, mouseY, plate.x, plate.y);

    if (d <= plateRadius * 1.1 && centerPlate.particles.length > 0) {
      let particlesToTransfer = 5;

      for (let j = 0; j < particlesToTransfer; j++) {
        if (centerPlate.particles.length === 0) break;
        let p = centerPlate.particles.pop();
        let newParticle = {
          angle: random(TWO_PI),
          spreadFactor: random(),
          size: random(2, 4),
          offset: random(10000),
          color: foodColor
        };
        plateParticles[i].push(newParticle);
      }

      console.log(`Added to plate ${i}, remaining in center: ${centerPlate.particles.length}`);
      break;
    }
  }
}



function mouseDragged() {
  volumeKnob.handleMouseDragged(mouseX, mouseY);
  distributionKnob.handleMouseDragged(mouseX, mouseY);
}

function mouseReleased() {
  volumeKnob.handleMouseReleased();
  distributionKnob.handleMouseReleased();
}



