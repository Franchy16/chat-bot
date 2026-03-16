// ========== Configuration ==========
// Backend chạy cùng origin → dùng URL tương đối
const API_BASE = '/api';
const API_URL = `${API_BASE}/knowledge`;

// ========== Authentication ==========
let authToken = null;

// Check authentication on page load
function checkAuth() {
    authToken = localStorage.getItem('adminToken');
    
    if (!authToken) {
        // No token, redirect to login
        window.location.href = '/login.html';
        return false;
    }

    // Verify token
    fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            // Token invalid, redirect to login
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login.html';
        } else {
            // Update user info in header
            updateUserInfo(data.user);
        }
    })
    .catch(err => {
        console.error('Auth error:', err);
        window.location.href = '/login.html';
    });

    return true;
}

function updateUserInfo(user) {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && user) {
        userInfo.textContent = user.username;
    }
}

// Get auth headers for API calls
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Logout function
function logout() {
    customConfirm({
        title: 'Xác nhận đăng xuất',
        message: 'Bạn có chắc muốn đăng xuất?',
        icon: 'warning',
        confirmText: 'Đăng xuất',
        confirmClass: 'btn-danger',
        onConfirm: () => {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('rememberMe');
            window.location.href = '/login.html';
        }
    });
}

// ========== DOM Elements ==========
const modal = document.getElementById('modal');
const deleteModal = document.getElementById('deleteModal');
const knowledgeForm = document.getElementById('knowledgeForm');
const tableBody = document.getElementById('knowledgeTableBody');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');

// Buttons
const addBtn = document.getElementById('addBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const fileInput = document.getElementById('fileInput');
const closeModal = document.getElementById('closeModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const cancelBtn = document.getElementById('cancelBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Stats section elements
const refreshStatsBtn = document.getElementById('refreshStatsBtn');
const statsTotal = document.getElementById('statsTotal');
const statsCreated14 = document.getElementById('statsCreated14');
const statsUpdated14 = document.getElementById('statsUpdated14');
const statsLongestTableBody = document.getElementById('statsLongestTableBody');
const statsChartCanvas = document.getElementById('statsChart');

// Settings section elements
const settingsForm = document.getElementById('settingsForm');
const reloadSettingsBtn = document.getElementById('reloadSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingAiEnabled = document.getElementById('settingAiEnabled');
const settingAiModel = document.getElementById('settingAiModel');
const settingSystemInstruction = document.getElementById('settingSystemInstruction');
const settingFuzzyThreshold = document.getElementById('settingFuzzyThreshold');
const settingImportMaxMb = document.getElementById('settingImportMaxMb');
const settingImportSkipDuplicates = document.getElementById('settingImportSkipDuplicates');

// Form inputs
const editIdInput = document.getElementById('editId');
const keywordInput = document.getElementById('keyword');
const answerInput = document.getElementById('answer');
const modalTitle = document.getElementById('modalTitle');
const charCounter = document.getElementById('charCounter');

// Search
const searchInput = document.getElementById('searchInput');

// Stats
const totalCount = document.getElementById('totalCount');
const todayCount = document.getElementById('todayCount');
const updatedCount = document.getElementById('updatedCount');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

// ========== State ==========
let knowledgeData = [];
let deleteId = null;
let statsLoadedOnce = false;
let settingsLoadedOnce = false;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    if (!checkAuth()) {
        return;
    }
    
    loadKnowledge();
    setupEventListeners();
});

// ========== Event Listeners ==========
function setupEventListeners() {
    // Buttons
    addBtn.addEventListener('click', openAddModal);
    refreshBtn.addEventListener('click', loadKnowledge);
    exportBtn.addEventListener('click', handleExport);
    importBtn.addEventListener('click', () => fileInput.click());
    downloadTemplateBtn.addEventListener('click', downloadTemplate);
    fileInput.addEventListener('change', handleImport);
    closeModal.addEventListener('click', closeModalHandler);
    closeDeleteModal.addEventListener('click', closeDeleteModalHandler);
    cancelBtn.addEventListener('click', closeModalHandler);
    cancelDeleteBtn.addEventListener('click', closeDeleteModalHandler);
    confirmDeleteBtn.addEventListener('click', confirmDelete);

    // Stats
    if (refreshStatsBtn) refreshStatsBtn.addEventListener('click', loadStats);

    // Settings
    if (settingsForm) settingsForm.addEventListener('submit', saveSettings);
    if (reloadSettingsBtn) reloadSettingsBtn.addEventListener('click', loadSettings);

    // Form
    knowledgeForm.addEventListener('submit', handleSubmit);
    answerInput.addEventListener('input', updateCharCounter);

    // Search
    searchInput.addEventListener('input', handleSearch);

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModalHandler();
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModalHandler();
    });
}

// ========== Navigation ==========
function switchSection(sectionName) {
    navItems.forEach(item => item.classList.remove('active'));
    contentSections.forEach(section => section.classList.remove('active'));

    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    document.getElementById(`${sectionName}-section`).classList.add('active');

    if (sectionName === 'stats') {
        loadStats();
    }

    if (sectionName === 'settings') {
        loadSettings();
    }
}

// ========== STATS (Báo cáo) ==========
async function loadStats() {
    try {
        if (!statsTotal) return;
        if (statsLoadedOnce && !document.getElementById('stats-section')?.classList.contains('active')) return;

        if (refreshStatsBtn) {
            refreshStatsBtn.disabled = true;
            refreshStatsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
        }

        // Loading placeholders
        statsLongestTableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="3">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Đang tải dữ liệu...
                    </div>
                </td>
            </tr>
        `;

        const response = await fetch(`${API_BASE}/stats`, { headers: getAuthHeaders() });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Stats error');

        const data = result.data;
        statsTotal.textContent = data.totals.total ?? 0;
        const created14 = (data.chart?.created || []).reduce((a, b) => a + b, 0);
        const updated14 = (data.chart?.updated || []).reduce((a, b) => a + b, 0);
        statsCreated14.textContent = created14;
        statsUpdated14.textContent = updated14;

        renderStatsChart(data.chart);
        renderLongestAnswersTable(data.topLongestAnswers || []);

        statsLoadedOnce = true;
    } catch (e) {
        console.error('Stats error:', e);
        showToast('Lỗi khi tải báo cáo', 'error');
    } finally {
        if (refreshStatsBtn) {
            refreshStatsBtn.disabled = false;
            refreshStatsBtn.innerHTML = '<i class="fas fa-sync"></i> Làm mới báo cáo';
        }
    }
}

function renderLongestAnswersTable(rows) {
    if (!statsLongestTableBody) return;
    if (!rows.length) {
        statsLongestTableBody.innerHTML = `
            <tr>
                <td colspan="3" style="padding:20px; color: var(--text-light);">Chưa có dữ liệu</td>
            </tr>
        `;
        return;
    }

    statsLongestTableBody.innerHTML = rows.map((r, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td class="keyword-cell">${escapeHtml(r.keyword || '')}</td>
            <td class="date-cell">${r.len ?? 0}</td>
        </tr>
    `).join('');
}

function renderStatsChart(chart) {
    if (!statsChartCanvas) return;
    const ctx = statsChartCanvas.getContext('2d');
    if (!ctx) return;

    const days = chart?.days || [];
    const created = chart?.created || [];
    const updated = chart?.updated || [];

    // clear
    ctx.clearRect(0, 0, statsChartCanvas.width, statsChartCanvas.height);

    // handle HiDPI
    const dpr = window.devicePixelRatio || 1;
    const rect = statsChartCanvas.getBoundingClientRect();
    statsChartCanvas.width = Math.floor(rect.width * dpr);
    statsChartCanvas.height = Math.floor(rect.height * dpr);
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 20;
    const chartH = h - padding * 2;
    const chartW = w - padding * 2;

    const maxV = Math.max(1, ...created, ...updated);
    const n = Math.max(days.length, 1);
    const groupW = chartW / n;
    const barW = Math.max(2, groupW * 0.35);

    // axes
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartH);
    ctx.lineTo(padding + chartW, padding + chartH);
    ctx.stroke();

    // bars
    for (let i = 0; i < n; i++) {
        const c = created[i] ?? 0;
        const u = updated[i] ?? 0;
        const x0 = padding + i * groupW + (groupW - barW * 2 - 6) / 2;

        const cH = (c / maxV) * (chartH - 10);
        const uH = (u / maxV) * (chartH - 10);

        // created (blue)
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x0, padding + chartH - cH, barW, cH);

        // updated (amber)
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x0 + barW + 6, padding + chartH - uH, barW, uH);
    }

    // legend
    ctx.fillStyle = '#111827';
    ctx.font = '12px Segoe UI';
    ctx.fillText('Thêm mới', padding + 10, padding + 12);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(padding, padding + 4, 8, 8);

    ctx.fillStyle = '#111827';
    ctx.fillText('Cập nhật', padding + 90, padding + 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(padding + 78, padding + 4, 8, 8);

    // reset transform (avoid double scaling if re-render)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ========== SETTINGS (Cài đặt) ==========
async function loadSettings() {
    try {
        if (!settingsForm) return;
        if (settingsLoadedOnce && !document.getElementById('settings-section')?.classList.contains('active')) return;

        if (reloadSettingsBtn) {
            reloadSettingsBtn.disabled = true;
            reloadSettingsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
        }

        const response = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Settings error');

        const s = result.data;
        settingAiEnabled.value = String(Boolean(s.ai?.enabled));
        settingAiModel.value = s.ai?.model || '';
        settingSystemInstruction.value = s.ai?.systemInstruction || '';
        settingFuzzyThreshold.value = s.fuzzy?.threshold ?? 0.4;
        settingImportMaxMb.value = s.importExport?.maxFileSizeMB ?? 5;
        settingImportSkipDuplicates.value = String(Boolean(s.importExport?.skipDuplicates));

        settingsLoadedOnce = true;
        showToast('Đã nạp cài đặt', 'success');
    } catch (e) {
        console.error('Settings load error:', e);
        showToast('Lỗi khi nạp cài đặt', 'error');
    } finally {
        if (reloadSettingsBtn) {
            reloadSettingsBtn.disabled = false;
            reloadSettingsBtn.innerHTML = '<i class="fas fa-sync"></i> Nạp lại';
        }
    }
}

async function saveSettings(e) {
    e.preventDefault();
    try {
        if (saveSettingsBtn) {
            saveSettingsBtn.disabled = true;
            saveSettingsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        }

        const payload = {
            ai: {
                enabled: settingAiEnabled.value === 'true',
                model: settingAiModel.value.trim(),
                systemInstruction: settingSystemInstruction.value.trim()
            },
            fuzzy: {
                threshold: Number(settingFuzzyThreshold.value)
            },
            importExport: {
                maxFileSizeMB: Number(settingImportMaxMb.value),
                skipDuplicates: settingImportSkipDuplicates.value === 'true'
            }
        };

        const response = await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Save settings failed');

        showToast('Đã lưu cài đặt', 'success');
        settingsLoadedOnce = false;
        await loadSettings();
    } catch (e2) {
        console.error('Settings save error:', e2);
        customAlert({
            title: 'Lỗi lưu cài đặt',
            message: e2.message || 'Không thể lưu',
            icon: 'danger',
            confirmText: 'Đóng',
            confirmClass: 'btn-primary'
        });
    } finally {
        if (saveSettingsBtn) {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.innerHTML = '<i class="fas fa-save"></i> Lưu cài đặt';
        }
    }
}

// ========== Load Knowledge ==========
async function loadKnowledge() {
    try {
        showLoading();
        
        const response = await fetch(API_URL, {
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) {
            knowledgeData = result.data;
            renderTable(knowledgeData);
            updateStats(knowledgeData);
        } else {
            showToast('Lỗi khi tải dữ liệu', 'error');
        }
    } catch (error) {
        console.error('Error loading knowledge:', error);
        showToast('Lỗi kết nối server', 'error');
        showEmptyState();
    }
}

// ========== Render Table ==========
function renderTable(data) {
    if (data.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    tableBody.innerHTML = data.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td class="keyword-cell">${escapeHtml(item.keyword)}</td>
            <td class="answer-cell" title="${escapeHtml(item.answer)}">
                ${escapeHtml(truncate(item.answer, 100))}
            </td>
            <td class="date-cell">
                ${item.createdAt ? formatDate(item.createdAt) : 'N/A'}
            </td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-primary" onclick="editKnowledge('${item.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteKnowledge('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ========== Update Stats ==========
function updateStats(data) {
    totalCount.textContent = data.length;

    // Count today's entries
    const today = new Date().toDateString();
    const todayEntries = data.filter(item => {
        if (!item.createdAt) return false;
        return new Date(item.createdAt).toDateString() === today;
    });
    todayCount.textContent = todayEntries.length;

    // Count updated entries
    const updatedEntries = data.filter(item => item.updatedAt);
    updatedCount.textContent = updatedEntries.length;
}

// ========== Modal Handlers ==========
function openAddModal() {
    modalTitle.textContent = 'Thêm câu trả lời mới';
    editIdInput.value = '';
    keywordInput.value = '';
    answerInput.value = '';
    updateCharCounter();
    modal.classList.add('show');
}

function openEditModal(item) {
    modalTitle.textContent = 'Chỉnh sửa câu trả lời';
    editIdInput.value = item.id;
    keywordInput.value = item.keyword;
    answerInput.value = item.answer;
    updateCharCounter();
    modal.classList.add('show');
}

function closeModalHandler() {
    modal.classList.remove('show');
    knowledgeForm.reset();
}

function closeDeleteModalHandler() {
    deleteModal.classList.remove('show');
    deleteId = null;
}

// ========== CRUD Operations ==========

// Create or Update
async function handleSubmit(e) {
    e.preventDefault();

    const keyword = keywordInput.value.trim();
    const answer = answerInput.value.trim();
    const id = editIdInput.value;

    if (!keyword || !answer) {
        showToast('Vui lòng điền đầy đủ thông tin', 'warning');
        return;
    }

    try {
        let response;
        
        if (id) {
            // Update
            response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ keyword, answer })
            });
        } else {
            // Create
            response = await fetch(API_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ keyword, answer })
            });
        }

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            closeModalHandler();
            loadKnowledge();
        } else {
            showToast(result.error || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error saving:', error);
        showToast('Lỗi kết nối server', 'error');
    }
}

// Edit
function editKnowledge(id) {
    const item = knowledgeData.find(item => item.id === id);
    if (item) {
        openEditModal(item);
    }
}

// Delete
function deleteKnowledge(id) {
    deleteId = id;
    deleteModal.classList.add('show');
}

async function confirmDelete() {
    if (!deleteId) return;

    try {
        const response = await fetch(`${API_URL}/${deleteId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            closeDeleteModalHandler();
            loadKnowledge();
        } else {
            showToast(result.error || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error deleting:', error);
        showToast('Lỗi kết nối server', 'error');
    }
}

// ========== Search ==========
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
        renderTable(knowledgeData);
        return;
    }

    const filtered = knowledgeData.filter(item => {
        return item.keyword.toLowerCase().includes(query) ||
               item.answer.toLowerCase().includes(query);
    });

    renderTable(filtered);
}

// ========== Utility Functions ==========

function showLoading() {
    tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="5">
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Đang tải dữ liệu...
                </div>
            </td>
        </tr>
    `;
    emptyState.style.display = 'none';
}

function showEmptyState() {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function updateCharCounter() {
    const length = answerInput.value.length;
    charCounter.textContent = `${length}/2000`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ========== Make functions global for onclick ==========
window.editKnowledge = editKnowledge;
window.deleteKnowledge = deleteKnowledge;

// ========== IMPORT/EXPORT FUNCTIONS ==========

// Export to Excel
async function handleExport() {
    try {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang export...';

        const response = await fetch(`${API_BASE}/knowledge/export`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        // Get blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knowledge-base-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Export Excel thành công!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Lỗi khi export Excel', 'error');
    } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = '<i class="fas fa-file-excel"></i> Export Excel';
    }
}

// Import from Excel
async function handleImport(event) {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        showToast('Chỉ chấp nhận file Excel (.xlsx, .xls)', 'error');
        fileInput.value = '';
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File quá lớn. Tối đa 5MB', 'error');
        fileInput.value = '';
        return;
    }

    customConfirm({
        title: 'Xác nhận Import',
        message: `Import file "${file.name}"?`,
        details: 'Câu hỏi trùng lặp sẽ bị bỏ qua.',
        icon: 'question',
        confirmText: 'Import',
        confirmClass: 'btn-success',
        confirmIcon: 'fa-file-upload',
        onConfirm: () => {
            performImport(file);
        },
        onCancel: () => {
            fileInput.value = '';
        }
    });
}

async function performImport(file) {
    try {
        importBtn.disabled = true;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang import...';

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload file
        const response = await fetch(`${API_BASE}/knowledge/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            
            // Show details if there are errors
            if (result.data && result.data.errors > 0) {
                console.log('Import errors:', result.data.details);
                const errorMsg = result.data.details.slice(0, 10).join('\n');
                const allErrors = result.data.details.length > 10 
                    ? errorMsg + `\n... và ${result.data.details.length - 10} lỗi khác`
                    : errorMsg;
                
                customAlert({
                    title: 'Kết quả Import',
                    message: `Import thành công: ${result.data.imported} câu trả lời\nLỗi: ${result.data.errors}`,
                    details: allErrors,
                    icon: 'warning',
                    confirmText: 'Đóng',
                    confirmClass: 'btn-primary'
                });
            }

            // Reload knowledge base
            loadKnowledge();
        } else {
            showToast(result.error || 'Import thất bại', 'error');
        }
    } catch (error) {
        console.error('Import error:', error);
        showToast('Lỗi khi import Excel', 'error');
    } finally {
        importBtn.disabled = false;
        importBtn.innerHTML = '<i class="fas fa-file-upload"></i> Import Excel';
        fileInput.value = '';
    }
}

// Download Template
async function downloadTemplate() {
    try {
        downloadTemplateBtn.disabled = true;
        downloadTemplateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';

        const response = await fetch(`${API_BASE}/knowledge/template`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Download failed');
        }

        // Get blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'knowledge-template.xlsx';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Tải template thành công!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('Lỗi khi tải template', 'error');
    } finally {
        downloadTemplateBtn.disabled = false;
        downloadTemplateBtn.innerHTML = '<i class="fas fa-download"></i> Template';
    }
}

// ========== CUSTOM MODAL FUNCTIONS ==========

// Custom Confirm (thay thế confirm())
function customConfirm(options = {}) {
    const modal = document.getElementById('customModal');
    const title = document.getElementById('customModalTitle');
    const message = document.getElementById('customModalMessage');
    const icon = document.getElementById('customModalIcon');
    const details = document.getElementById('customModalDetails');
    const actions = document.getElementById('customModalActions');
    const confirmBtn = document.getElementById('customModalConfirm');
    const cancelBtn = document.getElementById('customModalCancel');
    const closeBtn = document.getElementById('closeCustomModal');

    // Set content
    title.textContent = options.title || 'Xác nhận';
    message.textContent = options.message || '';
    
    // Set icon
    const iconType = options.icon || 'warning';
    const iconMap = {
        warning: 'fa-exclamation-triangle',
        danger: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        question: 'fa-question-circle'
    };
    icon.className = `custom-modal-icon ${iconType}`;
    icon.innerHTML = `<i class="fas ${iconMap[iconType] || iconMap.warning}"></i>`;

    // Set details if provided
    if (options.details) {
        details.style.display = 'block';
        details.textContent = options.details;
    } else {
        details.style.display = 'none';
    }

    // Set buttons
    confirmBtn.textContent = options.confirmText || 'Xác nhận';
    confirmBtn.className = `btn ${options.confirmClass || 'btn-primary'}`;
    if (options.confirmIcon) {
        confirmBtn.innerHTML = `<i class="fas ${options.confirmIcon}"></i> ${confirmBtn.textContent}`;
    }

    cancelBtn.textContent = options.cancelText || 'Hủy';

    // Show/hide cancel button
    if (options.showCancel === false) {
        cancelBtn.style.display = 'none';
    } else {
        cancelBtn.style.display = 'inline-flex';
    }

    // Clear previous event listeners by cloning
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newCloseBtn = closeBtn.cloneNode(true);
    
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    // Add event listeners
    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        if (options.onConfirm) {
            options.onConfirm();
        }
    });

    const closeHandler = () => {
        modal.classList.remove('show');
        if (options.onCancel) {
            options.onCancel();
        }
    };

    newCancelBtn.addEventListener('click', closeHandler);
    newCloseBtn.addEventListener('click', closeHandler);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeHandler();
        }
    });

    // Show modal
    modal.classList.add('show');
}

// Custom Alert (thay thế alert())
function customAlert(options = {}) {
    if (typeof options === 'string') {
        options = { message: options };
    }

    customConfirm({
        title: options.title || 'Thông báo',
        message: options.message || '',
        details: options.details || null,
        icon: options.icon || 'info',
        confirmText: options.confirmText || 'Đóng',
        confirmClass: options.confirmClass || 'btn-primary',
        showCancel: false,
        onConfirm: options.onConfirm || null
    });
}

