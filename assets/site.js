// Seven Lanterns — small front-end behaviours. Source: site/src/site.js. Settings arrive in window.SL (from config.js).
(() => {
  const SL = window.SL || {};
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // mobile menu
  const btn = document.querySelector('.menu-btn'), nav = document.querySelector('.nav');
  if (btn && nav) btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  // 45-second samples: one plays at a time
  let current = null;
  $$('.sample').forEach(b => {
    const audio = new Audio(); audio.preload = 'none';
    const bar = b.querySelector('.bar i');
    const stop = () => { audio.pause(); b.classList.remove('playing'); b.setAttribute('aria-pressed', 'false'); };
    b.addEventListener('click', () => {
      if (b.classList.contains('playing')) return stop();
      if (current && current !== stop) current();
      if (!audio.src) audio.src = b.dataset.src;
      audio.play().catch(() => {});
      b.classList.add('playing'); b.setAttribute('aria-pressed', 'true');
      current = stop;
    });
    audio.addEventListener('timeupdate', () => { if (audio.duration) bar.style.width = (audio.currentTime / audio.duration * 100) + '%'; });
    audio.addEventListener('ended', () => { stop(); audio.currentTime = 0; bar.style.width = '0'; });
  });

  // YouTube: nothing loads from YouTube until the visitor clicks (no cookies before consent)
  const fmt = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  $$('.video[data-yt]').forEach(v => {
    const rel = v.dataset.release && new Date(v.dataset.release);
    if (rel && rel > new Date()) {
      v.innerHTML = `<div class="soon">PREMIERES<b>${fmt(rel)}</b></div>`;
      const watch = v.closest('.mix')?.querySelector('.watch');
      if (watch) watch.textContent = 'Set a reminder';
      return;
    }
    v.querySelector('button')?.addEventListener('click', () => {
      if (current) current();
      v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1&rel=0" title="${v.dataset.title || 'Video'}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    });
  });

  // e-book picker preselect (?l=seville) and thank-you page download
  const q = new URLSearchParams(location.search).get('l');
  if (q) { const r = document.querySelector(`input[name=lantern][value="${q}"]`); if (r) r.checked = true; }
  $$('[data-thanks]').forEach(el => { const a = el.querySelector(`[data-l="${q}"]`); if (a) el.prepend(a); });

  // signup (MailerLite) — only active when configured
  $$('form[data-signup]').forEach(f => {
    const msg = f.querySelector('.form-msg');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const email = f.querySelector('input[type=email]').value.trim();
      const consent = f.querySelector('input[name=consent]');
      const lantern = (f.querySelector('input[name=lantern]:checked') || {}).value || f.dataset.lantern || '';
      if (!/^\S+@\S+\.\S+$/.test(email)) { msg.className = 'form-msg err'; msg.textContent = 'Please enter a valid email address.'; return; }
      if (consent && !consent.checked) { msg.className = 'form-msg err'; msg.textContent = 'Please tick the box so we may email you.'; return; }
      const s = SL.signup || {};
      if (s.provider !== 'mailerlite') { location.href = '/thank-you/?l=' + lantern; return; }
      const body = new FormData();
      body.append('fields[email]', email);
      if (lantern) body.append('fields[lantern]', lantern);
      body.append('ml-submit', '1'); body.append('anticsrf', 'true');
      msg.className = 'form-msg'; msg.textContent = 'Sending…';
      try {
        const r = await fetch(`https://assets.mailerlite.com/jsonp/${s.mailerliteAccount}/forms/${s.mailerliteForm}/subscribe`, { method: 'POST', body });
        const j = await r.json();
        if (!j.success) throw new Error();
        location.href = '/thank-you/?l=' + lantern;
      } catch {
        msg.className = 'form-msg err';
        msg.textContent = 'Something went wrong. Please try again, or write to ' + SL.email + '.';
      }
    });
  });

  // licensing enquiry -> opens the visitor's email app (no data stored on this site)
  $$('form[data-enquiry]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const subject = `Licence enquiry: ${d.type || ''} – ${d.business || d.name || ''}`.trim();
    const body = ['Name: ' + d.name, 'Business: ' + (d.business || '-'), 'Licence: ' + d.type, 'Country / city: ' + (d.place || '-'), '', d.message || ''].join('\n');
    location.href = `mailto:${SL.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    f.querySelector('.form-msg').textContent = 'Your email app should open now. If it does not, write to ' + SL.email + '.';
  }));
  $$('[data-pick-licence]').forEach(a => a.addEventListener('click', () => {
    const sel = document.querySelector('form[data-enquiry] select[name=type]');
    if (sel) sel.value = a.dataset.pickLicence;
  }));
})();
