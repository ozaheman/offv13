									  
																

export const ReportingModule = {
    init: (domElements, context) => {
        if(domElements.generateBtn) {
            domElements.generateBtn.addEventListener('click', () => ReportingModule.handleGenerate(context));
        }
    },

    handleGenerate: async (context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return alert("Please select a project first.");

        if (!window.PDFGenerator || !window.getProjectSchedule) {
            return alert("Reporting dependencies (PDF Generator or Schedule Logic) are not loaded.");
        }

        try {
											   
            const project = await window.DB.getProject(currentJobNo);
            const siteData = await window.DB.getSiteData(currentJobNo);
			
																								  
            const schedule = await window.getProjectSchedule(project, siteData);
																																							  
            
            const reportHtml = await ReportingModule.generateHtml(project, siteData, schedule);
            
										   
										  
            await window.PDFGenerator.generate({ 
                tempContent: reportHtml, 
                projectJobNo: currentJobNo, 
                fileName: `${project.jobNo}_Status_Report_${new Date().toISOString().split('T')[0]}` 
            });

															   
				 
					
																																							 
			 
        } catch (error) {
            console.error("Report generation failed:", error);
            alert("An error occurred while generating the report.");
        }
    },
																   
										  
														   
																	
																																																		 
																																																			 
																																																																																																									
																  
																																	   
																																																																																																																																			
																									  
					 
	  

    generateHtml: async (project, siteData, schedule) => {
        // This is a placeholder for a rich HTML report template.
        const latestStatus = (siteData.statusLog && siteData.statusLog.length > 0) 
            ? siteData.statusLog.slice(-1)[0].status 
            : siteData.status;

        const openActionItems = (siteData.mom || []).flatMap(m => m.actions || [])
            .filter(a => a.status && a.status.toLowerCase() !== 'closed')
            .map(a => `<li>${a.desc} (By: ${a.by}, Due: ${a.date})</li>`).join('');

        return `
            <div class="report-container">
                <h1>Project Status Report</h1>
                <h2>${project.projectDescription} (${project.jobNo})</h2>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <hr>
                <h3>Overall Status</h3>
                <p><strong>Current Stage:</strong> ${latestStatus}</p>
                <p><strong>Overall Progress:</strong> ${siteData.progress || 0}%</p>
                
                <h3>Open Action Items</h3>
                <ul>${openActionItems || '<li>No open action items.</li>'}</ul>

                <h3>Upcoming Schedule</h3>
                <p><em>Schedule details would be rendered here...</em></p>
            </div>
        `;
    }
};