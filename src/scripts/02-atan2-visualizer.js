/*
 * atan2 visualiser (vector + signed angle wedge)
 *
 * Extracted verbatim from the inline <script type="module"> block of
 * the original Global Axes v4.2.html. Bundled by Vite via src/main.js;
 * three.js and its addons resolve through the npm package instead of
 * the runtime CDN importmap that previously lived in the HTML head.
 */

        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        let sceneA, cameraA, rendererA, controlsA;
        let arrowU, arrowXRef, arrowXFinal, arrowCross;
        let sector;
        const vecU = new THREE.Vector3(0, -1, 0); // Downward u
        const vecXRef = new THREE.Vector3(1, 0, 0);
        const vecXFinal = new THREE.Vector3(1, 0, 0);

        function initAtan2() {
            const container = document.getElementById('atan2-canvas-container');
            if (!container) return;

            sceneA = new THREE.Scene();
            cameraA = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
            cameraA.position.set(5, 3, 6);

            rendererA = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            rendererA.setSize(container.clientWidth, container.clientHeight);
            rendererA.setPixelRatio(window.devicePixelRatio);
            container.appendChild(rendererA.domElement);

            controlsA = new OrbitControls(cameraA, rendererA.domElement);
            controlsA.target.set(0, -1, 0);
            controlsA.enableDamping = true;

            sceneA.add(new THREE.AmbientLight(0xffffff, 0.6));
            const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(5, 10, 5); sceneA.add(dl);
            sceneA.add(new THREE.GridHelper(10, 10, 0x444444, 0x222222));

            arrowU = new THREE.ArrowHelper(vecU, new THREE.Vector3(0,0,0), 3, 0xffffff, 0.4, 0.2);
            arrowXRef = new THREE.ArrowHelper(vecXRef, new THREE.Vector3(0,0,0), 4, 0xef4444, 0.4, 0.2);
            arrowXFinal = new THREE.ArrowHelper(vecXFinal, new THREE.Vector3(0,0,0), 4, 0xfacc15, 0.4, 0.2);
            arrowCross = new THREE.ArrowHelper(vecU, new THREE.Vector3(0,0,0), 0.1, 0xa855f7, 0.4, 0.2);

            sceneA.add(arrowU); sceneA.add(arrowXRef); sceneA.add(arrowXFinal); sceneA.add(arrowCross);

            sector = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.2, side: THREE.DoubleSide }));
            sector.rotation.x = -Math.PI / 2; sceneA.add(sector);

            const slider = document.getElementById('atan2-angle-slider');
            slider.addEventListener('input', updateAtan2);
            updateAtan2();
            animateAtan2();
        }

        function updateAtan2() {
            const slider = document.getElementById('atan2-angle-slider');
            if (!slider) return;
            const val = parseFloat(slider.value);
            const rad = THREE.MathUtils.degToRad(val);

            // Mathematical setup: Clinical Positive = External. 
            // We want positive to rotate towards Q4 (bottom right).
            // If X is lateral (1,0,0) and Z is anterior (0,0,1), Q4 is X>0, Z<0.
            vecXFinal.set(Math.cos(rad), 0, -Math.sin(rad));
            arrowXFinal.setDirection(vecXFinal);

            const dot = vecXRef.dot(vecXFinal);
            const cross = new THREE.Vector3().crossVectors(vecXRef, vecXFinal);
            
            // To extract correct clinical sign (Positive External) with downward u, use -u referee
            const upRef = vecU.clone().negate();
            const sine = cross.dot(upRef); 

            if (Math.abs(sine) > 0.01) {
                arrowCross.visible = true;
                arrowCross.setDirection(sine > 0 ? upRef : vecU);
                arrowCross.setLength(Math.abs(sine) * 3, 0.4, 0.2);
            } else {
                arrowCross.visible = false;
            }

            // Fixed Sector Geometry Math to ensure sweep starts at xref and bridges to xfinal correctly
            sector.geometry.dispose();
            sector.geometry = new THREE.CircleGeometry(1.5, 32, rad > 0 ? 0 : rad, Math.abs(rad));

            document.getElementById('atan2-angle-display').textContent = `${val}°`;
            document.getElementById('atan2-val-dot').textContent = dot.toFixed(3);
            document.getElementById('atan2-val-cross').textContent = sine.toFixed(3);
            document.getElementById('atan2-eq-cos').textContent = dot.toFixed(3);
            document.getElementById('atan2-eq-sin').textContent = sine.toFixed(3);
            document.getElementById('atan2-val-final').textContent = THREE.MathUtils.radToDeg(Math.atan2(sine, dot)).toFixed(1);
        }

        function animateAtan2() {
            requestAnimationFrame(animateAtan2);
            if(controlsA) controlsA.update();
            rendererA.render(sceneA, cameraA);
        }

        function toScreenXYA(position, currentCamera, canvasElement) {
            if (!currentCamera || !canvasElement) return { x: -1000, y: -1000 };
            const pos = position.clone(); pos.project(currentCamera);
            return { x: (pos.x + 1) * canvasElement.clientWidth / 2, y: (-pos.y + 1) * canvasElement.clientHeight / 2 };
        }

        function updateLabelsA() {
            if (document.getElementById('view-math').classList.contains('hidden') || !cameraA) return;
            const container = document.getElementById('atan2-canvas-container');
            const updateL = (id, pos) => {
                const el = document.getElementById(id);
                if(!el) return;
                if(pos) {
                    const s = toScreenXYA(pos, cameraA, container);
                    el.style.left = `${s.x}px`; el.style.top = `${s.y}px`; el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            };
            updateL('lbl-atan2-u', vecU.clone().multiplyScalar(3.2));
            updateL('lbl-atan2-xref', vecXRef.clone().multiplyScalar(4.2));
            updateL('lbl-atan2-xfinal', vecXFinal.clone().multiplyScalar(4.2));
            if(arrowCross && arrowCross.visible) updateL('lbl-atan2-cross', arrowCross.dir.clone().multiplyScalar(arrowCross.line.scale.y + 0.3));
            else updateL('lbl-atan2-cross', null);
        }

        window.addEventListener('load', initAtan2);
        
        document.getElementById('btn-tab-math').addEventListener('click', () => {
            setTimeout(() => {
                const containerAtan2 = document.getElementById('atan2-canvas-container');
                if (containerAtan2 && cameraA && rendererA) {
                    cameraA.aspect = containerAtan2.clientWidth / containerAtan2.clientHeight;
                    cameraA.updateProjectionMatrix();
                    rendererA.setSize(containerAtan2.clientWidth, containerAtan2.clientHeight);
                }
            }, 50);
        });
        
        window.addEventListener('resize', () => {
            if(document.getElementById('view-math').classList.contains('hidden')) return;
            const containerAtan2 = document.getElementById('atan2-canvas-container');
            if (containerAtan2 && cameraA && rendererA) {
                cameraA.aspect = containerAtan2.clientWidth / containerAtan2.clientHeight;
                cameraA.updateProjectionMatrix();
                rendererA.setSize(containerAtan2.clientWidth, containerAtan2.clientHeight);
            }
        });

        setInterval(updateLabelsA, 30);
