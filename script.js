const addGoalBtn = document.getElementById('addGoal');
const goalsContainer = document.getElementById('goalsContainer');

let goals = JSON.parse(localStorage.getItem('goals')) || [];

function saveGoals() {
  localStorage.setItem('goals', JSON.stringify(goals));
}

function renderGoals() {
  goalsContainer.innerHTML = '';
  goals.forEach((goal, index) => {
    const goalDiv = document.createElement('div');
    goalDiv.classList.add('goal');

    goalDiv.innerHTML = `
      <h3>${goal.title} - ${goal.current} / ${goal.amount} د.م</h3>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${Math.min((goal.current / goal.amount) * 100, 100)}%"></div>
      </div>
      <div class="add-amount">
        <input type="number" placeholder="أضف مبلغ" id="amount${index}">
        <button onclick="addAmount(${index})">أضف</button>
      </div>
    `;

    goalsContainer.appendChild(goalDiv);
  });
}

function addAmount(index) {
  const input = document.getElementById(`amount${index}`);
  const value = parseFloat(input.value);
  if (!isNaN(value) && value > 0) {
    goals[index].current += value;
    if (goals[index].current > goals[index].amount) goals[index].current = goals[index].amount;
    saveGoals();
    renderGoals();
    input.value = '';
  }
}

addGoalBtn.addEventListener('click', () => {
  const title = document.getElementById('goalTitle').value.trim();
  const amount = parseFloat(document.getElementById('goalAmount').value);
  if (title && !isNaN(amount) && amount > 0) {
    goals.push({ title, amount, current: 0 });
    saveGoals();
    renderGoals();
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalAmount').value = '';
  }
});

renderGoals();
