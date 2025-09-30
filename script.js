// Application state
let patients = [];
let samples = [];
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
    setupEnrollmentForm();
    setupSampleForm();
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
        case 'enrollment':
            renderPatientsTable();
            break;
        case 'samples':
            renderSamplesTable();
            populatePatientSelect();
            break;
        case 'patients':
            renderPatientsGrid();
            break;
    }
}

function setupEnrollmentForm() {
    const newEnrollmentBtn = document.getElementById('new-enrollment-btn');
    const enrollmentFormContainer = document.getElementById('enrollment-form-container');
    const enrollmentForm = document.getElementById('enrollment-form');
    const cancelEnrollmentBtn = document.getElementById('cancel-enrollment');

    newEnrollmentBtn.addEventListener('click', () => {
        enrollmentFormContainer.style.display = 'block';
        generatePatientId();
        setDefaultEnrollmentDate();
    });

    cancelEnrollmentBtn.addEventListener('click', () => {
        enrollmentFormContainer.style.display = 'none';
        enrollmentForm.reset();
    });

    enrollmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleEnrollmentSubmit();
    });
}

function setupSampleForm() {
    const newSampleBtn = document.getElementById('new-sample-btn');
    const sampleFormContainer = document.getElementById('sample-form-container');
    const sampleForm = document.getElementById('sample-form');
    const cancelSampleBtn = document.getElementById('cancel-sample');

    newSampleBtn.addEventListener('click', () => {
        sampleFormContainer.style.display = 'block';
        generateSampleId();
        setDefaultCollectionDate();
        populatePatientSelect();
    });

    cancelSampleBtn.addEventListener('click', () => {
        sampleFormContainer.style.display = 'none';
        sampleForm.reset();
    });

    sampleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSampleSubmit();
    });
}

function setupSearchFunctionality() {
    const patientSearch = document.getElementById('patient-search');
    const sampleSearch = document.getElementById('sample-search');
    const patientsOverviewSearch = document.getElementById('patients-overview-search');

    if (patientSearch) {
        patientSearch.addEventListener('input', (e) => {
            filterPatientsTable(e.target.value);
        });
    }

    if (sampleSearch) {
        sampleSearch.addEventListener('input', (e) => {
            filterSamplesTable(e.target.value);
        });
    }

    if (patientsOverviewSearch) {
        patientsOverviewSearch.addEventListener('input', (e) => {
            filterPatientsGrid(e.target.value);
        });
    }
}

function setupModals() {
    const patientModal = document.getElementById('patient-modal');
    const closePatientModal = document.getElementById('close-patient-modal');

    closePatientModal.addEventListener('click', () => {
        patientModal.classList.remove('active');
    });

    patientModal.addEventListener('click', (e) => {
        if (e.target === patientModal) {
            patientModal.classList.remove('active');
        }
    });
}

function generatePatientId() {
    const prefix = 'PT';
    const timestamp = Date.now().toString().slice(-6);
    const patientId = `${prefix}${timestamp}`;
    document.getElementById('patient-id').value = patientId;
}

function generateSampleId() {
    const prefix = 'SM';
    const timestamp = Date.now().toString().slice(-6);
    const sampleId = `${prefix}${timestamp}`;
    document.getElementById('sample-id').value = sampleId;
}

function setDefaultEnrollmentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('enrollment-date').value = today;
}

function setDefaultCollectionDate() {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
    document.getElementById('collection-date').value = localDateTime;
}

function handleEnrollmentSubmit() {
    const formData = new FormData(document.getElementById('enrollment-form'));
    const patientData = Object.fromEntries(formData.entries());
    
    // Add additional fields
    patientData.id = patientData.patientId;
    patientData.status = 'active';
    patientData.enrollmentTimestamp = new Date().toISOString();
    patientData.age = calculateAge(patientData.dateOfBirth);

    patients.push(patientData);
    
    // Hide form and reset
    document.getElementById('enrollment-form-container').style.display = 'none';
    document.getElementById('enrollment-form').reset();
    
    // Update displays
    renderPatientsTable();
    updateDashboard();
    addActivity('enrollment', `New patient enrolled: ${patientData.firstName} ${patientData.lastName}`);
    
    showNotification('Patient enrolled successfully!', 'success');
}

function handleSampleSubmit() {
    const formData = new FormData(document.getElementById('sample-form'));
    const sampleData = Object.fromEntries(formData.entries());
    
    // Find patient info
    const patient = patients.find(p => p.id === sampleData.patientId);
    if (!patient) {
        showNotification('Patient not found!', 'error');
        return;
    }
    
    // Add additional fields
    sampleData.id = sampleData.sampleId;
    sampleData.patientName = `${patient.firstName} ${patient.lastName}`;
    sampleData.status = 'stored';
    sampleData.collectionTimestamp = new Date(sampleData.collectionDate).toISOString();

    samples.push(sampleData);
    
    // Hide form and reset
    document.getElementById('sample-form-container').style.display = 'none';
    document.getElementById('sample-form').reset();
    
    // Update displays
    renderSamplesTable();
    updateDashboard();
    addActivity('sample', `New sample collected: ${sampleData.sampleId} from ${sampleData.patientName}`);
    
    showNotification('Sample added successfully!', 'success');
}

function populatePatientSelect() {
    const select = document.getElementById('sample-patient-id');
    select.innerHTML = '<option value="">Select Patient</option>';
    
    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.id} - ${patient.firstName} ${patient.lastName}`;
        select.appendChild(option);
    });
}

function renderPatientsTable() {
    const tbody = document.getElementById('patients-table-body');
    tbody.innerHTML = '';

    if (patients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No patients enrolled yet</h3>
                    <p>Click "New Enrollment" to add your first patient</p>
                </td>
            </tr>
        `;
        return;
    }

    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.firstName} ${patient.lastName}</td>
            <td>${patient.age}</td>
            <td>${capitalizeFirst(patient.gender)}</td>
            <td>${capitalizeFirst(patient.studyArm)}</td>
            <td>${formatDate(patient.enrollmentDate)}</td>
            <td><span class="status-badge ${patient.status}">${capitalizeFirst(patient.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewPatient('${patient.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editPatient('${patient.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deletePatient('${patient.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderSamplesTable() {
    const tbody = document.getElementById('samples-table-body');
    tbody.innerHTML = '';

    if (samples.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-flask"></i>
                    <h3>No samples collected yet</h3>
                    <p>Click "New Sample" to add your first sample</p>
                </td>
            </tr>
        `;
        return;
    }

    samples.forEach(sample => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sample.id}</td>
            <td>${sample.patientId}</td>
            <td>${sample.patientName}</td>
            <td>${capitalizeFirst(sample.sampleType)}</td>
            <td>${sample.volume}</td>
            <td>${formatDateTime(sample.collectionDate)}</td>
            <td>${sample.storageLocation}</td>
            <td><span class="status-badge ${sample.status}">${capitalizeFirst(sample.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewSample('${sample.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editSample('${sample.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSample('${sample.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderPatientsGrid() {
    const grid = document.getElementById('patients-grid');
    grid.innerHTML = '';

    if (patients.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No patients enrolled yet</h3>
                <p>Switch to the Enrollment tab to add your first patient</p>
            </div>
        `;
        return;
    }

    patients.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.onclick = () => viewPatient(patient.id);
        
        const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;
        const patientSamples = samples.filter(s => s.patientId === patient.id);
        
        card.innerHTML = `
            <div class="patient-header">
                <div class="patient-avatar">${initials}</div>
                <div class="patient-info">
                    <h3>${patient.firstName} ${patient.lastName}</h3>
                    <p>${patient.id}</p>
                </div>
            </div>
            <div class="patient-details">
                <div class="patient-detail">
                    <label>Age</label>
                    <span>${patient.age} years</span>
                </div>
                <div class="patient-detail">
                    <label>Gender</label>
                    <span>${capitalizeFirst(patient.gender)}</span>
                </div>
                <div class="patient-detail">
                    <label>Study Arm</label>
                    <span>${capitalizeFirst(patient.studyArm)}</span>
                </div>
                <div class="patient-detail">
                    <label>Samples</label>
                    <span>${patientSamples.length} collected</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function updateDashboard() {
    // Update stats
    document.getElementById('total-patients').textContent = patients.length;
    document.getElementById('total-samples').textContent = samples.length;
    
    const pendingSamples = samples.filter(s => s.status === 'pending').length;
    document.getElementById('pending-samples').textContent = pendingSamples;
    
    const completionRate = patients.length > 0 ? 
        Math.round((samples.length / (patients.length * 3)) * 100) : 0; // Assuming 3 samples per patient
    document.getElementById('completion-rate').textContent = `${completionRate}%`;

    // Update chart
    updateEnrollmentChart();
}

function updateEnrollmentChart() {
    const ctx = document.getElementById('enrollmentChart');
    if (!ctx) return;

    // Create enrollment data by month
    const enrollmentData = getEnrollmentDataByMonth();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: enrollmentData.labels,
            datasets: [{
                label: 'Patients Enrolled',
                data: enrollmentData.data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
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

function getEnrollmentDataByMonth() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = new Array(6).fill(0);
    
    patients.forEach(patient => {
        const enrollmentDate = new Date(patient.enrollmentDate);
        const monthIndex = enrollmentDate.getMonth();
        if (monthIndex < 6) {
            data[monthIndex]++;
        }
    });
    
    return { labels: months, data };
}

function addActivity(type, message) {
    const activityList = document.getElementById('activity-list');
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const iconClass = type === 'enrollment' ? 'fa-user-plus' : 'fa-flask';
    const now = new Date();
    
    activityItem.innerHTML = `
        <div class="activity-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="activity-content">
            <h4>${message}</h4>
            <p>Clinical trial activity</p>
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

function viewPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const patientSamples = samples.filter(s => s.patientId === patientId);
    const modal = document.getElementById('patient-modal');
    const modalBody = document.getElementById('patient-modal-body');
    
    modalBody.innerHTML = `
        <div class="patient-details-modal">
            <div class="form-grid">
                <div class="form-group">
                    <label>Patient ID</label>
                    <span>${patient.id}</span>
                </div>
                <div class="form-group">
                    <label>Full Name</label>
                    <span>${patient.firstName} ${patient.lastName}</span>
                </div>
                <div class="form-group">
                    <label>Date of Birth</label>
                    <span>${formatDate(patient.dateOfBirth)}</span>
                </div>
                <div class="form-group">
                    <label>Age</label>
                    <span>${patient.age} years</span>
                </div>
                <div class="form-group">
                    <label>Gender</label>
                    <span>${capitalizeFirst(patient.gender)}</span>
                </div>
                <div class="form-group">
                    <label>Study Arm</label>
                    <span>${capitalizeFirst(patient.studyArm)}</span>
                </div>
                <div class="form-group">
                    <label>Enrollment Date</label>
                    <span>${formatDate(patient.enrollmentDate)}</span>
                </div>
                <div class="form-group">
                    <label>Contact Phone</label>
                    <span>${patient.contactPhone || 'Not provided'}</span>
                </div>
            </div>
            <div style="margin-top: 2rem;">
                <h4>Sample Collection History (${patientSamples.length} samples)</h4>
                <div class="samples-summary">
                    ${patientSamples.map(sample => `
                        <div class="sample-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
                            <div>
                                <strong>${sample.id}</strong> - ${capitalizeFirst(sample.sampleType)}
                                <br>
                                <small>${formatDateTime(sample.collectionDate)}</small>
                            </div>
                            <span class="status-badge ${sample.status}">${capitalizeFirst(sample.status)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function editPatient(patientId) {
    // Implementation for editing patient
    showNotification('Edit functionality coming soon!', 'info');
}

function deletePatient(patientId) {
    if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
        patients = patients.filter(p => p.id !== patientId);
        samples = samples.filter(s => s.patientId !== patientId);
        renderPatientsTable();
        renderPatientsGrid();
        updateDashboard();
        showNotification('Patient deleted successfully!', 'success');
    }
}

function viewSample(sampleId) {
    // Implementation for viewing sample details
    showNotification('Sample details view coming soon!', 'info');
}

function editSample(sampleId) {
    // Implementation for editing sample
    showNotification('Edit functionality coming soon!', 'info');
}

function deleteSample(sampleId) {
    if (confirm('Are you sure you want to delete this sample? This action cannot be undone.')) {
        samples = samples.filter(s => s.id !== sampleId);
        renderSamplesTable();
        updateDashboard();
        showNotification('Sample deleted successfully!', 'success');
    }
}

function filterPatientsTable(searchTerm) {
    const rows = document.querySelectorAll('#patients-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterSamplesTable(searchTerm) {
    const rows = document.querySelectorAll('#samples-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterPatientsGrid(searchTerm) {
    const cards = document.querySelectorAll('.patient-card');
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
function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
    // Sample patients
    const samplePatients = [
        {
            id: 'PT001234',
            patientId: 'PT001234',
            firstName: 'John',
            lastName: 'Smith',
            dateOfBirth: '1985-03-15',
            age: calculateAge('1985-03-15'),
            gender: 'male',
            studyArm: 'treatment',
            enrollmentDate: '2024-01-15',
            contactPhone: '(555) 123-4567',
            status: 'active',
            enrollmentTimestamp: new Date('2024-01-15').toISOString()
        },
        {
            id: 'PT001235',
            patientId: 'PT001235',
            firstName: 'Sarah',
            lastName: 'Johnson',
            dateOfBirth: '1978-07-22',
            age: calculateAge('1978-07-22'),
            gender: 'female',
            studyArm: 'control',
            enrollmentDate: '2024-01-18',
            contactPhone: '(555) 987-6543',
            status: 'active',
            enrollmentTimestamp: new Date('2024-01-18').toISOString()
        },
        {
            id: 'PT001236',
            patientId: 'PT001236',
            firstName: 'Michael',
            lastName: 'Davis',
            dateOfBirth: '1992-11-08',
            age: calculateAge('1992-11-08'),
            gender: 'male',
            studyArm: 'placebo',
            enrollmentDate: '2024-01-20',
            contactPhone: '(555) 456-7890',
            status: 'active',
            enrollmentTimestamp: new Date('2024-01-20').toISOString()
        }
    ];

    // Sample serum samples
    const sampleSerumSamples = [
        {
            id: 'SM001001',
            sampleId: 'SM001001',
            patientId: 'PT001234',
            patientName: 'John Smith',
            sampleType: 'serum',
            volume: '5.0',
            collectionDate: '2024-01-16T09:30:00',
            storageLocation: 'Freezer A1-B2',
            collectionNotes: 'Baseline sample collection',
            status: 'stored',
            collectionTimestamp: new Date('2024-01-16T09:30:00').toISOString()
        },
        {
            id: 'SM001002',
            sampleId: 'SM001002',
            patientId: 'PT001235',
            patientName: 'Sarah Johnson',
            sampleType: 'serum',
            volume: '4.5',
            collectionDate: '2024-01-19T14:15:00',
            storageLocation: 'Freezer A1-C3',
            collectionNotes: 'Week 1 follow-up',
            status: 'stored',
            collectionTimestamp: new Date('2024-01-19T14:15:00').toISOString()
        },
        {
            id: 'SM001003',
            sampleId: 'SM001003',
            patientId: 'PT001236',
            patientName: 'Michael Davis',
            sampleType: 'plasma',
            volume: '6.0',
            collectionDate: '2024-01-21T11:00:00',
            storageLocation: 'Freezer B2-A1',
            collectionNotes: 'Initial screening sample',
            status: 'stored',
            collectionTimestamp: new Date('2024-01-21T11:00:00').toISOString()
        }
    ];

    patients = samplePatients;
    samples = sampleSerumSamples;

    // Add some initial activities
    addActivity('enrollment', 'Sample data loaded successfully');
    addActivity('sample', 'Initial serum samples added to system');
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