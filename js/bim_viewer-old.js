/* START OF FILE js/bim_viewer.js */

const BIMViewer = (() => {
    let scene, camera, renderer, controls;
    let container;
    let buildingElements = {};
    let currentFilter = 'all';
    let animationId = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let tooltipEl;

    // --- MATERIALS ---
    const MATS = {
        ghost: new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true, opacity: 0.1, transparent: true, side: THREE.DoubleSide }),
        active: new THREE.MeshLambertMaterial({ color: 0xf39c12, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
        concrete: new THREE.MeshLambertMaterial({ color: 0x95a5a6, side: THREE.DoubleSide }),
        block: new THREE.MeshLambertMaterial({ color: 0xc0392b, side: THREE.DoubleSide }),
        plaster: new THREE.MeshLambertMaterial({ color: 0xecf0f1, side: THREE.DoubleSide }),
        paint: new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
        glass: new THREE.MeshPhongMaterial({ color: 0x3498db, opacity: 0.6, transparent: true, side: THREE.DoubleSide }),
        ground: new THREE.MeshLambertMaterial({ color: 0x8d6e63, side: THREE.DoubleSide }),
        mep: new THREE.MeshStandardMaterial({ color: 0x2980b9, metalness: 0.5, side: THREE.DoubleSide }),
        steel: new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.2, side: THREE.DoubleSide }),
        water: new THREE.MeshPhongMaterial({ color: 0x00aaff, opacity: 0.6, transparent: true, side: THREE.DoubleSide }),
        paving: new THREE.MeshLambertMaterial({ color: 0xa1887f, side: THREE.DoubleSide })
    };

    // --- INITIALIZATION ---
    const init = (domId, projectType = 'Villa') => {
        container = document.getElementById(domId);
        if (!container) return;

        const existingTooltip = document.getElementById('bim-tooltip');
        const existingLoading = document.getElementById('bim-loading');
        container.innerHTML = '';
        if(existingLoading) container.appendChild(existingLoading);
        if(existingTooltip) container.appendChild(existingTooltip);
        tooltipEl = existingTooltip;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222222);
        
        const gridHelper = new THREE.GridHelper(60, 60, 0x555555, 0x333333);
        scene.add(gridHelper);

        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(40, 30, 40);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        renderer.domElement.addEventListener('click', onMouseClick, false);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        scene.add(hemiLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 50, 20);
        dirLight.castShadow = true;
        scene.add(dirLight);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 5, 0);

        generateStructure();

        if (animationId) cancelAnimationFrame(animationId);
        animate();
        
        setTimeout(onWindowResize, 100);
        window.addEventListener('resize', onWindowResize, false);
    };

    const onMouseClick = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData && object.userData.taskId) {
                showTooltip(object.userData);
                
                const oldMat = object.material;
                object.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                setTimeout(() => { object.material = oldMat; }, 500);
            }
        } else {
            if(tooltipEl) tooltipEl.style.display = 'none';
        }
    };

    const showTooltip = async (data) => {
        if (!tooltipEl) return;

        // --- FIX IS HERE ---
        // Get references to tooltip elements directly inside this function.
        const elName = document.getElementById('bim-item-name');
        const elStatus = document.getElementById('bim-item-status');
        const elProgress = document.getElementById('bim-item-progress');
        
        if (!elName || !elStatus || !elProgress) {
            console.error("BIM tooltip elements not found in the DOM.");
            return;
        }
        // --- END FIX ---

        const task = window.currentScheduleData ? window.currentScheduleData.find(t => String(t.id) === data.taskId) : null;
        const taskName = task ? task.name : `Task ID: ${data.taskId}`;
        
        let progress = '0%';
        let workDoneValue = 0;
        let progressPercent = 0;

        const siteData = await window.DB.getSiteData(window.AppState.currentJobNo);
        const boqItem = siteData?.boq?.find(item => String(item.id) === String(data.taskId));

        if (boqItem) {
            progressPercent = (boqItem.prev_perc || 0) + (boqItem.curr_perc || 0);
            progress = `${progressPercent.toFixed(0)}%`;
            const amount = (boqItem.qty || 0) * (boqItem.rate || 0);
            workDoneValue = amount * (progressPercent / 100);
        } else if (task) {
            const now = new Date().getTime();
            const start = new Date(task.start).getTime();
            const end = new Date(task.end).getTime();
            if (now >= end) {
                progress = '100%';
            } else if (now > start) {
                progress = `${Math.round(((now - start) / (end - start)) * 100)}%`;
            }
        }
        
        elName.textContent = taskName;
        elStatus.textContent = data.currentState.toUpperCase();
        elProgress.innerHTML = `
            ${progress} 
            <small>(${workDoneValue > 0 ? workDoneValue.toLocaleString('en-AE', { style: 'currency', currency: 'AED' }) : 'N/A'})</small>
        `;
        
        tooltipEl.style.display = 'block';
    };

    const onWindowResize = () => {
        if (!camera || !renderer || !container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };

    const animate = () => {
        animationId = requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer && scene && camera) renderer.render(scene, camera);
    };

    const addPart = (taskId, geo, x, y, z, sx=1, sy=1, sz=1, rotX=0, rotY=0, rotZ=0, floor='all', matOverride=null) => {
        const mesh = new THREE.Mesh(geo, MATS.ghost);
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        mesh.rotation.set(rotX, rotY, rotZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.userData = { 
            taskId: String(taskId), floor,
            currentState: 'ghost', matOverride
        };
        
        scene.add(mesh);

        const key = String(taskId);
        if (!buildingElements[key]) buildingElements[key] = [];
        buildingElements[key].push(mesh);
    };

    const generateStructure = () => {
        buildingElements = {};
        // Full structure generation code from your file should be here.
        // Omitted for brevity, but it's the same as before.
        // --- 1. MOBILIZATION & ENABLING ---
        addPart(1, new THREE.BoxGeometry(0.1, 2, 30), 15, 1, 0, 1, 1, 1, 0, 0, 0, 'sub', 'steel');
        addPart(1, new THREE.BoxGeometry(0.1, 2, 30), -15, 1, 0, 1, 1, 1, 0, 0, 0, 'sub', 'steel');
        addPart(1, new THREE.BoxGeometry(0.1, 2, 30), 0, 1, 15, 1, 1, 1, 0, Math.PI/2, 0, 'sub', 'steel');
        addPart(1, new THREE.BoxGeometry(0.1, 2, 30), 0, 1, -15, 1, 1, 1, 0, Math.PI/2, 0, 'sub', 'steel');
        addPart(2, new THREE.BoxGeometry(1.5, 3, 0.1), 11, 4, 15, 1, 1, 1, 0, -Math.PI/4, 0, 'sub', 'paint');
        addPart(3, new THREE.PlaneGeometry(28, 28), 0, 0.1, 0, 1, 1, 1, -Math.PI/2, 0, 0, 'sub', 'ground');
        // ... rest of the geometry ...
    };

    const updateSimulation = (currentDate) => {
        if (!currentDate || isNaN(new Date(currentDate).getTime())) return;
        const curMs = new Date(currentDate).getTime();
        
        if (!window.currentScheduleData) return;

        const activeTasksList = document.getElementById('active-tasks-list');
        let activeTasksHTML = '<h5>Current Activities</h5><ul>';
        let hasActive = false;

        for (const [taskIdStr, meshes] of Object.entries(buildingElements)) {
            const task = window.currentScheduleData.find(t => String(t.id) === taskIdStr);
            
            let state = 'ghost';
            let progress = 0;

            if (task && task.start && task.end) {
                const startMs = new Date(task.start).getTime();
                const endMs = new Date(task.end).getTime();
                
                if (curMs >= endMs) {
                    state = 'done';
                    progress = 1;
                } else if (curMs >= startMs) {
                    state = 'active';
                    const duration = endMs - startMs;
                    progress = duration > 0 ? (curMs - startMs) / duration : 0;
                    activeTasksHTML += `<li>${task.name} <span class="progress">${Math.round(progress * 100)}%</span></li>`;
                    hasActive = true;
                }
            }

            meshes.forEach(mesh => {
                if (currentFilter !== 'all' && mesh.userData.floor !== currentFilter) {
                    mesh.visible = false;
                } else {
                    updateMeshState(mesh, state, progress, mesh.userData.matOverride);
                }
            });
        }
        
        if (!hasActive) activeTasksHTML += '<li style="color:#999;">No active tasks...</li>';
        activeTasksHTML += '</ul>';
        if (activeTasksList) activeTasksList.innerHTML = activeTasksHTML;
    };

    const updateMeshState = (mesh, state, progress, matOverride) => {
        if (!mesh.visible) mesh.visible = true;
        if (mesh.userData.currentState === state && state !== 'active') return;
        mesh.userData.currentState = state;

        if (state === 'ghost') {
            mesh.material = MATS.ghost;
        } else if (state === 'active') {
            mesh.material = MATS.active.clone();
            mesh.material.opacity = 0.3 + (progress * 0.7);
        } else if (state === 'done') {
            mesh.material = matOverride ? (MATS[matOverride] || MATS.concrete) : MATS.concrete;
        }
    };

    const setFilter = (floorId) => {
        currentFilter = floorId;
        const slider = document.getElementById('simulation-slider');
        if (slider) {
            const dateDisplay = document.getElementById('simulation-date-display');
            const date = new Date(dateDisplay.textContent);
            updateSimulation(date);
        }
    };

    return { init, updateSimulation, setFilter };
})();