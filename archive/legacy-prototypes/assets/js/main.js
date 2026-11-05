// Tree Tag Platform Main Interactions & Authentication State
(() => {
  // Global Auth Controller
  window.TreeTagAuth = {
    isLoggedIn() {
      const val = localStorage.getItem('tree_tag_logged_in');
      return val === null ? true : val === 'true'; // default to logged in as Jibin Wilson
    },
    getUser() {
      return {
        name: localStorage.getItem('tree_tag_user_name') || 'Jibin Wilson',
        role: 'STUDENT',
        email: 'jibin.cse22@mbits.ac.in',
        phone: '7907863486',
        college: 'MAR BASELIOS INSTITUTE OF TECHNOLOGY AND SCIENCE-MBI',
        cluster: 'EKM',
        institution: 'APJAKTU NSSCELL NRPF',
        treesPlanted: 1,
        treeTag: 'TT-8841',
        treeSpecies: 'Tectona grandis (Teak)'
      };
    },
    login(name = 'Jibin Wilson') {
      localStorage.setItem('tree_tag_logged_in', 'true');
      localStorage.setItem('tree_tag_user_name', name);
      this.syncUI();
      window.TreeTagAuth.showToast(`Welcome back, ${name}!`);
    },
    logout() {
      localStorage.setItem('tree_tag_logged_in', 'false');
      this.syncUI();
      window.TreeTagAuth.showToast('You have been logged out.');
      // If currently on profile page, update profile content
      const profileCard = document.getElementById('profileMainCard');
      const loggedOutNotice = document.getElementById('profileLoggedOutNotice');
      if (profileCard && loggedOutNotice) {
        profileCard.classList.add('hidden');
        loggedOutNotice.classList.remove('hidden');
      }
    },
    showToast(message) {
      let toast = document.getElementById('treeTagToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'treeTagToast';
        toast.className = 'fixed bottom-5 right-5 z-50 bg-[#002218] text-white px-4 py-3 rounded-xl shadow-2xl border border-secondary flex items-center gap-2.5 text-xs font-medium transform transition-all duration-300 opacity-0 translate-y-3 pointer-events-none';
        document.body.appendChild(toast);
      }
      toast.innerHTML = `<span class="material-symbols-outlined text-secondary-container text-[18px]">verified</span><span>${message}</span>`;
      toast.classList.remove('opacity-0', 'translate-y-3', 'pointer-events-none');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-3', 'pointer-events-none');
      }, 3200);
    },
    syncUI() {
      const loggedIn = this.isLoggedIn();
      const user = this.getUser();

      // 1. Top Bar Auth Strip (.top-bar-auth)
      document.querySelectorAll('.top-bar-auth').forEach(el => {
        if (loggedIn) {
          el.innerHTML = `
            <div class="flex items-center gap-2">
              <a class="text-white hover:text-primary-fixed transition-colors flex items-center gap-1 font-medium" href="profile.html" title="View Profile">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>${user.name}</span>
              </a>
              <span class="opacity-40 select-none">|</span>
              <button onclick="TreeTagAuth.logout()" class="text-white/80 hover:text-red-300 transition-colors flex items-center gap-0.5 cursor-pointer text-[11px]" title="Log Out">
                <span class="material-symbols-outlined text-[14px]">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          `;
        } else {
          el.innerHTML = `
            <a class="font-medium text-white hover:text-primary-fixed transition-colors flex items-center gap-1" href="login.html">
              <span class="material-symbols-outlined text-[16px]">account_circle</span>
              <span>Sign In</span>
            </a>
          `;
        }
      });

      // 2. Main Header Auth Container (.header-auth-controls)
      document.querySelectorAll('.header-auth-controls').forEach(el => {
        if (loggedIn) {
          el.innerHTML = `
            <div class="flex items-center gap-2">
              <a class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/60 hover:bg-secondary-container text-primary transition-all group" href="profile.html" title="Student Profile: ${user.name}">
                <div class="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                  ${user.name.charAt(0)}
                </div>
                <div class="hidden xl:flex flex-col text-left leading-none">
                  <span class="font-label-sm text-xs font-bold text-primary group-hover:text-secondary">${user.name}</span>
                  <span class="text-[10px] text-on-surface-variant font-mono">1 Tree Logged</span>
                </div>
              </a>
              <button onclick="TreeTagAuth.logout()" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors cursor-pointer" title="Log out of account">
                <span class="material-symbols-outlined text-[16px]">logout</span>
                <span class="hidden sm:inline">Logout</span>
              </button>
            </div>
          `;
        } else {
          el.innerHTML = `
            <div class="flex items-center gap-2">
              <a class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-secondary text-white font-label-md text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer" href="login.html">
                <span class="material-symbols-outlined text-[16px]">login</span>
                <span>Sign In</span>
              </a>
            </div>
          `;
        }
      });

      // 3. Mobile Menu Auth (.mobile-auth-controls)
      document.querySelectorAll('.mobile-auth-controls').forEach(el => {
        if (loggedIn) {
          el.innerHTML = `
            <div class="flex items-center justify-between pt-2 border-t border-outline-variant/40">
              <a class="flex items-center gap-2 text-primary font-semibold text-sm" href="profile.html">
                <span class="material-symbols-outlined text-[20px]">person</span>
                <span>Profile (${user.name})</span>
              </a>
              <button onclick="TreeTagAuth.logout()" class="text-xs text-red-600 font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          `;
        } else {
          el.innerHTML = `
            <div class="pt-2 border-t border-outline-variant/40">
              <a class="flex items-center justify-center gap-1.5 w-full py-2 bg-primary text-white rounded-lg font-semibold text-sm" href="login.html">
                <span class="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In</span>
              </a>
            </div>
          `;
        }
      });
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Auth UI
  if (window.TreeTagAuth) {
    window.TreeTagAuth.syncUI();
  }

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

  // 5. Activity Ideas Horizontal Canvas & Automatic 6s Scroll Controller
  const activityTrack = document.getElementById('activityScrollTrack');
  const activityCanvas = document.getElementById('activityIdeasCanvas');
  const dots = document.querySelectorAll('.activity-dot');

  if (activityTrack) {
    const cards = activityTrack.querySelectorAll('.activity-card');
    const totalCards = cards.length;
    let currentIndex = 0;
    let isPaused = false;

    function updateActiveState(idx) {
      if (idx < 0 || idx >= totalCards) return;
      currentIndex = idx;

      dots.forEach((dot, i) => {
        if (i === idx) {
          dot.className = 'activity-dot h-1.5 rounded-full transition-all cursor-pointer w-8 bg-secondary';
        } else {
          dot.className = 'activity-dot h-1.5 rounded-full transition-all cursor-pointer w-2 bg-outline/30 hover:bg-outline/60';
        }
      });
    }

    function scrollToIndex(idx) {
      if (cards[idx]) {
        cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        updateActiveState(idx);
      }
    }

    // Scroll Wheel event conversion: translates mouse wheel to horizontal scroll
    function handleWheelScroll(e) {
      if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        activityTrack.scrollBy({ left: delta * 1.1, behavior: 'smooth' });
      }
    }

    if (activityCanvas) {
      activityCanvas.addEventListener('wheel', handleWheelScroll, { passive: false });
      activityCanvas.addEventListener('mouseenter', () => { isPaused = true; });
      activityCanvas.addEventListener('mouseleave', () => { isPaused = false; });
    }

    // Automatic scroll every 6 seconds
    setInterval(() => {
      if (!isPaused) {
        const next = (currentIndex + 1) % totalCards;
        scrollToIndex(next);
      }
    }, 6000);

    // Track scroll listener to sync active dot on manual scroll
    let scrollTimeout;
    activityTrack.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const cardWidth = cards[0] ? cards[0].clientWidth + 16 : activityTrack.clientWidth;
        const newIdx = Math.round(activityTrack.scrollLeft / cardWidth);
        if (newIdx >= 0 && newIdx < totalCards && newIdx !== currentIndex) {
          updateActiveState(newIdx);
        }
      }, 50);
    });

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
        scrollToIndex(idx);
      });
    });

    // Initialize state
    updateActiveState(0);
  }
});
