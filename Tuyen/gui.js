class RotaryKnob {
constructor(x, y, radius, minValue, maxValue, initialValue, steps = 0, displayFullScaleValue = undefined) {
  this.x = x;
  this.y = y;
  this.targetX = x;
  this.targetY = y;
  this.originalX = x;
  this.originalY = y;
  this.radius = radius;
  this.minValue = minValue;
  this.maxValue = maxValue;
  this.value = initialValue;
  this.steps = steps;
  this.isDragging = false;
  this.displayFullScale = displayFullScaleValue !== undefined ? displayFullScaleValue : this.maxValue;
  this.startAngleVisual = -PI / 2;
  this.totalAngleRangeVisual = TWO_PI;
  this.currentAngle = this.valueToAngle(this.value);
}


setPosition(x, y) {
  this.targetX = x;
  this.targetY = y;
}
  updateAnimation() {
  this.x = lerp(this.x, this.targetX, 0.1);  // 0.1 = smoothness
  this.y = lerp(this.y, this.targetY, 0.1);
}


  restorePosition() {
    this.x = this.originalX;
    this.y = this.originalY;
  }

  valueToAngle(val) {
    let valConstrained = constrain(val, this.minValue, this.maxValue);
    let fraction = (valConstrained - this.minValue) / (this.displayFullScale - this.minValue);
    fraction = constrain(fraction, 0, 1);
    return this.startAngleVisual + fraction * this.totalAngleRangeVisual;
  }

  updateValueFromMouse(mx, my) {
    let mouseAngle = atan2(my - this.y, mx - this.x);
    let relativeAngle = mouseAngle - this.startAngleVisual;
    while (relativeAngle < 0) relativeAngle += TWO_PI;
    relativeAngle %= TWO_PI;
    let fraction = relativeAngle / this.totalAngleRangeVisual;

    let value = this.minValue + fraction * (this.maxValue - this.minValue);
    if (this.steps > 0) {
      let stepSize = (this.maxValue - this.minValue) / (this.steps - 1);
      value = this.minValue + round((value - this.minValue) / stepSize) * stepSize;
    }
    this.value = constrain(value, this.minValue, this.maxValue);
    this.currentAngle = this.valueToAngle(this.value);
  }

  display(labelFont) {
    push();
    translate(this.x, this.y);
    let baseRadius = this.radius * 0.85;
    let ringThickness = this.radius * 0.35;

    stroke(200);
    strokeWeight(ringThickness);
    noFill();
    arc(0, 0, baseRadius * 2, baseRadius * 2, 0, TWO_PI);

    stroke("#E50004");
    arc(0, 0, baseRadius * 2, baseRadius * 2, this.startAngleVisual, this.currentAngle);

    let handleX = cos(this.currentAngle) * baseRadius;
    let handleY = sin(this.currentAngle) * baseRadius;
    fill(60);
    noStroke();
    ellipse(handleX, handleY, ringThickness * 0.8);

    fill("#E50004");
    noStroke();
    textAlign(CENTER, CENTER);
    textFont(labelFont || 'Arial');
    textSize(this.radius * 0.4);

    let displayText;
    if (this.steps === 3) {
      let val = this.getValue();
      displayText = val === 0 ? "RICH" : val === 1 ? "EQUAL" : "POOR";
    } else {
      displayText = nf(this.getPercentage(), 2, 0) + "%";
    }

    text(displayText, 0, 0);
    pop();
  }

  handleMousePressed(mx, my) {
    let d = dist(mx, my, this.x, this.y);
    if (d < this.radius * 1.3) {
      this.isDragging = true;
      this.updateValueFromMouse(mx, my);
      return true;
    }
    return false;
  }

  handleMouseDragged(mx, my) {
    if (this.isDragging) this.updateValueFromMouse(mx, my);
  }

  handleMouseReleased() {
    this.isDragging = false;
  }

  getValue() {
    return this.value;
  }

  getPercentage() {
    return ((this.value - this.minValue) / (this.maxValue - this.minValue)) * 100;
  }
}


function drawKnobToggleButton() {
  push();
  translate(knobToggleButtonX, knobToggleButtonY);
  noStroke();

  let blurLevels = 15;
  let maxBlurOffset = knobToggleButtonRadius * 0.8;

  for (let i = blurLevels; i >= 0; i--) {
    let alpha = map(i, blurLevels, 0, 0, 50);
    let r = knobToggleButtonRadius + map(i, blurLevels, 0, maxBlurOffset, 0) * 0.5;
    fill(0, alpha);
    ellipse(0, 0, r * 2, r * 2);
  }

  fill(0);
  ellipse(0, 0, knobToggleButtonRadius, knobToggleButtonRadius);
  pop();
}

function updateKnobPositions() {
  const spacing = 90; // Horizontal spacing when knobs are visible
  const baseX = knobToggleButtonX;
  const baseY = knobToggleButtonY;

  if (knobsVisible) {
    // ✅ Slide knobs out to the right
    volumeKnob.setPosition(baseX + spacing, baseY);
    distributionKnob.setPosition(baseX + spacing * 2, baseY);
  } else {
    // ✅ Slide knobs back INTO the toggle button
    volumeKnob.setPosition(baseX, baseY);
    distributionKnob.setPosition(baseX, baseY);
  }
}
