let particles = [];
let earthCenter;
let numParticles = 3000;
let earthRadius = 100;
let state = "earth";
let blobs = [];
let outerRing = null;
let compassRing = null;
let prevMouse;
let mouseDir;
let backgroundSpiral;
let currentSharingSoundIndex = 0;

// Sound
let ambience; // sound file
let amplitude; // amplitude analyzer
let blobSoundIndex = 0;
let blobSounds = []; // We'll populate this in preload

// GUI knobs
let volumeKnob, distributionKnob;
let knobXStart = 60;
let knobTopMargin = 40;
let knobRadius = 35;
let knobToggleButtonX, knobToggleButtonY, knobToggleButtonRadius;
let knobsVisible = false; // start hidden

// Fonts
let BGFont;
let boldFont;
let regularFont;

// Pre Load

function preload() {
  BGFont = loadFont("font/BGfont.otf");
  boldFont = loadFont("font/HVD Fonts - NiveauGroteskBold.otf");
  regularFont = loadFont("font/HVD Fonts - NiveauGroteskRegular.otf");

  // Load sounds
  ambience = loadSound("sounds/bg.mp3");
  rich = loadSound("sounds/rich.mp3");
  poor = loadSound("sounds/poor.mp3");
  blobSounds = [
    loadSound("sounds/sharingtable_1.mp3"),
    loadSound("sounds/sharingtable_2.mp3"),
    loadSound("sounds/sharingtable_3.mp3"),
    loadSound("sounds/sharingtable_4.mp3"),
    loadSound("sounds/sharingtable_5.mp3"),
    loadSound("sounds/sharingtable_6.mp3"),
  ];
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  earthCenter = createVector(width / 2, height / 2);

  knobToggleButtonRadius = 30;
  knobToggleButtonX = knobXStart;
  knobToggleButtonY = knobTopMargin + knobRadius;

  volumeKnob = new RotaryKnob(
    knobToggleButtonX,
    knobToggleButtonY,
    knobRadius,
    0,
    100,
    32
  );
  distributionKnob = new RotaryKnob(
    knobToggleButtonX,
    knobToggleButtonY,
    knobRadius,
    0,
    2,
    1,
    3
  );

  // Force Equal mode on load
  distributionKnob.value = 1;

  currentMode = 1;

  volumeKnob.setPosition(knobToggleButtonX, knobToggleButtonY);
  distributionKnob.setPosition(knobToggleButtonX, knobToggleButtonY);
  updateKnobPositions();

  amplitude = new p5.Amplitude();
  amplitude.setInput(ambience);
  ambience.loop();

  // Stop all distribution music initially
  rich.stop();
  poor.stop();

  setupBackgroundText();
  generateEarthParticles();
  prevMouse = createVector(mouseX, mouseY);
  mouseDir = createVector(0, 0);
}

function draw() {
  background("#F7F7F7");

  drawKnobToggleButton();

  // Volume control
  if (ambience && ambience.isPlaying()) {
    let vol = map(volumeKnob.getValue(), 0, 100, 0.0, 1.0, true);
    ambience.setVolume(vol);
  }

  let mode = distributionKnob.getValue(); // 0 = RICH, 1 = EQUAL, 2 = POOR

  // ✅ Mode-based music switching
  if (mode !== currentMode) {
    currentMode = mode;

    // Stop both first
    rich.stop();
    poor.stop();

    if (mode === 0) {
      rich.loop();
    } else if (mode === 2) {
      poor.loop();
    }
    // Equal (1): No music needed
  }

  drawBackgroundText();

  let currentMouse = createVector(mouseX, mouseY);
  mouseDir = p5.Vector.sub(currentMouse, prevMouse);
  prevMouse = currentMouse;

  if (state === "earth") {
    drawEarth();
  } else if (state === "splitting") {
    if (outerRing) outerRing.update();
    if (compassRing) compassRing.update(0);
    animateSplitToBlobs();
    if (outerRing) outerRing.show();
    if (compassRing) compassRing.show();
  } else if (state === "blobs") {
    drawBlobs();
  }

  if (backgroundSpiral) {
    backgroundSpiral.update();
    backgroundSpiral.display();
  }

  if (knobsVisible) {
    volumeKnob.updateAnimation();
    distributionKnob.updateAnimation();
    volumeKnob.display(boldFont);
    distributionKnob.display(boldFont);
  }
}

function mousePressed() {
  if (!ambience.isPlaying()) ambience.loop();

  let dToggle = dist(mouseX, mouseY, knobToggleButtonX, knobToggleButtonY);
  if (dToggle < knobToggleButtonRadius) {
    knobsVisible = !knobsVisible;
    updateKnobPositions();
    return;
  }

  if (knobsVisible) {
    if (volumeKnob.handleMousePressed(mouseX, mouseY)) return;
    if (distributionKnob.handleMousePressed(mouseX, mouseY)) return;
  }

  let mode = distributionKnob.getValue();

  if (state === "earth") {
    startSplitToBlobs();
    state = "splitting";
  } else if (state === "blobs") {
    if (mode === 1) {
      // Equal mode: trigger blob on center click
      let d = dist(mouseX, mouseY, width / 2, height / 2);
      if (d < min(width, height) * 0.05) {
        let blob = random(blobs);
        blob.activateSpiral();

        if (blobSounds[blobSoundIndex]) {
          for (let s of blobSounds) s.stop();
          blobSounds[blobSoundIndex].play();
          blobSoundIndex = (blobSoundIndex + 1) % blobSounds.length;
        }
      }
    }

    // Rich and Poor handled elsewhere
  }
}

function mouseDragged() {
  if (knobsVisible) {
    volumeKnob.handleMouseDragged(mouseX, mouseY);
    distributionKnob.handleMouseDragged(mouseX, mouseY);
  }
}

function mouseReleased() {
  volumeKnob.handleMouseReleased();
  distributionKnob.handleMouseReleased();
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  earthCenter = createVector(width / 2, height / 2);

  if (state === "blobs" || state === "splitting") {
    startSplitToBlobs(); // Recalculate blob positions
  }
}
