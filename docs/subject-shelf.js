const coverTones = ['linen', 'rose', 'sage', 'violet', 'sand'];
const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

function coverTone(id) {
  let index = 0;
  for (const character of id) index = (index * 31 + character.codePointAt(0)) % coverTones.length;
  return coverTones[index];
}

function standingBook(entry) {
  const id = escape(entry.id);
  const title = escape(entry.title);
  const lang = entry.lang ? ` lang="${escape(entry.lang)}"` : '';
  const preview = entry.cover
    ? `<span class="subject-book-preview"><img src="${escape(entry.cover)}" alt="" draggable="false" loading="lazy" decoding="async"></span>`
    : '';
  return `<li>
    <a class="subject-book subject-book--${coverTone(String(entry.id))}" href="${escape(entry.href)}"
      data-paper-id="${id}" aria-label="${title}，打开全文" title="${title}"${lang}>
      <span class="subject-book-cover">
        <span class="subject-book-kind">${escape(entry.type || '论文')}</span>
        <span class="subject-book-title">${title}</span>
        ${preview}
      </span>
    </a>
  </li>`;
}

export function renderSubjectShelf(entries, label) {
  if (!entries.length) return '';
  const size = entries.length === 1 ? 'single' : entries.length === 2 ? 'pair' : 'wide';
  return `<section class="subject-shelf subject-shelf--${size}" aria-labelledby="subject-shelf-title">
    <div class="subject-shelf-case">
      <header class="subject-shelf-heading">
        <h2 id="subject-shelf-title">${escape(label)}</h2>
      </header>
      <div class="subject-shelf-tiers">
        <ul class="subject-shelf-tier">${entries.map(standingBook).join('')}</ul>
      </div>
    </div>
  </section>`;
}
