const CATEGORIES = {
  prep: '준비물',
  homework: '숙제',
  notice: '알림장',
  lesson: '수업내용',
  general: '기타',
};

// --- DOM refs ---
const datePicker = document.getElementById('datePicker');
const prevDateBtn = document.getElementById('prevDate');
const nextDateBtn = document.getElementById('nextDate');
const postList = document.getElementById('postList');
const addBtn = document.getElementById('addBtn');

const tabClass = document.getElementById('tabClass');
const tabSchool = document.getElementById('tabSchool');
const classSelector = document.getElementById('classSelector');
const gradeSelect = document.getElementById('gradeSelect');
const classSelect = document.getElementById('classSelect');

const editorOverlay = document.getElementById('editorOverlay');
const editorTitle = document.getElementById('editorTitle');
const editId = document.getElementById('editId');
const editCategory = document.getElementById('editCategory');
const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// --- State ---
let currentTab = 'class';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

datePicker.value = todayStr();

// --- Storage ---
function loadPosts() {
  try {
    return JSON.parse(localStorage.getItem('school_posts') || '[]');
  } catch { return []; }
}

function savePosts(posts) {
  localStorage.setItem('school_posts', JSON.stringify(posts));
}

function nextId(posts) {
  return posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1;
}

// --- CRUD ---
function getPosts() {
  const posts = loadPosts();
  const date = datePicker.value;
  if (!isValidDate(date)) return [];
  return posts.filter(p => {
    if (p.date !== date) return false;
    if (currentTab === 'class') {
      return p.scope === 'class' && p.grade === Number(gradeSelect.value) && p.class_num === Number(classSelect.value);
    }
    return p.scope === 'school';
  }).sort((a, b) => a.category.localeCompare(b.category) || a.id - b.id);
}

function createPost(data) {
  const posts = loadPosts();
  data.id = nextId(posts);
  data.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  posts.push(data);
  savePosts(posts);
  return data;
}

function updatePost(id, data) {
  const posts = loadPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return;
  Object.assign(posts[idx], data);
  posts[idx].updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  savePosts(posts);
}

function deletePost(id) {
  const posts = loadPosts().filter(p => p.id !== id);
  savePosts(posts);
}

// --- Render ---
function renderPost(post) {
  const catLabel = CATEGORIES[post.category] || post.category;
  const div = document.createElement('div');
  div.className = 'card';

  let scopeHtml = '';
  if (post.scope === 'class') {
    scopeHtml = `<span class="scope-badge">${post.grade}학년 ${post.class_num}반</span>`;
  } else {
    scopeHtml = `<span class="scope-badge" style="background:#fce4ec;color:#c62828;">학교</span>`;
  }

  div.innerHTML = `
    <div class="card-header">
      ${scopeHtml}
      <span class="category-badge category-${post.category}">${catLabel}</span>
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

function render() {
  const posts = getPosts();
  postList.innerHTML = '';
  if (posts.length === 0) {
    postList.innerHTML = '<div class="empty-message">등록된 내용이 없습니다.<br>+ 버튼을 눌러 추가해보세요.</div>';
    return;
  }
  posts.forEach(p => postList.appendChild(renderPost(p)));
}

// --- Editor ---
function openEditor(post) {
  if (post) {
    editorTitle.textContent = '글 수정';
    editId.value = post.id;
    editCategory.value = post.category;
    editTitle.value = post.title;
    editContent.value = post.content;
  } else {
    editorTitle.textContent = '새 글 작성';
    editId.value = '';
    editCategory.value = 'prep';
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
  render();
}

function buildPayload() {
  const payload = {
    date: datePicker.value,
    category: editCategory.value,
    title: editTitle.value.trim(),
    content: editContent.value.trim(),
  };
  if (currentTab === 'class') {
    payload.scope = 'class';
    payload.grade = Number(gradeSelect.value);
    payload.class_num = Number(classSelect.value);
  } else {
    payload.scope = 'school';
  }
  return payload;
}

// --- Events ---
saveBtn.addEventListener('click', () => {
  const data = buildPayload();
  if (!data.content && !data.title) {
    alert('제목 또는 내용을 입력해주세요.');
    return;
  }
  const id = Number(editId.value);
  if (id) {
    updatePost(id, data);
  } else {
    createPost(data);
  }
  closeEditor();
  render();
});

cancelBtn.addEventListener('click', closeEditor);
addBtn.addEventListener('click', () => openEditor(null));

datePicker.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!isValidDate(datePicker.value)) {
      alert('날짜 형식이 올바르지 않습니다. (예: 2026-05-16)');
      return;
    }
    render();
  }
});
datePicker.addEventListener('blur', () => {
  if (isValidDate(datePicker.value)) render();
});

prevDateBtn.addEventListener('click', () => {
  const d = new Date(datePicker.value);
  if (isNaN(d.getTime())) return;
  d.setDate(d.getDate() - 1);
  datePicker.value = formatDate(d);
  render();
});

nextDateBtn.addEventListener('click', () => {
  const d = new Date(datePicker.value);
  if (isNaN(d.getTime())) return;
  d.setDate(d.getDate() + 1);
  datePicker.value = formatDate(d);
  render();
});

editorOverlay.addEventListener('click', (e) => {
  if (e.target === editorOverlay) closeEditor();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeEditor();
});

// --- Tab ---
function switchTab(tab) {
  currentTab = tab;
  tabClass.classList.toggle('active', tab === 'class');
  tabSchool.classList.toggle('active', tab === 'school');
  classSelector.style.display = tab === 'class' ? 'flex' : 'none';
  render();
}

tabClass.addEventListener('click', () => switchTab('class'));
tabSchool.addEventListener('click', () => switchTab('school'));

gradeSelect.addEventListener('change', render);
classSelect.addEventListener('change', render);

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

render();
