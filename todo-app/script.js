const STORAGE_KEY = 'todoListTasks';
const STORAGE_FILTER = 'todoListFilter';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const tasksList = document.getElementById('tasksList');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');
const clearAllBtn = document.getElementById('clearAll');

const statTotal = document.getElementById('statTotal');
const statCompleted = document.getElementById('statCompleted');
const statProgress = document.getElementById('statProgress');

const countAll = document.getElementById('countAll');
const countActive = document.getElementById('countActive');
const countCompleted = document.getElementById('countCompleted');

let tasks = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadFilter();
    renderTasks();
    updateStats();
    updateFilterCounts();
    attachEventListeners();
});

function attachEventListeners() {
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    clearAllBtn.addEventListener('click', clearAllTasks);
}

function addTask() {
    const text = taskInput.value.trim();
    if (text === '') {
        showNotification('Please enter a task');
        return;
    }
    if (text.length > 200) {
        showNotification('Task is too long (max 200 characters)');
        return;
    }
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    };
    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
    updateFilterCounts();
    taskInput.value = '';
    taskInput.focus();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
        updateFilterCounts();
    }
}

function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('removing');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            updateFilterCounts();
        }, 300);
    }
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        showNotification('No completed tasks to clear');
        return;
    }
    if (confirm(`Clear ${completedCount} completed task(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();
        updateFilterCounts();
        showNotification(`Cleared ${completedCount} completed task(s)`, 'success');
    }
}

function clearAllTasks() {
    if (tasks.length === 0) {
        showNotification('No tasks to clear');
        return;
    }
    if (confirm(`Delete all ${tasks.length} task(s)? This cannot be undone.`)) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
        updateFilterCounts();
        showNotification('All tasks cleared', 'success');
    }
}

function setFilter(filter) {
    currentFilter = filter;
    localStorage.setItem(STORAGE_FILTER, filter);
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    renderTasks();
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    tasksList.innerHTML = '';
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `<div class="empty-state"><p class="empty-icon">🎉</p><p class="empty-text">${currentFilter === 'all' ? 'No tasks yet. Add one to get started!' : currentFilter === 'active' ? 'No active tasks. Great job!' : 'No completed tasks yet.'}</p></div>`;
        return;
    }
    filteredTasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''}`;
        div.dataset.id = task.id;
        div.innerHTML = `<input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle task completion"><span class="task-text">${escapeHtml(task.text)}</span><span class="task-time">${task.createdAt}</span><button class="task-delete" aria-label="Delete task">🗑️</button>`;
        const checkbox = div.querySelector('.task-checkbox');
        const deleteBtn = div.querySelector('.task-delete');
        checkbox.addEventListener('change', () => toggleTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        tasksList.appendChild(div);
    });
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    statTotal.textContent = total;
    statCompleted.textContent = completed;
    statProgress.textContent = `${progress}%`;
}

function updateFilterCounts() {
    const all = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    countAll.textContent = all;
    countActive.textContent = active;
    countCompleted.textContent = completed;
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
        showNotification('Failed to save tasks', 'error');
    }
}

function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        tasks = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
        showNotification('Error loading tasks', 'error');
    }
}

function loadFilter() {
    const stored = localStorage.getItem(STORAGE_FILTER);
    if (stored && ['all', 'active', 'completed'].includes(stored)) {
        setFilter(stored);
    }
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'}; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-weight: 600; z-index: 1000; animation: slideIn 0.3s ease; max-width: 300px; word-wrap: break-word;`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        taskInput.focus();
    }
});