// --- DOM refs ---
const datePicker = document.getElementById('datePicker');
const prevDateBtn = document.getElementById('prevDate');
const nextDateBtn = document.getElementById('nextDate');
const postList = document.getElementById('postList');
const addBtn = document.getElementById('addBtn');

const editorOverlay = document.getElementById('editorOverlay');
const editorTitle = document.getElementById('editorTitle');
const editId = document.getElementById('editId');
const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

const assessList = document.getElementById('assessmentList');
const addAssessBtn = document.getElementById('addAssessBtn');
const assessOverlay = document.getElementById('assessOverlay');
const assessTitle = document.getElementById('assessTitle');
const assessId = document.getElementById('assessId');
const assessName = document.getElementById('assessName');
const assessDate = document.getElementById('assessDate');
const assessContent = document.getElementById('assessContent');
const saveAssessBtn = document.getElementById('saveAssessBtn');
const cancelAssessBtn = document.getElementById('cancelAssessBtn');

// --- Date helpers ---
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function daysUntil(target) {
  const now = new Date();
  now.setHours(0,0,0,0);
  const t = new Date(target);
  t.setHours(0,0,0,0);
  return Math.round((t - now) / (1000*60*60*24));
}

datePicker.value = todayStr();

// --- Storage (알림장) ---
function loadPosts() {
  try { return JSON.parse(localStorage.getItem('minsse_notice') || '[]'); }
  catch { return []; }
}

function savePosts(posts) {
  localStorage.setItem('minsse_notice', JSON.stringify(posts));
}

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(p => p.id)) + 1 : 1;
}

function getPosts() {
  const posts = loadPosts();
  const date = datePicker.value;
  if (!isValidDate(date)) return [];
  return posts.filter(p => p.date === date).sort((a, b) => a.id - b.id);
}

function createPost(data) {
  const posts = loadPosts();
  data.id = nextId(posts);
  posts.push(data);
  savePosts(posts);
  return data;
}

function updatePost(id, data) {
  const posts = loadPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return;
  Object.assign(posts[idx], data);
  savePosts(posts);
}

function deletePost(id) {
  savePosts(loadPosts().filter(p => p.id !== id));
}

// --- Storage (수행평가) ---
function loadAssessments() {
  try { return JSON.parse(localStorage.getItem('minsse_assess') || '[]'); }
  catch { return []; }
}

function saveAssessments(list) {
  localStorage.setItem('minsse_assess', JSON.stringify(list));
}

function getAssessments() {
  return loadAssessments().sort((a, b) => a.date.localeCompare(b.date));
}

function createAssessment(data) {
  const list = loadAssessments();
  data.id = nextId(list);
  list.push(data);
  saveAssessments(list);
}

function updateAssessment(id, data) {
  const list = loadAssessments();
  const idx = list.findIndex(a => a.id === id);
  if (idx === -1) return;
  Object.assign(list[idx], data);
  saveAssessments(list);
}

function deleteAssessment(id) {
  saveAssessments(loadAssessments().filter(a => a.id !== id));
}

// --- Render 알림장 ---
function renderPost(post) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class="card-header">
      <span class="card-title">${escapeHtml(post.title)}</span>
    </div>
    ${post.content ? `<div class="card-content">${escapeHtml(post.content)}</div>` : ''}
    <div class="card-actions">
      <button class="edit-btn" data-id="${post.id}">수정</button>
      <button class="del-btn" data-id="${post.id}">삭제</button>
    </div>
  `;
  div.querySelector('.edit-btn').addEventListener('click', () => openEditor(post));
  div.querySelector('.del-btn').addEventListener('click', () => confirmDelete(post.id));
  return div;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderPosts() {
  const posts = getPosts();
  postList.innerHTML = '';
  if (posts.length === 0) {
    postList.innerHTML = '<div class="empty-message">등록된 알림장이 없습니다.<br>+ 버튼을 눌러 추가해보세요.</div>';
    return;
  }
  posts.forEach(p => postList.appendChild(renderPost(p)));
}

// --- Render 수행평가 ---
function ddayClass(days) {
  if (days < 0) return 'dday-done';
  if (days === 0) return 'dday-danger';
  if (days <= 3) return 'dday-warn';
  if (days <= 7) return 'dday-soon';
  return 'dday-ok';
}

function ddayText(days) {
  if (days < 0) return 'D+' + Math.abs(days);
  if (days === 0) return 'D-Day';
  return 'D-' + days;
}

function renderAssessments() {
  const list = getAssessments();
  assessList.innerHTML = '';
  list.forEach(a => {
    const days = daysUntil(a.date);
    const cls = ddayClass(days);
    const dtxt = ddayText(days);
    const div = document.createElement('div');
    div.className = 'assess-card';
    div.innerHTML = `
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
          <span class="assess-name">${escapeHtml(a.name)}</span>
          <span class="assess-dday ${cls}">${dtxt}</span>
          <span style="font-size:.75rem;color:#b07f90">${escapeHtml(a.date)}</span>
        </div>
        ${a.content ? `<div class="assess-detail">${escapeHtml(a.content)}</div>` : ''}
      </div>
      <div class="assess-actions" style="flex-shrink:0">
        <button class="edit-assess" data-id="${a.id}">수정</button>
        <button class="del-assess" data-id="${a.id}">삭제</button>
      </div>
    `;
    div.querySelector('.edit-assess').addEventListener('click', () => openAssessEditor(a));
    div.querySelector('.del-assess').addEventListener('click', () => {
      if (confirm('삭제하시겠습니까?')) {
        deleteAssessment(a.id);
        renderAll();
      }
    });
    assessList.appendChild(div);
  });
}

// --- Editor 알림장 ---
function openEditor(post) {
  if (post) {
    editorTitle.textContent = '알림장 수정';
    editId.value = post.id;
    editTitle.value = post.title;
    editContent.value = post.content;
  } else {
    editorTitle.textContent = '알림장 작성';
    editId.value = '';
    editTitle.value = '';
    editContent.value = '';
  }
  editorOverlay.classList.remove('hidden');
  editTitle.focus();
}

function closeEditor() {
  editorOverlay.classList.add('hidden');
}

function confirmDelete(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  deletePost(id);
  renderPosts();
}

// --- Editor 수행평가 ---
function openAssessEditor(item) {
  if (item) {
    assessTitle.textContent = '수행평가 수정';
    assessId.value = item.id;
    assessName.value = item.name;
    assessDate.value = item.date;
    assessContent.value = item.content || '';
  } else {
    assessTitle.textContent = '수행평가 추가';
    assessId.value = '';
    assessName.value = '';
    assessDate.value = '';
    assessContent.value = '';
  }
  assessOverlay.classList.remove('hidden');
  assessName.focus();
}

function closeAssessEditor() {
  assessOverlay.classList.add('hidden');
}

function renderAll() {
  renderAssessments();
  renderPosts();
}

// --- Events: 알림장 ---
saveBtn.addEventListener('click', () => {
  const data = {
    date: datePicker.value,
    title: editTitle.value.trim(),
    content: editContent.value.trim(),
  };
  if (!data.content && !data.title) {
    alert('제목 또는 내용을 입력해주세요.');
    return;
  }
  const id = Number(editId.value);
  if (id) updatePost(id, data);
  else createPost(data);
  closeEditor();
  renderPosts();
});

cancelBtn.addEventListener('click', closeEditor);
addBtn.addEventListener('click', () => openEditor(null));

datePicker.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!isValidDate(datePicker.value)) {
      alert('날짜 형식이 올바르지 않습니다. (예: 2026-05-16)');
      return;
    }
    renderPosts();
  }
});
datePicker.addEventListener('blur', () => {
  if (isValidDate(datePicker.value)) renderPosts();
});

prevDateBtn.addEventListener('click', () => {
  const d = new Date(datePicker.value);
  if (isNaN(d.getTime())) return;
  d.setDate(d.getDate() - 1);
  datePicker.value = formatDate(d);
  renderPosts();
});

nextDateBtn.addEventListener('click', () => {
  const d = new Date(datePicker.value);
  if (isNaN(d.getTime())) return;
  d.setDate(d.getDate() + 1);
  datePicker.value = formatDate(d);
  renderPosts();
});

editorOverlay.addEventListener('click', (e) => {
  if (e.target === editorOverlay) closeEditor();
});

// --- Events: 수행평가 ---
saveAssessBtn.addEventListener('click', () => {
  const name = assessName.value.trim();
  const date = assessDate.value.trim();
  const content = assessContent.value.trim();
  if (!name) { alert('수행평가 이름을 입력해주세요.'); return; }
  if (!isValidDate(date)) { alert('날짜 형식이 올바르지 않습니다. (예: 2026-05-16)'); return; }
  const id = Number(assessId.value);
  if (id) updateAssessment(id, { name, date, content });
  else createAssessment({ name, date, content });
  closeAssessEditor();
  renderAssessments();
});

cancelAssessBtn.addEventListener('click', closeAssessEditor);
addAssessBtn.addEventListener('click', () => openAssessEditor(null));

assessOverlay.addEventListener('click', (e) => {
  if (e.target === assessOverlay) closeAssessEditor();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeEditor(); closeAssessEditor(); }
});

// --- Init ---
renderAll();
