const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      entry.target.classList.remove('fade-out');
    } else {
      entry.target.classList.remove('fade-in');
      entry.target.classList.add('fade-out');
    }
  });
}, {
  threshold: 0.1
});

document.querySelectorAll('.fade-element').forEach(el => {
  observer.observe(el);
});

  document.addEventListener('DOMContentLoaded', function () {
      const learnMoreBtn = document.querySelector('.learn-more');
      const closeBtn = document.getElementById('closeIntro');
      const introContainer = document.querySelector('.container');
      const gridOverlay = document.querySelector('.grid-overlay');

      learnMoreBtn.addEventListener('click', () => {
        introContainer.classList.add('container-visible');
        introContainer.classList.remove('container-hidden');
        gridOverlay.style.transition = 'opacity 1s ease-in-out';
        gridOverlay.style.opacity = '0';

        setTimeout(() => {
          gridOverlay.style.display = 'none';
        }, 1000);
      });

      closeBtn.addEventListener('click', () => {
        introContainer.classList.remove('container-visible');
        introContainer.classList.add('container-hidden');
        gridOverlay.style.display = 'block';
        gridOverlay.style.opacity = '1';
      });
    });