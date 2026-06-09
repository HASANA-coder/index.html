// Data Storage
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let currentDetailCustomerId = null;
let filteredCustomers = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    renderCustomersTable();
    updateBalanceDisplay();
});

// ==================== Navigation ====================
function showDashboard() {
    hideAllViews();
    document.getElementById('dashboard').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.nav-item')[0].classList.add('active');
    updateDashboard();
}

function showCustomers() {
    hideAllViews();
    document.getElementById('customers').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.nav-item')[1].classList.add('active');
    clearSearch();
    renderCustomersTable();
    updateBalanceDisplay();
}

function showCustomerDetail(id) {
    currentDetailCustomerId = id;
    hideAllViews();
    document.getElementById('customerDetail').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    updateCustomerDetail();
}

function hideAllViews() {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
}

// ==================== Dashboard ====================
function updateDashboard() {
    if (customers.length === 0) {
        document.getElementById('totalDebt').textContent = '$0.00';
        document.getElementById('totalPaid').textContent = '$0.00';
        document.getElementById('customersInDebt').textContent = '0';
        document.getElementById('totalCustomersText').textContent = 'Out of 0 total customers';
        document.getElementById('highestDebtor').textContent = 'None';
        document.getElementById('highestDebtAmount').textContent = '$0.00';
        document.getElementById('topDebtorsContainer').innerHTML = '<p class="empty-state">No customers currently in debt.</p>';
        return;
    }

    // Calculate metrics
    let totalDebt = 0;
    let totalPaid = 0;
    let debtorsCount = 0;
    let highestDebt = 0;
    let highestDebtorName = 'None';
    const debtors = [];

    customers.forEach(customer => {
        const debt = customer.initialAmount - customer.paidAmount;
        if (debt > 0) {
            totalDebt += debt;
            debtorsCount++;
            debtors.push({ name: customer.name, debt: debt });
            if (debt > highestDebt) {
                highestDebt = debt;
                highestDebtorName = customer.name;
            }
        }
        totalPaid += customer.paidAmount;
    });

    // Update UI
    document.getElementById('totalDebt').textContent = formatCurrency(totalDebt);
    document.getElementById('totalPaid').textContent = formatCurrency(totalPaid);
    document.getElementById('customersInDebt').textContent = debtorsCount;
    document.getElementById('totalCustomersText').textContent = `Out of ${customers.length} total customers`;
    document.getElementById('highestDebtor').textContent = highestDebtorName;
    document.getElementById('highestDebtAmount').textContent = formatCurrency(highestDebt);

    // Update Top Debtors
    const topDebtors = debtors.sort((a, b) => b.debt - a.debt).slice(0, 5);
    if (topDebtors.length > 0) {
        const topDebtorsHTML = topDebtors.map(debtor => `
            <div class="debtor-item">
                <div class="debtor-info">
                    <div class="debtor-name">${debtor.name}</div>
                    <div class="debtor-amount">Owes: ${formatCurrency(debtor.debt)}</div>
                </div>
            </div>
        `).join('');
        document.getElementById('topDebtorsContainer').innerHTML = topDebtorsHTML;
    } else {
        document.getElementById('topDebtorsContainer').innerHTML = '<p class="empty-state">No customers currently in debt.</p>';
    }
}

// ==================== Update Balance Display ====================
function updateBalanceDisplay() {
    let totalBalance = 0;
    
    customers.forEach(customer => {
        const debt = customer.initialAmount - customer.paidAmount;
        if (debt > 0) {
            totalBalance += debt;
        }
    });
    
    document.getElementById('balanceAmount').textContent = formatCurrency(totalBalance);
}

// ==================== Customers Management ====================
function renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    
    if (customers.length === 0) {
        tbody.innerHTML =
        '<tr class="empty-row"><td colspan="3" class="empty-message">No customers match your search.</td></tr>';
        return;
    }

    const customersToDisplay = filteredCustomers.length > 0 ? filteredCustomers : customers;
    
    if (customersToDisplay.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6" class="empty-message">No customers match your search.</td></tr>';
        return;
    }

    tbody.innerHTML = customersToDisplay.map(customer => {
        const debt = customer.initialAmount - customer.paidAmount;
        let status = 'Paid';
        let statusClass = 'paid';
        
        if (debt > 0) {
            status = customer.paidAmount > 0 ? 'Partial' : 'Pending';
            statusClass = customer.paidAmount > 0 ? 'partial' : 'pending';
        }

        return `
        <tr>
            <td><strong>${customer.name}</strong></td>
            <td><strong>${formatCurrency(debt)}</strong></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="showCustomerDetail(${customer.id})" title="Edit">📝</button>
                    <button class="btn-icon delete" onclick="deleteCustomer(${customer.id})" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// ==================== Add Customer ====================
function showAddCustomerModal() {
    document.getElementById('addCustomerModal').classList.add('active');
    document.getElementById('customerName').focus();
}

function closeAddCustomerModal() {
    document.getElementById('addCustomerModal').classList.remove('active');
    document.getElementById('customerName').value = '';
    document.getElementById('initialAmount').value = '';
}

function submitAddCustomer(e) {
    e.preventDefault();
    const name = document.getElementById('customerName').value.trim();
    const initialAmount = parseFloat(document.getElementById('initialAmount').value);

    if (!name || initialAmount <= 0) {
        alert('Please enter valid customer details');
        return;
    }

    const newCustomer = {
        id: Date.now(),
        name: name,
        initialAmount: initialAmount,
        paidAmount: 0
    };

    customers.push(newCustomer);
    saveCustomers();
    closeAddCustomerModal();
    renderCustomersTable();
    updateDashboard();
    updateBalanceDisplay();
}

// ==================== Delete Customer ====================
function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        customers = customers.filter(c => c.id !== id);
        saveCustomers();
        renderCustomersTable();
        updateDashboard();
        updateBalanceDisplay();
    }
}

function deleteCurrentCustomer() {
    if (confirm('Are you sure you want to delete this customer?')) {
        customers = customers.filter(c => c.id !== currentDetailCustomerId);
        saveCustomers();
        showCustomers();
    }
}

// ==================== Customer Detail ====================
function updateCustomerDetail() {
    const customer = customers.find(c => c.id === currentDetailCustomerId);
    if (!customer) return;

    document.getElementById('detailCustomerName').textContent = customer.name;
    
    const debt = customer.initialAmount - customer.paidAmount;
    document.getElementById('detailRemainingAmount').textContent = formatCurrency(debt);

    // Clear input fields
    document.getElementById('addPaymentAmount').value = '';
    document.getElementById('subtractPaymentAmount').value = '';
}

function addPayment() {
    const amount = parseFloat(document.getElementById('addPaymentAmount').value);
    const customer = customers.find(c => c.id === currentDetailCustomerId);

    if (!customer || amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
    }

    const remaining = customer.initialAmount - customer.paidAmount;
    if (amount > remaining) {
        alert(`Cannot add more than the remaining balance of ${formatCurrency(remaining)}`);
        return;
    }

    customer.paidAmount += amount;
    saveCustomers();
    updateCustomerDetail();
    updateDashboard();
    updateBalanceDisplay();
    document.getElementById('addPaymentAmount').value = '';
}

function subtractPayment() {
    const amount = parseFloat(document.getElementById('subtractPaymentAmount').value);
    const customer = customers.find(c => c.id === currentDetailCustomerId);

    if (!customer || amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
    }

    if (amount > customer.paidAmount) {
        alert(`Cannot subtract more than the paid amount of ${formatCurrency(customer.paidAmount)}`);
        return;
    }

    customer.paidAmount -= amount;
    saveCustomers();
    updateCustomerDetail();
    updateDashboard();
    updateBalanceDisplay();
    document.getElementById('subtractPaymentAmount').value = '';
}

// ==================== Search ====================
function filterCustomers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        filteredCustomers = [];
        renderCustomersTable();
        updateBalanceDisplay();
        return;
    }

    filteredCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm)
    );
    renderCustomersTable();
    updateBalanceDisplay();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    filteredCustomers = [];
}

// ==================== Utilities ====================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function saveCustomers() {
    localStorage.setItem('customers', JSON.stringify(customers));
}
