// ======== GLOBAL STATE ========
let tasks = [];
let anniversaries = [];
let diaries = [];
let chats = [];
let customIcons = ["🐱", "💖", "📱"];
let currentChatId = null;
let currentPerspective = 'sent'; // 'sent' or 'received'
let longPressTimer;

// ======== 📋 待办清单 ========
const todoList = document.getElementById("todo-list");
function renderTasks() {
  if (!todoList) return;
  todoList.innerHTML = "";
  tasks.sort((a,b) => a.done - b.done).forEach((task, index) => {
    const item = document.createElement("div");
    item.className = "todo-item";
    item.innerHTML = `
      <label class="checkbox-label">
        <input type="checkbox" ${task.done ? "checked" : ""}>
        <span class="todo-text ${task.done ? 'completed' : ''}">${task.text}</span>
      </label>
      <button class="delete-btn"><i class="fas fa-trash"></i></button>
    `;
    item.querySelector("input").addEventListener("change", (e) => {
      tasks[index].done = e.target.checked;
      saveData("tasks");
      renderTasks();
    });
    item.querySelector(".delete-btn").addEventListener("click", () => {
      tasks.splice(index, 1);
      saveData("tasks");
      renderTasks();
    });
    todoList.appendChild(item);
  });
}

function addTask() {
  const input = document.getElementById("new-task");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  tasks.push({ text, done: false });
  input.value = "";
  saveData("tasks");
  renderTasks();
}

// ======== 🎉 纪念日 ========
const anniList = document.getElementById("anni-list");
function renderAnnis() {
  if (!anniList) return;
  anniList.innerHTML = "";
  const sorted = [...anniversaries].sort((a, b) => (b.pinned || 0) - (a.pinned || 0) || new Date(a.date) - new Date(b.date));
  sorted.forEach(anni => {
    const originalIndex = anniversaries.findIndex(a => a.name === anni.name && a.date === anni.date);
    const item = document.createElement("div");
    item.className = "card";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const date = new Date(anni.date);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    const msg = diff >= 0 ? `还有 ${diff} 天` : `已过去 ${Math.abs(diff)} 天`;
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${anni.pinned ? '📌 ' : ''}${anni.name}</strong> (${anni.date})<br>
          <small>${msg}</small>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn" onclick="togglePin(${originalIndex})" title="${anni.pinned ? '取消置顶' : '置顶'}">${anni.pinned ? '<i class="fas fa-thumbtack"></i>' : '<i class="far fa-thumbtack"></i>'}</button>
          <button class="btn btn-danger" onclick="deleteAnni(${originalIndex})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    anniList.appendChild(item);
  });
}

function deleteAnni(index) {
  if (confirm(`确定要删除纪念日 "${anniversaries[index].name}" 吗？`)) {
    anniversaries.splice(index, 1);
    saveData("anniversaries");
    renderAnnis();
    updateAnniversaryDisplay();
  }
}

function togglePin(index) {
  anniversaries[index].pinned = !anniversaries[index].pinned;
  saveData("anniversaries");
  renderAnnis();
  updateAnniversaryDisplay();
}

function addAnni() {
  const nameInput = document.getElementById("anni-name");
  const dateInput = document.getElementById("anni-date");
  const pinInput = document.getElementById("anni-pin");
  const name = nameInput.value.trim();
  const date = dateInput.value;
  if (!name || !date) return;
  anniversaries.push({ name, date, pinned: pinInput.checked });
  nameInput.value = "";
  dateInput.value = new Date().toISOString().split("T")[0];
  pinInput.checked = false;
  saveData("anniversaries");
  renderAnnis();
  updateAnniversaryDisplay();
}

function updateAnniversaryDisplay() {
  const titleEl = document.getElementById('anniversary-title');
  const descEl = document.getElementById('anniversary-desc');
  if (!titleEl || !descEl) return;
  if (!anniversaries.length) {
    titleEl.textContent = '纪念日';
    descEl.textContent = '记录重要日期';
    return;
  }
  const pinned = anniversaries.filter(a => a.pinned);
  const displayAnnis = pinned.length > 0 ? pinned : anniversaries;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nearest = displayAnnis.map(a => ({...a, diff: new Date(a.date) - today})).sort((a,b) => Math.abs(a.diff) - Math.abs(b.diff))[0];
  const days = Math.ceil(nearest.diff / (1000 * 60 * 60 * 24));
  titleEl.textContent = `${nearest.pinned ? '📌 ' : ''}${nearest.name}`;
  descEl.textContent = days >= 0 ? `还有 ${days} 天` : `已过去 ${Math.abs(days)} 天`;
}

// ======== 📖 恋爱日记 ========
const diaryList = document.getElementById("diary-list");
function renderDiaries() {
  if (!diaryList) return;
  diaryList.innerHTML = "";
  diaries.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((d, index) => {
    const item = document.createElement("div");
    item.className = "diary-item";
    item.innerHTML = `
      <div class="diary-header" onclick="this.nextElementSibling.classList.toggle('expanded'); this.querySelector('.diary-toggle').classList.toggle('expanded');">
        <span class="diary-date">${d.date}</span>
        <span class="diary-toggle"><i class="fas fa-chevron-down"></i></span>
      </div>
      <div class="diary-content">
        <p class="diary-text">${d.content.replace(/\n/g, '<br>')}</p>
        <div class="diary-actions">
          <button class="btn-icon" onclick="editDiary(${index})" title="编辑"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-icon-danger" onclick="deleteDiary(${index})" title="删除"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    diaryList.appendChild(item);
  });
}

function addDiary() {
  const dateInput = document.getElementById("diary-date");
  const contentInput = document.getElementById("diary-content");
  const date = dateInput.value || new Date().toISOString().split("T")[0];
  const content = contentInput.value.trim();
  if (!content) return;
  diaries.push({ date, content });
  contentInput.value = "";
  saveData("diaries");
  renderDiaries();
}

function editDiary(index) {
  const newContent = prompt('编辑日记内容:', diaries[index].content);
  if (newContent !== null) {
    diaries[index].content = newContent.trim();
    saveData("diaries");
    renderDiaries();
  }
}

function deleteDiary(index) {
  if (confirm('确定要删除这篇日记吗？')) {
    diaries.splice(index, 1);
    saveData("diaries");
    renderDiaries();
  }
}


// ======== 💬 聊天功能 ========
function renderChatList() {
    const container = document.getElementById('chat-list-container');
    if (!container) return;
    container.innerHTML = '';
    if (chats.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">还没有聊天记录，快去新建一个吧！</p>';
        return;
    }
    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'chat-list-item';
        item.onclick = () => openChat(chat.id);
        const avatarContent = chat.avatar ? `<div class="chat-list-avatar" style="background-image: url(${chat.avatar});"></div>` : `<div class="chat-list-avatar">${chat.name.charAt(0) || '?'}</div>`;
        item.innerHTML = `
            ${avatarContent}
            <div class="chat-list-name">${chat.name}</div>
        `;
        container.appendChild(item);
    });
}

function createNewChat() {
    const name = prompt("请输入新聊天的名称：");
    if (name && name.trim()) {
        const newChat = {
            id: Date.now().toString(),
            name: name.trim(),
            avatar: '',
            background: '',
            messages: []
        };
        chats.push(newChat);
        saveData('chats');
        openChat(newChat.id);
    }
}

function openChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    document.getElementById('chat-page-name').textContent = chat.name;
    const bgLayer = document.getElementById('chat-background-layer');
    bgLayer.style.backgroundImage = chat.background ? `url(${chat.background})` : 'none';
    
    currentPerspective = 'sent';
    document.getElementById('perspective-btn').classList.remove('active');

    renderChatMessages();
    showPage('chat');
}

function renderChatMessages() {
  const container = document.getElementById("chat-messages");
  if (!container || !currentChatId) return;
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;
  
  container.innerHTML = "";
  chat.messages.forEach((msg, index) => {
    const div = document.createElement("div");
    div.className = `message ${msg.type}`;
    const avatar = msg.type === 'sent' 
        ? '<div class="message-avatar">我</div>' 
        : chat.avatar 
            ? `<div class="message-avatar" style="background-image: url(${chat.avatar});"></div>`
            : `<div class="message-avatar">${chat.name.charAt(0) || '?'}</div>`;
    
    let content;
    if (msg.contentType === 'image') {
      content = `<img src="${msg.content}" alt="图片" class="message-image">`;
    } else if (msg.contentType === 'voice') {
      content = `
        <div class="voice-message-container">
          <i class="fas fa-play"></i>
          <div class="voice-waveform"></div>
          <span class="voice-duration">${msg.content}s</span>
        </div>
        <div class="voice-transcript" id="transcript-${index}" style="display: none;">
           <div class="transcript-content" id="transcript-content-${index}"></div>
           <div class="transcript-actions">
                <button class="btn-icon" onclick="editTranscript(${index})" title="编辑"><i class="fas fa-edit"></i></button>
           </div>
        </div>`;
    } else {
      content = msg.content;
    }

    div.innerHTML = `
      ${msg.type === 'received' ? avatar : ''}
      <div class="message-content" id="message-content-${index}">${content}</div>
      ${msg.type === 'sent' ? avatar : ''}
    `;
    container.appendChild(div);

    if (msg.contentType === 'voice') {
        const messageContentEl = document.getElementById(`message-content-${index}`);
        messageContentEl.addEventListener('mousedown', () => startLongPress(index));
        messageContentEl.addEventListener('mouseup', cancelLongPress);
        messageContentEl.addEventListener('mouseleave', cancelLongPress);
        messageContentEl.addEventListener('touchstart', () => startLongPress(index));
        messageContentEl.addEventListener('touchend', cancelLongPress);
        if (msg.editableTranscript) {
            displayTranscript(index, msg.editableTranscript, false);
        }
    }
  });
  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  if (!input || !input.value.trim() || !currentChatId) return;
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  chat.messages.push({
    type: currentPerspective,
    contentType: 'text',
    content: input.value.trim(),
  });
  input.value = "";
  input.style.height = 'auto'; // Reset height
  saveData("chats");
  renderChatMessages();
}

function addImageMessage() {
    if (!currentChatId) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                const chat = chats.find(c => c.id === currentChatId);
                if (!chat) return;
                chat.messages.push({
                    type: currentPerspective,
                    contentType: 'image',
                    content: e.target.result
                });
                saveData("chats");
                renderChatMessages();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function addVoiceMessage() {
    if (!currentChatId) return;
    const duration = prompt("输入模拟语音时长(秒):", "5");
    const parsedDuration = parseInt(duration, 10);
    if (!isNaN(parsedDuration) && parsedDuration > 0) {
        const chat = chats.find(c => c.id === currentChatId);
        if (!chat) return;
        chat.messages.push({
            type: currentPerspective,
            contentType: 'voice',
            content: parsedDuration // Store duration as content
        });
        saveData("chats");
        renderChatMessages();
    } else if (duration !== null) {
        alert("请输入有效的数字！");
    }
}

function startLongPress(index) {
    cancelLongPress(); // Clear any existing timers
    longPressTimer = setTimeout(() => {
        transcribeVoiceMessage(index);
    }, 800); // 800ms for long press
}

function cancelLongPress() {
    clearTimeout(longPressTimer);
}

async function transcribeVoiceMessage(index) {
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    const msg = chat.messages[index];

    if (msg.editableTranscript) {
        const transcriptDiv = document.getElementById(`transcript-${index}`);
        transcriptDiv.style.display = transcriptDiv.style.display === 'none' ? 'flex' : 'none';
        return;
    }
    
    displayTranscript(index, '<i>💖 正在转为文字...</i>', true);

    const transcript = await window.transcribeAudio(msg.content);
    msg.transcript = transcript;
    msg.editableTranscript = transcript;
    saveData('chats');
    displayTranscript(index, transcript, true);
}

function displayTranscript(index, text, show) {
    const transcriptDiv = document.getElementById(`transcript-${index}`);
    const transcriptContent = document.getElementById(`transcript-content-${index}`);
    if (transcriptDiv && transcriptContent) {
        transcriptContent.innerHTML = text.replace(/\n/g, '<br>');
        if (show) transcriptDiv.style.display = 'flex';
    }
}

function editTranscript(index) {
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    const newTranscript = prompt("编辑文字:", chat.messages[index].editableTranscript);
    if (newTranscript !== null) {
        chat.messages[index].editableTranscript = newTranscript;
        saveData('chats');
        displayTranscript(index, newTranscript, true);
    }
}

function togglePerspective() {
  currentPerspective = currentPerspective === 'sent' ? 'received' : 'sent';
  document.getElementById('perspective-btn').classList.toggle('active', currentPerspective === 'received');
}

// ======== 💬 聊天设置 ========
function openChatSettings() {
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    document.getElementById('modal-chat-name-input').value = chat.name;
    document.getElementById('chat-settings-modal').style.display = 'flex';
}

function closeChatSettings() {
    document.getElementById('chat-settings-modal').style.display = 'none';
}

function updateCurrentChatDetails(field, value) {
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;

    if (field === 'name') {
        chat.name = value;
        document.getElementById('chat-page-name').textContent = value;
    } else if (field === 'avatar' || field === 'background') {
        const file = value;
        if(file) {
            const reader = new FileReader();
            reader.onload = e => {
                chat[field] = e.target.result;
                saveData('chats');
                openChat(currentChatId); // Re-render chat page
            };
            reader.readAsDataURL(file);
        }
        return; // Avoid double save
    }
    saveData('chats');
}

function deleteCurrentChat() {
    if (confirm('确定要删除这个聊天吗？此操作不可恢复！')) {
        const index = chats.findIndex(c => c.id === currentChatId);
        if (index > -1) {
            chats.splice(index, 1);
            saveData('chats');
            currentChatId = null;
            closeChatSettings();
            showPage('chat-list');
        }
    }
}


// ======== ⚙️ 设置与数据管理 ========
function updateCustomIcon(index, emoji) {
  if (emoji && emoji.trim()) {
    customIcons[index - 1] = emoji.trim();
    saveData("customIcons");
    renderCustomIcons();
  }
}

function renderCustomIcons() {
  customIcons.forEach((icon, i) => {
    const el = document.getElementById(`custom-icon-${i + 1}`);
    if (el) el.textContent = icon;
  });
}

function saveCustomCSS() {
    const input = document.getElementById('custom-css-input');
    const newCSS = input.value;
    localStorage.setItem('customChatCSS', newCSS);
    applyCustomChatCSS(newCSS);
    alert('样式已保存！');
}

function applyCustomChatCSS(css) {
    let styleTag = document.getElementById('custom-chat-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'custom-chat-style';
        document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = css;
}

function exportData() {
  const allData = { tasks, anniversaries, diaries, chats, customIcons, customChatCSS: localStorage.getItem('customChatCSS') || '', version: "1.0.4" };
  const dataStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `小本子备份_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('数据已导出！');
}

function importData(input) {
  const file = input.files[0];
  if (!file || !confirm('导入数据将覆盖当前所有数据，确定吗？')) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version) throw new Error("Invalid file");
      tasks = data.tasks || [];
      anniversaries = data.anniversaries || [];
      diaries = data.diaries || [];
      chats = data.chats || [];
      customIcons = data.customIcons || ["🐱", "💖", "📱"];
      
      const customCSS = data.customChatCSS || "";
      localStorage.setItem('customChatCSS', customCSS);
      applyCustomChatCSS(customCSS);
      
      saveAllData();
      loadAllData();
      alert('数据导入成功！');
    } catch (err) { alert('文件格式错误，导入失败！'); }
  };
  reader.readAsText(file);
  input.value = '';
}

function clearAllData() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！') && confirm('再次确认：真的要删除所有数据吗？')) {
    localStorage.clear();
    loadAllData();
    applyCustomChatCSS('');
    alert('所有数据已清空！');
  }
}

// ======== 数据持久化 ========
function saveData(key) {
  const dataMap = { tasks, anniversaries, diaries, chats, customIcons };
  localStorage.setItem(key, JSON.stringify(dataMap[key]));
}

function saveAllData() {
  Object.keys({ tasks, anniversaries, diaries, chats, customIcons }).forEach(saveData);
}

function loadAllData() {
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    anniversaries = JSON.parse(localStorage.getItem("anniversaries")) || [];
    diaries = JSON.parse(localStorage.getItem("diaries")) || [];
    chats = JSON.parse(localStorage.getItem("chats")) || [];
    customIcons = JSON.parse(localStorage.getItem("customIcons")) || ["🐱", "💖", "📱"];
    
    // Migration from old chat format
    const oldChatData = localStorage.getItem('chatData');
    if (oldChatData && chats.length === 0) {
        const migratedChat = {
            id: 'migrated-1',
            name: localStorage.getItem('chatName') || '我们的聊天',
            avatar: localStorage.getItem('receivedAvatar') || '',
            background: localStorage.getItem('chatBackground') || '',
            messages: JSON.parse(oldChatData)
        };
        chats.push(migratedChat);
        localStorage.removeItem('chatData');
        localStorage.removeItem('chatName');
        localStorage.removeItem('receivedAvatar');
        localStorage.removeItem('chatBackground');
        saveData('chats');
    }

    renderEverything();
}

function renderEverything() {
    renderTasks();
    renderAnnis();
    renderDiaries();
    renderCustomIcons();
    updateAnniversaryDisplay();
    renderChatList();
    const customCssInput = document.getElementById('custom-css-input');
    if(customCssInput) customCssInput.value = localStorage.getItem('customChatCSS') || '';
}


// ======== 页面切换 ========
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(`${pageId}-page`).style.display = 'block';

  document.querySelectorAll('.tab-bar button').forEach(b => b.classList.remove('active'));
  const activeTabMap = {
    'todo': 'tab-todo',
    'features': 'tab-features',
    'anniversary': 'tab-features',
    'diary': 'tab-features',
    'chat-list': 'tab-features',
    'settings': 'tab-settings'
  };
  const activeTab = document.getElementById(activeTabMap[pageId]);
  if (activeTab) activeTab.classList.add('active');
  
  const tabBar = document.querySelector('.tab-bar');
  tabBar.style.display = (pageId === 'chat') ? 'none' : 'flex';

  if(pageId === 'chat-list') renderChatList();
}

// ======== 初始化 ========
document.addEventListener("DOMContentLoaded", () => {
  const savedCSS = localStorage.getItem('customChatCSS') || '';
  applyCustomChatCSS(savedCSS);
  loadAllData();
  showPage('todo'); // Fix initial page bug

  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
     chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  const taskInput = document.getElementById('new-task');
  if(taskInput) {
    taskInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') { e.preventDefault(); addTask(); }
    });
  }
  
  const dateInputs = ['anni-date', 'diary-date'];
  dateInputs.forEach(id => {
      const el = document.getElementById(id);
      if(el && !el.value) el.value = new Date().toISOString().split("T")[0];
  });

  setInterval(renderAnnis, 60000);
});