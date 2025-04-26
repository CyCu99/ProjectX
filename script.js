document.addEventListener("DOMContentLoaded", () => {
            const DOM = {
                expenseForm: document.getElementById("expense-form"),
                expenseList: document.getElementById("expense-list"),
                filterCategory: document.getElementById("filter-category"),
                filterMonth: document.getElementById("filter-month"),
                filterSearch: document.getElementById("filter-search"),
                resetFiltersBtn: document.getElementById("reset-filters"),
                expenseCounter: document.getElementById("expense-counter"),
                limitWarning: document.getElementById("limit-warning"),
                themeToggle: document.getElementById("theme-toggle"),
                monthlyLimitInput: document.getElementById("monthly-limit"),
                setLimitBtn: document.getElementById("set-limit-btn"),
                budgetProgress: document.getElementById("budget-progress"),
                budgetText: document.getElementById("budget-text"),
                exportAll: document.getElementById("export-all"),
                export0: document.getElementById("export-0"),
                export1: document.getElementById("export-1"),
                export2: document.getElementById("export-2"),
                export3: document.getElementById("export-3"),
                export4: document.getElementById("export-4"),
                export5: document.getElementById("export-5"),
                export6: document.getElementById("export-6"),
                export7: document.getElementById("export-7"),
                export8: document.getElementById("export-8"),
                export9: document.getElementById("export-9"),
                export10: document.getElementById("export-10"),
                export11: document.getElementById("export-11"),
            };

            const position = {
                topRight: "top-right",
                top: "top",
                topLeft: "top-left",
                bottomRight: "bottom-right",
                bottom: "bottom",
                bottomLeft: "bottom-left",
            };

            const state = {
                expenses: JSON.parse(localStorage.getItem('expenses')) || [],
                reminders: JSON.parse(localStorage.getItem('reminders')) || [],
                monthlyLimit: JSON.parse(localStorage.getItem('monthlyLimit')) || null,
                theme: localStorage.getItem("theme") || "light",
                charts: {},
                currentPage: 1,
                itemsPerPage: 10,
            };

            function saveData() {
                localStorage.setItem('expenses', JSON.stringify(state.expenses));
                localStorage.setItem('reminders', JSON.stringify(state.reminders));
                localStorage.setItem('monthlyLimit', JSON.stringify(state.monthlyLimit));
                console.log('Dane zapisane w localStorage.');
            }

            function loadData() {
                state.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
                state.reminders = JSON.parse(localStorage.getItem('reminders')) || [];
                state.monthlyLimit = JSON.parse(localStorage.getItem('monthlyLimit')) || null;
                console.log('Dane załadowane z localStorage.');
                renderAll();
            }

            function renderAll() {
                console.log('Renderowanie danych:', state);
                renderExpenses();
                renderCharts();
                updateBudgetProgress();
                updateCounter(filterExpenses());
                fillSummariesData();
            }

            init();

            function init() {
                loadData();
                applyTheme(state.theme);
                setupEventListeners();
                checkReminders();
                setupAccordion();
                renderAll();
            }

            function setupEventListeners() {
                DOM.expenseForm.addEventListener("submit", handleExpenseSubmit);
                document
                    .getElementById("fuel-form")
                    .addEventListener("submit", handleFuelCalc);
                document
                    .getElementById("reminder-form")
                    .addEventListener("submit", handleReminderSubmit);

                DOM.filterCategory.addEventListener("change", renderAll);
                DOM.filterMonth.addEventListener("change", renderAll);
                DOM.filterSearch.addEventListener("input", renderAll);
                DOM.resetFiltersBtn.addEventListener("click", resetFilters);

                DOM.setLimitBtn.addEventListener("click", setMonthlyLimit);
                DOM.themeToggle.addEventListener("click", toggleTheme);

                DOM.expenseList.addEventListener("click", handleExpenseListClick);
                document
                    .getElementById("reminder-list")
                    .addEventListener("click", handleReminderListClick);

                DOM.exportAll.addEventListener("click", () => exportToCSV(-1));
                DOM.export0.addEventListener("click", () => exportToCSV(0));
                DOM.export1.addEventListener("click", () => exportToCSV(1));
                DOM.export2.addEventListener("click", () => exportToCSV(2));
                DOM.export3.addEventListener("click", () => exportToCSV(3));
                DOM.export4.addEventListener("click", () => exportToCSV(4));
                DOM.export5.addEventListener("click", () => exportToCSV(5));
                DOM.export6.addEventListener("click", () => exportToCSV(6));
                DOM.export7.addEventListener("click", () => exportToCSV(7));
                DOM.export8.addEventListener("click", () => exportToCSV(8));
                DOM.export9.addEventListener("click", () => exportToCSV(9));
                DOM.export10.addEventListener("click", () => exportToCSV(10));
                DOM.export11.addEventListener("click", () => exportToCSV(11));

                document.getElementById("prev-page").addEventListener("click", () => {
                    if (state.currentPage > 1) {
                        state.currentPage--;
                        renderAll();
                    }
                });

                document.getElementById("next-page").addEventListener("click", () => {
                    const totalPages = Math.ceil(
                        filterExpenses().length / state.itemsPerPage
                    );
                    if (state.currentPage < totalPages) {
                        state.currentPage++;
                        renderAll();
                    }
                });

                const resetButton = document.getElementById("reset-button");
                resetButton.addEventListener("click", () => {
                    const confirmation = confirm("Czy na pewno chcesz zresetować wszystkie dane?");
                    if (confirmation) {
                        localStorage.clear();
                        alert("Dane zostały zresetowane!");
                        location.reload(); // Odśwież stronę, aby zastosować zmiany
                    }
                });
            }

            function toggleTheme() {
                state.theme = state.theme === "light" ? "dark" : "light";
                applyTheme(state.theme);
                localStorage.setItem("theme", state.theme);
            }

            function applyTheme(theme) {
                document.documentElement.setAttribute("data-theme", theme);
                renderCharts();
            }

            function handleExpenseSubmit(e) {
                e.preventDefault();

                const category = document.getElementById("category").value.trim();
                const type = document.getElementById("type").value.trim();
                const amount = parseFloat(document.getElementById("amount").value);
                const date = document.getElementById("date").value;
                const formMessage = DOM.expenseForm.querySelector(".form-message");

                if (!category || !type || isNaN(amount) || amount <= 0 || !date) {
                    showMessage(formMessage, "Wypełnij wszystkie pola poprawnie!", "error");
                    return;
                }

                const currentMonth = new Date().toISOString().slice(0, 7);
                const expenseMonth = date.slice(0, 7);

                if (currentMonth !== expenseMonth && state.monthlyLimit) {
                    if (!confirm("Dodajesz wydatek z innego miesiąca. Czy na pewno?")) return;
                }

                try {
                    state.expenses.push({ category, type, amount, date });
                    saveData();
                    renderAll();
                    showConfirmation(
                        `Dodano wydatek: ${type} - ${amount.toFixed(2)} zł`,
                        position.topRight,
                        false,
                        true
                    );
                    DOM.expenseForm.reset();
                    state.currentPage = 1;
                } catch (error) {
                    console.error("Błąd:", error);
                    showMessage(formMessage, "Wystąpił błąd podczas dodawania", "error");
                }
            }

            function filterExpenses() {
                const category = DOM.filterCategory.value;
                const month = DOM.filterMonth.value;
                const search = DOM.filterSearch.value.toLowerCase();

                return state.expenses.filter((expense) => {
                    const matchesCategory = !category || expense.category === category;
                    const matchesMonth = !month || expense.date.split("-")[1] === month;
                    const matchesSearch = !search ||
                        expense.type.toLowerCase().includes(search) ||
                        expense.category.toLowerCase().includes(search);

                    return matchesCategory && matchesMonth && matchesSearch;
                });
            }

            function renderExpenses() {
                const filteredExpenses = filterExpenses();
                const startIndex = (state.currentPage - 1) * state.itemsPerPage;
                const endIndex = startIndex + state.itemsPerPage;
                const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

                DOM.expenseList.innerHTML = "";

                if (paginatedExpenses.length === 0) {
                    DOM.expenseList.innerHTML =
                        '<li class="no-expenses">Brak wydatków do wyświetlenia</li>';
                    return;
                }

                paginatedExpenses.forEach((expense, index) => {
                    const li = document.createElement("li");
                    li.className = "expense-item";
                    li.innerHTML = `
        <div class="expense-info">
            <span class="expense-date">${formatDate(
              expense.date
            )}</span>
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

                const totalPages = Math.ceil(filteredExpenses.length / state.itemsPerPage);
                document.getElementById("prev-page").disabled = state.currentPage === 1;
                document.getElementById("next-page").disabled =
                    state.currentPage === totalPages || totalPages === 0;
                document.getElementById("page-info").textContent = `Strona ${
      state.currentPage
    } z ${totalPages || 1}`;
            }

            function handleExpenseListClick(e) {
                const deleteBtn = e.target.closest(".delete-btn");
                if (!deleteBtn) return;

                const index = deleteBtn.getAttribute("data-id");
                if (confirm("Czy na pewno chcesz usunąć ten wydatek?")) {
                    state.expenses.splice(index, 1);
                    saveData();
                    const totalPages = Math.ceil(
                        filterExpenses().length / state.itemsPerPage
                    );
                    if (state.currentPage > totalPages && totalPages > 0) {
                        state.currentPage = totalPages;
                    }
                    renderAll();
                    showConfirmation(
                        "Wydatek został usunięty",
                        position.topRight,
                        false,
                        true
                    );
                }
            }

            function setMonthlyLimit() {
                const newLimit = parseFloat(DOM.monthlyLimitInput.value);

                if (newLimit > 0) {
                    state.monthlyLimit = newLimit;
                    saveData();
                    DOM.monthlyLimitInput.value = "";
                    updateBudgetProgress();
                    showConfirmation(
                        `Limit miesięczny ustawiony na ${newLimit} zł`,
                        position.topRight,
                        false,
                        true
                    );
                } else {
                    showMessage(
                        DOM.expenseForm.querySelector(".form-message"),
                        "Wprowadź poprawną kwotę!",
                        "error"
                    );
                }
            }

            function updateBudgetProgress() {
                const currentMonth = new Date().toISOString().slice(0, 7);
                const monthlyExpenses = state.expenses
                    .filter((exp) => exp.date.startsWith(currentMonth))
                    .reduce((sum, exp) => sum + exp.amount, 0);

                if (!state.monthlyLimit) {
                    DOM.budgetProgress.style.setProperty("--progress", "0%");
                    DOM.budgetText.textContent = "Nie ustawiono limitu";
                    DOM.limitWarning.style.display = "none";
                    return;
                }

                const percentage = Math.min(
                    (monthlyExpenses / state.monthlyLimit) * 100,
                    100
                );
                const remaining = state.monthlyLimit - monthlyExpenses;

                DOM.budgetProgress.style.setProperty("--progress", `${percentage}%`);

                if (percentage >= 90) {
                    DOM.budgetProgress.classList.add("warning");

                    if (percentage >= 100) {
                        DOM.limitWarning.textContent = `Przekroczono limit o ${Math.abs(
          remaining
        ).toFixed(2)} zł!`;
                        DOM.limitWarning.style.display = "block";
                        if (percentage < 110) {
                            showConfirmation(
                                "Przekroczono miesięczny limit budżetu!",
                                position.topRight,
                                true,
                                true
                            );
                        }
                    } else {
                        DOM.limitWarning.textContent = `Uwaga! Wykorzystano ${Math.round(
          percentage
        )}% limitu`;
                        DOM.limitWarning.style.display = "block";
                        if (percentage >= 90 && percentage < 100) {
                            showConfirmation(
                                `Uwaga! Wykorzystano ${Math.round(percentage)}% limitu`,
                                position.topRight,
                                false,
                                true
                            );
                        }
                    }
                } else {
                    DOM.budgetProgress.classList.remove("warning");
                    DOM.limitWarning.style.display = "none";
                }

                DOM.budgetText.textContent =
                    remaining >= 0 ?
                    `Pozostało: ${remaining.toFixed(2)} zł` :
                    `Przekroczono o ${Math.abs(remaining).toFixed(2)} zł`;
            }

            function handleFuelCalc(e) {
                e.preventDefault();
                const distance = parseFloat(document.getElementById("distance").value);
                const fuelUsed = parseFloat(document.getElementById("fuel-used").value);
                const fuelPrice =
                    parseFloat(document.getElementById("fuel-price").value) || 0;

                if (distance <= 0 || fuelUsed <= 0) {
                    showMessage(
                        document.getElementById("fuel-form").querySelector(".form-message"),
                        "Wprowadź poprawne wartości!",
                        "error"
                    );
                    return;
                }

                const consumption = (fuelUsed / distance) * 100;
                const costPerKm = (fuelUsed * fuelPrice) / distance;

                document.getElementById("consumption").textContent = consumption.toFixed(2);
                document.getElementById("cost-per-km").textContent = costPerKm.toFixed(3);
            }

            function handleReminderSubmit(e) {
                e.preventDefault();
                const title = document.getElementById("reminder-title").value;
                const date = document.getElementById("reminder-date").value;
                const description = document
                    .getElementById("reminder-description")
                    .value.trim();

                if (!title || !date) {
                    showMessage(
                        document.getElementById("reminder-form").querySelector(".form-message"),
                        "Wypełnij wymagane pola!",
                        "error"
                    );
                    return;
                }

                state.reminders.push({ title, date, description });
                saveData();
                renderReminders();
                showConfirmation("Dodano przypomnienie", position.topRight, false, true);
                e.target.reset();
            }

            function renderReminders() {
                const list = document.getElementById("reminder-list");
                list.innerHTML = "";

                state.reminders
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .forEach((reminder, index) => {
                            const li = document.createElement("li");
                            const reminderDate = new Date(reminder.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            reminderDate.setHours(0, 0, 0, 0);

                            const timeDiff = reminderDate - today;
                            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                            let timeLeftText;
                            if (daysLeft === 0) {
                                timeLeftText = "Dzisiaj";
                            } else if (daysLeft < 0) {
                                const yearsAgo = Math.floor(Math.abs(daysLeft) / 365);
                                const daysAgo = Math.abs(daysLeft) % 365;
                                if (yearsAgo > 0) {
                                    timeLeftText = `${yearsAgo} ${
              yearsAgo === 1 ? "rok" : yearsAgo < 5 ? "lata" : "lat"
            }`;
                                    if (daysAgo > 0) {
                                        timeLeftText += ` i ${daysAgo} ${
                daysAgo === 1 ? "dzień" : "dni"
              } temu`;
                                    } else {
                                        timeLeftText += " temu";
                                    }
                                } else {
                                    timeLeftText = `${Math.abs(daysLeft)} ${
              Math.abs(daysLeft) === 1 ? "dzień" : "dni"
            } temu`;
                                }
                            } else {
                                const yearsLeft = Math.floor(daysLeft / 365);
                                const remainingDays = daysLeft % 365;
                                if (yearsLeft > 0) {
                                    timeLeftText = `${yearsLeft} ${
              yearsLeft === 1 ? "rok" : yearsLeft < 5 ? "lata" : "lat"
            }`;
                                    if (remainingDays > 0) {
                                        timeLeftText += ` i ${remainingDays} ${
                remainingDays === 1 ? "dzień" : "dni"
              }`;
                                    }
                                } else {
                                    timeLeftText = `${daysLeft} ${daysLeft === 1 ? "dzień" : "dni"}`;
                                }
                            }

                            if (daysLeft >= 0) {
                                if (daysLeft <= 1) {
                                    li.style.backgroundColor = "rgba(231, 76, 60, 0.2)";
                                } else if (daysLeft <= 7) {
                                    li.style.backgroundColor = "rgba(241, 196, 15, 0.2)";
                                }
                            }

                            li.className = "reminder-item";
                            li.innerHTML = `
          <div class="reminder-info">
             <span class="reminder-title bold">${
               reminder.title
             }</span>
              - 
             <span class="reminder-date italic">${formatDate(
               reminder.date
             )}</span>
              ${
                reminder.description
                  ? `<p class="reminder-description">${reminder.description}</p>`
                  : ""
              }
          </div>
         <div class="reminder-time-left">
             <span class="reminder-time-left-value">${timeLeftText}</span>
         </div>
          <button class="delete-btn" data-reminder-id="${index}" aria-label="Usuń przypomnienie">
              <i class="fas fa-trash-alt"></i>
          </button>
        `;
        list.appendChild(li);
      });
  }

  function handleReminderListClick(e) {
    const deleteBtn = e.target.closest(".delete-btn");
    if (!deleteBtn) return;

    const index = deleteBtn.getAttribute("data-reminder-id");
    if (confirm("Usunąć to przypomnienie?")) {
      state.reminders.splice(index, 1);
      saveData();
      renderReminders();
      showConfirmation(
        "Przypomnienie usunięte",
        position.topRight,
        false,
        true
      );
    }
  }

  function renderCharts() {
    const totals = {};
    state.expenses.forEach((exp) => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });

    const labels = Object.keys(totals);
    const data = Object.values(totals);

    createChart("expense-chart", labels, data);

    let isPreviousYear = false;

    for (let i = 0; i < 12; i++) {
      const monthTotal = {};
      let currentMonth = new Date().getMonth();
      let currentYear = new Date().getFullYear();

      currentMonth = currentMonth - i;
      if (currentMonth < 0) {
        currentMonth += 12;
        isPreviousYear = true;
      }

      if (isPreviousYear) {
        currentYear -= 1;
      }

      const monthExpenses = state.expenses.filter(
        (e) =>
          new Date(e.date).getMonth() === currentMonth &&
          new Date(e.date).getFullYear() === currentYear
      );
      monthExpenses.forEach((exp) => {
        monthTotal[exp.category] = (monthTotal[exp.category] || 0) + exp.amount;
      });

      const labels = Object.keys(monthTotal);
      const data = Object.values(monthTotal);

      createChart(`month-chart-${i}`, labels, data);
    }
  }

  function createChart(chartName, labels, data) {
    if (state.charts[chartName]) {
      state.charts[chartName].destroy();
    }

    const canvas = document.getElementById(chartName);
    if (!canvas) return;

    canvas.innerHTML = "";

    if (labels.length > 0) {
      canvas.parentElement.classList.remove("empty");
      const isDarkMode = state.theme === "dark";
      const textColor = isDarkMode ? "#f0f0f0" : "#333";
      const gridColor = isDarkMode
        ? "rgba(240, 240, 240, 0.1)"
        : "rgba(0, 0, 0, 0.1)";

      state.charts[chartName] = new Chart(canvas, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Wydatki",
              data: data,
              backgroundColor: [
                "#36A2EB",
                "#FF6384",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
                "#8AC24A",
                "#607D8B",
              ],
              borderColor: isDarkMode ? "#444" : "#fff",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: textColor,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${context.label}: ${value.toFixed(
                    2
                  )} zł (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      canvas.parentElement.classList.add("empty");
    }
  }

  function updateCounter(filteredExpenses) {
    DOM.expenseCounter.textContent = `Wyświetlono ${
      (state.currentPage - 1) * state.itemsPerPage + 1
    } - ${
      (state.currentPage - 1) * state.itemsPerPage + state.itemsPerPage <=
      filteredExpenses.length
        ? (state.currentPage - 1) * state.itemsPerPage + state.itemsPerPage
        : filteredExpenses.length
    } z ${filteredExpenses.length} wydatków`;
  }

  function resetFilters() {
    DOM.filterCategory.value = "";
    DOM.filterMonth.value = "";
    DOM.filterSearch.value = "";
    state.currentPage = 1;
    renderAll();
  }

  function resetData() {
    if (
      confirm(
        "Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć."
      )
    ) {
      localStorage.clear();
      state.expenses = [];
      state.reminders = [];
      state.monthlyLimit = null;
      state.charts = {};
      saveData();
      renderAll();
      renderReminders();
      showConfirmation(
        "Wszystkie dane zostały zresetowane",
        position.topRight,
        false,
        true
      );
    }
  }

  function exportToCSV(month) {
    if (state.expenses.length === 0) {
      showConfirmation(
        "Brak danych do eksportu!",
        position.topRight,
        true,
        true
      );
      return;
    }

    const headers = ["Data", "Kategoria", "Typ", "Kwota"];

    const currentDate = new Date();
    let targetMonth = currentDate.getMonth() - month;
    let targetYear = currentDate.getFullYear();

    if (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const rows = state.expenses
      .filter((e) => {
        if (month === -1) {
          return true;
        }
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getMonth() === targetMonth &&
          expenseDate.getFullYear() === targetYear
        );
      })
      .map((e) => [e.date, e.category, e.type, e.amount]);

    if (rows.length === 0) {
      showConfirmation(
        "Brak wydatków w wybranym miesiącu!",
        position.topRight,
        true,
        true
      );
      return;
    }

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const monthName =
      month === -1
        ? "wszystkie"
        : new Date(targetYear, targetMonth).toLocaleString("pl-PL", {
            month: "long",
            year: "numeric",
          });

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `wydatki_${new Date().toISOString().slice(0, 10)}_${monthName}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function checkReminders() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    state.reminders = state.reminders.filter((reminder) => {
      const reminderDate = new Date(reminder.date);
      const reminderDay = new Date(
        reminderDate.getFullYear(),
        reminderDate.getMonth(),
        reminderDate.getDate()
      );
      return reminderDay.getTime() >= today.getTime();
    });

    const todayReminders = state.reminders.filter((reminder) => {
      const reminderDate = new Date(reminder.date);
      const reminderDay = new Date(
        reminderDate.getFullYear(),
        reminderDate.getMonth(),
        reminderDate.getDate()
      );
      return reminderDay.getTime() === today.getTime();
    });

    todayReminders.forEach((reminder) => {
      showConfirmation(
        `Dzisiaj masz zaplanowane: ${reminder.title}!`,
        position.topRight,
        false,
        false
      );
    });

    saveData();
    renderReminders();
  }

  function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  }

  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `form-message ${type}`;
    setTimeout(() => {
      element.className = "form-message";
      element.textContent = "";
    }, 5000);
  }

  function showConfirmation(message, position, isError, autoClose) {
    const confirmation = document.createElement("div");
    confirmation.className = `confirmation-message ${position} ${
      isError ? "error-message" : ""
    }`;
    confirmation.textContent = message;

    if (!autoClose) {
      confirmation.style.cursor = "pointer";
      confirmation.title = "Click to dismiss";
      confirmation.addEventListener("click", () => {
        confirmation.style.animation = "fadeInOut 0.5s ease-in-out";
        setTimeout(() => confirmation.remove(), 500);
      });
    }

    document.body.appendChild(confirmation);

    if (autoClose) {
      setTimeout(() => {
        confirmation.style.animation = "fadeInOut 3s ease-in-out";
        setTimeout(() => confirmation.remove(), 3000);
      }, 0);
    }
  }

  function setupAccordion() {
    const headers = document.querySelectorAll(".accordion-header");
    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        const isActive = header.classList.contains("active");

        headers.forEach((h) => {
          h.classList.remove("active");
          h.nextElementSibling.classList.remove("active");
        });

        if (!isActive) {
          header.classList.add("active");
          content.classList.add("active");
        }
      });
    });
  }

  function fillSummariesData() {
    const totalElement = document.getElementById("total");
    const averageElement = document.getElementById("average");
    const maxElement = document.getElementById("max");
    const countElement = document.getElementById("count");

    const amounts = state.expenses.map((e) => e.amount);
    const total = amounts.reduce((a, b) => a + b, 0);
    const average = total / amounts.length;
    const max = Math.max(...amounts);

    totalElement.textContent = total.toFixed(2);
    averageElement.textContent = average.toFixed(2);
    maxElement.textContent = max.toFixed(2);
    countElement.textContent = amounts.length;

    let isPreviousYear = false;

    for (let i = 0; i < 12; i++) {
      let currentMonth = new Date().getMonth();
      let currentYear = new Date().getFullYear();

      currentMonth = currentMonth - i;
      if (currentMonth < 0) {
        currentMonth += 12;
        isPreviousYear = true;
      }

      if (isPreviousYear) {
        currentYear = currentYear - 1;
      }

      const monthName = new Date(0, currentMonth).toLocaleString("pl-PL", {
        month: "long",
      });

      const monthExpenses = state.expenses.filter(
        (e) =>
          new Date(e.date).getMonth() === currentMonth &&
          new Date(e.date).getFullYear() === currentYear
      );
      const total =
        monthExpenses.length > 0
          ? monthExpenses.reduce((a, b) => a + b.amount, 0)
          : 0;
      const average =
        monthExpenses.length > 0 ? total / monthExpenses.length : 0;
      const max =
        monthExpenses.length > 0
          ? Math.max(...monthExpenses.map((e) => e.amount))
          : 0;
      const count = monthExpenses.length;

      if (i === 0) {
        document.getElementById(`month-${i}`).textContent = "Obecny Miesiąc";
      } else if (i === 1) {
        document.getElementById(`month-${i}`).textContent = "Poprzedni Miesiąc";
      } else {
        document.getElementById(`month-${i}`).textContent =
          monthName + " " + currentYear;
      }
      document.getElementById(`total-${i}`).textContent = total.toFixed(2);
      document.getElementById(`average-${i}`).textContent = average.toFixed(2);
      document.getElementById(`max-${i}`).textContent = max.toFixed(2);
      document.getElementById(`count-${i}`).textContent = count;
    }
  }
});