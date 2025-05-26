// backgroundText.js
let numMovingTexts = 50;
let movingTexts = [];
let minFontSize = 10;
let maxFontSize = 20;
let minTextSpeedX = 1.5;
let maxTextSpeedX = 4.0;
let globalTextSpeedMultiplier = 1.0;
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
let movingTextAlpha = 50;
let movingTextTrailLength = 8;
let movingTextTrailStartAlphaFraction = 0.6;
let movingTextColor;

function setupBackgroundText() {
  textFont(BGFont);

  movingTextColor = color(80, 80, 100, movingTextAlpha);
  for (let i = 0; i < numMovingTexts; i++) {
    movingTexts.push(createMovingText());
  }
}

function drawBackgroundText() {
  let dt = deltaTime / 16.667;
  let level = amplitude.getLevel(); // Get current volume
  globalTextSpeedMultiplier = map(level, 0, 0.2, 0.2, 5); // more sensitive
  // Map sound to speed
  let r = red(movingTextColor);
  let g = green(movingTextColor);
  let b = blue(movingTextColor);

  noStroke();
  textAlign(CENTER, CENTER);

  for (let i = 0; i < movingTexts.length; i++) {
    let mt = movingTexts[i];

    // Trail
    for (let j = mt.history.length - 1; j >= 0; j--) {
      let past = mt.history[j];
      let alpha = map(
        j,
        mt.history.length - 1,
        0,
        10,
        movingTextAlpha * movingTextTrailStartAlphaFraction
      );
      fill(r, g, b, alpha);
      textSize(mt.fontSize);
      text(mt.text, past.x, past.y);
    }

    // Current text
    fill(movingTextColor);
    textSize(mt.fontSize);
    text(mt.text, mt.x, mt.y);

    // History
    mt.history.unshift({ x: mt.x, y: mt.y });
    if (mt.history.length > movingTextTrailLength) {
      mt.history.pop();
    }

    // Movement
    mt.x += mt.speedX * mt.direction * globalTextSpeedMultiplier * dt;

    // Reset
    let halfWidth = mt.text.length * mt.fontSize * 0.25;
    let shouldReset = false;
    if (mt.direction === 1 && mt.x - halfWidth > width) shouldReset = true;
    if (mt.direction === -1 && mt.x + halfWidth < 0) shouldReset = true;
    if (shouldReset) movingTexts[i] = createMovingText();
  }
}

function createMovingText() {
  let textContent = random(textOptions);
  let fontSize = random(minFontSize, maxFontSize);
  let direction = random() < 0.5 ? 1 : -1;
  let halfWidth = textContent.length * fontSize * 0.25;

  let initialX =
    direction === 1
      ? -halfWidth - random(50, 200)
      : width + halfWidth + random(50, 200);

  return {
    text: textContent,
    x: initialX,
    y: random(height * 0.1, height * 0.9),
    speedX: random(minTextSpeedX, maxTextSpeedX),
    fontSize: fontSize,
    direction: direction,
    history: [],
  };
}
