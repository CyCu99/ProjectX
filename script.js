document.addEventListener('DOMContentLoaded', () => {
    // Inicjalizacja aplikacji
    const DOM = {
        expenseForm: document.getElementById('expense-form'),
        expenseList: document.getElementById('expense-list'),
        chartCanvas: document.getElementById('expense-chart'),
        filterCategory: document.getElementById('filter-category'),
        filterMonth: document.getElementById('filter-month'),
        filterSearch: document.getElementById('filter-search'),
        resetFiltersBtn: document.getElementById('reset-filters'),
        expenseCounter: document.getElementById('expense-counter'),
        limitWarning: document.getElementById('limit-warning'),
        themeToggle: document.getElementById('theme-toggle'),
        monthlyLimitInput: document.getElementById('monthly-limit'),
        setLimitBtn: document.getElementById('set-limit-btn'),
        budgetProgress: document.getElementById('budget-progress'),
        budgetText: document.getElementById('budget-text')
    };

    // Stan aplikacji
    const state = {
        expenses: JSON.parse(localStorage.getItem('expenses')) || [],
        reminders: JSON.parse(localStorage.getItem('reminders')) || [],
        monthlyLimit: parseFloat(localStorage.getItem('monthlyLimit')) || null,
        theme: localStorage.getItem('theme') || 'light',
        chart: null
    };

    // Inicjalizacja
    init();

    function init() {
        setupEventListeners();
        applyTheme(state.theme);
        updateCategoryFilters();
        renderAll();
        checkReminders();
    }

    function setupEventListeners() {
        // Formularze
        DOM.expenseForm.addEventListener('submit', handleExpenseSubmit);
        document.getElementById('fuel-form').addEventListener('submit', handleFuelCalc);
        document.getElementById('reminder-form').addEventListener('submit', handleReminderSubmit);

        // Filtry
        DOM.filterCategory.addEventListener('change', renderAll);
        DOM.filterMonth.addEventListener('change', renderAll);
        DOM.filterSearch.addEventListener('input', renderAll);
        DOM.resetFiltersBtn.addEventListener('click', resetFilters);

        // Przyciski akcji
        DOM.setLimitBtn.addEventListener('click', setMonthlyLimit);
        document.getElementById('export-btn').addEventListener('click', exportToCSV);
        document.getElementById('reset-btn').addEventListener('click', resetData);
        DOM.themeToggle.addEventListener('click', toggleTheme);

        // Listy
        DOM.expenseList.addEventListener('click', handleExpenseListClick);
        document.getElementById('reminder-list').addEventListener('click', handleReminderListClick);
    }

    // ==================== FUNKCJE TEMATU ====================
    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(state.theme);
        localStorage.setItem('theme', state.theme);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const moonIcon = DOM.themeToggle.querySelector('.fa-moon');
        const sunIcon = DOM.themeToggle.querySelector('.fa-sun');
        
        moonIcon.style.display = theme === 'light' ? 'inline-block' : 'none';
        sunIcon.style.display = theme === 'dark' ? 'inline-block' : 'none';

        // Aktualizacja wykresu po zmianie motywu
        if (state.chart) {
            renderChart();
        }
    }

    // ==================== FUNKCJE WYDATKÓW ====================
    function handleExpenseSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('category').value.trim();
        const type = document.getElementById('type').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const formMessage = DOM.expenseForm.querySelector('.form-message');

        // Walidacja
        if (!category || !type || isNaN(amount) || amount <= 0 || !date) {
            showMessage(formMessage, 'Wypełnij wszystkie pola poprawnie!', 'error');
            return;
        }

        // Sprawdź czy wydatek jest z bieżącego miesiąca
        const currentMonth = new Date().toISOString().slice(0, 7);
        const expenseMonth = date.slice(0, 7);
        
        if (currentMonth !== expenseMonth && state.monthlyLimit) {
            if (!confirm('Dodajesz wydatek z innego miesiąca. Czy na pewno?')) return;
        }

        try {
            state.expenses.push({ category, type, amount, date });
            saveData();
            updateCategoryFilters();
            renderAll();
            showConfirmation(`Dodano wydatek: ${type} - ${amount.toFixed(2)} zł`);
            DOM.expenseForm.reset();
        } catch (error) {
            console.error('Błąd:', error);
            showMessage(formMessage, 'Wystąpił błąd podczas dodawania', 'error');
        }
    }

    function updateCategoryFilters() {
        const categories = [...new Set(state.expenses.map(e => e.category))];
        DOM.filterCategory.innerHTML = '<option value="">Wszystkie kategorie</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            DOM.filterCategory.appendChild(option);
        });
    }

    function filterExpenses() {
        const category = DOM.filterCategory.value;
        const month = DOM.filterMonth.value;
        const search = DOM.filterSearch.value.toLowerCase();
        
        return state.expenses.filter(expense => {
            const matchesCategory = !category || expense.category === category;
            const matchesMonth = !month || expense.date.startsWith(month);
            const matchesSearch = !search || 
                expense.type.toLowerCase().includes(search) || 
                expense.category.toLowerCase().includes(search);
            
            return matchesCategory && matchesMonth && matchesSearch;
        });
    }

    function renderExpenses() {
        const filteredExpenses = filterExpenses();
        DOM.expenseList.innerHTML = '';
        
        if (filteredExpenses.length === 0) {
            DOM.expenseList.innerHTML = '<li class="no-expenses">Brak wydatków do wyświetlenia</li>';
            return;
        }

        filteredExpenses.forEach((expense, index) => {
            const li = document.createElement('li');
            li.className = 'expense-item';
            li.innerHTML = `
                <div class="expense-info">
                    <span class="expense-date">${formatDate(expense.date)}</span>
                    <span class="expense-category">${expense.category}</span>
                    <span class="expense-type">${expense.type}</span>
                </div>
                <div class="expense-amount">
                    ${expense.amount.toFixed(2)} zł
                    <button class="delete-btn" data-id="${index}" aria-label="Usuń wydatek">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            DOM.expenseList.appendChild(li);
        });
    }

    function handleExpenseListClick(e) {
        const deleteBtn = e.target.closest('.delete-btn');
        if (!deleteBtn) return;
        
        const index = deleteBtn.getAttribute('data-id');
        if (confirm('Czy na pewno chcesz usunąć ten wydatek?')) {
            state.expenses.splice(index, 1);
            saveData();
            renderAll();
            showConfirmation('Wydatek został usunięty');
        }
    }

    // ==================== LIMIT WYDATKÓW ====================
    function setMonthlyLimit() {
        const newLimit = parseFloat(DOM.monthlyLimitInput.value);

        if (newLimit > 0) {
            state.monthlyLimit = newLimit;
            saveData();
            DOM.monthlyLimitInput.value = '';
            updateBudgetProgress();
            showConfirmation(`Limit miesięczny ustawiony na ${newLimit} zł`);
        } else {
            showMessage(DOM.expenseForm.querySelector('.form-message'), 'Wprowadź poprawną kwotę!', 'error');
        }
    }

    function updateBudgetProgress() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyExpenses = state.expenses
            .filter(exp => exp.date.startsWith(currentMonth))
            .reduce((sum, exp) => sum + exp.amount, 0);

        if (!state.monthlyLimit) {
            DOM.budgetProgress.style.setProperty('--progress', '0%');
            DOM.budgetText.textContent = 'Nie ustawiono limitu';
            DOM.limitWarning.style.display = 'none';
            return;
        }

        const percentage = Math.min((monthlyExpenses / state.monthlyLimit) * 100, 100);
        const remaining = state.monthlyLimit - monthlyExpenses;

        DOM.budgetProgress.style.setProperty('--progress', `${percentage}%`);

        // Zmiana stylów w zależności od wykorzystania limitu
        if (percentage >= 90) {
            DOM.budgetProgress.classList.add('warning');
            
            if (percentage >= 100) {
                DOM.limitWarning.textContent = `Przekroczono limit o ${Math.abs(remaining).toFixed(2)} zł!`;
                DOM.limitWarning.style.display = 'block';
                if (percentage < 110) { // Zapobiegaj spamowaniu powiadomień
                    showConfirmation('Przekroczono miesięczny limit budżetu!', true);
                }
            } else {
                DOM.limitWarning.textContent = `Uwaga! Wykorzystano ${Math.round(percentage)}% limitu`;
                DOM.limitWarning.style.display = 'block';
                if (percentage >= 90 && percentage < 100) {
                    showConfirmation(`Uwaga! Wykorzystano ${Math.round(percentage)}% limitu`);
                }
            }
        } else {
            DOM.budgetProgress.classList.remove('warning');
            DOM.limitWarning.style.display = 'none';
        }

        DOM.budgetText.textContent = remaining >= 0 
            ? `Pozostało: ${remaining.toFixed(2)} zł` 
            : `Przekroczono o ${Math.abs(remaining).toFixed(2)} zł`;
    }

    // ==================== NARZĘDZIA SAMOCHODOWE ====================
    function handleFuelCalc(e) {
        e.preventDefault();
        const distance = parseFloat(document.getElementById('distance').value);
        const fuelUsed = parseFloat(document.getElementById('fuel-used').value);
        const fuelPrice = parseFloat(document.getElementById('fuel-price').value) || 0;

        if (distance <= 0 || fuelUsed <= 0) {
            showMessage(document.getElementById('fuel-form').querySelector('.form-message'), 'Wprowadź poprawne wartości!', 'error');
            return;
        }

        const consumption = (fuelUsed / distance) * 100;
        const costPerKm = (fuelUsed * fuelPrice) / distance;

        document.getElementById('consumption').textContent = consumption.toFixed(2);
        document.getElementById('cost-per-km').textContent = costPerKm.toFixed(3);
    }

    function handleReminderSubmit(e) {
        e.preventDefault();
        const type = document.getElementById('reminder-type').value;
        const date = document.getElementById('reminder-date').value;
        const notes = document.getElementById('reminder-notes').value.trim();

        if (!type || !date) {
            showMessage(document.getElementById('reminder-form').querySelector('.form-message'), 'Wypełnij wymagane pola!', 'error');
            return;
        }

        state.reminders.push({ type, date, notes });
        saveData();
        renderReminders();
        showConfirmation('Dodano przypomnienie');
        e.target.reset();
    }

    function renderReminders() {
        const list = document.getElementById('reminder-list');
        list.innerHTML = '';
        
        state.reminders.sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach((reminder, index) => {
                const li = document.createElement('li');
                li.className = 'reminder-item';
                li.innerHTML = `
                    <div class="reminder-info">
                        <span class="reminder-type">${reminder.type}</span>
                        <span class="reminder-date">${formatDate(reminder.date)}</span>
                        ${reminder.notes ? `<p class="reminder-notes">${reminder.notes}</p>` : ''}
                    </div>
                    <button class="delete-btn" data-reminder-id="${index}" aria-label="Usuń przypomnienie">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
                list.appendChild(li);
            });
    }

    function handleReminderListClick(e) {
        const deleteBtn = e.target.closest('.delete-btn');
        if (!deleteBtn) return;
        
        const index = deleteBtn.getAttribute('data-reminder-id');
        if (confirm('Usunąć to przypomnienie?')) {
            state.reminders.splice(index, 1);
            saveData();
            renderReminders();
            showConfirmation('Przypomnienie usunięte');
        }
    }

    // ==================== PODSUMOWANIE I WYKRESY ====================
    function updateSummary(filteredExpenses = state.expenses) {
        const totalElement = document.getElementById('total');
        const averageElement = document.getElementById('average');
        const maxElement = document.getElementById('max');
        const countElement = document.getElementById('count');
        
        if (filteredExpenses.length === 0) {
            totalElement.textContent = '0';
            averageElement.textContent = '0';
            maxElement.textContent = '0';
            countElement.textContent = '0';
            return;
        }
        
        const amounts = filteredExpenses.map(e => e.amount);
        const total = amounts.reduce((a, b) => a + b, 0);
        const average = total / amounts.length;
        const max = Math.max(...amounts);
        
        totalElement.textContent = total.toFixed(2);
        averageElement.textContent = average.toFixed(2);
        maxElement.textContent = max.toFixed(2);
        countElement.textContent = amounts.length;
    }

    function renderChart(filteredExpenses = state.expenses) {
        const totals = {};
        filteredExpenses.forEach(exp => {
            totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
        });
        
        const labels = Object.keys(totals);
        const data = Object.values(totals);
        
        if (state.chart) state.chart.destroy();
        
        if (labels.length > 0) {
            const isDarkMode = state.theme === 'dark';
            const textColor = isDarkMode ? '#f0f0f0' : '#333';
            const gridColor = isDarkMode ? 'rgba(240, 240, 240, 0.1)' : 'rgba(0, 0, 0, 0.1)';

            state.chart = new Chart(DOM.chartCanvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Wydatki',
                        data: data,
                        backgroundColor: [
                            '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#8AC24A', '#607D8B'
                        ],
                        borderColor: isDarkMode ? '#444' : '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: textColor
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${value.toFixed(2)} zł (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            DOM.chartCanvas.innerHTML = '<p class="no-chart-data">Brak danych do wyświetlenia wykresu</p>';
        }
    }

    // ==================== FUNKCJE POMOCNICZE ====================
    function renderAll() {
        const filteredExpenses = filterExpenses();
        renderExpenses();
        updateSummary(filteredExpenses);
        renderChart(filteredExpenses);
        updateBudgetProgress();
        updateCounter(filteredExpenses);
    }

    function updateCounter(filteredExpenses) {
        DOM.expenseCounter.textContent = `Wyświetlono ${filteredExpenses.length} z ${state.expenses.length} wydatków`;
    }

    function resetFilters() {
        DOM.filterCategory.value = '';
        DOM.filterMonth.value = '';
        DOM.filterSearch.value = '';
        renderAll();
    }

    function resetData() {
        if (confirm("Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć.")) {
            localStorage.clear();
            state.expenses = [];
            state.reminders = [];
            state.monthlyLimit = null;
            state.chart = null;
            saveData();
            renderAll();
            renderReminders();
            showConfirmation("Wszystkie dane zostały zresetowane");
        }
    }

    function exportToCSV() {
        if (state.expenses.length === 0) {
            showConfirmation("Brak danych do eksportu!", true);
            return;
        }

        const headers = ["Data", "Kategoria", "Typ", "Kwota"];
        const rows = state.expenses.map(e => [e.date, e.category, e.type, e.amount]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `wydatki_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function checkReminders() {
        const today = new Date().toISOString().split('T')[0];
        const upcoming = state.reminders
            .filter(r => r.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date));
        
        if (upcoming.length > 0 && upcoming[0].date === today) {
            showConfirmation(`Dzisiaj masz zaplanowane: ${upcoming[0].type}!`);
        }
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('pl-PL', options);
    }

    function saveData() {
        localStorage.setItem('expenses', JSON.stringify(state.expenses));
        localStorage.setItem('reminders', JSON.stringify(state.reminders));
        if (state.monthlyLimit) {
            localStorage.setItem('monthlyLimit', state.monthlyLimit);
        }
    }

    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `form-message ${type}`;
        setTimeout(() => {
            element.className = 'form-message';
            element.textContent = '';
        }, 5000);
    }

    function showConfirmation(message, isError = false) {
        const confirmation = document.createElement('div');
        confirmation.className = `confirmation-message ${isError ? 'error-message' : ''}`;
        confirmation.textContent = message;
        document.body.appendChild(confirmation);
        
        setTimeout(() => {
            confirmation.style.animation = 'fadeInOut 3s ease-in-out';
            setTimeout(() => confirmation.remove(), 3000);
        }, 0);
    }
});