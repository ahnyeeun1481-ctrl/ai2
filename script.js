const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const progressBar = document.querySelector('.reading-progress-bar');
const copyEmailButton = document.querySelector('.copy-email-button');
const copyStatus = document.querySelector('.copy-status');
const backToTopButton = document.querySelector('.back-to-top-button');
const commentForm = document.querySelector('#comment-form');
const commentList = document.querySelector('#comment-list');
const commentCount = document.querySelector('#comment-count');
const commentStatus = document.querySelector('#comment-status');
const LOCAL_COMMENTS_KEY = 'portfolio-guestbook-comments';
const API_BASE = '';

fetch('site-content.json')
  .then((response) => {
    if (!response.ok) throw new Error('No exported portfolio content');
    return response.json();
  })
  .then(({ profile, works }) => {
    document.querySelectorAll('[data-content]').forEach((element) => {
      const key = element.dataset.content;
      const value = typeof profile[key] === 'string' ? profile[key].trim() : '';
      const isPlaceholder = !value || /^\[.*\]$/.test(value);
      if (key === 'name' && element.classList.contains('hero-name')) {
        element.textContent = isPlaceholder ? '' : value;
        element.hidden = isPlaceholder;
        const suffix = document.querySelector('.hero-name-suffix');
        if (suffix) suffix.hidden = isPlaceholder;
      } else if (['name', 'field', 'focus'].includes(key)) {
        const row = document.querySelector(`[data-profile-row="${key}"]`);
        if (row) {
          row.hidden = isPlaceholder;
          if (!isPlaceholder) row.querySelector('[data-content]').textContent = value;
        }
      } else if (!isPlaceholder) {
        element.textContent = value;
      }
    });
    const email = typeof profile.email === 'string' ? profile.email.trim() : '';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/example\.(com|org|net)$/i.test(email);
    if (validEmail) {
      const emailLink = document.querySelector('.contact-email-link');
      emailLink.href = `mailto:${email}`;
      emailLink.hidden = false;
      copyEmailButton.dataset.email = email;
      copyEmailButton.hidden = false;
      document.querySelector('.contact-email-not-set').hidden = true;
    }
    document.querySelectorAll('[data-work-link]').forEach((link) => {
      const work = works.find((item) => item.id === link.dataset.workLink);
      if (!work) return;
      link.href = work.url;
      link.querySelector(`[data-work-title="${work.id}"]`).textContent = work.title;
      link.querySelector(`[data-work-platform="${work.id}"]`).textContent = `${work.platform} · ${work.kind.toUpperCase()}`;
      const spokenPlatform = work.platform.toLowerCase() === 'goodnovel' ? 'GoodNovel' : work.platform;
      link.setAttribute('aria-label', `${spokenPlatform} ${work.title} (새 창으로 열림)`);
    });
  })
  .catch(() => {
    document.querySelectorAll('[data-profile-row]').forEach((row) => { row.hidden = true; });
    const heroName = document.querySelector('.hero-name');
    if (heroName) heroName.hidden = true;
    const suffix = document.querySelector('.hero-name-suffix');
    if (suffix) suffix.hidden = true;
  });

const readLocalComments = () => {
  try {
    const comments = JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY) || '[]');
    return Array.isArray(comments) ? comments : [];
  } catch {
    return [];
  }
};

const formatCommentDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date);
};

const renderComments = (comments) => {
  commentList.replaceChildren();
  commentCount.textContent = String(comments.length);
  if (!comments.length) {
    const empty = document.createElement('li');
    empty.className = 'comment-empty';
    empty.textContent = '아직 댓글이 없습니다. 첫 댓글을 남겨보세요.';
    commentList.append(empty);
    return;
  }
  comments.forEach((comment) => {
    const item = document.createElement('li');
    item.className = 'comment-item';
    const header = document.createElement('div');
    header.className = 'comment-item-header';
    const author = document.createElement('strong');
    author.textContent = comment.author;
    const date = document.createElement('time');
    date.textContent = formatCommentDate(comment.created_at);
    const body = document.createElement('p');
    body.textContent = comment.body;
    header.append(author, date);
    item.append(header, body);
    if (comment.shared) {
      const report = document.createElement('button');
      report.className = 'comment-report';
      report.type = 'button';
      report.textContent = '신고';
      report.setAttribute('aria-label', `${comment.author} 댓글 신고`);
      report.addEventListener('click', async () => {
        report.disabled = true;
        try {
          const response = await fetch(`${API_BASE}/api/comments/${comment.id}/report`, { method: 'POST' });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || '신고하지 못했습니다.');
          commentStatus.textContent = '신고가 접수됐습니다. 반복 신고 댓글은 자동으로 숨김 처리됩니다.';
          await loadSharedComments();
        } catch (error) {
          report.disabled = false;
          commentStatus.textContent = error.message || '신고하지 못했습니다.';
        }
      });
      item.append(report);
    }
    if (comment.local) {
      const remove = document.createElement('button');
      remove.className = 'comment-delete';
      remove.type = 'button';
      remove.textContent = '삭제';
      remove.setAttribute('aria-label', `${comment.author} 댓글 삭제`);
      remove.addEventListener('click', () => {
        const next = readLocalComments().filter((entry) => entry.id !== comment.id);
        localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(next));
        renderComments(next);
      });
      item.append(remove);
    }
    commentList.append(item);
  });
};

const loadSharedComments = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/comments`);
    if (!response.ok) throw new Error('Shared comments are unavailable');
    const comments = await response.json();
    renderComments(comments.map((comment) => ({ ...comment, shared: true })));
    document.querySelector('.guestbook-notice').textContent = '댓글은 모든 방문자와 공유됩니다. 예의를 지켜 작성해 주세요.';
    return { available: true, comments };
  } catch {
    renderComments(readLocalComments());
    document.querySelector('.guestbook-notice').textContent = '공유 댓글 서비스에 연결되지 않았습니다. 지금 남기는 댓글은 이 브라우저에만 저장되며 다른 방문자와 공유되지 않습니다.';
    return { available: false, comments: [] };
  }
};

let sharedCommentsAvailable = false;
let guestbookReady = false;
commentForm.querySelector('button[type="submit"]').disabled = true;
loadSharedComments().then((result) => {
  sharedCommentsAvailable = result.available;
  guestbookReady = true;
  commentForm.querySelector('button[type="submit"]').disabled = false;
});
commentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guestbookReady) {
    commentStatus.textContent = '댓글 저장 방식을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.';
    return;
  }
  const formData = new FormData(commentForm);
  const author = String(formData.get('author') || '').trim();
  const body = String(formData.get('body') || '').trim();
  if (!author || author.length > 40 || !body || body.length > 1000) {
    commentStatus.textContent = '닉네임은 1~40자, 댓글은 1~1,000자로 입력해 주세요.';
    return;
  }
  if (sharedCommentsAvailable) {
    try {
      const response = await fetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, body }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '댓글을 저장하지 못했습니다.');
      commentForm.reset();
      commentStatus.textContent = '댓글을 모두가 볼 수 있도록 게시했습니다.';
      const loaded = await loadSharedComments();
      if (!loaded.available) throw new Error('댓글 저장은 완료됐지만 목록을 불러오지 못했습니다. 새로고침해 주세요.');
      return;
    } catch (error) {
      commentStatus.textContent = error.message || '댓글을 게시하지 못했습니다.';
      return;
    }
  }
  const comments = readLocalComments();
  comments.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    author,
    body,
    created_at: new Date().toISOString(),
    local: true,
  });
  try {
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments.slice(0, 100)));
    renderComments(readLocalComments());
    commentForm.reset();
    commentStatus.textContent = '이 브라우저에 댓글을 저장했습니다. 다른 방문자에게는 보이지 않습니다.';
  } catch {
    commentStatus.textContent = '브라우저 저장 공간에 댓글을 저장하지 못했습니다.';
  }
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