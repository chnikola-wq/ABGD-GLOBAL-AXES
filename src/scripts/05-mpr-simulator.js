        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        let scene, cameraTop, cameraBottom, rendererTop, rendererBottom;
        let controlsBottom;
        let wholeVolume, distalGroup;
        
        // Mathematical Constants
        const WEDGE_MAX = 40 * (Math.PI / 180);
        const TRUE_TWIST = 25 * (Math.PI / 180);
        const DISK_RADIUS = 2.0;

        // Helper function to create high-res text labels that always face the camera
        function createLabelSprite(text, color) {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            ctx.font = '600 72px ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.strokeStyle = '#18181b'; 
            ctx.lineWidth = 12; 
            ctx.strokeText(text, 1024, 128);
            
            ctx.fillStyle = color;
            ctx.fillText(text, 1024, 128);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;

            const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(8.8, 1.1, 1); 
            sprite.renderOrder = 999; 
            return sprite;
        }

        function initMPRSimulation() {
            const containerTop = document.getElementById('mpr-top-canvas');
            const containerBottom = document.getElementById('mpr-bottom-canvas');
            if (!containerTop || !containerBottom) return; // Guard clause if missing from DOM

            scene = new THREE.Scene();
            scene.add(new THREE.AmbientLight(0xffffff, 1.0));

            // MATERIALS 
            const colorProx = 0xd1d5db;   // Light Grey
            const colorDist = 0x73bdf5;   // Light Blue
            const colorOrange = 0xf87171; // Orange/Red anatomical line
            const colorGlass = 0xffffff;  // White screen line

            const matProxSurface = new THREE.MeshBasicMaterial({ color: colorProx });
            const matDistSurface = new THREE.MeshBasicMaterial({ color: colorDist });
            const matLineOrange = new THREE.MeshBasicMaterial({ color: colorOrange });
            const matLineGlass = new THREE.MeshBasicMaterial({ color: colorGlass });

            // THE GLASS LINE: Fixed to the screen, closest to the user (looking from below)
            const glassLine = new THREE.Mesh(new THREE.BoxGeometry(DISK_RADIUS, 0.04, 0.04), matLineGlass);
            glassLine.position.set(DISK_RADIUS / 2, -0.1, 0); 
            scene.add(glassLine);

            const lblGlass = createLabelSprite('Proximal Ref (Glass)', '#ffffff');
            lblGlass.position.set(3.4, -0.1, -0.5); 
            scene.add(lblGlass);

            // MASTER VOLUME: This represents the entire 3D CT scan data
            wholeVolume = new THREE.Group();
            scene.add(wholeVolume);

            // === PROXIMAL SURFACE ===
            const proxSurface = new THREE.Mesh(new THREE.CylinderGeometry(DISK_RADIUS, DISK_RADIUS, 0.04, 64), matProxSurface);
            proxSurface.position.y = 0; 
            wholeVolume.add(proxSurface);

            const lblProx = createLabelSprite('Proximal Surface', '#d1d5db');
            lblProx.position.set(-3.4, 0, -0.5); 
            wholeVolume.add(lblProx);

            // === DISTAL SURFACE ===
            distalGroup = new THREE.Group();
            
            const distSurface = new THREE.Mesh(new THREE.CylinderGeometry(DISK_RADIUS, DISK_RADIUS, 0.04, 64), matDistSurface);
            distSurface.position.y = -0.05; 
            distalGroup.add(distSurface);

            const lblDist = createLabelSprite('Distal Surface', '#73bdf5');
            lblDist.position.set(-3.4, -0.05, 0.5); 
            distalGroup.add(lblDist);

            // Distal Anatomical Line
            const distLine = new THREE.Mesh(new THREE.BoxGeometry(DISK_RADIUS, 0.04, 0.04), matLineOrange);
            distLine.position.set(DISK_RADIUS / 2, -0.06, 0); 
            distalGroup.add(distLine);

            const lblDistLine = createLabelSprite('Distal Anatomical Ref', '#f87171');
            lblDistLine.position.set(3.4, -0.06, 0.5); 
            distalGroup.add(lblDistLine);

            // Apply intrinsic deformity
            distalGroup.rotation.z = WEDGE_MAX;
            distalGroup.rotateY(-TRUE_TWIST); 
            wholeVolume.add(distalGroup);

            // === WEDGE VOLUME FILL ===
            const matWedge = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
            const wedgeGeo = new THREE.CylinderGeometry(DISK_RADIUS, DISK_RADIUS, 0.04, 32);
            const wedgeMesh = new THREE.Mesh(wedgeGeo, matWedge);
            wedgeMesh.position.y = -0.025;
            distalGroup.add(wedgeMesh);

            // === VIEWING DIRECTION INDICATOR ===
            window.eyeGroup = new THREE.Group();
            const arrowDir = new THREE.Vector3(0, 1, 0); 
            const arrowOrigin = new THREE.Vector3(0, -4, 0);
            const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowOrigin, 2.5, 0x10b981, 0.6, 0.4);
            window.eyeGroup.add(arrowHelper);
            
            const lblEye = createLabelSprite('User Viewing Direction', '#10b981');
            lblEye.position.set(0, -5.2, 0); 
            window.eyeGroup.add(lblEye);
            scene.add(window.eyeGroup);

            // === CAMERAS ===
            const aspect = containerTop.clientWidth / containerTop.clientHeight;
            
            const d = 2.8;
            cameraTop = new THREE.OrthographicCamera(-d*aspect, d*aspect, d, -d, 0.1, 100);
            cameraTop.position.set(0, -10, 0); 
            cameraTop.lookAt(0, 0, 0);
            cameraTop.up.set(0, 0, 1); 

            cameraBottom = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
            cameraBottom.position.set(0, -1.5, 15); 
            cameraBottom.lookAt(0, 0, 0);

            // === RENDERERS ===
            rendererTop = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            rendererTop.setSize(containerTop.clientWidth, containerTop.clientHeight);
            containerTop.appendChild(rendererTop.domElement);

            rendererBottom = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            rendererBottom.setSize(containerBottom.clientWidth, containerBottom.clientHeight);
            containerBottom.appendChild(rendererBottom.domElement);

            controlsBottom = new OrbitControls(cameraBottom, rendererBottom.domElement);
            controlsBottom.enableDamping = true;

            // Event Listeners (Safe binding for the report environment)
            const slider = document.getElementById('mpr-slider');
            if (slider) {
                ['input', 'change'].forEach(evt => slider.addEventListener(evt, updateMPRState));
            }
            window.addEventListener('resize', onWindowResize);

            // Fix for tab switching (prevents canvas stretching)
            document.getElementById('btn-tab-math')?.addEventListener('click', () => {
                setTimeout(onWindowResize, 50);
            });

            updateMPRState();
            animateMPR();
        }

        function updateMPRState() {
            const slider = document.getElementById('mpr-slider');
            if (!slider) return;
            const progress = slider.value / 100;
            
            wholeVolume.rotation.z = -WEDGE_MAX * progress;

            const currentWedge = 40.0 * (1 - progress);
            const wedgeValEl = document.getElementById('mpr-wedge-val');
            if(wedgeValEl) wedgeValEl.innerHTML = `${currentWedge.toFixed(1)}&deg;`;

            const startDistortion = 53.8;
            const currentProj = startDistortion - ((startDistortion - 25.0) * progress);
            const projValEl = document.getElementById('mpr-proj-val');
            if(projValEl) projValEl.innerHTML = `${currentProj.toFixed(1)}&deg;`;
        }

        function onWindowResize() {
            const containerTop = document.getElementById('mpr-top-canvas');
            const containerBottom = document.getElementById('mpr-bottom-canvas');
            if (!containerTop || !containerBottom) return;

            const aspect = containerTop.clientWidth / containerTop.clientHeight;
            
            const d = 2.8;
            cameraTop.left = -d * aspect;
            cameraTop.right = d * aspect;
            cameraTop.updateProjectionMatrix();
            rendererTop.setSize(containerTop.clientWidth, containerTop.clientHeight);

            cameraBottom.aspect = aspect;
            cameraBottom.updateProjectionMatrix();
            rendererBottom.setSize(containerBottom.clientWidth, containerBottom.clientHeight);
        }

        function animateMPR() {
            requestAnimationFrame(animateMPR);
            
            // Optimisation: Only render if the Math tab is active
            const mathTab = document.getElementById('view-math');
            if (mathTab && mathTab.classList.contains('hidden')) return;

            controlsBottom.update();
            
            if(window.eyeGroup) window.eyeGroup.visible = false;
            rendererTop.render(scene, cameraTop);
            
            if(window.eyeGroup) window.eyeGroup.visible = true;
            rendererBottom.render(scene, cameraBottom);
        }

        window.addEventListener('load', () => {
            // Slight delay ensures the DOM is fully painted before attaching canvases
            setTimeout(initMPRSimulation, 100);
        });
