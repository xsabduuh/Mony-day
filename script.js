/**
 * ============================================
 * تطبيق تتبع الأهداف المالية
 * Finance Goals Tracker App
 * ============================================
 * 
 * المميزات:
 * - إنشاء وإدارة أهداف مالية متعددة
 * - تتبع التقدم بصرياً باستخدام المخططات الدائرية
 * - رسوم متحركة وتأثيرات بصرية
 * - تخزين البيانات في localStorage
 * - واجهة متجاوبة لجميع الأجهزة
 */

// ============================================
// المتغيرات العامة
// ============================================

// بيانات الأهداف
let goals = [];

// معرف الهدف المحدد للحذف
let goalToDelete = null;

// مخططات Chart.js
const charts = {};

// ============================================
// عناصر DOM
// ============================================

const elements = {
    // الحاويات
    goalsGrid: document.getElementById('goalsGrid'),
    emptyState: document.getElementById('emptyState'),
    toastContainer: document.getElementById('toastContainer'),
    
    // الملخص
    totalGoals: document.getElementById('totalGoals'),
    totalSaved: document.getElementById('totalSaved'),
    totalTarget: document.getElementById('totalTarget'),
    
    // الأزرار الرئيسية
    btnAddGoal: document.getElementById('btnAddGoal'),
    
    // النوافذ المنبثقة
    goalModal: document.getElementById('goalModal'),
    addAmountModal: document.getElementById('addAmountModal'),
    historyModal: document.getElementById('historyModal'),
    deleteModal: document.getElementById('deleteModal'),
    
    // أزرار الإغلاق
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnCloseAddAmount: document.getElementById('btnCloseAddAmount'),
    btnCloseHistory: document.getElementById('btnCloseHistory'),
    btnCloseDelete: document.getElementById('btnCloseDelete'),
    
    // النماذج
    goalForm: document.getElementById('goalForm'),
    addAmountForm: document.getElementById('addAmountForm'),
    
    // حقول النموذج - إضافة هدف
    goalId: document.getElementById('goalId'),
    goalName: document.getElementById('goalName'),
    targetAmount: document.getElementById('targetAmount'),
    currentAmount: document.getElementById('currentAmount'),
    selectedColor: document.getElementById('selectedColor'),
    selectedIcon: document.getElementById('selectedIcon'),
    modalTitle: document.getElementById('modalTitle'),
    
    // منتقي الألوان والأيقونات
    colorPicker: document.getElementById('colorPicker'),
    iconPicker: document.getElementById('iconPicker'),
    
    // حقول النموذج - إضافة مبلغ
    addAmountGoalId: document.getElementById('addAmountGoalId'),
    amountToAdd: document.getElementById('amountToAdd'),
    
    // سجل المدخرات
    historyTitle: document.getElementById('historyTitle'),
    historyContent: document.getElementById('historyContent'),
    
    // أزرار الإلغاء والتأكيد
    btnCancel: document.getElementById('btnCancel'),
    btnCancelAddAmount: document.getElementById('btnCancelAddAmount'),
    btnCancelDelete: document.getElementById('btnCancelDelete'),
    btnConfirmDelete: document.getElementById('btnConfirmDelete'),
};

// ============================================
// تهيئة التطبيق
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
    setupEventListeners();
    renderGoals();
    updateSummary();
});

// ============================================
// إدارة البيانات - localStorage
// ============================================

/**
 * حفظ الأهداف في localStorage
 */
function saveGoals() {
    try {
        localStorage.setItem('financeGoals', JSON.stringify(goals));
    } catch (error) {
        console.error('Error saving goals:', error);
        showToast('حدث خطأ أثناء حفظ البيانات', 'error');
    }
}

/**
 * تحميل الأهداف من localStorage
 */
function loadGoals() {
    try {
        const saved = localStorage.getItem('financeGoals');
        if (saved) {
            goals = JSON.parse(saved);
            // التأكد من وجود سجل لكل هدف
            goals.forEach(goal => {
                if (!goal.history) {
                    goal.history = [];
                }
            });
        }
    } catch (error) {
        console.error('Error loading goals:', error);
        goals = [];
    }
}

// ============================================
// عرض الأهداف
// ============================================

/**
 * عرض جميع الأهداف
 */
function renderGoals() {
    // تنظيف الشبكة
    elements.goalsGrid.innerHTML = '';
    
    // تدمير المخططات القديمة
    Object.values(charts).forEach(chart => chart.destroy());
    Object.keys(charts).forEach(key => delete charts[key]);
    
    // عرض الحالة الفارغة إذا لم يكن هناك أهداف
    if (goals.length === 0) {
        elements.emptyState.classList.add('active');
        return;
    }
    
    elements.emptyState.classList.remove('active');
    
    // عرض كل هدف
    goals.forEach(goal => {
        const goalCard = createGoalCard(goal);
        elements.goalsGrid.appendChild(goalCard);
        
        // إنشاء المخطط الدائري
        createDonutChart(goal);
    });
}

/**
 * إنشاء بطاقة الهدف
 */
function createGoalCard(goal) {
    const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount);
    const isCompleted = percentage >= 100;
    
    const card = document.createElement('div');
    card.className = `goal-card ${isCompleted ? 'completed' : ''}`;
    card.style.setProperty('--goal-color', goal.color);
    card.style.setProperty('--goal-color-light', lightenColor(goal.color, 20));
    card.dataset.id = goal.id;
    
    card.innerHTML = `
        <div class="goal-header">
            <div class="goal-info">
                <div class="goal-icon">
                    <i class="fas ${goal.icon}"></i>
                </div>
                <div class="goal-title-section">
                    <h3>${escapeHtml(goal.name)}</h3>
                    <span class="goal-status ${isCompleted ? 'completed' : ''}">
                        ${isCompleted ? 'تم تحقيق الهدف!' : 'قيد التقدم'}
                    </span>
                </div>
            </div>
            <div class="goal-actions">
                <button class="btn-icon history" onclick="showHistory('${goal.id}')" title="سجل المدخرات">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn-icon edit" onclick="editGoal('${goal.id}')" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="confirmDelete('${goal.id}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        
        <div class="goal-chart-section">
            <div class="chart-container">
                <canvas id="chart-${goal.id}"></canvas>
                <div class="chart-percentage">
                    <span class="percentage">${Math.round(percentage)}%</span>
                    <span class="label">مكتمل</span>
                </div>
            </div>
        </div>
        
        <div class="goal-amounts">
            <div class="amount-box saved">
                <div class="amount-label">المدخر</div>
                <div class="amount-value">${formatCurrency(goal.currentAmount)}</div>
            </div>
            <div class="amount-box target">
                <div class="amount-label">المستهدف</div>
                <div class="amount-value">${formatCurrency(goal.targetAmount)}</div>
            </div>
        </div>
        
        <div class="progress-section">
            <div class="progress-bar-container">
                <div class="progress-bar ${isCompleted ? 'completed' : ''}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
        </div>
        
        <div class="goal-buttons">
            <button class="btn-add-money" onclick="showAddAmountModal('${goal.id}')">
                <i class="fas fa-plus-circle"></i>
                إضافة مبلغ
            </button>
            <button class="btn-quick-add" onclick="quickAdd('${goal.id}', 100)" title="إضافة 100">
                +100
            </button>
            <button class="btn-quick-add" onclick="quickAdd('${goal.id}', 500)" title="إضافة 500">
                +500
            </button>
            <button class="btn-quick-add" onclick="quickAdd('${goal.id}', 1000)" title="إضافة 1000">
                +1K
            </button>
        </div>
    `;
    
    return card;
}

/**
 * إنشاء المخطط الدائري
 */
function createDonutChart(goal) {
    const ctx = document.getElementById(`chart-${goal.id}`);
    if (!ctx) return;
    
    const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount);
    const remaining = Math.max(0, 100 - percentage);
    
    charts[goal.id] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentage, remaining],
                backgroundColor: [
                    goal.color,
                    'rgba(255, 255, 255, 0.1)'
                ],
                borderWidth: 0,
                cutout: '75%',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

/**
 * تحديث ملخص الإحصائيات
 */
function updateSummary() {
    const totalGoals = goals.length;
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    
    animateNumber(elements.totalGoals, totalGoals);
    animateNumber(elements.totalSaved, totalSaved, true);
    animateNumber(elements.totalTarget, totalTarget, true);
}

// ============================================
// إدارة الأهداف
// ============================================

/**
 * إضافة هدف جديد
 */
function addGoal(goalData) {
    const newGoal = {
        id: generateId(),
        name: goalData.name,
        targetAmount: parseFloat(goalData.targetAmount),
        currentAmount: parseFloat(goalData.currentAmount) || 0,
        color: goalData.color,
        icon: goalData.icon,
        createdAt: new Date().toISOString(),
        history: []
    };
    
    // إضافة السجل الأول إذا كان هناك مبلغ مدخر
    if (newGoal.currentAmount > 0) {
        newGoal.history.push({
            id: generateId(),
            amount: newGoal.currentAmount,
            date: new Date().toISOString(),
            note: 'المبلغ الابتدائي'
        });
    }
    
    goals.push(newGoal);
    saveGoals();
    renderGoals();
    updateSummary();
    
    // التحقق من اكتمال الهدف
    if (newGoal.currentAmount >= newGoal.targetAmount) {
        setTimeout(() => celebrateGoal(newGoal.id), 500);
    }
    
    showToast('تم إضافة الهدف بنجاح', 'success');
}

/**
 * تحديث هدف موجود
 */
function updateGoal(id, goalData) {
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return;
    
    const oldGoal = goals[index];
    const wasCompleted = oldGoal.currentAmount >= oldGoal.targetAmount;
    
    goals[index] = {
        ...oldGoal,
        name: goalData.name,
        targetAmount: parseFloat(goalData.targetAmount),
        currentAmount: parseFloat(goalData.currentAmount) || 0,
        color: goalData.color,
        icon: goalData.icon
    };
    
    // التحقق من اكتمال الهدف
    const isCompleted = goals[index].currentAmount >= goals[index].targetAmount;
    if (isCompleted && !wasCompleted) {
        setTimeout(() => celebrateGoal(id), 500);
    }
    
    saveGoals();
    renderGoals();
    updateSummary();
    showToast('تم تحديث الهدف بنجاح', 'success');
}

/**
 * حذف هدف
 */
function deleteGoal(id) {
    goals = goals.filter(g => g.id !== id);
    saveGoals();
    renderGoals();
    updateSummary();
    showToast('تم حذف الهدف بنجاح', 'success');
}

/**
 * إضافة مبلغ لهدف
 */
function addAmountToGoal(id, amount) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    const wasCompleted = goal.currentAmount >= goal.targetAmount;
    const oldAmount = goal.currentAmount;
    
    goal.currentAmount += amount;
    
    // إضافة للسجل
    if (!goal.history) goal.history = [];
    goal.history.push({
        id: generateId(),
        amount: amount,
        date: new Date().toISOString(),
        note: 'إضافة مبلغ'
    });
    
    // التحقق من اكتمال الهدف
    const isCompleted = goal.currentAmount >= goal.targetAmount;
    
    saveGoals();
    renderGoals();
    updateSummary();
    
    // تأثيرات
    if (isCompleted && !wasCompleted) {
        celebrateGoal(id);
    } else {
        pulseGoalCard(id);
    }
    
    showToast(`تم إضافة ${formatCurrency(amount)} بنجاح`, 'success');
}

/**
 * إضافة سريعة
 */
function quickAdd(id, amount) {
    addAmountToGoal(id, amount);
}

// ============================================
// النوافذ المنبثقة
// ============================================

/**
 * فتح نافذة إضافة هدف
 */
function openAddModal() {
    resetForm();
    elements.modalTitle.textContent = 'إضافة هدف جديد';
    elements.goalId.value = '';
    elements.goalModal.classList.add('active');
}

/**
 * فتح نافذة تعديل هدف
 */
function editGoal(id) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    resetForm();
    elements.modalTitle.textContent = 'تعديل الهدف';
    elements.goalId.value = goal.id;
    elements.goalName.value = goal.name;
    elements.targetAmount.value = goal.targetAmount;
    elements.currentAmount.value = goal.currentAmount;
    
    // تحديد اللون
    selectColor(goal.color);
    
    // تحديد الأيقونة
    selectIcon(goal.icon);
    
    elements.goalModal.classList.add('active');
}

/**
 * عرض نافذة إضافة مبلغ
 */
function showAddAmountModal(id) {
    elements.addAmountGoalId.value = id;
    elements.amountToAdd.value = '';
    elements.addAmountModal.classList.add('active');
    elements.amountToAdd.focus();
}

/**
 * عرض سجل المدخرات
 */
function showHistory(id) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    elements.historyTitle.textContent = `سجل المدخرات - ${goal.name}`;
    
    if (!goal.history || goal.history.length === 0) {
        elements.historyContent.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-inbox"></i>
                <p>لا يوجد سجل مدخرات بعد</p>
            </div>
        `;
    } else {
        const sortedHistory = [...goal.history].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        elements.historyContent.innerHTML = `
            <div class="history-list">
                ${sortedHistory.map(item => `
                    <div class="history-item">
                        <div class="history-item-info">
                            <div class="history-item-icon">
                                <i class="fas fa-plus"></i>
                            </div>
                            <div class="history-item-details">
                                <span class="history-item-amount">+${formatCurrency(item.amount)}</span>
                                <span class="history-item-date">${formatDate(item.date)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    elements.historyModal.classList.add('active');
}

/**
 * تأكيد الحذف
 */
function confirmDelete(id) {
    goalToDelete = id;
    elements.deleteModal.classList.add('active');
}

/**
 * إغلاق جميع النوافذ
 */
function closeAllModals() {
    elements.goalModal.classList.remove('active');
    elements.addAmountModal.classList.remove('active');
    elements.historyModal.classList.remove('active');
    elements.deleteModal.classList.remove('active');
    goalToDelete = null;
}

// ============================================
// معالجة الأحداث
// ============================================

function setupEventListeners() {
    // زر إضافة هدف
    elements.btnAddGoal.addEventListener('click', openAddModal);
    
    // أزرار الإغلاق
    elements.btnCloseModal.addEventListener('click', closeAllModals);
    elements.btnCloseAddAmount.addEventListener('click', closeAllModals);
    elements.btnCloseHistory.addEventListener('click', closeAllModals);
    elements.btnCloseDelete.addEventListener('click', closeAllModals);
    
    // أزرار الإلغاء
    elements.btnCancel.addEventListener('click', closeAllModals);
    elements.btnCancelAddAmount.addEventListener('click', closeAllModals);
    elements.btnCancelDelete.addEventListener('click', closeAllModals);
    
    // نموذج إضافة/تعديل هدف
    elements.goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const goalData = {
            name: elements.goalName.value.trim(),
            targetAmount: elements.targetAmount.value,
            currentAmount: elements.currentAmount.value,
            color: elements.selectedColor.value,
            icon: elements.selectedIcon.value
        };
        
        const id = elements.goalId.value;
        if (id) {
            updateGoal(id, goalData);
        } else {
            addGoal(goalData);
        }
        
        closeAllModals();
    });
    
    // نموذج إضافة مبلغ
    elements.addAmountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = elements.addAmountGoalId.value;
        const amount = parseFloat(elements.amountToAdd.value);
        
        if (id && amount > 0) {
            addAmountToGoal(id, amount);
            closeAllModals();
        }
    });
    
    // تأكيد الحذف
    elements.btnConfirmDelete.addEventListener('click', () => {
        if (goalToDelete) {
            deleteGoal(goalToDelete);
            closeAllModals();
        }
    });
    
    // منتقي الألوان
    elements.colorPicker.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            selectColor(btn.dataset.color);
        });
    });
    
    // منتقي الأيقونات
    elements.iconPicker.querySelectorAll('.icon-option').forEach(btn => {
        btn.addEventListener('click', () => {
            selectIcon(btn.dataset.icon);
        });
    });
    
    // إغلاق النوافذ بالنقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // إغلاق بالزر Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ============================================
// أدوات مساعدة
// ============================================

/**
 * اختيار اللون
 */
function selectColor(color) {
    elements.colorPicker.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
    elements.selectedColor.value = color;
}

/**
 * اختيار الأيقونة
 */
function selectIcon(icon) {
    elements.iconPicker.querySelectorAll('.icon-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.icon === icon);
    });
    elements.selectedIcon.value = icon;
}

/**
 * إعادة تعيين النموذج
 */
function resetForm() {
    elements.goalForm.reset();
    elements.goalId.value = '';
    selectColor('#6366f1');
    selectIcon('fa-car');
}

/**
 * حساب النسبة المئوية
 */
function calculatePercentage(current, target) {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
}

/**
 * تنسيق المبلغ كعملة
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * تنسيق التاريخ
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * توليد معرف فريد
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * تفادي حقن HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * تفتيح اللون
 */
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

/**
 * رسوم متحركة للأرقام
 */
function animateNumber(element, target, isCurrency = false) {
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (target - start) * easeOutQuart;
        
        element.textContent = isCurrency ? formatCurrency(current) : Math.round(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ============================================
// التأثيرات البصرية
// ============================================

/**
 * تأثير الاحتفال عند اكتمال الهدف
 */
function celebrateGoal(goalId) {
    const card = document.querySelector(`.goal-card[data-id="${goalId}"]`);
    if (!card) return;
    
    // Confetti effect
    const rect = card.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { x, y },
        colors: ['#22c55e', '#4ade80', '#fbbf24', '#f59e0b', '#ec4899'],
        disableForReducedMotion: true,
        zIndex: 2000
    });
    
    // Sparkle effect
    createSparkles(card);
    
    // Toast notification
    setTimeout(() => {
        showToast('مبروك! لقد حققت هدفك', 'success');
    }, 500);
}

/**
 * تأثير النبض على بطاقة الهدف
 */
function pulseGoalCard(goalId) {
    const card = document.querySelector(`.goal-card[data-id="${goalId}"]`);
    if (!card) return;
    
    card.style.animation = 'none';
    card.offsetHeight; // Trigger reflow
    card.style.animation = 'pulse 0.5s ease';
    
    setTimeout(() => {
        card.style.animation = '';
    }, 500);
}

/**
 * إنشاء تأثير Sparkle
 */
function createSparkles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = centerX + (Math.random() - 0.5) * 200 + 'px';
            sparkle.style.top = centerY + (Math.random() - 0.5) * 200 + 'px';
            sparkle.style.background = ['#gold', '#fbbf24', '#f59e0b', '#22c55e'][Math.floor(Math.random() * 4)];
            document.body.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 1000);
        }, i * 50);
    }
}

/**
 * عرض Toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // إزالة بعد 3 ثواني
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================
// دوال عامة للوصول من HTML
// ============================================

window.editGoal = editGoal;
window.showHistory = showHistory;
window.confirmDelete = confirmDelete;
window.showAddAmountModal = showAddAmountModal;
window.quickAdd = quickAdd;