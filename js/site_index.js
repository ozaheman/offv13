// --- START OF NEW site_index.js ---

// Import ALL necessary modules
import { BoqModule } from './site_modules/boq_module.js';
import { BulletinModule } from './site_modules/bulletin_module.js';
import { MaterialsModule } from './site_modules/materials_module.js';
import { MomModule } from './site_modules/mom_module.js';
import { ReportingModule } from './site_modules/reporting_module.js';
import { RfiModule } from './site_modules/rfi_module.js';
import { ScheduleModule,renderFloorSelector,  showNewTaskModal,saveNewTask,getProjectSchedule,setupSimulationControls,renderGanttChart } from './site_modules/schedule_module.js';
import { SubcontractorModule } from './site_modules/subcontractor_module.js';
import { ToolsModule } from './site_modules/tools_module.js';
import { VendorModule } from './site_modules/vendor_module.js';

// --- GLOBAL STATE ---
export const AppState = {
    currentJobNo: null,
    currentUserRole: null,
    accessibleProjects: [], 
    currentProjectFilter: '',
    calendarDate: new Date(),
     simulationInterval : null,
    
    currentFloorFilter: 'all',
    simulationSpeed : 100, // ms per day
    specificProjectAccess : null // New global to track if a specific project is locked
};
window.AppState = AppState; // <-- ADD THIS LINE
// --- DOM ELEMENTS CACHE ---
window.DOMElements = {};
console.log('DOMElements'); 
console.log(DOMElements);
// Globally Accessible Helper Functions
window.verifyAccess = async (jobNo, role, password) => {
    try {
        const project = await window.DB.getProject(jobNo);
        if (project?.accessCredentials?.[role]?.pass === password) {
            return true;
        }
        return await window.DB.verifyPassword(role, password);
    } catch (e) {
        console.error("Error during access verification:", e);
        return false;
    }
};
window.getProjectSchedule = getProjectSchedule;

// --- APP CONTEXT FOR MODULES ---
 const AppContext = {
    getState: () => AppState,
    onUpdate: async (moduleName) => {
        const jobNo = AppState.currentJobNo;
        if (!jobNo) return;

        switch (moduleName) {
            case 'rfi': await RfiModule.render(jobNo); break;
            case 'mom':
                await MomModule.renderList(jobNo, DOMElements.momList);
                await renderCalendar();
                break;
            
            case 'materials': await MaterialsModule.render(jobNo); break;
            case 'bulletin': await BulletinModule.render(jobNo, DOMElements.bulletinFeed); break;
            case 'boq': 
                await BoqModule.render(jobNo, getBoqElements()); 
                await renderProjectList();
                break;
            case 'subcontractors': await SubcontractorModule.render(jobNo, DOMElements.subcontractorList); break;
           // case 'schedule': await ScheduleModule.render(jobNo); break;
        }
    },
     getSchedule: (project, siteData) => ScheduleModule.render(project.jobNo),
};

document.addEventListener('DOMContentLoaded', async () => {
    cacheDomElements();
    try {
    if (window.DB) {
        await window.DB.init();
        await populateHolidayCountries();
    } else {
        console.error("Database (DB) object not found.");
        }
    initializeModules();
    setupCoreEventListeners();
    
    DOMElements.loginModal.style.display = 'flex';
    DOMElements.mainSiteContainer.style.display = 'none';
      }catch (error) {
        console.error("Initialization Error:", error);
    }
});

export function cacheDomElements() {
    const ids = [
        'main-site-container', 'login-modal', 'logout-btn', 'perform-login-btn', 'login-role', 'login-username', 'login-password', 'login-error','welcome-user-msg', 'project-list-body', 'details-project-name','details-project-info', 'back-to-global-btn', 'control-tabs-container','site-status-select','floor-selector-container','rfi-log-list', 'mom-list', 'material-approval-list', 'bulletin-feed', 'subcontractor-list', 'vendor-search-results', 'calendar-grid-body', 'month-year-display',
        'holiday-country-select', 'load-holidays-btn', 'resource-calculator-body', 'resource-day-rate', 
        'photo-gallery', 
        'site-doc-gallery', 'project-docs-gallery',
        'tender-docs-gallery', 'vendor-lists-gallery', 'photo-upload-input', 'doc-upload-input', 
        'doc-name-input', 
        'form-modal', 
        'form-modal-close-btn', 'form-modal-title', 'form-modal-body',
        'save-form-pdf-btn', 'new-task-modal', 'new-task-close-btn', 'save-new-task-btn', 'add-custom-task-btn', 'new-task-name', 
        'new-task-start', 'new-task-duration',
        'new-task-floor', 'new-task-dependency', 'bim-item-name', 
        'bim-item-status', 'bim-item-progress', 'bim-loading',
        'photo-gallery', 'project-docs-gallery', 'site-doc-gallery', 'photo-upload-input', 'doc-upload-input', 
        'doc-name-input', 'calendar-grid-body', 'month-year-display','holiday-country-select', 'load-holidays-btn', 'mom-list', 'bulletin-feed', 
        'post-bulletin-btn', 'bulletin-subject', 'bulletin-details', 
        'bulletin-assigned-to', 'subcontractor-list', 'add-subcontractor-btn', 
        'resource-day-rate', 'resource-calculator-body', 'vendor-search-input', 
        'vendor-search-results', 'generate-project-report-btn'
    ];
     ids.forEach(id => {
        const camelCaseKey = id.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
        DOMElements[camelCaseKey] = document.getElementById(id);
    });
    
      DOMElements.momModalElements = getMomModalElements();
    DOMElements.momPreviewElements = getMomPreviewElements();
    DOMElements.rfiModalElements = getRfiModalElements();
    // DOMElements = {
     //bimitemname: document.getElementById('bim-item-name'),
        //bimitemstatus: document.getElementById('bim-item-status'),
       // projectListBody: document.getElementById('project-list-body'),
       // loginModal: document.getElementById('login-modal'),
       // backToGlobalBtn: document.getElementById('back-to-global-btn'),
        //controlTabsContainer: document.getElementById('control-tabs-container'),
        //mainSiteContainer: document.getElementById('main-Site-Container'),
       // bimitemprogress: document.getElementById('bim-item-progress')
        
    // }
     //alert('ok1');
}


function getBoqElements() {
    return {
        tableBody: document.getElementById('boq-table-body'),
        totalValueDisplay: document.getElementById('boq-total-value'),
        workDoneDisplay: document.getElementById('boq-work-done-value'),
        progressDisplay: document.getElementById('boq-progress-percentage'),progressBar: document.getElementById('boq-progress-bar'),
        addBtn: document.getElementById('add-boq-item-btn'),
        certBtn: document.getElementById('generate-payment-cert-btn')
    };
}
function getRfiModalElements() {
    return {
        modal: document.getElementById('rfi-modal'), closeBtn: document.getElementById('rfi-modal-close-btn'), title: document.getElementById('rfi-modal-title'),
        editId: document.getElementById('rfi-edit-id'), refNo: document.getElementById('rfi-ref-no'), subject: document.getElementById('rfi-subject'),
        description: document.getElementById('rfi-description'), fileAttach: document.getElementById('rfi-file-attach'), newAttachmentsList: document.getElementById('rfi-new-attachments-list'),
        docLinkSelect: document.getElementById('rfi-doc-link-select'), approversGroup: document.getElementById('rfi-approvers-group'), responseComments: document.getElementById('rfi-response-comments'), saveBtn: document.getElementById('save-rfi-btn'),
    };
}
function getMomModalElements() {
    return {
        title: document.getElementById('mom-modal-title'), modal: document.getElementById('mom-modal'), editIndex: document.getElementById('mom-edit-index'),
        deleteBtn: document.getElementById('delete-mom-btn'), ref: document.getElementById('mom-ref'), date: document.getElementById('mom-date'), location: document.getElementById('mom-location'),
        progress: document.getElementById('mom-progress'), lookAhead: document.getElementById('mom-lookahead'), materials: document.getElementById('mom-materials'), summary: document.getElementById('mom-status-summary'),
        nextDate: document.getElementById('mom-next-meeting'), nextNotes: document.getElementById('mom-next-meeting-notes'), attendeesBody: document.getElementById('mom-attendees-tbody'), actionsBody: document.getElementById('mom-actions-tbody'),
        closeBtn: document.getElementById('mom-modal-close-btn'), addAttendeeBtn: document.getElementById('add-attendee-btn'), addActionBtn: document.getElementById('add-action-btn'), saveMomDataBtn: document.getElementById('save-mom-data-btn'),
    };
}
function getMomPreviewElements() {
    return {
        modal: document.getElementById('mom-preview-modal'), title: document.getElementById('mom-preview-modal-title'), body: document.getElementById('mom-preview-modal-body'),
        footer: document.getElementById('mom-preview-modal-footer'), closeBtn: document.getElementById('mom-preview-modal-close-btn')
    };
}
function initializeModules() {
    BoqModule.init(getBoqElements(), AppContext);
    const rfiModalElements = getRfiModalElements();
    rfiModalElements.newRfiBtn = document.getElementById('new-rfi-btn');
    RfiModule.init(rfiModalElements, AppContext);
 
    const momElements = getMomModalElements();
    MomModule.init({ newBtn: document.getElementById('new-mom-btn'), listContainer: DOMElements.momList, modalElements: momElements, previewElements: getMomPreviewElements() }, AppContext);

    MaterialsModule.init({ newBtn: document.getElementById('new-material-submittal-btn') }, AppContext);
    BulletinModule.init({ postBtn: DOMElements.postBulletinBtn, subjectInput: DOMElements.bulletinSubject, detailsInput: DOMElements.bulletinDetails, assignedToInput: DOMElements.bulletinAssignedTo }, AppContext);
    VendorModule.init({ searchInput: DOMElements.vendorSearchInput, resultsContainer: DOMElements.vendorSearchResults });
    ReportingModule.init({ generateBtn: DOMElements.generateProjectReportBtn }, AppContext);
    
    
     SubcontractorModule.init({ addBtn: document.getElementById('add-subcontractor-btn') }, AppContext);
    ToolsModule.init({ rateInput: DOMElements.resourceDayRate, tableBody: DOMElements.resourceCalculatorBody });
    ScheduleModule.init(AppContext);
    // 2. Floor Selector Listener
    const floorContainer = document.getElementById('floor-selector-container');
    if (floorContainer) {
        // alert('hhhhh');
        // Remove old listeners to be safe (optional, but good practice if re-init happens)
        const newContainer = floorContainer.cloneNode(true);
        floorContainer.parentNode.replaceChild(newContainer, floorContainer);
        DOMElements.floorSelectorContainer = newContainer; // Update reference

        newContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('floor-btn')) {
                // UI Update
                const buttons = newContainer.querySelectorAll('.floor-btn');
                buttons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Logic Update
                AppState.currentFloorFilter = e.target.dataset.floor;
                
                // Re-render Schedule
                if(AppState.currentJobNo) {
                    ScheduleModule.render(AppState.currentJobNo); 
                }
            }
        });
    }
}

function setupCoreEventListeners() {
    DOMElements.performLoginBtn?.addEventListener('click', handleLogin);
    DOMElements.logoutBtn?.addEventListener('click', handleLogout);
    DOMElements.projectListBody.addEventListener('click', handleProjectSelect);
   DOMElements.backToGlobalBtn.addEventListener('click', showGlobalView);
     DOMElements.controlTabsContainer.addEventListener('click', handleTabClick);
    document.getElementById('save-data-btn')?.addEventListener('click', () => alert('Save XML functionality placeholder.'));
     DOMElements.siteStatusSelect?.addEventListener('change', updateStatus);
  
    //DOMElements.loadHolidaysBtn?.addEventListener('click', handleLoadHolidays);
    DOMElements.photoUploadInput?.addEventListener('change', (e) => handleFileUpload(e, 'photo'));
    DOMElements.docUploadInput?.addEventListener('change', (e) => handleFileUpload(e, 'document'));
      document.getElementById('prev-month-btn')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month-btn')?.addEventListener('click', () => changeMonth(1));
      document.getElementById('load-holidays-btn')?.addEventListener('click', handleLoadHolidays);
   if(DOMElements.formModalCloseBtn) DOMElements.formModalCloseBtn.addEventListener('click', () => DOMElements.formModal.style.display = 'none');
    const formsTab = document.getElementById('forms-tab');
    if(formsTab) formsTab.addEventListener('click', handleFormButtonClick);
    document.body.addEventListener('click', handleGlobalClicks);
     DOMElements.filePreviewCloseBtn?.addEventListener('click', () => {
        DOMElements.filePreviewModal.style.display = 'none';
    });
}
     
async function handleLoginx() {
    const role = DOMElements.loginRole.value;
    const username = DOMElements.loginUsername.value.trim();
    const password = DOMElements.loginPassword.value;

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }
    
    const authResult = await authenticateUser(role, username, password);

    if (!authResult.success) {
        DOMElements.loginError.textContent = 'Invalid username or password.';
        DOMElements.loginError.style.display = 'block';
        return;
    }

    DOMElements.loginError.style.display = 'none';
    AppState.currentUserRole = role;
    AppState.accessibleProjects = authResult.accessibleProjects;

    DOMElements.loginModal.style.display = 'none';
    DOMElements.mainSiteContainer.style.display = 'block';
    
    DOMElements.welcomeUserMsg.textContent = `Welcome, ${username}`;
    DOMElements.welcomeUserMsg.style.display = 'inline';
    DOMElements.logoutBtn.style.display = 'inline-block';
    
    await renderProjectList();

    if (AppState.accessibleProjects.length === 1) {
        const singleProjectRow = DOMElements.projectListBody.querySelector(`tr[data-job-no="${AppState.accessibleProjects[0]}"]`);
        if (singleProjectRow) await handleProjectSelect({ target: singleProjectRow });
    } else {
        showGlobalView();
    }
}
// --- CORE APP LOGIC ---

async function handleLogin() {
    const role = DOMElements.loginRole.value;
    const inputUser = DOMElements.loginUsername.value.trim();
    const inputPass = DOMElements.loginPassword.value.trim();
    
    const authResult = await authenticateUser(role, inputUser, inputPass);

    if (authResult.success) {
        DOMElements.loginModal.style.display = 'none';
        DOMElements.mainSiteContainer.style.display = 'block';
        
        AppState.currentUserRole = role;
        AppState.accessibleProjects = authResult.accessibleProjects;
        
        const roleName = DOMElements.loginRole.options[DOMElements.loginRole.selectedIndex].text;
        DOMElements.welcomeUserMsg.textContent = `Welcome, ${roleName}`;
        DOMElements.welcomeUserMsg.style.display = 'inline';
        DOMElements.logoutBtn.style.display = 'inline-block';

        await renderProjectList();

        if (AppState.accessibleProjects.length === 1) {
            await autoLoadProject(AppState.accessibleProjects[0]);
        } else {
            showGlobalView();
        }
    } else {
        DOMElements.loginError.style.display = 'block';
    }
}
async function authenticateUser(role, username, password) {
    let accessibleProjects = [];
    const allProjects = await window.DB.getAllProjects();
    for (const project of allProjects) {
        if (project.accessCredentials?.[role]?.user === username && project.accessCredentials?.[role]?.pass === password) {
            accessibleProjects.push(project.jobNo);
        }
    }
    if (accessibleProjects.length > 0) return { success: true, accessibleProjects };
    
    const settings = await window.DB.getSetting('access_control');
    if (settings?.credentials?.[role]?.user === username && settings?.credentials?.[role]?.pass === password) {
        return { success: true, accessibleProjects: [] }; // Empty means all
    }
    
    return { success: false, accessibleProjects: [] };
}



function handleLogout() {window.location.reload();}

async function handleProjectSelect(e) {
    const row = e.target.closest('tr');
    if (!row || !row.dataset.jobNo) return;

    AppState.currentJobNo = row.dataset.jobNo;
    DOMElements.projectListBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
    DOMElements.backToGlobalBtn.style.display = 'block';

    const project = await window.DB.getProject(AppState.currentJobNo);
    //let siteData = await window.DB.getSiteData(AppState.currentJobNo);
    
    let siteData = await window.DB.getSiteData(AppState.currentJobNo) || { jobNo: AppState.currentJobNo, status: 'Pending Start', boq: [], mom: [], rfiLog: [], materialLog: [] };


    DOMElements.detailsProjectName.textContent = project.projectDescription;
      DOMElements.detailsProjectInfo.textContent = `Job: ${project.jobNo} | ${project.clientName}`;
    DOMElements.siteStatusSelect.value = siteData.status || 'Pending Start';
    // Render all modules and galleries
    RfiModule.render(AppState.currentJobNo);
    MomModule.renderList(AppState.currentJobNo, DOMElements.momList);
    MaterialsModule.render(AppState.currentJobNo);
    BulletinModule.render(AppState.currentJobNo, DOMElements.bulletinFeed);
    BoqModule.render(AppState.currentJobNo, getBoqElements());
    SubcontractorModule.render(AppState.currentJobNo, DOMElements.subcontractorList);

    await renderFileGallery(DOMElements.photoGallery, 'site', 'photo', true);
    await renderFileGallery(DOMElements.projectDocsGallery, 'master', null, false);
    //await renderFileGallery(DOMElements.siteDocGallery, 'site', 'document', true);
    //await MomModule.renderList(AppState.currentJobNo, DOMElements.momList);
    //await RfiModule.render(AppState.currentJobNo);
    //await MaterialsModule.render(AppState.currentJobNo);
    //await BulletinModule.render(AppState.currentJobNo, DOMElements.bulletinFeed);
    //await BoqModule.render(AppState.currentJobNo, getBoqElements());
    //await SubcontractorModule.render(AppState.currentJobNo, DOMElements.subcontractorList);
    const schedule = await ScheduleModule.render(AppState.currentJobNo);
    renderCalendar();
    renderFloorSelector();
    if(schedule) ToolsModule.renderResourceCalculator(AppState.currentJobNo, { tableBody: DOMElements.resourceCalculatorBody }, schedule);
    updateDashboardStats(AppState.currentJobNo);
    toggleTabsForView(true);
}
async function autoLoadProject(jobNo) {
    const targetRow = Array.from(DOMElements.projectListBody.querySelectorAll('tr')).find(r => r.dataset.jobNo === jobNo);
    if (targetRow) await handleProjectSelect({ target: targetRow }); 
}
async function renderProjectList() {
    const allProjects = await window.DB.getAllProjects();
    const allSiteData = await window.DB.getAllSiteData();
      const siteDataMap = new Map(allSiteData.map(d => [d.jobNo, d]));

    const filteredProjects = AppState.accessibleProjects.length > 0
        ? allProjects.filter(p => AppState.accessibleProjects.includes(p.jobNo))
        : allProjects;

    DOMElements.projectListBody.innerHTML = filteredProjects.map(p => {
        let siteData = siteDataMap.get(p.jobNo) || { status: 'Pending Start', progress: 0 };
        return `<tr data-job-no="${p.jobNo}"><td>${p.jobNo}</td><td>${p.projectDescription}<br><small>${p.clientName}</small></td><td>${p.plotNo}</td><td>${siteData.status} (${siteData.progress}%)</td></tr>`;
    }).join('') || '<tr><td colspan="4">No projects accessible.</td></tr>';
}

function showGlobalView() {
    AppState.currentJobNo = null;
    DOMElements.detailsProjectName.textContent = "All Projects Overview";
    DOMElements.detailsProjectInfo.textContent = "Select a project to see details.";
    DOMElements.backToGlobalBtn.style.display = 'none';
    DOMElements.projectListBody.querySelectorAll('tr.selected').forEach(r => r.classList.remove('selected'));
    
    toggleTabsForView(false);
    //renderCalendar();// to be hidden
}
function toggleTabsForView(isProjectView) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.style.display = (!isProjectView && btn.dataset.tab !== 'calendar') ? 'none' : 'inline-block';
    });
    const tabToActivate = isProjectView ? 'status' : 'calendar';
    document.querySelector(`[data-tab="${tabToActivate}"]`)?.click();
}
function toggleTabsForViewx(isProjectView) {
    const tabs = document.querySelectorAll('#control-tabs-container .tab-button');
    tabs.forEach(btn => {
        if (!isProjectView && btn.dataset.tab !== 'calendar') {
            btn.style.display = 'none';
        } else {
            btn.style.display = '';
        }
    });
    if (isProjectView) {
        document.querySelector('.tab-button[data-tab="status"]')?.click();
    } else {
        document.querySelector('.tab-button[data-tab="calendar"]')?.click();
    }
}
function handleTabClick(e) {
    if (e.target.matches('.tab-button')) {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const content = document.getElementById(`${e.target.dataset.tab}-tab`);
        if (content) content.classList.add('active');
        if(e.target.dataset.tab === 'schedule') ScheduleModule.render(AppState.currentJobNo);
    }
}
async function handleGlobalClicks(e) {
    if(e.target.classList.contains('preview-mom-btn')) {
        const { index, jobNo } = e.target.dataset;
        if (index && jobNo) MomModule.renderPreview(jobNo, parseInt(index), getMomPreviewElements());
    }
    if(e.target.classList.contains('thumbnail-delete-btn')) {
        e.stopPropagation();
        const { id, type } = e.target.dataset;
        if(confirm("Delete this file?")) {
            await window.DB.deleteFile(parseInt(id));
            const gallery = type === 'photo' ? DOMElements.photoGallery : DOMElements.siteDocGallery;
            renderFileGallery(gallery, 'site', type, true);
        }
    }
}
async function handleFileUpload(event, type) {
    if (!AppState.currentJobNo) return;
    for (const file of event.target.files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            await window.DB.addFile({
                jobNo: AppState.currentJobNo, source: 'site', type, name: (type === 'document' && DOMElements.docNameInput?.value) ? `${DOMElements.docNameInput.value} (${file.name})` : file.name,
                fileType: file.type, dataUrl: e.target.result, timestamp: new Date().toISOString()
            });
            const gallery = type === 'photo' ? DOMElements.photoGallery : DOMElements.siteDocGallery;
            renderFileGallery(gallery, 'site', type, true);
        };
        reader.readAsDataURL(file);
    }
}
async function handleFileUploadx(event, type) {
    if (!AppState.currentJobNo) return;
    for (const file of event.target.files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            await window.DB.addFile({
                jobNo: AppState.currentJobNo,
                source: 'site', type,
                name: (type === 'document' && DOMElements.docNameInput.value) ? `${DOMElements.docNameInput.value} (${file.name})` : file.name,
                fileType: file.type, dataUrl: e.target.result,
                timestamp: new Date().toISOString()
            });
            if (type === 'photo') await renderFileGallery(DOMElements.photoGallery, 'site', 'photo', true);
            else await renderFileGallery(DOMElements.siteDocGallery, 'site', 'document', true);
        };
        reader.readAsDataURL(file);
    }
}
function handleTabClickx(e) {
    if (!e.target.matches('.tab-button')) return;
    DOMElements.controlTabsContainer.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tabContent = document.getElementById(`${e.target.dataset.tab}-tab`);
    if (tabContent) tabContent.classList.add('active');
    
    if(e.target.dataset.tab === 'schedule') {
        ScheduleModule.render(AppState.currentJobNo);
    }
}



async function renderFileGallery(galleryEl, source, type, isDeletable) {
    if(!galleryEl) return;
    galleryEl.innerHTML = '';
    if (!AppState.currentJobNo) return;
    let files = (await window.DB.getFiles(AppState.currentJobNo, source)).filter(f => !type || f.type === type);
    
    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'thumbnail-container';
        const isImage = file.fileType?.startsWith('image/');
        div.innerHTML = (isImage ? `<img src="${file.dataUrl}" class="thumbnail">` : `<div class="file-icon">📄</div>`) + 
                        `<div class="thumbnail-caption">${file.name}</div>` +
                        (isDeletable ? `<div class="thumbnail-delete-btn" data-id="${file.id}" data-type="${type}">×</div>` : '');
        galleryEl.appendChild(div);
    });
}



async function updateStatus() {
    if (!AppState.currentJobNo) return;
    const siteData = await window.DB.getSiteData(AppState.currentJobNo);
    siteData.status = DOMElements.siteStatusSelect.value;
    await window.DB.putSiteData(siteData);
    await renderProjectList();
}
async function handleFormButtonClick(e) {
    if(!e.target.matches('.form-btn')) return;
    if(!AppState.currentJobNo) return alert("Select a project");
    
    const formType = e.target.dataset.form;
    const project = await window.DB.getProject(AppState.currentJobNo);
    const siteData = await window.DB.getSiteData(AppState.currentJobNo);
    
    // Set Modal Title
    DOMElements.formModalTitle.textContent = e.target.innerText;
    
    try {
        // Fetch Form Template
        const response = await fetch(`forms/${formType}.html`);
        if(!response.ok) throw new Error("Form template not found");
        let htmlContent = await response.text();

        // --- DYNAMIC DATA INJECTION ---
        
        // 1. Consultant Logo (Top Left usually)
        // Check if LOGO_svgBASE64 exists (from logo_base64.js), otherwise fallback
        const logoSrc = (typeof LOGO_svgBASE64 !== 'undefined') ? LOGO_svgBASE64 : '';
        const logoHtml = logoSrc ? `<img src="${logoSrc}" style="max-height:60px; max-width:200px; margin-bottom:10px;">` : '';

        // Inject Logo at the start of .form-container if not already present
        // Or specific placeholder like [Consultant Logo]
        if (htmlContent.includes('<div class="form-container">')) {
             htmlContent = htmlContent.replace('<div class="form-container">', `<div class="form-container"><div style="text-align:left;">${logoHtml}</div>`);
        }

        // 2. Project Details Replacement
        htmlContent = htmlContent
            .replace(/\[Project Name\]/g, project.projectDescription || 'N/A')
            .replace(/\[Project Description\]/g, project.projectDescription || 'N/A') // Alias
            .replace(/\[Plot No\]/g, project.plotNo || 'N/A')
            .replace(/\[Client Name\]/g, project.clientName || 'N/A')
            .replace(/\[Contractor Name\]/g, siteData.contractorName || 'Main Contractor')
            .replace(/\[Consultant Name\]/g, 'Urban Axis Architectural & Consulting Engineers');

        // Render
        DOMElements.formModalBody.innerHTML = htmlContent;
        DOMElements.formModal.style.display = 'flex';

    } catch (error) {
        console.error("Error loading form:", error);
        DOMElements.formModalBody.innerHTML = `<p style="color:red">Error loading form template: ${error.message}</p>`;
        DOMElements.formModal.style.display = 'flex';
    }
}

async function updateDashboardStats(jobNo) {
    if (!jobNo) return;
    const siteData = await window.DB.getSiteData(jobNo);
    document.getElementById('stat-rfi-pending').textContent = (siteData.rfiLog || []).filter(r => r.status !== 'Approved' && r.status !== 'Closed').length;
    document.getElementById('stat-mat-pending').textContent = (siteData.materialLog || []).filter(m => m.status === 'Submitted' || m.status === 'Revise & Resubmit').length;
    document.getElementById('stat-work-progress').textContent = (siteData.progress || 0) + '%';
    const project = await window.DB.getProject(jobNo);
    const startStr = project.agreementDate || siteData.startDate || new Date().toISOString();
    const startDate = new Date(startStr);
    const diffTime = Math.abs(new Date() - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    document.getElementById('stat-days-active').textContent = diffDays + ' Days';
}
function changeMonth(offset) {
    AppState.calendarDate.setMonth(AppState.calendarDate.getMonth() + offset);
    renderCalendar();
}
//currentJobNo
// --- CALENDAR LOGIC ---
    async function renderCalendar() {
        DOMElements.monthYearDisplay.textContent = AppState.calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
		
        const grid = DOMElements.calendarGridBody;
        grid.innerHTML = '';
        const allEvents = {};

        const addEvent = (date, type, text, color = null, momIndex = null, jobNo = null) => {
            const dateKey = new Date(date).toDateString();
            if (!allEvents[dateKey]) allEvents[dateKey] = [];
            if (!allEvents[dateKey].some(e => e.type === type && e.text === text && e.jobNo === jobNo)) {
                allEvents[dateKey].push({ type, text, color, momIndex, jobNo });
            }
        };
        
        const allHolidays = await window.DB.getAllHolidays();
        allHolidays.forEach(holiday => addEvent(holiday.date, 'holiday', holiday.name));
        const allStaffLeaves = await DB.getAll('staffLeaves');
        allStaffLeaves.forEach(leave => {
            let currentDate = new Date(leave.startDate + 'T00:00:00'); // Ensure correct date parsing
            const endDate = new Date(leave.endDate + 'T00:00:00');
            // Loop through each day of the leave period
            while (currentDate <= endDate) {
                addEvent(currentDate, 'leave', `On Leave: ${leave.staffName}`);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
        if (AppState.currentJobNo) {
            const project = await window.DB.getProject(AppState.currentJobNo);
            const siteData = await window.DB.getSiteData(AppState.currentJobNo);
            (siteData.statusLog || []).forEach(log => addEvent(log.date, 'status', `Status: ${log.status}`));
            (siteData.mom || []).forEach((mom, index) => addEvent(mom.date, 'mom', `MoM: Ref ${mom.ref || 'N/A'}`, null, index, AppState.currentJobNo));
            if (project.projectType === 'Villa') {
                const dynamicSchedule = await getProjectSchedule(project, siteData);
                dynamicSchedule.forEach(task => {
                    for (let d = new Date(task.start + 'T00:00:00'); d <= new Date(task.end + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
                        addEvent(d, 'gantt-task', task.name);
                    }
                });
            }
        } else {
            const allProjects = await DB.getAllProjects();
            const allSiteData = await DB.getAllSiteData();
            for (const project of allProjects) {
                 const siteData = allSiteData.find(d => d.jobNo === project.jobNo) || {};
                const color = getProjectColor(project.jobNo);
                (siteData.statusLog || []).forEach(log => addEvent(log.date, 'status', `${project.jobNo}: ${log.status}`, color));
                (siteData.mom || []).forEach((mom, index) => addEvent(mom.date, 'mom', `${project.jobNo}: MoM ${mom.ref || 'N/A'}`, color, index, project.jobNo));
                if (project.projectType === 'Villa') {
                    const dynamicSchedule = await getProjectSchedule(project, siteData);
                    dynamicSchedule.forEach(task => {
                         for (let d = new Date(task.start + 'T00:00:00'); d <= new Date(task.end + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
                            addEvent(d, 'gantt-task', `${project.jobNo}: ${task.name}`, color);
                        }
                    });
                }
            }
        }

        const year = AppState.calendarDate.getFullYear(), month = AppState.calendarDate.getMonth();
        const startDayOfWeek = new Date(year, month, 1).getDay();
        const currentDay = new Date(year, month, 1 - startDayOfWeek);
        for (let i = 0; i < 42; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            const dayKey = currentDay.toDateString();
            if (currentDay.getMonth() !== month) dayCell.classList.add('other-month');
            dayCell.innerHTML = `<div class="day-number">${currentDay.getDate()}</div><div class="day-events"></div>`;
            const eventsContainer = dayCell.querySelector('.day-events');
            if (allEvents[dayKey]) {
                allEvents[dayKey].sort((a,b) => a.type === 'holiday' ? -1 : 1).forEach(event => {
                    const eventEl = document.createElement('span');
                    eventEl.className = `${event.type.includes('gantt') ? 'event-bar' : 'event-dot'} ${event.type}`;
                    eventEl.textContent = event.text;
                    eventEl.title = event.text;
                    if (event.color) eventEl.style.backgroundColor = event.color;
                    if (event.type === 'mom' && event.momIndex !== null) {
                        eventEl.dataset.momIndex = event.momIndex;
                        eventEl.dataset.jobNo = event.jobNo;
                        eventEl.classList.add('clickable-event');
                    }
                    eventsContainer.appendChild(eventEl);
                });
            }
            grid.appendChild(dayCell);
            currentDay.setDate(currentDay.getDate() + 1);
        }
    }
async function renderCalendarxx() {
    if (!DOMElements.calendarGridBody) return;
    DOMElements.monthYearDisplay.textContent = AppState.calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    DOMElements.calendarGridBody.innerHTML = 'Rendering calendar...';
}

async function populateHolidayCountries() {
    const select = DOMElements.holidayCountrySelect;
    if (!select) return;
    try {
        const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
        if (!response.ok) throw new Error('Failed to fetch countries');
        const countries = await response.json();
        select.innerHTML = countries.map(c => `<option value="${c.countryCode}">${c.name}</option>`).join('');
        select.value = 'AE';
    } catch (error) {
        console.error('Could not load holiday countries:', error);
        select.innerHTML = '<option value="AE">United Arab Emirates</option>';
    }
}

async function handleLoadHolidays() {
    alert("Loading holidays...");
}
// --- END OF NEW site_index.js ---