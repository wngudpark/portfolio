// ===== Admin panel: login, project CRUD =====
(function () {
  const esc = (s) => (window.App ? window.App.escapeHtml(s) : String(s ?? ''));

  const el = {};
  function cache() {
    el.login = document.getElementById('admin-login');
    el.dashboard = document.getElementById('admin-dashboard');
    el.loginForm = document.getElementById('login-form');
    el.password = document.getElementById('login-password');
    el.loginError = document.getElementById('login-error');
    el.logoutBtn = document.getElementById('logout-btn');
    el.form = document.getElementById('project-form');
    el.formTitle = document.getElementById('form-title');
    el.id = document.getElementById('p-id');
    el.title = document.getElementById('p-title');
    el.year = document.getElementById('p-year');
    el.description = document.getElementById('p-description');
    el.stack = document.getElementById('p-stack');
    el.link = document.getElementById('p-link');
    el.thumbnail = document.getElementById('p-thumbnail');
    el.previewWrap = document.getElementById('thumb-preview-wrap');
    el.preview = document.getElementById('thumb-preview');
    el.thumbClear = document.getElementById('thumb-clear');
    el.detail = document.getElementById('p-detail');
    el.detailPreview = document.getElementById('p-detail-preview');
    el.formReset = document.getElementById('form-reset');
    el.msg = document.getElementById('admin-msg');
    el.rows = document.getElementById('admin-project-rows');

    // Admin tabs / panels
    el.tabs = document.querySelectorAll('[data-admin-tab]');
    el.panelProject = document.getElementById('panel-project');
    el.panelCareer = document.getElementById('panel-career');

    // Career form
    el.cForm = document.getElementById('career-form');
    el.cFormTitle = document.getElementById('career-form-title');
    el.cId = document.getElementById('c-id');
    el.cCompany = document.getElementById('c-company');
    el.cPosition = document.getElementById('c-position');
    el.cStart = document.getElementById('c-start');
    el.cEnd = document.getElementById('c-end');
    el.cCurrent = document.getElementById('c-current');
    el.cDescription = document.getElementById('c-description');
    el.cFormReset = document.getElementById('career-form-reset');
    el.cMsg = document.getElementById('career-msg');
    el.cRows = document.getElementById('admin-career-rows');
  }

  async function api(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...options
    });
    let data = null;
    try { data = await res.json(); } catch { /* no body */ }
    if (!res.ok) throw new Error((data && data.error) || '요청 실패');
    return data;
  }

  function setLoggedIn(isAdmin) {
    el.login.classList.toggle('hidden', isAdmin);
    el.dashboard.classList.toggle('hidden', !isAdmin);
    if (isAdmin) {
      loadRows();
      loadCareerRows();
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // ---- Admin tab switching ----
  function switchTab(name) {
    el.tabs.forEach((t) =>
      t.classList.toggle('admin-tab-active', t.dataset.adminTab === name)
    );
    el.panelProject.classList.toggle('hidden', name !== 'project');
    el.panelCareer.classList.toggle('hidden', name !== 'career');
  }

  async function checkAuth() {
    try {
      const { isAdmin } = await api('/api/me');
      setLoggedIn(isAdmin);
    } catch {
      setLoggedIn(false);
    }
  }

  // ---- Login / logout ----
  async function onLogin(e) {
    e.preventDefault();
    el.loginError.classList.add('hidden');
    try {
      await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ password: el.password.value })
      });
      el.password.value = '';
      setLoggedIn(true);
    } catch (err) {
      el.loginError.textContent = err.message;
      el.loginError.classList.remove('hidden');
    }
  }

  async function onLogout() {
    await api('/api/logout', { method: 'POST' });
    setLoggedIn(false);
    resetForm();
  }

  // ---- Project table ----
  async function loadRows() {
    el.rows.innerHTML = `<tr><td class="px-4 py-4 text-slate-400" colspan="5">불러오는 중...</td></tr>`;
    try {
      const projects = await api('/api/projects');
      if (!projects.length) {
        el.rows.innerHTML = `<tr><td class="px-4 py-4 text-slate-400" colspan="5">등록된 프로젝트가 없습니다.</td></tr>`;
        return;
      }
      el.rows.innerHTML = projects.map(rowHtml).join('');
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      el.rows.innerHTML = `<tr><td class="px-4 py-4 text-red-500" colspan="5">${esc(err.message)}</td></tr>`;
    }
  }

  function rowHtml(p) {
    const stack = (p.stack || []).join(', ');
    const thumb = p.thumbnail_url
      ? `<img src="${esc(p.thumbnail_url)}" alt="" class="h-10 w-14 rounded object-cover" />`
      : `<span class="flex h-10 w-14 items-center justify-center rounded bg-slate-100 text-slate-300"><i data-lucide="image" class="h-5 w-5"></i></span>`;
    return `
      <tr class="border-b border-slate-100 last:border-0" data-id="${p.id}">
        <td class="px-4 py-3">${thumb}</td>
        <td class="px-4 py-3 font-medium text-slate-800">${esc(p.title)}</td>
        <td class="px-4 py-3 text-slate-500">${esc(p.year || '-')}</td>
        <td class="px-4 py-3 hidden text-slate-500 sm:table-cell">${esc(stack)}</td>
        <td class="px-4 py-3">
          <div class="flex justify-end gap-2">
            <button class="edit-btn inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100" data-id="${p.id}">
              <i data-lucide="pencil" class="h-3.5 w-3.5"></i> 수정
            </button>
            <button class="del-btn inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50" data-id="${p.id}">
              <i data-lucide="trash-2" class="h-3.5 w-3.5"></i> 삭제
            </button>
          </div>
        </td>
      </tr>`;
  }

  // ---- Thumbnail preview ----
  function showPreview(src) {
    el.preview.src = src;
    el.previewWrap.classList.remove('hidden');
  }
  function hidePreview() {
    el.preview.removeAttribute('src');
    el.previewWrap.classList.add('hidden');
  }
  function onFileChange() {
    const file = el.thumbnail.files[0];
    if (file) showPreview(URL.createObjectURL(file));
    else hidePreview();
  }
  function onClearThumb() {
    el.thumbnail.value = '';
    hidePreview();
  }

  // ---- Markdown live preview ----
  function updateDetailPreview() {
    const md = el.detail.value.trim();
    if (!md) {
      el.detailPreview.innerHTML = '<p class="text-slate-300">여기에 미리보기가 표시됩니다.</p>';
      return;
    }
    el.detailPreview.innerHTML = window.App
      ? window.App.renderMarkdown(md)
      : esc(md);
  }

  // ---- Form (create / update) ----
  function resetForm() {
    el.form.reset();
    el.id.value = '';
    el.formTitle.textContent = '프로젝트 추가';
    el.msg.textContent = '';
    hidePreview();
    updateDetailPreview();
  }

  function fillForm(p) {
    el.id.value = p.id;
    el.title.value = p.title || '';
    el.year.value = p.year || '';
    el.description.value = p.description || '';
    el.stack.value = (p.stack || []).join(', ');
    el.link.value = p.link || '';
    el.detail.value = p.detail_content || '';
    updateDetailPreview();
    el.thumbnail.value = '';
    // Preview the currently saved thumbnail (if any) until a new file is chosen.
    if (p.thumbnail_url) showPreview(p.thumbnail_url);
    else hidePreview();
    el.formTitle.textContent = `프로젝트 수정 #${p.id}`;
    window.scrollTo({ top: el.form.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  }

  function flash(text, ok = true) {
    el.msg.textContent = text;
    el.msg.className = `text-sm ${ok ? 'text-green-600' : 'text-red-600'}`;
    setTimeout(() => { el.msg.textContent = ''; }, 2500);
  }

  async function onSubmit(e) {
    e.preventDefault();
    // multipart/form-data so the optional thumbnail file rides along.
    const fd = new FormData();
    fd.append('title', el.title.value.trim());
    fd.append('year', el.year.value.trim());
    fd.append('description', el.description.value.trim());
    fd.append('stack', el.stack.value); // comma-separated; backend normalizes
    fd.append('link', el.link.value.trim());
    fd.append('detail_content', el.detail.value);
    const file = el.thumbnail.files[0];
    if (file) fd.append('thumbnail', file);

    const id = el.id.value;
    const url = id ? `/api/projects/${id}` : '/api/projects';
    const method = id ? 'PUT' : 'POST';

    try {
      // Don't set Content-Type — the browser adds the multipart boundary.
      const res = await fetch(url, { method, body: fd, credentials: 'same-origin' });
      let data = null;
      try { data = await res.json(); } catch { /* no body */ }
      if (!res.ok) throw new Error((data && data.error) || '요청 실패');

      flash(id ? '수정되었습니다.' : '추가되었습니다.');
      resetForm();
      loadRows();
      if (window.App) window.App.loadProjects();
    } catch (err) {
      flash(err.message, false);
    }
  }

  async function onTableClick(e) {
    const editBtn = e.target.closest('.edit-btn');
    const delBtn = e.target.closest('.del-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      try {
        const p = await api(`/api/projects/${id}`);
        fillForm(p);
      } catch (err) { flash(err.message, false); }
    } else if (delBtn) {
      const id = delBtn.dataset.id;
      if (!confirm('이 프로젝트를 삭제할까요?')) return;
      try {
        await api(`/api/projects/${id}`, { method: 'DELETE' });
        loadRows();
        if (window.App) window.App.loadProjects();
      } catch (err) { flash(err.message, false); }
    }
  }

  // ===== Career management =====
  async function loadCareerRows() {
    el.cRows.innerHTML = `<tr><td class="px-4 py-4 text-slate-400" colspan="4">불러오는 중...</td></tr>`;
    try {
      const careers = await api('/api/careers');
      if (!careers.length) {
        el.cRows.innerHTML = `<tr><td class="px-4 py-4 text-slate-400" colspan="4">등록된 경력이 없습니다.</td></tr>`;
        return;
      }
      el.cRows.innerHTML = careers.map(careerRowHtml).join('');
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      el.cRows.innerHTML = `<tr><td class="px-4 py-4 text-red-500" colspan="4">${esc(err.message)}</td></tr>`;
    }
  }

  function careerRowHtml(c) {
    const period = window.App
      ? window.App.formatPeriod(c.start_date, c.end_date)
      : `${c.start_date || ''} ~ ${c.end_date || '현재'}`;
    return `
      <tr class="border-b border-slate-100 last:border-0" data-id="${c.id}">
        <td class="px-4 py-3 font-medium text-slate-800">${esc(c.company)}</td>
        <td class="px-4 py-3 text-slate-500">${esc(c.position)}</td>
        <td class="px-4 py-3 text-slate-500">${esc(period)}</td>
        <td class="px-4 py-3">
          <div class="flex justify-end gap-2">
            <button class="c-edit-btn inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100" data-id="${c.id}">
              <i data-lucide="pencil" class="h-3.5 w-3.5"></i> 수정
            </button>
            <button class="c-del-btn inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50" data-id="${c.id}">
              <i data-lucide="trash-2" class="h-3.5 w-3.5"></i> 삭제
            </button>
          </div>
        </td>
      </tr>`;
  }

  // "재직중" checkbox disables/clears the end date.
  function onCurrentToggle() {
    el.cEnd.disabled = el.cCurrent.checked;
    if (el.cCurrent.checked) el.cEnd.value = '';
  }

  function resetCareerForm() {
    el.cForm.reset();
    el.cId.value = '';
    el.cFormTitle.textContent = '경력 추가';
    el.cMsg.textContent = '';
    onCurrentToggle();
  }

  function fillCareerForm(c) {
    el.cId.value = c.id;
    el.cCompany.value = c.company || '';
    el.cPosition.value = c.position || '';
    el.cStart.value = c.start_date || '';
    el.cCurrent.checked = !c.end_date; // null end = 재직중
    el.cEnd.value = c.end_date || '';
    onCurrentToggle();
    el.cDescription.value = c.description || '';
    el.cFormTitle.textContent = `경력 수정 #${c.id}`;
    window.scrollTo({ top: el.cForm.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  }

  function careerFlash(text, ok = true) {
    el.cMsg.textContent = text;
    el.cMsg.className = `text-sm ${ok ? 'text-green-600' : 'text-red-600'}`;
    setTimeout(() => { el.cMsg.textContent = ''; }, 2500);
  }

  async function onCareerSubmit(e) {
    e.preventDefault();
    const payload = {
      company: el.cCompany.value.trim(),
      position: el.cPosition.value.trim(),
      start_date: el.cStart.value.trim(),
      end_date: el.cCurrent.checked ? '' : el.cEnd.value.trim(), // '' -> null (재직중)
      description: el.cDescription.value.trim()
    };
    const id = el.cId.value;
    try {
      if (id) {
        await api(`/api/careers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        careerFlash('수정되었습니다.');
      } else {
        await api('/api/careers', { method: 'POST', body: JSON.stringify(payload) });
        careerFlash('추가되었습니다.');
      }
      resetCareerForm();
      loadCareerRows();
      if (window.App) window.App.loadCareers();
    } catch (err) {
      careerFlash(err.message, false);
    }
  }

  async function onCareerTableClick(e) {
    const editBtn = e.target.closest('.c-edit-btn');
    const delBtn = e.target.closest('.c-del-btn');
    if (editBtn) {
      try {
        const c = await api(`/api/careers/${editBtn.dataset.id}`);
        fillCareerForm(c);
      } catch (err) { careerFlash(err.message, false); }
    } else if (delBtn) {
      if (!confirm('이 경력을 삭제할까요?')) return;
      try {
        await api(`/api/careers/${delBtn.dataset.id}`, { method: 'DELETE' });
        loadCareerRows();
        if (window.App) window.App.loadCareers();
      } catch (err) { careerFlash(err.message, false); }
    }
  }

  // Called by the router when the admin section is shown.
  function onEnter() {
    checkAuth();
  }

  window.addEventListener('DOMContentLoaded', () => {
    cache();
    el.loginForm.addEventListener('submit', onLogin);
    el.logoutBtn.addEventListener('click', onLogout);
    el.form.addEventListener('submit', onSubmit);
    el.formReset.addEventListener('click', resetForm);
    el.thumbnail.addEventListener('change', onFileChange);
    el.thumbClear.addEventListener('click', onClearThumb);
    el.detail.addEventListener('input', updateDetailPreview);
    el.rows.addEventListener('click', onTableClick);

    // Career management
    el.tabs.forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.adminTab)));
    el.cForm.addEventListener('submit', onCareerSubmit);
    el.cFormReset.addEventListener('click', resetCareerForm);
    el.cCurrent.addEventListener('change', onCurrentToggle);
    el.cRows.addEventListener('click', onCareerTableClick);
  });

  window.AdminPanel = { onEnter };
})();
