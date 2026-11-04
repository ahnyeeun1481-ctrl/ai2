const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const progressBar = document.querySelector('.reading-progress-bar');
const copyEmailButton = document.querySelector('.copy-email-button');
const copyStatus = document.querySelector('.copy-status');
const backToTopButton = document.querySelector('.back-to-top-button');

fetch('site-content.json')
  .then((response) => {
    if (!response.ok) throw new Error('No exported portfolio content');
    return response.json();
  })
  .then(({ profile, works }) => {
    document.querySelectorAll('[data-content]').forEach((element) => {
      const key = element.dataset.content;
      if (profile[key]) element.textContent = profile[key];
    });
    document.querySelectorAll('[data-work-link]').forEach((link) => {
      const work = works.find((item) => item.id === link.dataset.workLink);
      if (!work) return;
      link.href = work.url;
      link.querySelector(`[data-work-title="${work.id}"]`).textContent = work.title;
      link.querySelector(`[data-work-platform="${work.id}"]`).textContent = `${work.platform} · ${work.kind.toUpperCase()}`;
    });
  })
  .catch(() => {
    // Keep the baked-in copy when no exported SQLite content is published.
  });

const copyTextFallback = (text) => {
  const temporaryInput = document.createElement('textarea');
  temporaryInput.value = text;
  temporaryInput.setAttribute('readonly', '');
  temporaryInput.style.position = 'fixed';
  temporaryInput.style.opacity = '0';
  document.body.appendChild(temporaryInput);
  temporaryInput.select();
  const copied = document.execCommand('copy');
  temporaryInput.remove();
  return copied;
};

copyEmailButton.addEventListener('click', async () => {
  const email = copyEmailButton.dataset.email;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(email);
    } else if (!copyTextFallback(email)) {
      throw new Error('Clipboard copy failed');
    }
    copyStatus.textContent = '이메일을 복사했어요.';
    copyEmailButton.textContent = '복사 완료';
  } catch {
    copyStatus.textContent = '복사할 수 없어요. 이메일을 직접 선택해 주세요.';
    copyEmailButton.textContent = '다시 시도';
  }
  window.setTimeout(() => {
    copyEmailButton.textContent = '이메일 복사';
    copyStatus.textContent = '';
  }, 3000);
});

let progressTicking = false;
const updateReadingProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  backToTopButton.classList.toggle('is-visible', window.scrollY > 420);
  backToTopButton.setAttribute('aria-hidden', String(window.scrollY <= 420));
  backToTopButton.tabIndex = window.scrollY > 420 ? 0 : -1;
  progressTicking = false;
};

window.addEventListener('scroll', () => {
  if (!progressTicking) {
    window.requestAnimationFrame(updateReadingProgress);
    progressTicking = true;
  }
}, { passive: true });
window.addEventListener('resize', updateReadingProgress);
updateReadingProgress();

backToTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});

menuButton.addEventListener('click', () => {
  const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isExpanded));
  menuButton.setAttribute('aria-label', isExpanded ? '메뉴 열기' : '메뉴 닫기');
  navigation.classList.toggle('is-open', !isExpanded);
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
    navigation.classList.remove('is-open');
  });
});

const revealTargets = document.querySelectorAll('.about-grid, .writing-grid, .power-card, .contact-panel');
revealTargets.forEach((target) => target.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('power-card')) {
          const cardIndex = Array.from(entry.target.parentElement.children).indexOf(entry.target);
          entry.target.style.transitionDelay = `${cardIndex * 100}ms`;
        }
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add('is-visible'));
}