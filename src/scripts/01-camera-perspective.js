        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        let scene, roomCamera, monitorCameraPersp, monitorCameraOrtho, activeMonitorCamera;
        let roomRenderer, monitorRenderer, roomControls;
        let cameraHelper;

        function initPerspectiveDemo() {
            const containerRoom = document.getElementById('persp-room-canvas');
            const containerMonitor = document.getElementById('persp-monitor-canvas');
            if (!containerRoom || !containerMonitor) return;

            // 1. Shared Scene Setup
            scene = new THREE.Scene();
            scene.add(new THREE.AmbientLight(0xffffff, 0.7));
            const dl = new THREE.DirectionalLight(0xffffff, 0.6);
            dl.position.set(10, 20, 10);
            scene.add(dl);

            const grid = new THREE.GridHelper(40, 40, 0x4b5563, 0x222222);
            scene.add(grid);

            // The rigid 90-degree 'L' Shape
            const materialL = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
            const cylGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
            
            const legX = new THREE.Mesh(cylGeo, materialL);
            legX.rotation.z = Math.PI / 2;
            legX.position.set(3, 0.3, 0); 
            scene.add(legX);

            const legZ = new THREE.Mesh(cylGeo, materialL);
            legZ.rotation.x = Math.PI / 2;
            legZ.position.set(0, 0.3, 3); 
            scene.add(legZ);

            const vertex = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
            vertex.position.set(0, 0.3, 0);
            scene.add(vertex);

            // 2. The physical "Monitor Cameras"
            const aspect = containerMonitor.clientWidth / containerMonitor.clientHeight;
            
            // Perspective Camera
            monitorCameraPersp = new THREE.PerspectiveCamera(45, aspect, 0.1, 25);
            
            // Orthographic Camera
            const fSize = 12;
            monitorCameraOrtho = new THREE.OrthographicCamera(-fSize*aspect/2, fSize*aspect/2, fSize/2, -fSize/2, 0.1, 50);

            activeMonitorCamera = monitorCameraPersp;
            
            cameraHelper = new THREE.CameraHelper(activeMonitorCamera);
            scene.add(cameraHelper);

            // 3. The "Room Camera"
            roomCamera = new THREE.PerspectiveCamera(50, containerRoom.clientWidth / containerRoom.clientHeight, 0.1, 200);
            roomCamera.position.set(-25, 30, 30);
            roomCamera.lookAt(0, 0, 0);

            roomRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            roomRenderer.setSize(containerRoom.clientWidth, containerRoom.clientHeight);
            containerRoom.appendChild(roomRenderer.domElement);

            monitorRenderer = new THREE.WebGLRenderer({ antialias: true });
            monitorRenderer.setClearColor(0x0f172a); 
            monitorRenderer.setSize(containerMonitor.clientWidth, containerMonitor.clientHeight);
            containerMonitor.appendChild(monitorRenderer.domElement);

            roomControls = new OrbitControls(roomCamera, roomRenderer.domElement);
            roomControls.enableDamping = true;
            roomControls.target.set(0, 0, 0);
            

            // Listeners (Using both 'input' and 'change' to guarantee UI updates on all browsers)
            ['input', 'change'].forEach(evt => {
                document.getElementById('sim-cam-x').addEventListener(evt, updateSimCamera);
                document.getElementById('sim-cam-y').addEventListener(evt, updateSimCamera);
                document.getElementById('sim-cam-z').addEventListener(evt, updateSimCamera);
            });

            const radios = document.querySelectorAll('input[name="sim-lens"]');
            radios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const isPersp = e.target.value === 'perspective';
                    activeMonitorCamera = isPersp ? monitorCameraPersp : monitorCameraOrtho;
                    
                    document.querySelector('input[value="perspective"]').nextElementSibling.classList.toggle('text-white', isPersp);
                    document.querySelector('input[value="perspective"]').nextElementSibling.classList.toggle('text-gray-400', !isPersp);
                    document.querySelector('.label-ortho-text').classList.toggle('text-white', !isPersp);
                    document.querySelector('.label-ortho-text').classList.toggle('text-gray-400', isPersp);
                    
                    scene.remove(cameraHelper);
                    cameraHelper = new THREE.CameraHelper(activeMonitorCamera);
                    scene.add(cameraHelper);
                    
                    updateSimCamera();
                });
            });

            document.getElementById('btn-tab-math').addEventListener('click', () => {
                setTimeout(() => {
                    const newAspect = containerMonitor.clientWidth / containerMonitor.clientHeight;
                    
                    roomCamera.aspect = containerRoom.clientWidth / containerRoom.clientHeight;
                    roomCamera.updateProjectionMatrix();
                    roomRenderer.setSize(containerRoom.clientWidth, containerRoom.clientHeight);
                    
                    monitorCameraPersp.aspect = newAspect;
                    monitorCameraPersp.updateProjectionMatrix();
                    
                    monitorCameraOrtho.left = -fSize * newAspect / 2;
                    monitorCameraOrtho.right = fSize * newAspect / 2;
                    monitorCameraOrtho.updateProjectionMatrix();
                    
                    monitorRenderer.setSize(containerMonitor.clientWidth, containerMonitor.clientHeight);
                }, 50);
            });

            // Force highly skewed default values on initial load to prove the distortion
            document.getElementById('sim-cam-x').value = -15;
            document.getElementById('sim-cam-y').value = 8;
            document.getElementById('sim-cam-z').value = 20;

            updateSimCamera();
            animatePersp();
        }

        function updateSimCamera() {
            const x = parseFloat(document.getElementById('sim-cam-x').value);
            const y = parseFloat(document.getElementById('sim-cam-y').value);
            const z = parseFloat(document.getElementById('sim-cam-z').value);

            document.getElementById('val-cam-x').textContent = x;
            document.getElementById('val-cam-y').textContent = y;
            document.getElementById('val-cam-z').textContent = z;

            monitorCameraPersp.position.set(x, y, z);
            monitorCameraOrtho.position.set(x, y, z);
            
            if (Math.abs(x) < 0.1 && Math.abs(z) < 0.1) {
                monitorCameraPersp.up.set(0, 0, -1);
                monitorCameraOrtho.up.set(0, 0, -1);
            } else {
                monitorCameraPersp.up.set(0, 1, 0);
                monitorCameraOrtho.up.set(0, 1, 0);
            }
            
            monitorCameraPersp.lookAt(0, 0.3, 0); 
            monitorCameraOrtho.lookAt(0, 0.3, 0);
            
            monitorCameraPersp.updateProjectionMatrix();
            monitorCameraOrtho.updateProjectionMatrix();
            
            // Force the 3D matrices to update explicitly before calculation
            monitorCameraPersp.updateMatrixWorld(true);
            monitorCameraOrtho.updateMatrixWorld(true);
            
            if (cameraHelper) cameraHelper.update();
        }

        function drawScreenAngleOverlay() {
            const container = document.getElementById('persp-monitor-canvas');
            if (!container || !activeMonitorCamera) return;

            const cw = container.clientWidth;
            const ch = container.clientHeight;

            const ptOrigin = new THREE.Vector3(0, 0.3, 0);
            const ptX = new THREE.Vector3(5, 0.3, 0);
            const ptZ = new THREE.Vector3(0, 0.3, 5);

            const toScreen = (pt) => {
                // EXPLICIT FORCE: Ensure the projection matrix is not using cached coordinates
                activeMonitorCamera.updateMatrixWorld(true); 
                const proj = pt.clone().project(activeMonitorCamera);
                return { x: (proj.x * 0.5 + 0.5) * cw, y: (-proj.y * 0.5 + 0.5) * ch, z: proj.z };
            };

            const sOrigin = toScreen(ptOrigin);
            const sX = toScreen(ptX);
            const sZ = toScreen(ptZ);

            if (sOrigin.z > 1.0) return;

            const vecX = { x: sX.x - sOrigin.x, y: sX.y - sOrigin.y };
            const vecZ = { x: sZ.x - sOrigin.x, y: sZ.y - sOrigin.y };

            const lenX = Math.sqrt(vecX.x * vecX.x + vecX.y * vecX.y);
            const lenZ = Math.sqrt(vecZ.x * vecZ.x + vecZ.y * vecZ.y);

            if (lenX < 1 || lenZ < 1) return; 

            const dirX = { x: vecX.x / lenX, y: vecX.y / lenX };
            const dirZ = { x: vecZ.x / lenZ, y: vecZ.y / lenZ };

            const drawLen = 70;
            document.getElementById('persp-svg-lineX').setAttribute('x1', sOrigin.x);
            document.getElementById('persp-svg-lineX').setAttribute('y1', sOrigin.y);
            document.getElementById('persp-svg-lineX').setAttribute('x2', sOrigin.x + dirX.x * drawLen);
            document.getElementById('persp-svg-lineX').setAttribute('y2', sOrigin.y + dirX.y * drawLen);

            document.getElementById('persp-svg-lineZ').setAttribute('x1', sOrigin.x);
            document.getElementById('persp-svg-lineZ').setAttribute('y1', sOrigin.y);
            document.getElementById('persp-svg-lineZ').setAttribute('x2', sOrigin.x + dirZ.x * drawLen);
            document.getElementById('persp-svg-lineZ').setAttribute('y2', sOrigin.y + dirZ.y * drawLen);

            let ang1 = Math.atan2(dirX.y, dirX.x);
            let ang2 = Math.atan2(dirZ.y, dirZ.x);
            let diff = ang2 - ang1;
            
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            
            const displayDeg = Math.abs(diff * 180 / Math.PI);
            
            const readoutEl = document.getElementById('persp-angle-readout');
            readoutEl.textContent = `${displayDeg.toFixed(1)}°`;
            if (document.querySelector('input[value="orthographic"]').checked) {
                readoutEl.className = "font-mono text-lg text-indigo-400";
                document.getElementById('persp-svg-arc').setAttribute('fill', 'rgba(99, 102, 241, 0.2)');
                document.getElementById('persp-svg-arc').setAttribute('stroke', '#6366f1');
            } else {
                readoutEl.className = "font-mono text-lg text-pink-400";
                document.getElementById('persp-svg-arc').setAttribute('fill', 'rgba(236, 72, 153, 0.2)');
                document.getElementById('persp-svg-arc').setAttribute('stroke', '#ec4899');
            }

            const radius = 40;
            const arcStart = { x: sOrigin.x + dirX.x * radius, y: sOrigin.y + dirX.y * radius };
            const arcEnd = { x: sOrigin.x + dirZ.x * radius, y: sOrigin.y + dirZ.y * radius };
            
            const sweep = diff > 0 ? 1 : 0;
            const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
            
            const pathData = `M ${sOrigin.x} ${sOrigin.y} L ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${arcEnd.x} ${arcEnd.y} Z`;
            document.getElementById('persp-svg-arc').setAttribute('d', pathData);
        }

        function animatePersp() {
            requestAnimationFrame(animatePersp);
            
            if (document.getElementById('view-math').classList.contains('hidden')) return;

            if (roomControls) roomControls.update();

            if (cameraHelper) cameraHelper.visible = true;
            roomRenderer.render(scene, roomCamera);

            if (cameraHelper) cameraHelper.visible = false;
            monitorRenderer.render(scene, activeMonitorCamera);

            drawScreenAngleOverlay();
        }

        window.addEventListener('load', initPerspectiveDemo);
