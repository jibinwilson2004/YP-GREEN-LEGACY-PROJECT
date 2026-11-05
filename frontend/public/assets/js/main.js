// Tree Tag Platform Main Interactions
document.addEventListener('DOMContentLoaded', () => {
  // 1. Live Tagged Counter Animation
  const counters = document.querySelectorAll('.counter-val');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target') || '55918', 10);
    const duration = 1600;
    const start = target > 5000 ? target - 500 : 0;
    const startTime = performance.now();

    function updateCounter(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * ease);
      counter.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(updateCounter);
  });

  // 2. Schedule a Meeting Modal Logic
  const scheduleTriggers = document.querySelectorAll('[data-action="schedule-meeting"]');
  const meetingModal = document.getElementById('meetingModal');
  const closeModalBtn = document.getElementById('closeMeetingModal');
  const meetingForm = document.getElementById('meetingForm');
  const meetingSuccessMsg = document.getElementById('meetingSuccessMsg');

  function openModal() {
    if (meetingModal) {
      meetingModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (meetingModal) {
      meetingModal.classList.add('hidden');
      document.body.style.overflow = '';
      if (meetingSuccessMsg) meetingSuccessMsg.classList.add('hidden');
      if (meetingForm) meetingForm.reset();
      if (meetingForm) meetingForm.classList.remove('hidden');
    }
  }

  scheduleTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (meetingModal) {
    meetingModal.addEventListener('click', (e) => {
      if (e.target === meetingModal) {
        closeModal();
      }
    });
  }

  if (meetingForm) {
    meetingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      meetingForm.classList.add('hidden');
      if (meetingSuccessMsg) meetingSuccessMsg.classList.remove('hidden');
      setTimeout(() => {
        closeModal();
      }, 2500);
    });
  }

  // 3. Smooth scrolling for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#' && document.querySelector(targetId)) {
        e.preventDefault();
        const elem = document.querySelector(targetId);
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 4. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
});
