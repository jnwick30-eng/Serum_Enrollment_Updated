// Application state
let employees = [];
let documents = [];
let currentTab = 'dashboard';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSampleData();
    updateDashboard();
    updateCurrentDate();
});

function initializeApp() {
    // Tab navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Form handlers
    setupOnboardingForm();
    setupDocumentForm();
    setupSearchFunctionality();
    setupModals();
}

function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;

    // Refresh content based on tab
    switch(tabName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'onboarding':
            renderEmployeesTable();
            break;
        case 'documents':
            renderDocumentsTable();
            populateEmployeeSelect();
            updateDocumentStats();
            break;
        case 'employees':
            renderEmployeesGrid();
            break;
    }
}

function setupOnboardingForm() {
    const newEmployeeBtn = document.getElementById('new-employee-btn');
    const onboardingFormContainer = document.getElementById('onboarding-form-container');
    const onboardingForm = document.getElementById('onboarding-form');
    const cancelOnboardingBtn = document.getElementById('cancel-onboarding');

    newEmployeeBtn.addEventListener('click', () => {
        onboardingFormContainer.style.display = 'block';
        generateEmployeeId();
        setDefaultStartDate();
    });

    cancelOnboardingBtn.addEventListener('click', () => {
        onboardingFormContainer.style.display = 'none';
        onboardingForm.reset();
    });

    onboardingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleOnboardingSubmit();
    });
}

function setupDocumentForm() {
    const uploadDocumentBtn = document.getElementById('upload-document-btn');
    const documentModal = document.getElementById('document-modal');
    const documentForm = document.getElementById('document-form');
    const cancelDocumentBtn = document.getElementById('cancel-document');

    uploadDocumentBtn.addEventListener('click', () => {
        documentModal.classList.add('active');
        populateEmployeeSelect();
    });

    cancelDocumentBtn.addEventListener('click', () => {
        documentModal.classList.remove('active');
        documentForm.reset();
    });

    documentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleDocumentSubmit();
    });
}

function setupSearchFunctionality() {
    const employeeSearch = document.getElementById('employee-search');
    const documentSearch = document.getElementById('document-search');
    const employeesOverviewSearch = document.getElementById('employees-overview-search');

    if (employeeSearch) {
        employeeSearch.addEventListener('input', (e) => {
            filterEmployeesTable(e.target.value);
        });
    }

    if (documentSearch) {
        documentSearch.addEventListener('input', (e) => {
            filterDocumentsTable(e.target.value);
        });
    }

    if (employeesOverviewSearch) {
        employeesOverviewSearch.addEventListener('input', (e) => {
            filterEmployeesGrid(e.target.value);
        });
    }
}

function setupModals() {
    const employeeModal = document.getElementById('employee-modal');
    const closeEmployeeModal = document.getElementById('close-employee-modal');
    const documentModal = document.getElementById('document-modal');
    const closeDocumentModal = document.getElementById('close-document-modal');

    closeEmployeeModal.addEventListener('click', () => {
        employeeModal.classList.remove('active');
    });

    closeDocumentModal.addEventListener('click', () => {
        documentModal.classList.remove('active');
    });

    employeeModal.addEventListener('click', (e) => {
        if (e.target === employeeModal) {
            employeeModal.classList.remove('active');
        }
    });

    documentModal.addEventListener('click', (e) => {
        if (e.target === documentModal) {
            documentModal.classList.remove('active');
        }
    });
}

function generateEmployeeId() {
    const prefix = 'SII';
    const year = new Date().getFullYear().toString().slice(-2);
    const timestamp = Date.now().toString().slice(-4);
    const employeeId = `${prefix}${year}${timestamp}`;
    document.getElementById('employee-id').value = employeeId;
}

function setDefaultStartDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').value = today;
}

function handleOnboardingSubmit() {
    const formData = new FormData(document.getElementById('onboarding-form'));
    const employeeData = Object.fromEntries(formData.entries());
    
    // Add additional fields
    employeeData.id = employeeData.employeeId;
    employeeData.status = 'in-progress';
    employeeData.onboardingTimestamp = new Date().toISOString();
    employeeData.progress = 25; // Initial progress
    employeeData.documentsSubmitted = 0;
    employeeData.documentsRequired = 8;

    employees.push(employeeData);
    
    // Hide form and reset
    document.getElementById('onboarding-form-container').style.display = 'none';
    document.getElementById('onboarding-form').reset();
    
    // Update displays
    renderEmployeesTable();
    updateDashboard();
    addActivity('onboarding', `New employee onboarded: ${employeeData.firstName} ${employeeData.lastName}`);
    
    showNotification('Employee onboarding started successfully!', 'success');
}

function handleDocumentSubmit() {
    const formData = new FormData(document.getElementById('document-form'));
    const documentData = Object.fromEntries(formData.entries());
    
    // Find employee info
    const employee = employees.find(e => e.id === documentData.employeeId);
    if (!employee) {
        showNotification('Employee not found!', 'error');
        return;
    }
    
    // Add additional fields
    documentData.id = `DOC${Date.now()}`;
    documentData.employeeName = `${employee.firstName} ${employee.lastName}`;
    documentData.status = 'pending';
    documentData.uploadDate = new Date().toISOString();
    documentData.fileName = documentData.file ? 'Document uploaded' : 'No file';

    documents.push(documentData);
    
    // Update employee progress
    employee.documentsSubmitted++;
    employee.progress = Math.min(100, (employee.documentsSubmitted / employee.documentsRequired) * 100);
    
    if (employee.progress === 100) {
        employee.status = 'completed';
    }
    
    // Hide modal and reset
    document.getElementById('document-modal').classList.remove('active');
    document.getElementById('document-form').reset();
    
    // Update displays
    renderDocumentsTable();
    renderEmployeesTable();
    updateDashboard();
    updateDocumentStats();
    addActivity('document', `Document uploaded for ${documentData.employeeName}: ${documentData.documentName}`);
    
    showNotification('Document uploaded successfully!', 'success');
}

function populateEmployeeSelect() {
    const select = document.getElementById('doc-employee');
    select.innerHTML = '<option value="">Select Employee</option>';
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.id} - ${employee.firstName} ${employee.lastName}`;
        select.appendChild(option);
    });
}

function renderEmployeesTable() {
    const tbody = document.getElementById('employees-table-body');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No employees in onboarding yet</h3>
                    <p>Click "Add New Employee" to start the onboarding process</p>
                </td>
            </tr>
        `;
        return;
    }

    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.firstName} ${employee.lastName}</td>
            <td>${capitalizeFirst(employee.department)}</td>
            <td>${employee.position}</td>
            <td>${formatDate(employee.startDate)}</td>
            <td><span class="status-badge ${employee.status}">${capitalizeFirst(employee.status.replace('-', ' '))}</span></td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${employee.progress}%"></div>
                </div>
                <small>${Math.round(employee.progress)}% complete</small>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewEmployee('${employee.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editEmployee('${employee.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteEmployee('${employee.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderDocumentsTable() {
    const tbody = document.getElementById('documents-table-body');
    tbody.innerHTML = '';

    if (documents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h3>No documents uploaded yet</h3>
                    <p>Click "Upload Document" to add employee documents</p>
                </td>
            </tr>
        `;
        return;
    }

    documents.forEach(document => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${document.documentName}</td>
            <td>${document.employeeName}</td>
            <td>${capitalizeFirst(document.category)}</td>
            <td>${formatDate(document.uploadDate)}</td>
            <td><span class="status-badge ${document.status}">${capitalizeFirst(document.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewDocument('${document.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="approveDocument('${document.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteDocument('${document.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderEmployeesGrid() {
    const grid = document.getElementById('employees-grid');
    grid.innerHTML = '';

    if (employees.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No employees in system yet</h3>
                <p>Switch to the New Hire tab to add your first employee</p>
            </div>
        `;
        return;
    }

    employees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.onclick = () => viewEmployee(employee.id);
        
        const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`;
        const employeeDocuments = documents.filter(d => d.employeeId === employee.id);
        
        card.innerHTML = `
            <div class="employee-header">
                <div class="employee-avatar">${initials}</div>
                <div class="employee-info">
                    <h3>${employee.firstName} ${employee.lastName}</h3>
                    <p>${employee.id}</p>
                </div>
            </div>
            <div class="employee-details">
                <div class="employee-detail">
                    <label>Department</label>
                    <span>${capitalizeFirst(employee.department)}</span>
                </div>
                <div class="employee-detail">
                    <label>Position</label>
                    <span>${employee.position}</span>
                </div>
                <div class="employee-detail">
                    <label>Start Date</label>
                    <span>${formatDate(employee.startDate)}</span>
                </div>
                <div class="employee-detail">
                    <label>Documents</label>
                    <span>${employeeDocuments.length} uploaded</span>
                </div>
            </div>
            <div class="onboarding-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${employee.progress}%"></div>
                </div>
                <small>${Math.round(employee.progress)}% onboarding complete</small>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function updateDashboard() {
    // Update stats
    document.getElementById('total-employees').textContent = employees.length;
    
    const activeOnboarding = employees.filter(e => e.status === 'in-progress').length;
    document.getElementById('active-onboarding').textContent = activeOnboarding;
    
    const pendingDocuments = documents.filter(d => d.status === 'pending').length;
    document.getElementById('pending-documents').textContent = pendingDocuments;
    
    const completionRate = employees.length > 0 ? 
        Math.round(employees.reduce((sum, emp) => sum + emp.progress, 0) / employees.length) : 0;
    document.getElementById('completion-rate').textContent = `${completionRate}%`;

    // Update chart
    updateOnboardingChart();
}

function updateOnboardingChart() {
    const ctx = document.getElementById('onboardingChart');
    if (!ctx) return;

    // Create onboarding data by month
    const onboardingData = getOnboardingDataByMonth();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: onboardingData.labels,
            datasets: [{
                label: 'New Hires',
                data: onboardingData.data,
                borderColor: '#1e3c72',
                backgroundColor: 'rgba(30, 60, 114, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#1e3c72',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function getOnboardingDataByMonth() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = new Array(6).fill(0);
    
    employees.forEach(employee => {
        const startDate = new Date(employee.startDate);
        const monthIndex = startDate.getMonth();
        if (monthIndex < 6) {
            data[monthIndex]++;
        }
    });
    
    return { labels: months, data };
}

function updateDocumentStats() {
    const identityCount = documents.filter(d => d.category === 'identity').length;
    const educationCount = documents.filter(d => d.category === 'education').length;
    const employmentCount = documents.filter(d => d.category === 'employment').length;
    const complianceCount = documents.filter(d => d.category === 'compliance').length;

    document.getElementById('identity-docs-count').textContent = identityCount;
    document.getElementById('education-docs-count').textContent = educationCount;
    document.getElementById('employment-docs-count').textContent = employmentCount;
    document.getElementById('compliance-docs-count').textContent = complianceCount;
}

function addActivity(type, message) {
    const activityList = document.getElementById('activity-list');
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const iconClass = type === 'onboarding' ? 'fa-user-plus' : 'fa-file-alt';
    const now = new Date();
    
    activityItem.innerHTML = `
        <div class="activity-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="activity-content">
            <h4>${message}</h4>
            <p>HR onboarding activity</p>
        </div>
        <div class="activity-time">
            ${formatTime(now)}
        </div>
    `;
    
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Keep only the last 5 activities
    while (activityList.children.length > 5) {
        activityList.removeChild(activityList.lastChild);
    }
}

function viewEmployee(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    const employeeDocuments = documents.filter(d => d.employeeId === employeeId);
    const modal = document.getElementById('employee-modal');
    const modalBody = document.getElementById('employee-modal-body');
    
    modalBody.innerHTML = `
        <div class="employee-details-modal">
            <div class="form-grid">
                <div class="form-group">
                    <label>Employee ID</label>
                    <span>${employee.id}</span>
                </div>
                <div class="form-group">
                    <label>Full Name</label>
                    <span>${employee.firstName} ${employee.lastName}</span>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <span>${employee.email}</span>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <span>${employee.phone}</span>
                </div>
                <div class="form-group">
                    <label>Department</label>
                    <span>${capitalizeFirst(employee.department)}</span>
                </div>
                <div class="form-group">
                    <label>Position</label>
                    <span>${employee.position}</span>
                </div>
                <div class="form-group">
                    <label>Manager</label>
                    <span>${employee.manager}</span>
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <span>${formatDate(employee.startDate)}</span>
                </div>
                <div class="form-group">
                    <label>Employment Type</label>
                    <span>${capitalizeFirst(employee.employmentType.replace('-', ' '))}</span>
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <span>${employee.location}</span>
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <h4>Onboarding Progress</h4>
                <div class="progress-steps">
                    <div class="progress-step">
                        <div class="step-icon ${employee.progress >= 25 ? 'completed' : ''}">1</div>
                        <div class="step-label">Personal Info</div>
                    </div>
                    <div class="progress-step">
                        <div class="step-icon ${employee.progress >= 50 ? 'completed' : employee.progress >= 25 ? 'active' : ''}">2</div>
                        <div class="step-label">Documents</div>
                    </div>
                    <div class="progress-step">
                        <div class="step-icon ${employee.progress >= 75 ? 'completed' : employee.progress >= 50 ? 'active' : ''}">3</div>
                        <div class="step-label">Training</div>
                    </div>
                    <div class="progress-step">
                        <div class="step-icon ${employee.progress >= 100 ? 'completed' : employee.progress >= 75 ? 'active' : ''}">4</div>
                        <div class="step-label">Complete</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <h4>Documents Submitted (${employeeDocuments.length})</h4>
                <div class="documents-summary">
                    ${employeeDocuments.map(doc => `
                        <div class="document-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
                            <div>
                                <strong>${doc.documentName}</strong> - ${capitalizeFirst(doc.category)}
                                <br>
                                <small>${formatDate(doc.uploadDate)}</small>
                            </div>
                            <span class="status-badge ${doc.status}">${capitalizeFirst(doc.status)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function editEmployee(employeeId) {
    showNotification('Edit functionality coming soon!', 'info');
}

function deleteEmployee(employeeId) {
    if (confirm('Are you sure you want to remove this employee from onboarding? This action cannot be undone.')) {
        employees = employees.filter(e => e.id !== employeeId);
        documents = documents.filter(d => d.employeeId !== employeeId);
        renderEmployeesTable();
        renderEmployeesGrid();
        updateDashboard();
        updateDocumentStats();
        showNotification('Employee removed successfully!', 'success');
    }
}

function viewDocument(documentId) {
    showNotification('Document viewer coming soon!', 'info');
}

function approveDocument(documentId) {
    const document = documents.find(d => d.id === documentId);
    if (document) {
        document.status = 'approved';
        renderDocumentsTable();
        showNotification('Document approved successfully!', 'success');
    }
}

function deleteDocument(documentId) {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        const document = documents.find(d => d.id === documentId);
        if (document) {
            // Update employee progress
            const employee = employees.find(e => e.id === document.employeeId);
            if (employee) {
                employee.documentsSubmitted = Math.max(0, employee.documentsSubmitted - 1);
                employee.progress = Math.min(100, (employee.documentsSubmitted / employee.documentsRequired) * 100);
                if (employee.progress < 100) {
                    employee.status = 'in-progress';
                }
            }
        }
        
        documents = documents.filter(d => d.id !== documentId);
        renderDocumentsTable();
        renderEmployeesTable();
        updateDashboard();
        updateDocumentStats();
        showNotification('Document deleted successfully!', 'success');
    }
}

function filterEmployeesTable(searchTerm) {
    const rows = document.querySelectorAll('#employees-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterDocumentsTable(searchTerm) {
    const rows = document.querySelectorAll('#documents-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterEmployeesGrid(searchTerm) {
    const cards = document.querySelectorAll('.employee-card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Load sample data for demonstration
function loadSampleData() {
    // Sample employees
    const sampleEmployees = [
        {
            id: 'SII24001',
            employeeId: 'SII24001',
            firstName: 'Priya',
            lastName: 'Sharma',
            email: 'priya.sharma@seruminstitute.com',
            phone: '+91 98765 43210',
            dateOfBirth: '1995-06-15',
            department: 'research',
            position: 'Research Scientist',
            manager: 'Dr. Rajesh Kumar',
            startDate: '2024-01-15',
            employmentType: 'full-time',
            location: 'pune',
            status: 'in-progress',
            onboardingTimestamp: new Date('2024-01-15').toISOString(),
            progress: 75,
            documentsSubmitted: 6,
            documentsRequired: 8
        },
        {
            id: 'SII24002',
            employeeId: 'SII24002',
            firstName: 'Arjun',
            lastName: 'Patel',
            email: 'arjun.patel@seruminstitute.com',
            phone: '+91 87654 32109',
            dateOfBirth: '1992-03-22',
            department: 'manufacturing',
            position: 'Production Manager',
            manager: 'Suresh Reddy',
            startDate: '2024-01-18',
            employmentType: 'full-time',
            location: 'hyderabad',
            status: 'completed',
            onboardingTimestamp: new Date('2024-01-18').toISOString(),
            progress: 100,
            documentsSubmitted: 8,
            documentsRequired: 8
        },
        {
            id: 'SII24003',
            employeeId: 'SII24003',
            firstName: 'Sneha',
            lastName: 'Gupta',
            email: 'sneha.gupta@seruminstitute.com',
            phone: '+91 76543 21098',
            dateOfBirth: '1998-11-08',
            department: 'quality',
            position: 'QA Analyst',
            manager: 'Dr. Meera Singh',
            startDate: '2024-01-20',
            employmentType: 'full-time',
            location: 'pune',
            status: 'in-progress',
            onboardingTimestamp: new Date('2024-01-20').toISOString(),
            progress: 50,
            documentsSubmitted: 4,
            documentsRequired: 8
        }
    ];

    // Sample documents
    const sampleDocuments = [
        {
            id: 'DOC001',
            employeeId: 'SII24001',
            employeeName: 'Priya Sharma',
            category: 'identity',
            documentName: 'Aadhaar Card',
            status: 'approved',
            uploadDate: new Date('2024-01-16').toISOString(),
            fileName: 'aadhaar_priya.pdf',
            notes: 'Identity verification document'
        },
        {
            id: 'DOC002',
            employeeId: 'SII24001',
            employeeName: 'Priya Sharma',
            category: 'education',
            documentName: 'PhD Certificate',
            status: 'approved',
            uploadDate: new Date('2024-01-17').toISOString(),
            fileName: 'phd_certificate.pdf',
            notes: 'Doctorate in Biotechnology'
        },
        {
            id: 'DOC003',
            employeeId: 'SII24002',
            employeeName: 'Arjun Patel',
            category: 'employment',
            documentName: 'Offer Letter',
            status: 'approved',
            uploadDate: new Date('2024-01-19').toISOString(),
            fileName: 'offer_letter_arjun.pdf',
            notes: 'Signed offer letter'
        },
        {
            id: 'DOC004',
            employeeId: 'SII24003',
            employeeName: 'Sneha Gupta',
            category: 'compliance',
            documentName: 'Background Verification',
            status: 'pending',
            uploadDate: new Date('2024-01-21').toISOString(),
            fileName: 'background_check.pdf',
            notes: 'Pending HR review'
        }
    ];

    employees = sampleEmployees;
    documents = sampleDocuments;

    // Add some initial activities
    addActivity('onboarding', 'Sample employee data loaded');
    addActivity('document', 'Initial documents uploaded to system');
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);