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

renderComments(readLocalComments());
commentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(commentForm);
  const author = String(formData.get('author') || '').trim();
  const body = String(formData.get('body') || '').trim();
  if (!author || author.length > 40 || !body || body.length > 1000) {
    commentStatus.textContent = '닉네임은 1~40자, 댓글은 1~1,000자로 입력해 주세요.';
    return;
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