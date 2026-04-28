                import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        // Obfuscated Identity Variables
        const _0xAuthId = ['Q2hy', 'aXN0', 'b3Mg', 'Tmlr', 'b2xh', 'b3U='].join('');
        const _0xRefStr = atob(_0xAuthId);

        window._projLabelAnchors = {};
        window._projArcData = {};
        window._dragLabelOffsets = window._dragLabelOffsets || {};

        const domCache = {};
        let containerCache = null;

        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            try {
                const swCode = "self.addEventListener('fetch', () => {});";
                const blob = new Blob([swCode], { type: 'application/javascript' });
                navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(() => {});
            } catch (e) {}
        }

        function getContainer() {
            if (!containerCache) containerCache = document.getElementById('canvas-container');
            return containerCache;
        }

        let scene, camera, renderer, controls;
        let proximalBone, distalBoneGroup, distalBoneMesh;
        const boneLength = 6;
        
        let sectorPhi, sectorPsi, sectorTheta;
        let arcLinePhi, arcLinePsi, arcLineTheta;
        let conePhi, conePsi, coneTheta;
        let projFrontal, projSagittal, projTransverse;

        let wedgeGroup, wedgeConcaveMesh, wedgeConvexMesh, wedgeOutline;
        let midWedge = null, thetaWedge = 0;

        let singleGroup, singlePlaneMesh, singleAxisLine;
        let midSingle = null, angleSingle = 0;
        let axisSingle = new THREE.Vector3();
        
        let arrowU, arrowXRef, arrowURot, arrowNWedge;
        let uVec = new THREE.Vector3(0, -1, 0);
        let xRefVec = new THREE.Vector3(1, 0, 0);
        let uRotVec = new THREE.Vector3(1, 0, 0);
        let nWedgeVec = new THREE.Vector3(1, 0, 0);

        let gridTransverse, gridFrontal, gridSagittal;
        let refAxes, refYExtLine, localYExtLine, localAxes;
        let midPhi = null, midPsi = null, midTheta = null;
        
        // Guide lines for psi visualization
        let psiGuideLine = null;

        const sliderPhi = document.getElementById('slider-phi');
        const sliderPsi = document.getElementById('slider-psi');
        const sliderTheta = document.getElementById('slider-theta');
        const inputPhi = document.getElementById('input-phi');
        const inputPsi = document.getElementById('input-psi');
        const inputTheta = document.getElementById('input-theta');
        const sequenceSelect = document.getElementById('sequence-select');
        const toggleWedgeBtn = document.getElementById('toggle-wedge');
        const toggleSingleBtn = document.getElementById('toggle-single');
        const toggleBasisBtn = document.getElementById('toggle-basis');
        const resetBtn = document.getElementById('reset-btn');
        const correctBtn = document.getElementById('correct-btn');
        const matrixDisplay = document.getElementById('matrix-display');
        const sequenceDisplay = document.getElementById('sequence-display');

        const controlPanel = document.getElementById('control-panel');
        const controlBackdrop = document.getElementById('control-backdrop');
        const openControlsBtn = document.getElementById('open-controls-btn');
        const closeControlsBtn = document.getElementById('close-controls-btn');

        const instructionsPanel = document.getElementById('instructions-panel');
        const toggleInstBtn = document.getElementById('toggle-inst-btn');
        const closeInstBtn = document.getElementById('close-inst-btn');
        const resizerHandle = document.getElementById('resizer-handle');

        const btnTabSim = document.getElementById('btn-tab-sim');
        const btnTabMath = document.getElementById('btn-tab-math');
        const viewSim = document.getElementById('view-sim');
        const viewMath = document.getElementById('view-math');

        function openMobileControls() {
            controlPanel.classList.remove('-translate-x-full');
            controlBackdrop.classList.remove('hidden');
        }

        function closeMobileControls() {
            controlPanel.classList.add('-translate-x-full');
            controlBackdrop.classList.add('hidden');
        }

        openControlsBtn.addEventListener('click', openMobileControls);
        closeControlsBtn.addEventListener('click', closeMobileControls);
        controlBackdrop.addEventListener('click', closeMobileControls);

        btnTabSim.addEventListener('click', () => {
            viewSim.classList.remove('hidden');
            viewSim.classList.add('flex');
            viewMath.classList.add('hidden');
            viewMath.classList.remove('flex');
            btnTabSim.classList.add('text-indigo-400', 'border-b-2', 'border-indigo-400');
            btnTabSim.classList.remove('text-gray-400');
            btnTabMath.classList.remove('text-indigo-400', 'border-b-2', 'border-indigo-400');
            btnTabMath.classList.add('text-gray-400');

            // Wait for layout, recalculate everything, then reveal labels
            setTimeout(() => {
                onWindowResize();
                updateDeformity();
                // Second delay: let animate() run a frame with correct data
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        updateDeformity();
                        ['proj-lbl-frontal', 'proj-lbl-sagittal', 'proj-lbl-transverse'].forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.style.visibility = '';
                        });
                    });
                });
            }, 80);
        });

        btnTabMath.addEventListener('click', () => {
            // Hide draggable projection labels before switching away
            ['proj-lbl-frontal', 'proj-lbl-sagittal', 'proj-lbl-transverse', 'label-wedge-angle', 'label-single-angle'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.visibility = 'hidden';
            });

            viewSim.classList.add('hidden');
            viewSim.classList.remove('flex');
            viewMath.classList.remove('hidden');
            viewMath.classList.add('flex');
            btnTabMath.classList.add('text-indigo-400', 'border-b-2', 'border-indigo-400');
            btnTabMath.classList.remove('text-gray-400');
            btnTabSim.classList.remove('text-indigo-400', 'border-b-2', 'border-indigo-400');
            btnTabSim.classList.add('text-gray-400');
        });

        function formatTorsion(angleRad) {
            let deg = THREE.MathUtils.radToDeg(angleRad);
            if (deg < -0.05) return `${Math.abs(deg).toFixed(1)}&deg; Internal`;
            if (deg > 0.05) return `${Math.abs(deg).toFixed(1)}&deg; External`;
            return `0.0&deg;`;
        }

        init();
        animate();

        window._projLabelAnchors = {};
        window._projArcData = {};

        function init() {
            const _0xc1 = document.getElementById('cr-1');
            const _0xc2 = document.getElementById('cr-2');
            const _0xc3 = document.getElementById('cr-3');
            if(_0xc1) _0xc1.innerText = _0xRefStr;
            if(_0xc2) _0xc2.innerText = _0xRefStr;
            if(_0xc3) _0xc3.innerText = _0xRefStr;

            const container = getContainer();

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x111827); 

            camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
            
            // --- TOP-DOWN CAMERA SETUP (Gimbal Lock Fix) ---
            // A microscopic offset prevents the mathematical singularity
            camera.position.set(0.001, 30, 0.001); 
            
            // Keep the standard 'Y is Up' orientation for natural orbiting
            camera.up.set(0, 1, 0);       
            
            // Aim at the centre
            camera.lookAt(0, 0, 0);        
            // -----------------------------------------------
            
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(10, 20, 10);
            dirLight.castShadow = true;
            scene.add(dirLight);

            gridTransverse = new THREE.GridHelper(20, 20, 0x4b5563, 0x374151);
            gridTransverse.position.y = -10; 
            scene.add(gridTransverse);

            gridFrontal = new THREE.GridHelper(20, 20, 0x4b5563, 0x374151);
            gridFrontal.rotation.x = Math.PI / 2;
            gridFrontal.position.z = -10;
            scene.add(gridFrontal);

            gridSagittal = new THREE.GridHelper(20, 20, 0x4b5563, 0x374151);
            gridSagittal.rotation.z = Math.PI / 2;
            gridSagittal.position.x = -10;
            scene.add(gridSagittal);

            function createProjectionElements(color) {
                const group = new THREE.Group();
                // World-space elements (dashed projection line, grey anchor, tinted sector)
                const lineMat = new THREE.LineDashedMaterial({ color: color, dashSize: 0.4, gapSize: 0.2, depthTest: false, transparent: true, opacity: 0.9, linewidth: 2 });
                const refMat = new THREE.LineBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.4, depthTest: false }); 
                const sectorMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthTest: false });

                const projLine = new THREE.Line(new THREE.BufferGeometry(), lineMat);
                const refLine = new THREE.Line(new THREE.BufferGeometry(), refMat);
                const sector = new THREE.Mesh(new THREE.BufferGeometry(), sectorMat);

                group.add(projLine);
                group.add(refLine);
                group.add(sector);
                return { group, projLine, refLine, sector };
            }

            projFrontal = createProjectionElements(0x60a5fa);
            scene.add(projFrontal.group);

            projSagittal = createProjectionElements(0xf87171);
            scene.add(projSagittal.group);

            projTransverse = createProjectionElements(0x4ade80);
            scene.add(projTransverse.group);

            const boneRadius = 1.2;
            
            const geometry = new THREE.CylinderGeometry(boneRadius, boneRadius * 0.8, boneLength, 32);
            geometry.scale(1.3, 1, 0.7); 

            const proximalMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.4, roughness: 0.7 });
            const distalMat = new THREE.MeshStandardMaterial({ color: 0xe5e5cb, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.45, depthWrite: false });

            proximalBone = new THREE.Mesh(geometry, proximalMat);
            proximalBone.position.y = boneLength / 2;
            scene.add(proximalBone);

            const axesSize = 4;
            function createArrowedAxes(size, opacity = 1.0) {
                const group = new THREE.Group();
                const headLen = size * 0.15;
                const headWidth = size * 0.08;
                const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), size, 0xff0000, headLen, headWidth);
                const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), size, 0x00ff00, headLen, headWidth);
                const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), size, 0x0000ff, headLen, headWidth);
                if (opacity < 1.0) {
                    [arrowX, arrowY, arrowZ].forEach(arrow => {
                        arrow.line.material.transparent = true; arrow.line.material.opacity = opacity;
                        arrow.cone.material.transparent = true; arrow.cone.material.opacity = opacity;
                    });
                }
                group.add(arrowX, arrowY, arrowZ);
                return group;
            }

           refAxes = (function() {
                const group = new THREE.Group();
                const size = axesSize;

                const headLen = size * 0.15;
                const headWidth = size * 0.08;

                // Slightly muted (still strong) compared to bone axes
                const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), size, 0xb91c1c, headLen, headWidth); // red-700
                const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), size, 0x15803d, headLen, headWidth); // green-700
                const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), size, 0x1d4ed8, headLen, headWidth); // blue-700

                // Make the SHAFT dashed so it’s instantly distinguishable from bone axes.
                // ArrowHelper.line is a Line; we can swap its material.
                const dash = (arrow, color) => {
                    arrow.line.material = new THREE.LineDashedMaterial({
                        color,
                        dashSize: 0.35,
                        gapSize: 0.18,
                        transparent: true,
                        opacity: 0.85,
                        depthTest: false
                    });
                    arrow.line.computeLineDistances();

                    // Keep arrow heads solid but slightly translucent
                    arrow.cone.material.transparent = true;
                    arrow.cone.material.opacity = 0.9;
                    arrow.cone.material.depthTest = false;
                };

                dash(arrowX, 0xb91c1c);
                dash(arrowY, 0x15803d);
                dash(arrowZ, 0x1d4ed8);

                // Ensure axes render on top of bone
                arrowX.renderOrder = arrowY.renderOrder = arrowZ.renderOrder = 10;

                group.add(arrowX, arrowY, arrowZ);
                return group;
            })();


            scene.add(refAxes);

            arrowU = new THREE.ArrowHelper(uVec, new THREE.Vector3(0,0,0), 6, 0xffffff, 0.5, 0.3);
            arrowXRef = new THREE.ArrowHelper(xRefVec, new THREE.Vector3(0,0,0), 6, 0xf87171, 0.5, 0.3);
            arrowURot = new THREE.ArrowHelper(uRotVec, new THREE.Vector3(0,0,0), 7, 0xfacc15, 0.5, 0.3);
            arrowNWedge = new THREE.ArrowHelper(nWedgeVec, new THREE.Vector3(0,0,0), 6.5, 0x06b6d4, 0.5, 0.3);
            scene.add(arrowU, arrowXRef, arrowURot, arrowNWedge);
            arrowU.visible = arrowXRef.visible = arrowURot.visible = arrowNWedge.visible = false;

            function createEndCap(radius, isTop) {
                const capGroup = new THREE.Group();
                const curve = new THREE.EllipseCurve(0, 0, radius * 1.3, radius * 0.7, 0, 2 * Math.PI, false, 0);
                const points = curve.getPoints(64);
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                lineGeo.rotateX(Math.PI / 2);
                const outline = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x9ca3af, depthTest: false, transparent: true }));
                outline.renderOrder = 999;
                capGroup.add(outline);
                const majorGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-radius * 1.3, 0, 0), new THREE.Vector3(radius * 1.3, 0, 0)]);
                const majorLine = new THREE.Line(majorGeo, new THREE.LineBasicMaterial({ color: 0xef4444, depthTest: false, transparent: true }));
                majorLine.renderOrder = 999;
                capGroup.add(majorLine);
                const minorGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -radius * 0.7), new THREE.Vector3(0, 0, radius * 0.7)]);
                const minorLine = new THREE.Line(minorGeo, new THREE.LineBasicMaterial({ color: 0x3b82f6, depthTest: false, transparent: true }));
                minorLine.renderOrder = 999;
                capGroup.add(minorLine);
                capGroup.position.y = isTop ? (boneLength / 2) + 0.02 : -(boneLength / 2) - 0.02;
                return capGroup;
            }

            proximalBone.add(createEndCap(boneRadius, true));
            refYExtLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, boneLength + 2, 0)]), new THREE.LineBasicMaterial({ color: 0x00ff00 }));
            scene.add(refYExtLine);

            distalBoneGroup = new THREE.Group();
            scene.add(distalBoneGroup);

            distalBoneMesh = new THREE.Mesh(geometry, distalMat);
            distalBoneMesh.position.y = -boneLength / 2;
            distalBoneMesh.castShadow = true;
            distalBoneGroup.add(distalBoneMesh);
            distalBoneMesh.add(createEndCap(boneRadius * 0.8, false));

            localAxes = (function() {
                const group = new THREE.Group();
                const size = axesSize + 1.5;
                const headLen = size * 0.15;
                const headWidth = size * 0.08;
                const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), size, 0xfca5a5, headLen, headWidth); // red-300
                const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), size, 0x86efac, headLen, headWidth); // green-300
                const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), size, 0x93c5fd, headLen, headWidth); // blue-300
                group.add(arrowX, arrowY, arrowZ);
                return group;
            })();
            
            distalBoneGroup.add(localAxes);

            localYExtLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, boneLength / 1.5, 0), new THREE.Vector3(0, -(boneLength + 2), 0)]), new THREE.LineBasicMaterial({ color: 0x00ff00 }));
            distalBoneGroup.add(localYExtLine);

            const joint = new THREE.Mesh(new THREE.SphereGeometry(boneRadius * 0.25, 32, 32), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, transparent: true, opacity: 0.4 }));
            scene.add(joint);

            const opacity = 0.25;
            sectorPhi = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: opacity, side: THREE.DoubleSide, depthWrite: false }));
            sectorPsi = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: opacity, side: THREE.DoubleSide, depthWrite: false }));
            sectorTheta = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: opacity, side: THREE.DoubleSide, depthWrite: false }));
            scene.add(sectorPhi); scene.add(sectorPsi); scene.add(sectorTheta);

            arcLinePhi = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xf87171 }));
            arcLinePsi = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x60a5fa }));
            arcLineTheta = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x4ade80 }));
            scene.add(arcLinePhi); scene.add(arcLinePsi); scene.add(arcLineTheta);

            const coneGeo = new THREE.ConeGeometry(0.15, 0.6, 16); coneGeo.translate(0, -0.3, 0); 
            conePhi = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xf87171 }));
            conePsi = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0x60a5fa }));
            coneTheta = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
            scene.add(conePhi); scene.add(conePsi); scene.add(coneTheta);

            // Psi guide line - a dashed line from origin along the pre-psi bone axis direction
            psiGuideLine = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,-1,0)]),
                new THREE.LineDashedMaterial({ color: 0x60a5fa, dashSize: 0.3, gapSize: 0.15, transparent: true, opacity: 0.5, depthTest: false })
            );
            psiGuideLine.computeLineDistances();
            psiGuideLine.visible = false;
            scene.add(psiGuideLine);

            wedgeGroup = new THREE.Group();
            scene.add(wedgeGroup);
            wedgeConcaveMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthTest: false }));
            wedgeGroup.add(wedgeConcaveMesh);
            wedgeConvexMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthTest: false }));
            wedgeGroup.add(wedgeConvexMesh);
            wedgeOutline = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfcd34d, depthTest: false }));
            wedgeGroup.add(wedgeOutline);

            singleGroup = new THREE.Group();
            scene.add(singleGroup);
            singlePlaneMesh = new THREE.Mesh(new THREE.CircleGeometry(2.5, 64), new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthTest: false }));
            singleGroup.add(singlePlaneMesh);
            singlePlaneMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CircleGeometry(2.5, 64)), new THREE.LineBasicMaterial({ color: 0xd8b4fe, depthTest: false })));
            singleAxisLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xd8b4fe, depthTest: false, linewidth: 2 }));
            singleGroup.add(singleAxisLine);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.target.set(0, 0, 0);

            const syncInputs = (e) => {
                const id = e.target.id;
                let val = parseFloat(e.target.value) || 0;
                val = Math.max(-89, Math.min(89, val)); 
                if (id.startsWith('slider-')) {
                    document.getElementById(`input-${id.split('-')[1]}`).value = val;
                } else if (id.startsWith('input-')) {
                    document.getElementById(`slider-${id.split('-')[1]}`).value = val;
                    e.target.value = val; 
                }
                updateDeformity();
            };

            sliderPhi.addEventListener('input', syncInputs); sliderPsi.addEventListener('input', syncInputs); sliderTheta.addEventListener('input', syncInputs);
            inputPhi.addEventListener('input', syncInputs); inputPsi.addEventListener('input', syncInputs); inputTheta.addEventListener('input', syncInputs);
            
            const updateSequenceUI = () => {
                const sequence = sequenceSelect.value;
                if (sequence === 'ExtXZY') {
                    sequenceDisplay.innerText = 'Seq: Global X → Global Z → Global Y';
                } else if (sequence === 'ExtZXY') {
                    sequenceDisplay.innerText = 'Seq: Global Z → Global X → Global Y';
                } else if (sequence === 'ExtYZX') {
                    sequenceDisplay.innerText = 'Seq: Global Y → Global Z → Global X';
                }
                updateDeformity();
            };

            toggleWedgeBtn.addEventListener('change', (e) => { if (e.target.checked) toggleSingleBtn.checked = false; updateDeformity(); });
            toggleSingleBtn.addEventListener('change', (e) => { if (e.target.checked) toggleWedgeBtn.checked = false; updateDeformity(); });
            document.getElementById('toggle-hide-axes').addEventListener('change', updateDeformity);
            toggleBasisBtn.addEventListener('change', updateDeformity);
            sequenceSelect.addEventListener('change', updateSequenceUI);
            
            resetBtn.addEventListener('click', () => {
                sliderPhi.value = 0; inputPhi.value = 0;
                sliderPsi.value = 0; inputPsi.value = 0;
                sliderTheta.value = 0; inputTheta.value = 0;
                updateDeformity();
            });

            correctBtn.addEventListener('click', () => {
                correctBtn.disabled = true; resetBtn.disabled = true;
                sliderPhi.disabled = true; sliderPsi.disabled = true; sliderTheta.disabled = true;
                inputPhi.disabled = true; inputPsi.disabled = true; inputTheta.disabled = true;

                // Store the pre-wedge CT-Measured Twist BEFORE animation begins.
                // This is Codman-induced twist + original θ — the torsion that
                // will remain after correcting the angulation.
                const preWedgeCTTwist = window._ctMeasuredTwist || 0;

                const isSingleCut = toggleSingleBtn.checked;
                const sequence = sequenceSelect.value;
                const eulerOrder = sequence === 'ExtXZY' ? 'YZX' : (sequence === 'ExtZXY' ? 'YXZ' : 'XZY'); 
                
                const startQ = new THREE.Quaternion();
                distalBoneGroup.getWorldQuaternion(startQ);
                const identityQ = new THREE.Quaternion(0, 0, 0, 1);
                
                const distalBoneAxis = new THREE.Vector3(0, -1, 0).applyQuaternion(startQ);
                const globalDown = new THREE.Vector3(0, -1, 0);
                const alignQ = new THREE.Quaternion().setFromUnitVectors(distalBoneAxis, globalDown);
                const wedgeTargetQ = alignQ.clone().multiply(startQ);

                const duration = 2000; 
                const startTime = performance.now();

                function step(currentTime) {
                    let elapsed = currentTime - startTime;
                    let progress = Math.min(elapsed / duration, 1);
                    let ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                    let currentQ = new THREE.Quaternion();
                    if (isSingleCut) {
                        currentQ.slerpQuaternions(startQ, identityQ, ease);
                    } else {
                        currentQ.slerpQuaternions(startQ, wedgeTargetQ, ease);
                    }
                    
                    let dummy = new THREE.Object3D();
                    dummy.quaternion.copy(currentQ);
                    dummy.rotation.reorder(eulerOrder);

                    let currentPhi = THREE.MathUtils.radToDeg(dummy.rotation.x);
                    let currentPsi = THREE.MathUtils.radToDeg(dummy.rotation.z); 
                    let currentTheta = THREE.MathUtils.radToDeg(dummy.rotation.y);

                    sliderPhi.value = currentPhi; inputPhi.value = Math.abs(currentPhi) < 0.1 ? 0 : currentPhi.toFixed(1);
                    sliderPsi.value = currentPsi; inputPsi.value = Math.abs(currentPsi) < 0.1 ? 0 : currentPsi.toFixed(1);
                    sliderTheta.value = currentTheta; inputTheta.value = Math.abs(currentTheta) < 0.1 ? 0 : currentTheta.toFixed(1);

                    updateDeformity();

                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        correctBtn.disabled = false; resetBtn.disabled = false;
                        sliderPhi.disabled = false; sliderPsi.disabled = false; sliderTheta.disabled = false;
                        inputPhi.disabled = false; inputPsi.disabled = false; inputTheta.disabled = false;
                        
                        sliderPhi.value = 0; inputPhi.value = 0;
                        sliderPsi.value = 0; inputPsi.value = 0;
                        
                        if (isSingleCut) {
                            sliderTheta.value = 0; inputTheta.value = 0;
                        } else {
                            // After wedge closure, θ absorbs the full CT-Measured Twist
                            // captured BEFORE the animation started (Codman + original θ).
                            // This is the torsion the user must now correct.
                            const postWedgeTheta = THREE.MathUtils.radToDeg(preWedgeCTTwist);
                            const clamped = Math.max(-89, Math.min(89, postWedgeTheta));
                            sliderTheta.value = clamped;
                            inputTheta.value = Math.abs(clamped) < 0.1 ? 0 : clamped.toFixed(1);
                        }
                        updateDeformity();
                    }
                }
                requestAnimationFrame(step);
            });

            let isResizing = false;
            const toggleInstructions = (forceState) => {
                const isHidden = instructionsPanel.classList.contains('hidden');
                const willShow = forceState !== undefined ? forceState : isHidden;
                if (willShow) {
                    instructionsPanel.classList.remove('hidden'); instructionsPanel.classList.add('block');
                    instructionsPanel.style.height = '45%'; 
                } else {
                    instructionsPanel.classList.add('hidden'); instructionsPanel.classList.remove('block');
                }
                onWindowResize();
            };

            toggleInstBtn.addEventListener('click', () => { toggleInstructions(); closeMobileControls(); });
            closeInstBtn.addEventListener('click', () => toggleInstructions(false));

            resizerHandle.addEventListener('mousedown', () => { isResizing = true; document.body.style.cursor = 'ns-resize'; document.body.style.userSelect = 'none'; instructionsPanel.style.transition = 'none'; });
            resizerHandle.addEventListener('touchstart', () => { isResizing = true; document.body.style.userSelect = 'none'; instructionsPanel.style.transition = 'none'; }, {passive: true});

            window.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const panelHeightPercent = ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
                instructionsPanel.style.height = `${Math.max(0, Math.min(90, panelHeightPercent))}%`;
                onWindowResize();
            });
            window.addEventListener('touchmove', (e) => {
                if (!isResizing) return;
                const panelHeightPercent = ((window.innerHeight - e.touches[0].clientY) / window.innerHeight) * 100;
                instructionsPanel.style.height = `${Math.max(0, Math.min(90, panelHeightPercent))}%`;
                onWindowResize();
            }, {passive: true});

            const endResize = () => {
                if (!isResizing) return;
                isResizing = false; document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; instructionsPanel.style.transition = 'height 0.3s ease';
                if (parseFloat(instructionsPanel.style.height) < 15) toggleInstructions(false);
                else if (parseFloat(instructionsPanel.style.height) > 80) instructionsPanel.style.height = '80%';
                onWindowResize();
            };
            window.addEventListener('mouseup', endResize); window.addEventListener('touchend', endResize);

            new ResizeObserver(onWindowResize).observe(container);
            window.addEventListener('resize', onWindowResize);

            updateSequenceUI();
        }

        function updateProjGraphics(projObj, dirVector, refVector, planeNormal, radius, labelId, termText, subText = "") {
            const projRef = refVector.clone().projectOnPlane(planeNormal);
            if (projRef.lengthSq() < 0.0001) return; 
            projRef.normalize();

            const projectedDir = dirVector.clone().projectOnPlane(planeNormal);
            if (projectedDir.lengthSq() < 0.0001) {
                projObj.projLine.visible = false; projObj.refLine.visible = false; projObj.sector.visible = false;
                // Do not hide the label here — the CT-override block will position the transverse
                // label using the lateral-axis floor projection when the bone is straight.
                window._projArcData[labelId] = null;
                return;
            }
            projectedDir.normalize();

            projObj.projLine.visible = true; projObj.refLine.visible = true; projObj.sector.visible = true;
            const segments = 32;

            if (!projObj.projLine.geometry.attributes.position) {
                projObj.projLine.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
                projObj.refLine.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
                projObj.sector.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segments + 2) * 3), 3));
            }

            const pPos = projObj.projLine.geometry.attributes.position;
            pPos.setXYZ(0, 0, 0, 0); pPos.setXYZ(1, projectedDir.x * radius, projectedDir.y * radius, projectedDir.z * radius);
            pPos.needsUpdate = true; projObj.projLine.computeLineDistances(); 
            
            const rPos = projObj.refLine.geometry.attributes.position;
            rPos.setXYZ(0, 0, 0, 0); rPos.setXYZ(1, projRef.x * radius, projRef.y * radius, projRef.z * radius);
            rPos.needsUpdate = true;

            let angle = Math.atan2(projRef.clone().cross(projectedDir).dot(planeNormal), projRef.dot(projectedDir));
            
            const sPos = projObj.sector.geometry.attributes.position;
            sPos.setXYZ(0, 0, 0, 0);

            const q = new THREE.Quaternion();
            let midPoint = null;
            for (let i = 0; i <= segments; i++) {
                q.setFromAxisAngle(planeNormal, (i / segments) * angle);
                const v = projRef.clone().applyQuaternion(q).multiplyScalar(radius * 0.6);
                sPos.setXYZ(i + 1, v.x, v.y, v.z);
                if (i === Math.floor(segments / 2)) midPoint = v.clone();
            }

            const indices = [];
            for (let i = 1; i <= segments; i++) {
                if (angle > 0) indices.push(0, i, i + 1); else indices.push(0, i + 1, i);
            }
            if (!projObj.sector.geometry.index) projObj.sector.geometry.setIndex(indices);
            else {
                const idxArray = projObj.sector.geometry.index.array;
                for(let i=0; i<indices.length; i++) idxArray[i] = indices[i];
                projObj.sector.geometry.index.needsUpdate = true;
            }
            sPos.needsUpdate = true;

               const el = document.getElementById(labelId);
            if (el && midPoint) {
                // When angle ≈ 0 the arc midpoint coincides with projRef itself.
                // Position the label along projRef so it sits clearly on the wall near
                // the reference line rather than drifting toward the scene origin.
                const effectiveMidPoint = Math.abs(angle) < 0.001
                    ? projRef.clone().multiplyScalar(radius * 0.5)
                    : midPoint;
                let html = `${Math.abs(THREE.MathUtils.radToDeg(angle)).toFixed(1)}&deg; <br/> ${termText}`;
                if (subText) html += `<br><span class="text-xs text-gray-300 font-normal leading-tight block mt-1">${subText}</span>`;
                el.innerHTML = html;
                updateLabelPosition(effectiveMidPoint.clone().multiplyScalar(1.2).add(projObj.group.position), labelId, 1.0, true);

                // Store the arc midpoint in WORLD space (screen projection happens per-frame)
                window._projLabelAnchors[labelId] = {
                    worldPos: effectiveMidPoint.clone().add(projObj.group.position)
                };
                
            }

            // Store wall-projected vectors for per-frame screen-space angle computation
            window._projArcData[labelId] = { dirVec: projectedDir.clone(), refVec: projRef.clone(), planeNormal: planeNormal.clone(), projObj };
        }

        function updateSectorAndArc(sectorMesh, arcLine, coneMesh, startVec, axisVec, angle, radius) {
            if (Math.abs(angle) < 0.001) {
                sectorMesh.visible = false; arcLine.visible = false; coneMesh.visible = false; return null;
            }
            sectorMesh.visible = true; arcLine.visible = true; coneMesh.visible = true;

            const segments = 40;
            if (!arcLine.geometry.attributes.position) {
                arcLine.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3));
                sectorMesh.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segments + 2) * 3), 3));
            }

            const arcPos = arcLine.geometry.attributes.position;
            const secPos = sectorMesh.geometry.attributes.position;
            const q = new THREE.Quaternion();
            let midPoint = null, lastPoint = null, tangent = new THREE.Vector3();

            secPos.setXYZ(0, 0, 0, 0);

            for (let i = 0; i <= segments; i++) {
                q.setFromAxisAngle(axisVec, (i / segments) * angle);
                const v = startVec.clone().applyQuaternion(q).multiplyScalar(radius);
                arcPos.setXYZ(i, v.x, v.y, v.z);
                secPos.setXYZ(i + 1, v.x, v.y, v.z);

                if (i === Math.floor(segments / 2)) midPoint = v.clone();
                if (i === segments) {
                    lastPoint = v.clone();
                    tangent.crossVectors(axisVec, v).normalize();
                    if (angle < 0) tangent.negate();
                }
            }
            
            arcPos.needsUpdate = true;
            const indices = [];
            for (let i = 1; i <= segments; i++) {
                if (angle > 0) indices.push(0, i, i + 1); else indices.push(0, i + 1, i);
            }
            if (!sectorMesh.geometry.index) sectorMesh.geometry.setIndex(indices);
            else {
                const idxArray = sectorMesh.geometry.index.array;
                for(let i=0; i<indices.length; i++) idxArray[i] = indices[i];
                sectorMesh.geometry.index.needsUpdate = true;
            }
            secPos.needsUpdate = true; sectorMesh.geometry.computeVertexNormals();

            coneMesh.position.copy(lastPoint);
            coneMesh.lookAt(lastPoint.clone().add(tangent));
            coneMesh.rotateX(Math.PI / 2);

            return midPoint;
        }

        /**
         * Helper: For the psi (Z-axis) rotation, instead of sweeping from the
         * bone axis Y1 (which points mostly downward and is hard to see),
         * we project Y1 into the XY plane (perpendicular to the Z-axis) and
         * use that as the visual sweep vector. This keeps the arc in the
         * frontal plane where it's clearly visible as a lateral tilt.
         * If the projection degenerates (Y1 is along Z), fall back to -Y.
         */
        function getPsiVisualStartVec(Y1) {
            // Project Y1 onto the plane perpendicular to Z (i.e. the XY plane)
            const projected = new THREE.Vector3(Y1.x, Y1.y, 0);
            if (projected.lengthSq() < 0.0001) {
                // Fallback: use straight down
                return new THREE.Vector3(0, -1, 0);
            }
            return projected.normalize();
        }

        function updatePsiGuideLine(Y1, radius, psiRad) {
            if (!psiGuideLine) return;
            if (Math.abs(psiRad) < 0.001) {
                psiGuideLine.visible = false;
                return;
            }
            psiGuideLine.visible = true;
            const startVec = getPsiVisualStartVec(Y1);
            const endPoint = startVec.clone().multiplyScalar(radius + 1.5);
            if (!psiGuideLine.geometry.attributes.position) {
                psiGuideLine.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
            }
            const pos = psiGuideLine.geometry.attributes.position;
            pos.setXYZ(0, 0, 0, 0);
            pos.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);
            pos.needsUpdate = true;
            psiGuideLine.computeLineDistances();
        }

        function updateDeformity() {
            const phiDeg = parseFloat(inputPhi.value) || 0;
            const psiDeg = parseFloat(inputPsi.value) || 0;
            const thetaDeg = parseFloat(inputTheta.value) || 0;
            const sequence = sequenceSelect.value;
            const hideAxes = document.getElementById('toggle-hide-axes').checked;

            localAxes.visible = !hideAxes; 
            if (refAxes) refAxes.visible = !hideAxes;
            if (refYExtLine) refYExtLine.visible = !hideAxes;
            if (localYExtLine) localYExtLine.visible = !hideAxes;
            if (gridTransverse) gridTransverse.visible = !hideAxes;
            if (gridFrontal) gridFrontal.visible = !hideAxes;
            if (gridSagittal) gridSagittal.visible = !hideAxes;

            const phiRad = THREE.MathUtils.degToRad(phiDeg);     
            const psiRad = THREE.MathUtils.degToRad(psiDeg);    
            const thetaRad = THREE.MathUtils.degToRad(thetaDeg);

            const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), phiRad);
            const qZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), psiRad);
            const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), thetaRad);

            const globalQ = new THREE.Quaternion();
            const Y0 = new THREE.Vector3(0, -1, 0); 
            const X0 = new THREE.Vector3(1, 0, 0); 

            if (sequence === 'ExtXZY') {
                const q1 = qX.clone();
                const Y1 = Y0.clone().applyQuaternion(q1);
                midPhi = updateSectorAndArc(sectorPhi, arcLinePhi, conePhi, Y0, new THREE.Vector3(1,0,0), phiRad, 7.0);

                // PSI: Use projected start vector for better visibility
                const psiStart = getPsiVisualStartVec(Y1);
                const q2 = qZ.clone().multiply(q1);
                midPsi = updateSectorAndArc(sectorPsi, arcLinePsi, conePsi, psiStart, new THREE.Vector3(0,0,1), psiRad, 5.5);
                updatePsiGuideLine(Y1, 5.5, psiRad);

                globalQ.copy(qY).multiply(qZ).multiply(qX);
                const X2 = X0.clone().applyQuaternion(q2); 
                midTheta = updateSectorAndArc(sectorTheta, arcLineTheta, coneTheta, X2, new THREE.Vector3(0,1,0), thetaRad, 3.5);
            } else if (sequence === 'ExtZXY') {
                const q1 = qZ.clone();
                const Y1 = Y0.clone().applyQuaternion(q1);
                
                // PSI is first in this sequence - sweep from Y0 projected
                const psiStart = getPsiVisualStartVec(Y0);
                midPsi = updateSectorAndArc(sectorPsi, arcLinePsi, conePsi, psiStart, new THREE.Vector3(0,0,1), psiRad, 7.0);
                updatePsiGuideLine(Y0, 7.0, psiRad);

                const q2 = qX.clone().multiply(q1);
                midPhi = updateSectorAndArc(sectorPhi, arcLinePhi, conePhi, Y1, new THREE.Vector3(1,0,0), phiRad, 5.5);

                globalQ.copy(qY).multiply(qX).multiply(qZ);
                const X2 = X0.clone().applyQuaternion(q2);
                midTheta = updateSectorAndArc(sectorTheta, arcLineTheta, coneTheta, X2, new THREE.Vector3(0,1,0), thetaRad, 3.5);
            } else if (sequence === 'ExtYZX') {
                const q1 = qY.clone();
                midTheta = updateSectorAndArc(sectorTheta, arcLineTheta, coneTheta, X0, new THREE.Vector3(0,1,0), thetaRad, 7.0);

                const q2 = qZ.clone().multiply(q1);
                const Y1 = Y0.clone().applyQuaternion(q1); 
                
                // PSI is second in this sequence
                const psiStart = getPsiVisualStartVec(Y1);
                midPsi = updateSectorAndArc(sectorPsi, arcLinePsi, conePsi, psiStart, new THREE.Vector3(0,0,1), psiRad, 5.5);
                updatePsiGuideLine(Y1, 5.5, psiRad);

                globalQ.copy(qX).multiply(qZ).multiply(qY);
                const Y2 = Y0.clone().applyQuaternion(q2);
                midPhi = updateSectorAndArc(sectorPhi, arcLinePhi, conePhi, Y2, new THREE.Vector3(1,0,0), phiRad, 3.5);
            }

            distalBoneGroup.quaternion.copy(globalQ);
            distalBoneGroup.updateMatrixWorld(true);

            const distalBoneAxis = new THREE.Vector3(0, -1, 0).applyQuaternion(globalQ);
           const medialLateralAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(globalQ);
           const anteriorPosteriorAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(globalQ);

            let termFrontal = distalBoneAxis.x >= 0 ? "Projected Valgus" : "Projected Varus";
            let termSagittal = distalBoneAxis.z <= 0 ? "Projected Procurvatum" : "Projected Recurvatum";

           // ---------------------------------------------------------
// THE FLOOR PROJECTION (Global Transverse Plane)
// ---------------------------------------------------------
const floorNormal = new THREE.Vector3(0, 1, 0);
const refAxis     = new THREE.Vector3(1, 0, 0);

// === ANGLE 1: CT-Measured Angle of Twist ===
// Method A: Wedge-close the full R_tot (including θ), measure residual.
// This is the TRUE intrinsic torsion of the bone.
const boneAxis = distalBoneAxis.clone();           // v = R_tot · u
const uAxis    = new THREE.Vector3(0, -1, 0);      // u (proximal axis, downward)

let ctMeasuredTwist = 0;
{
    const vDir = boneAxis.clone().normalize();
    const uDir = uAxis.clone().normalize();
    let N_ct = new THREE.Vector3().crossVectors(uDir, vDir);
    if (N_ct.lengthSq() > 0.000001) {
        // Bone is angulated — perform wedge closure, measure residual twist
        N_ct.normalize();
        const thetaW = Math.acos(Math.max(-1, Math.min(1, uDir.dot(vDir))));
        if (thetaW > 0.001) {
            const nx = N_ct.x, ny = N_ct.y, nz = N_ct.z;
            const K = new THREE.Matrix3();
            K.set(0, -nz, ny, nz, 0, -nx, -ny, nx, 0);
            const K2 = new THREE.Matrix3(); K2.copy(K).multiply(K);
            const sinA = Math.sin(-thetaW), cosA = Math.cos(-thetaW);
            const Rc = new THREE.Matrix3();
            Rc.set(
                1 + sinA*K.elements[0] + (1-cosA)*K2.elements[0],
                    sinA*K.elements[3] + (1-cosA)*K2.elements[3],
                    sinA*K.elements[6] + (1-cosA)*K2.elements[6],
                    sinA*K.elements[1] + (1-cosA)*K2.elements[1],
                1 + sinA*K.elements[4] + (1-cosA)*K2.elements[4],
                    sinA*K.elements[7] + (1-cosA)*K2.elements[7],
                    sinA*K.elements[2] + (1-cosA)*K2.elements[2],
                    sinA*K.elements[5] + (1-cosA)*K2.elements[5],
                1 + sinA*K.elements[8] + (1-cosA)*K2.elements[8]
            );
            const totMat4 = new THREE.Matrix4().makeRotationFromQuaternion(globalQ);
            const totMat3 = new THREE.Matrix3().setFromMatrix4(totMat4);
            const Rfinal = new THREE.Matrix3(); Rfinal.copy(Rc).multiply(totMat3);
            const xFinal = new THREE.Vector3(1, 0, 0).applyMatrix3(Rfinal);
            const xFinalFloor = xFinal.clone().projectOnPlane(floorNormal).normalize();
            const xRefFloor   = refAxis.clone().projectOnPlane(floorNormal).normalize();
            if (xFinalFloor.lengthSq() > 0.0001) {
                ctMeasuredTwist = Math.atan2(
                    new THREE.Vector3().crossVectors(xRefFloor, xFinalFloor).dot(floorNormal),
                    xRefFloor.dot(xFinalFloor)
                );
            }
        }
    } else {
        // Bone is straight (no angulation) — twist is simply the angle
        // between x_ref and x_new on the floor (pure θ rotation)
        const mlFloor = medialLateralAxis.clone().projectOnPlane(floorNormal).normalize();
        const rfFloor = refAxis.clone().projectOnPlane(floorNormal).normalize();
        if (mlFloor.lengthSq() > 0.0001) {
            ctMeasuredTwist = Math.atan2(
                new THREE.Vector3().crossVectors(rfFloor, mlFloor).dot(floorNormal),
                rfFloor.dot(mlFloor)
            );
        }
    }
}

// Method B: Simulate CT two-slice protocol for verification
let ctMethodB = 0;
{
    const vDir = boneAxis.clone().normalize();
    const uDir = uAxis.clone().normalize();
    const zGlobal = new THREE.Vector3(0, 0, 1);

    // Proximal slice: perpendicular to u = [0,-1,0]
    // anterior reference in proximal plane
    const antProx = zGlobal.clone().sub(uDir.clone().multiplyScalar(zGlobal.dot(uDir))).normalize();
    const angleProx = Math.atan2(
        new THREE.Vector3().crossVectors(antProx, refAxis).dot(uDir),
        antProx.dot(refAxis)
    );

    // Distal slice: perpendicular to v
    const antDist = zGlobal.clone().sub(vDir.clone().multiplyScalar(zGlobal.dot(vDir)));
    if (antDist.lengthSq() > 0.0001) {
        antDist.normalize();
        const xNew = medialLateralAxis.clone();
        const angleDist = Math.atan2(
            new THREE.Vector3().crossVectors(antDist, xNew).dot(vDir),
            antDist.dot(xNew)
        );
        ctMethodB = angleDist - angleProx;
    }
}

// === ANGLE 2: Codman-Induced Twist (True) ===
// Same as CT-Measured Twist but with θ = 0
const qX_codman = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), phiRad);
const qZ_codman = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), psiRad);
const qY_codman = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), 0);

let codmanQ = new THREE.Quaternion();
if (sequence === 'ExtXZY') {
    codmanQ.copy(qY_codman).multiply(qZ_codman).multiply(qX_codman);
} else if (sequence === 'ExtZXY') {
    codmanQ.copy(qY_codman).multiply(qX_codman).multiply(qZ_codman);
} else if (sequence === 'ExtYZX') {
    codmanQ.copy(qX_codman).multiply(qZ_codman).multiply(qY_codman);
}

let codmanTrueTwist = 0;
{
    const codmanBoneAxis = new THREE.Vector3(0,-1,0).applyQuaternion(codmanQ).normalize();
    const uDir = uAxis.clone().normalize();
    let N_c = new THREE.Vector3().crossVectors(uDir, codmanBoneAxis);
    if (N_c.lengthSq() > 0.000001) {
        N_c.normalize();
        const thetaW = Math.acos(Math.max(-1, Math.min(1, uDir.dot(codmanBoneAxis))));
        if (thetaW > 0.001) {
            const nx = N_c.x, ny = N_c.y, nz = N_c.z;
            const K = new THREE.Matrix3();
            K.set(0, -nz, ny, nz, 0, -nx, -ny, nx, 0);
            const K2 = new THREE.Matrix3(); K2.copy(K).multiply(K);
            const sinA = Math.sin(-thetaW), cosA = Math.cos(-thetaW);
            const Rc = new THREE.Matrix3();
            Rc.set(
                1 + sinA*K.elements[0] + (1-cosA)*K2.elements[0],
                    sinA*K.elements[3] + (1-cosA)*K2.elements[3],
                    sinA*K.elements[6] + (1-cosA)*K2.elements[6],
                    sinA*K.elements[1] + (1-cosA)*K2.elements[1],
                1 + sinA*K.elements[4] + (1-cosA)*K2.elements[4],
                    sinA*K.elements[7] + (1-cosA)*K2.elements[7],
                    sinA*K.elements[2] + (1-cosA)*K2.elements[2],
                    sinA*K.elements[5] + (1-cosA)*K2.elements[5],
                1 + sinA*K.elements[8] + (1-cosA)*K2.elements[8]
            );
            const codmanMat4 = new THREE.Matrix4().makeRotationFromQuaternion(codmanQ);
            const codmanMat3 = new THREE.Matrix3().setFromMatrix4(codmanMat4);
            const Rfinal = new THREE.Matrix3(); Rfinal.copy(Rc).multiply(codmanMat3);
            const xFinal = new THREE.Vector3(1,0,0).applyMatrix3(Rfinal);
            const xFinalFloor = xFinal.clone().projectOnPlane(floorNormal).normalize();
            const xRefFloor   = refAxis.clone().projectOnPlane(floorNormal).normalize();
            if (xFinalFloor.lengthSq() > 0.0001) {
                codmanTrueTwist = Math.atan2(
                    new THREE.Vector3().crossVectors(xRefFloor, xFinalFloor).dot(floorNormal),
                    xRefFloor.dot(xFinalFloor)
                );
            }
        }
    }
}

// θ-Induced Twist = CT-Measured Twist - Codman Twist
const thetaInducedTwist = ctMeasuredTwist - codmanTrueTwist;

// === ANGLE 3: Apparent Axial Torsion ===
// The apparent axial torsion is the angle between the proximal reference direction
// (refAxis = global lateral = (1,0,0)) and the distal bone's medial-lateral axis
// (Xbone = medialLateralAxis), both projected onto the transverse floor plane.
// Because the proximal bone is straight (axis = (0,-1,0)), its transverse plane IS
// the floor, so this projection is the correct clinical definition — matching what
// would be measured on an AP X-ray looking straight down the limb.
const xRefOnFloor = refAxis.clone().projectOnPlane(floorNormal).normalize();
let apparentAxialTorsion = 0;
{
    const mlFloor = medialLateralAxis.clone().projectOnPlane(floorNormal);
    if (mlFloor.lengthSq() > 0.0001 && xRefOnFloor.lengthSq() > 0.0001) {
        mlFloor.normalize();
        apparentAxialTorsion = Math.atan2(
            new THREE.Vector3().crossVectors(xRefOnFloor, mlFloor).dot(floorNormal),
            xRefOnFloor.dot(mlFloor)
        );
    }
}

// Store for wedge correction animation
window._ctMeasuredTwist = ctMeasuredTwist;
window._codmanTrueTwist = codmanTrueTwist;
window._currentThetaDeg = thetaDeg;

// === FORMAT TRANSVERSE LABEL ===
const ctDeg       = THREE.MathUtils.radToDeg(ctMeasuredTwist);
const ctBDeg      = THREE.MathUtils.radToDeg(ctMethodB);
const codmanDeg   = THREE.MathUtils.radToDeg(codmanTrueTwist);
const thetaTwDeg  = THREE.MathUtils.radToDeg(thetaInducedTwist);
const apparentDeg = THREE.MathUtils.radToDeg(apparentAxialTorsion);

// --- NEW: Screen Space Angle (Using the Physical End Caps) ---
const boneLen = 6; // From your geometry setup

// 1. Exact global 3D coordinates of the Proximal Top Cap's red line
const proxCenter3D = new THREE.Vector3(0, boneLen + 0.02, 0);
const proxEnd3D = new THREE.Vector3(1, boneLen + 0.02, 0);

// 2. Exact global 3D coordinates of the Distal Bottom Cap's red line
// The distal cap is at local y = -6.02, rotated by the bone's deformity (globalQ)
const distCenter3D = new THREE.Vector3(0, -boneLen - 0.02, 0).applyQuaternion(globalQ);
const distEnd3D = new THREE.Vector3(1, -boneLen - 0.02, 0).applyQuaternion(globalQ);

// 3. Project these specific physical points through the perspective lens
camera.updateMatrixWorld(true);
            camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
            camera.updateProjectionMatrix();
const proxCenter2D = proxCenter3D.clone().project(camera);
const proxEnd2D = proxEnd3D.clone().project(camera);
const distCenter2D = distCenter3D.clone().project(camera);
const distEnd2D = distEnd3D.clone().project(camera);

// 4. Convert NDCs to Physical Screen Pixels to account for Monitor Aspect Ratio
const canvasW = getContainer().clientWidth;
const canvasH = getContainer().clientHeight;

const vecRefScreen = new THREE.Vector2(
    (proxEnd2D.x - proxCenter2D.x) * canvasW, 
    (proxEnd2D.y - proxCenter2D.y) * canvasH
);
const vecDistalScreen = new THREE.Vector2(
    (distEnd2D.x - distCenter2D.x) * canvasW, 
    (distEnd2D.y - distCenter2D.y) * canvasH
);

// 5. Calculate the visual angle using 2D atan2
let screenSpaceAngle = Math.atan2(vecDistalScreen.y, vecDistalScreen.x) - Math.atan2(vecRefScreen.y, vecRefScreen.x);
while (screenSpaceAngle > Math.PI) screenSpaceAngle -= 2 * Math.PI;
while (screenSpaceAngle < -Math.PI) screenSpaceAngle += 2 * Math.PI;

// The Camera Error is the visual screen angle minus the mathematically true floor projection
const perspectiveError = screenSpaceAngle - apparentAxialTorsion;
// ---------------------------------------------------

let termTransverse = "Projected Twist";
let subText = "";

const hasAngulation = Math.abs(phiDeg) > 0.05 || Math.abs(psiDeg) > 0.05;
const hasTorsion    = Math.abs(thetaDeg) > 0.05;

// Expose for real-time camera tracking
            window._liveApparentTorsion = apparentAxialTorsion;

            if (hasAngulation || hasTorsion || Math.abs(perspectiveError) > 0.001) {
                subText  = `<span class="text-amber-400">Codman-Induced: <span class="output-value">${formatTorsion(codmanTrueTwist)}</span></span>`;
                subText += `<br><span class="text-indigo-300">&theta;-Induced: <span class="output-value">${formatTorsion(thetaInducedTwist)}</span></span>`;
                subText += `<br><span class="text-gray-400">Total Intrinsic: <span class="output-value font-bold">${formatTorsion(ctMeasuredTwist)}</span></span>`;
                subText += `<br><span class="text-pink-400 mt-1 block border-t border-gray-600/50 pt-1">Camera Error: <span id="live-cam-err" class="output-value">${formatTorsion(perspectiveError)}</span></span>`;
                subText += `<span class="text-white font-bold block">Screen Angle: <span id="live-scr-ang" class="output-value">${formatTorsion(screenSpaceAngle)}</span></span>`;
            }

// Draw Projections
projFrontal.group.position.set(0, 0, -10);
projSagittal.group.position.set(-10, 0, 0);
projTransverse.group.position.set(0, -10, 0);

updateProjGraphics(projFrontal,   distalBoneAxis, new THREE.Vector3(0,-1,0), new THREE.Vector3(0,0,1), 9, 'proj-lbl-frontal',   termFrontal);
updateProjGraphics(projSagittal,  distalBoneAxis, new THREE.Vector3(0,-1,0), new THREE.Vector3(1,0,0), 9, 'proj-lbl-sagittal',  termSagittal);
// Project medialLateralAxis (Xbone = distal red line) onto the floor so the arc shows
// the apparent torsion angle — the same angle visible between the two red end-cap lines.
updateProjGraphics(projTransverse, medialLateralAxis, refAxis, floorNormal, 9, 'proj-lbl-transverse', termTransverse, subText);

// Override transverse label with apparent axial torsion (3-D transverse-plane projection)
const projLblTransverse = document.getElementById('proj-lbl-transverse');
if (projLblTransverse) {
    // UPDATED: Now passing apparentAxialTorsion through the format function
    let html = `${formatTorsion(apparentAxialTorsion)}<br/>${termTransverse}`;
    if (subText) html += `<br><span class="text-xs text-gray-300 font-normal leading-tight block mt-1">${subText}</span>`;
    projLblTransverse.innerHTML = html;
}

            if (hideAxes) {
                projFrontal.group.visible = false; projSagittal.group.visible = false; projTransverse.group.visible = false;
                updateLabelPosition(null, 'proj-lbl-frontal'); updateLabelPosition(null, 'proj-lbl-sagittal'); updateLabelPosition(null, 'proj-lbl-transverse');
                if (sectorPhi) sectorPhi.visible = false; if (arcLinePhi) arcLinePhi.visible = false; if (conePhi) conePhi.visible = false;
                if (sectorPsi) sectorPsi.visible = false; if (arcLinePsi) arcLinePsi.visible = false; if (conePsi) conePsi.visible = false;
                if (sectorTheta) sectorTheta.visible = false; if (arcLineTheta) arcLineTheta.visible = false; if (coneTheta) coneTheta.visible = false;
                if (psiGuideLine) psiGuideLine.visible = false;
            } else {
                projFrontal.group.visible = true; projSagittal.group.visible = true; projTransverse.group.visible = true;
            }

            // --- Compute Single Hinge Math ---
            const matElems = distalBoneGroup.matrixWorld.elements;
            const tr = matElems[0] + matElems[5] + matElems[10];
            const angleBasis = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
            if (angleBasis > 0.001) {
                let den = 2 * Math.sin(angleBasis);
                uRotVec.set((matElems[6] - matElems[9])/den, (matElems[8] - matElems[2])/den, (matElems[1] - matElems[4])/den).normalize();
            } else {
                uRotVec.set(1, 0, 0);
            }
            arrowURot.setDirection(uRotVec);

            const Ap = new THREE.Vector3(0, -1, 0); 
            let N = Ap.clone().cross(distalBoneAxis);
            if (N.lengthSq() > 0.000001) {
                N.normalize();
                thetaWedge = Math.acos(Math.max(-1, Math.min(1, Ap.dot(distalBoneAxis))));
            } else { N.set(1, 0, 0); thetaWedge = 0; }
            nWedgeVec.copy(N); 
            arrowNWedge.setDirection(nWedgeVec);

            const showBasis = document.getElementById('toggle-basis').checked;
            arrowU.visible = showBasis; arrowXRef.visible = showBasis; arrowURot.visible = showBasis; arrowNWedge.visible = showBasis;

            if (thetaWedge > 0.001 && document.getElementById('toggle-wedge').checked) {
                const U_convex = Ap.clone().cross(N).normalize(); 
                const radiusWedge = 2.4, segmentsWedge = 32;
                const ptsConvex = [new THREE.Vector3(0,0,0)], ptsConcave = [new THREE.Vector3(0,0,0)];
                const qWedge = new THREE.Quaternion();
                
                for(let i=0; i<=segmentsWedge; i++) {
                    qWedge.setFromAxisAngle(N, (i/segmentsWedge) * thetaWedge);
                    const vConvex = U_convex.clone().applyQuaternion(qWedge).multiplyScalar(radiusWedge);
                    ptsConvex.push(vConvex);
                    ptsConcave.push(U_convex.clone().negate().applyQuaternion(qWedge).multiplyScalar(1.2));
                    if (i === Math.floor(segmentsWedge / 2)) midWedge = vConvex.clone();
                }
                
                function updateSectorGeo(mesh, pts) {
                    if (!mesh.geometry.attributes.position || mesh.geometry.attributes.position.count !== pts.length) {
                        mesh.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.length * 3), 3));
                    }
                    const pos = mesh.geometry.attributes.position;
                    for(let i=0; i<pts.length; i++) pos.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
                    pos.needsUpdate = true;
                    
                    const indices = [];
                    for(let i=1; i<pts.length-1; i++) indices.push(0, i, i+1);
                    if (!mesh.geometry.index || mesh.geometry.index.count !== indices.length) mesh.geometry.setIndex(indices);
                    else {
                        const idxArray = mesh.geometry.index.array;
                        for(let i=0; i<indices.length; i++) idxArray[i] = indices[i];
                        mesh.geometry.index.needsUpdate = true;
                    }
                    mesh.geometry.computeVertexNormals();
                }
                
                updateSectorGeo(wedgeConvexMesh, ptsConvex); updateSectorGeo(wedgeConcaveMesh, ptsConcave);

                if (!wedgeOutline.geometry.attributes.position || wedgeOutline.geometry.attributes.position.count !== ptsConvex.length) {
                    wedgeOutline.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ptsConvex.length * 3), 3));
                }
                const outPos = wedgeOutline.geometry.attributes.position;
                for(let i=0; i<ptsConvex.length; i++) outPos.setXYZ(i, ptsConvex[i].x, ptsConvex[i].y, ptsConvex[i].z);
                outPos.needsUpdate = true;
                
                wedgeConvexMesh.visible = true; wedgeConcaveMesh.visible = true; wedgeOutline.visible = true;
                const labelEl = document.getElementById('label-wedge-angle');
                if (labelEl) labelEl.innerHTML = `Closing Wedge: ${THREE.MathUtils.radToDeg(thetaWedge).toFixed(1)}&deg;`;
                if (midWedge) {
                    window._projLabelAnchors['label-wedge-angle'] = {
                        worldPos: midWedge.clone()
                    };
                }
            } else {
                wedgeConvexMesh.visible = false; wedgeConcaveMesh.visible = false; wedgeOutline.visible = false; midWedge = null;
            }

            // Single Cut
            if (globalQ.w < 0) globalQ.set(-globalQ.x, -globalQ.y, -globalQ.z, -globalQ.w);
            const qW = Math.min(1, Math.max(-1, globalQ.w));
            angleSingle = 2 * Math.acos(qW);
            const sSingle = Math.sqrt(1 - qW * qW);
            if (sSingle > 0.001) axisSingle.set(globalQ.x, globalQ.y, globalQ.z).divideScalar(sSingle);
            else axisSingle.set(1, 0, 0);

            if (angleSingle > 0.001 && document.getElementById('toggle-single').checked) {
                singleGroup.visible = true;
                singlePlaneMesh.position.set(0, 0, 0); singlePlaneMesh.lookAt(axisSingle);
                if (!singleAxisLine.geometry.attributes.position) singleAxisLine.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
                const pos = singleAxisLine.geometry.attributes.position;
                const p1 = axisSingle.clone().multiplyScalar(-3.5), p2 = axisSingle.clone().multiplyScalar(3.5);
                pos.setXYZ(0, p1.x, p1.y, p1.z); pos.setXYZ(1, p2.x, p2.y, p2.z); pos.needsUpdate = true;
                midSingle = axisSingle.clone().multiplyScalar(3.6);
                const labelEl = document.getElementById('label-single-angle');
                if (labelEl) labelEl.innerHTML = `Single Cut: ${THREE.MathUtils.radToDeg(angleSingle).toFixed(1)}&deg;`;
                if (midSingle) {
                    window._projLabelAnchors['label-single-angle'] = {
                        worldPos: midSingle.clone()
                    };
                }
            } else {
                singleGroup.visible = false; midSingle = null;
            }

            updateMatrixDisplay(distalBoneGroup.matrixWorld, angleBasis, uRotVec);
        }

        function updateMatrixDisplay(matrix4, hingeAngleRad, hingeAxisVec) {
            const e = matrix4.elements;
            const r11 = e[0].toFixed(3), r12 = e[4].toFixed(3), r13 = e[8].toFixed(3);
            const r21 = e[1].toFixed(3), r22 = e[5].toFixed(3), r23 = e[9].toFixed(3);
            const r31 = e[2].toFixed(3), r32 = e[6].toFixed(3), r33 = e[10].toFixed(3);
            matrixDisplay.innerHTML = `<span>${r11}</span><span>${r12}</span><span>${r13}</span><span>${r21}</span><span>${r22}</span><span>${r23}</span><span>${r31}</span><span>${r32}</span><span>${r33}</span>`;
            const hingeAngleDisplay = document.getElementById('hinge-angle-display');
            const hingeAxisDisplay = document.getElementById('hinge-axis-display');
            if (hingeAngleDisplay && hingeAxisDisplay) {
                hingeAngleDisplay.innerHTML = `${THREE.MathUtils.radToDeg(hingeAngleRad).toFixed(2)}&deg;`;
                hingeAxisDisplay.innerHTML = `[ ${hingeAxisVec.x.toFixed(3)}, ${hingeAxisVec.y.toFixed(3)}, ${hingeAxisVec.z.toFixed(3)} ]`;
            }
        }

        function onWindowResize() {
            const container = getContainer();
            if (!container || !camera || !renderer || container.clientWidth === 0 || container.clientHeight === 0) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }

        function updateLabelPosition(midPoint, elementId, scale = 1.15, isVisible = true) {
            let el = domCache[elementId] || document.getElementById(elementId);
            if (el) domCache[elementId] = el;
            if (!el) return;
            
            if (!midPoint || !isVisible) {
                if (!el.classList.contains('hidden')) el.classList.add('hidden');
                return;
            }
            const pos = midPoint.clone();
            if (scale !== 1) pos.multiplyScalar(scale); 
            pos.project(camera);

            if (pos.z > 1) { if (!el.classList.contains('hidden')) el.classList.add('hidden'); return; }
            if (el.classList.contains('hidden')) el.classList.remove('hidden');

            const container = getContainer();
            if (!container) return;
            
            const x = (pos.x * .5 + .5) * container.clientWidth;
            const y = (pos.y * -.5 + .5) * container.clientHeight;
            const newTransform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0px) translate(-50%, -50%)`;
            if (el.style.transform !== newTransform) {
                if (el.style.left !== '0px') { el.style.left = '0px'; el.style.top = '0px'; }
                el.style.transform = newTransform;
            }
        }

        

        // =============================================
        // LABEL COLLISION AVOIDANCE SYSTEM
        // =============================================
        const labelCollisionPool = [];

        function resetLabelCollisionPool() {
            labelCollisionPool.length = 0;
        }

        function registerLabelForCollision(elementId) {
            const el = domCache[elementId] || document.getElementById(elementId);
            if (!el || el.classList.contains('hidden')) return;
            labelCollisionPool.push(el);
        }

        function resolveAllLabelCollisions() {
            // Reset any previous collision offsets first
            for (const el of labelCollisionPool) {
                el.style.marginLeft = '0px';
                el.style.marginTop = '0px';
            }

            const rects = [];
            for (const el of labelCollisionPool) {
                const r = el.getBoundingClientRect();
                rects.push({
                    el,
                    x: r.left + r.width / 2,
                    y: r.top + r.height / 2,
                    hw: r.width / 2,
                    hh: r.height / 2,
                    offsetX: 0,
                    offsetY: 0
                });
            }

            const padding = 4;
            const maxPasses = 5;

            for (let pass = 0; pass < maxPasses; pass++) {
                let anyOverlap = false;
                for (let i = 0; i < rects.length; i++) {
                    for (let j = i + 1; j < rects.length; j++) {
                        const a = rects[i], b = rects[j];
                        const ax = a.x + a.offsetX, ay = a.y + a.offsetY;
                        const bx = b.x + b.offsetX, by = b.y + b.offsetY;

                        const overlapX = (a.hw + b.hw + padding) - Math.abs(ax - bx);
                        const overlapY = (a.hh + b.hh + padding) - Math.abs(ay - by);

                        if (overlapX > 0 && overlapY > 0) {
                            anyOverlap = true;
                            if (overlapX < overlapY) {
                                const pushX = overlapX / 2 + 1;
                                if (ax <= bx) {
                                    a.offsetX -= pushX;
                                    b.offsetX += pushX;
                                } else {
                                    a.offsetX += pushX;
                                    b.offsetX -= pushX;
                                }
                            } else {
                                const pushY = overlapY / 2 + 1;
                                if (ay <= by) {
                                    a.offsetY -= pushY;
                                    b.offsetY += pushY;
                                } else {
                                    a.offsetY += pushY;
                                    b.offsetY -= pushY;
                                }
                            }
                        }
                    }
                }
                if (!anyOverlap) break;
            }

            // Apply computed offsets as margin adjustments
            for (const item of rects) {
                if (Math.abs(item.offsetX) > 0.5 || Math.abs(item.offsetY) > 0.5) {
                    item.el.style.marginLeft = `${item.offsetX.toFixed(1)}px`;
                    item.el.style.marginTop = `${item.offsetY.toFixed(1)}px`;
                }
            }
        }

// ── 2D SCREEN SPACE VISUALISATION ──
        function updateScreenOverlay() {
            const overlay = document.getElementById('screen-overlay');
            const hideAxes = document.getElementById('toggle-hide-axes').checked;
            if (!overlay) return;

            // Hide the overlay if axes are hidden
            if (hideAxes) {
                overlay.style.display = 'none';
                return;
            }

            const container = getContainer();
            if (!container || !camera || !distalBoneGroup) return;

            // 1. Get exact 3D points of the physical red lines
            const boneLen = 6;
            const proxCenter3D = new THREE.Vector3(0, boneLen + 0.02, 0);
            const proxEnd3D = new THREE.Vector3(1, boneLen + 0.02, 0);
            
            // Distal points follow the bone's spatial matrix
            const distCenter3D = new THREE.Vector3(0, -boneLen - 0.02, 0).applyMatrix4(distalBoneGroup.matrixWorld);
            const distEnd3D = new THREE.Vector3(1, -boneLen - 0.02, 0).applyMatrix4(distalBoneGroup.matrixWorld);

            // 2. Project points through the perspective lens to Normalized Device Coordinates (-1 to 1)
            const pC = proxCenter3D.clone().project(camera);
            const pE = proxEnd3D.clone().project(camera);
            const dC = distCenter3D.clone().project(camera);
            const dE = distEnd3D.clone().project(camera);

            // Hide if the distal center is physically behind the camera
            if (dC.z > 1.0) { overlay.style.display = 'none'; return; }

            // 3. Convert NDCs to exact 2D screen pixels
            const w = container.clientWidth, h = container.clientHeight;
            const toScreen = (ndc) => ({ x: (ndc.x * 0.5 + 0.5) * w, y: (-ndc.y * 0.5 + 0.5) * h });

            const pxC = toScreen(pC), pxE = toScreen(pE);
            const dxC = toScreen(dC), dxE = toScreen(dE);

            // 4. Calculate 2D pixel vectors 
            const vecRef = { x: pxE.x - pxC.x, y: pxE.y - pxC.y };
            const vecDist = { x: dxE.x - dxC.x, y: dxE.y - dxC.y };

            const lenRef = Math.sqrt(vecRef.x * vecRef.x + vecRef.y * vecRef.y);
            const lenDist = Math.sqrt(vecDist.x * vecDist.x + vecDist.y * vecDist.y);
            
            // Hide if vectors are visually crushed (looking straight down the line)
            if (lenRef < 5 || lenDist < 5) { overlay.style.display = 'none'; return; }

            overlay.style.display = 'block';

            // Normalize vectors
            const dirRef = { x: vecRef.x / lenRef, y: vecRef.y / lenRef };
            const dirDist = { x: vecDist.x / lenDist, y: vecDist.y / lenDist };

            // 5. Anchor the visual drawing at the Distal Center cap
            const startX = dxC.x;
            const startY = dxC.y;
            const drawLen = 90; // Pixel length of the drawn lines

            const endDistX = startX + dirDist.x * drawLen;
            const endDistY = startY + dirDist.y * drawLen;

            const endRefX = startX + dirRef.x * drawLen;
            const endRefY = startY + dirRef.y * drawLen;

            document.getElementById('screen-line-dist').setAttribute('x1', startX);
            document.getElementById('screen-line-dist').setAttribute('y1', startY);
            document.getElementById('screen-line-dist').setAttribute('x2', endDistX);
            document.getElementById('screen-line-dist').setAttribute('y2', endDistY);

            // The ghosted reference line (Proximal line transplanted to distal cap)
            document.getElementById('screen-line-ref').setAttribute('x1', startX);
            document.getElementById('screen-line-ref').setAttribute('y1', startY);
            document.getElementById('screen-line-ref').setAttribute('x2', endRefX);
            document.getElementById('screen-line-ref').setAttribute('y2', endRefY);

            // 6. Calculate angle and draw the SVG Arc
            let angleRef = Math.atan2(dirRef.y, dirRef.x);
            let angleDist = Math.atan2(dirDist.y, dirDist.x);
            let screenAngle = angleDist - angleRef;
            
            while (screenAngle > Math.PI) screenAngle -= 2 * Math.PI;
            while (screenAngle < -Math.PI) screenAngle += 2 * Math.PI;

            // Clear arc if angle is virtually zero
            if (Math.abs(screenAngle) < 0.01) {
                document.getElementById('screen-arc').setAttribute('d', '');
                document.getElementById('screen-text').textContent = '';
                return;
            }

            const arcRadius = 45;
            const arcStart = { x: startX + dirRef.x * arcRadius, y: startY + dirRef.y * arcRadius };
            const arcEnd = { x: startX + dirDist.x * arcRadius, y: startY + dirDist.y * arcRadius };
            
            const largeArcFlag = Math.abs(screenAngle) > Math.PI ? 1 : 0;
            const sweepFlag = screenAngle > 0 ? 1 : 0;

            const pathData = `M ${startX} ${startY} L ${arcStart.x} ${arcStart.y} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${arcEnd.x} ${arcEnd.y} Z`;
            document.getElementById('screen-arc').setAttribute('d', pathData);

            // 7. Render Text dynamically along the bisector of the angle
            const textDeg = (screenAngle * 180 / Math.PI);
            const textEl = document.getElementById('screen-text');
            textEl.textContent = `${Math.abs(textDeg).toFixed(1)}°`;
            
            const midAngle = angleRef + screenAngle / 2;
            const textRad = arcRadius + 25;
            textEl.setAttribute('x', startX + Math.cos(midAngle) * textRad - 15);
            textEl.setAttribute('y', startY + Math.sin(midAngle) * textRad + 5);
        }

        function animate() {
            requestAnimationFrame(animate);
            
            const _0xchk = document.getElementById('cr-1');
            if (!_0xchk || _0xchk.innerText !== atob('Q2hyaXN0b3MgTmlrb2xhb3U=')) { scene.visible = false; return; }
            if (document.getElementById('view-sim').classList.contains('hidden')) return;

            controls.update();
            updateDeformity();

            renderer.render(scene, camera);
            
            const hideAxes = document.getElementById('toggle-hide-axes').checked;

            updateLabelPosition(midPhi, 'label-phi', 1.15, !hideAxes);
            updateLabelPosition(midPsi, 'label-psi', 1.15, !hideAxes);
            updateLabelPosition(midTheta, 'label-theta', 1.15, !hideAxes);
            
            const s0 = 1.05;
const showBasis = document.getElementById('toggle-basis').checked;

if (!hideAxes) {
      // ✅ MOVED HERE — accessible to everything below
    function getScreenOffsetWorld(deltaPixelsX, deltaPixelsY, worldPoint) {
        const container = getContainer();
        if (!container || !camera) return new THREE.Vector3();
        const p = worldPoint.clone().project(camera);
        const ndcDX = (deltaPixelsX / container.clientWidth) * 2;
        const ndcDY = (-deltaPixelsY / container.clientHeight) * 2;
        const p2 = new THREE.Vector3(p.x + ndcDX, p.y + ndcDY, p.z);
        const w1 = worldPoint.clone();
        const w2 = p2.unproject(camera);
        return w2.sub(w1);
    }

    // --- Global axis label anchors (world space) ---
    const gOrigin = new THREE.Vector3(0, 0, 0);
    const gX = new THREE.Vector3(4.5, 0, 0);
    const gY = new THREE.Vector3(0, 4.5, 0);
    const gZ = new THREE.Vector3(0, 0, 4.5);

    // Small screen-space nudges so they don’t sit on top of bone labels
    updateLabelPosition(gOrigin.clone().add(getScreenOffsetWorld(-10, 10, gOrigin)), 'label-origin', 1.0, true);
    updateLabelPosition(gX.clone().add(getScreenOffsetWorld(10, 10, gX)), 'label-x', 1.0, true);
    updateLabelPosition(gY.clone().add(getScreenOffsetWorld(10, -10, gY)), 'label-y', 1.0, true);
    updateLabelPosition(gZ.clone().add(getScreenOffsetWorld(-10, -10, gZ)), 'label-z', 1.0, true);

    // --- Bone axis label anchors (TRUE world positions at distalBoneGroup) ---
    if (distalBoneGroup) {
        // match your localAxes length (axesSize + 1.5) and then a little extra for label clearance
        const boneAxisLen = 5.8;

        const bx = new THREE.Vector3(boneAxisLen, 0, 0);
        const by = new THREE.Vector3(0, boneAxisLen, 0);
        const bz = new THREE.Vector3(0, 0, boneAxisLen);

        distalBoneGroup.localToWorld(bx);
        distalBoneGroup.localToWorld(by);
        distalBoneGroup.localToWorld(bz);

 


        // Screen-space nudges opposite direction so they separate from global labels
         updateLabelPosition(bx.clone().add(getScreenOffsetWorld(14, -14, bx)), 'label-x-final', 1.0, true);
        updateLabelPosition(by.clone().add(getScreenOffsetWorld(14, 14, by)), 'label-y-final', 1.0, true);
        updateLabelPosition(bz.clone().add(getScreenOffsetWorld(-14, -14, bz)), 'label-z-final', 1.0, true);

        // --- Grid Plane Labels ---
        updateLabelPosition(new THREE.Vector3(8, -10, 8), 'label-plane-transverse', 1.0, true);
        updateLabelPosition(new THREE.Vector3(8, -8, -10), 'label-plane-frontal', 1.0, true);
        updateLabelPosition(new THREE.Vector3(-10, -8, 8), 'label-plane-sagittal', 1.0, true);
    } else {
        updateLabelPosition(null, 'label-origin');
        updateLabelPosition(null, 'label-x');
        updateLabelPosition(null, 'label-y');
        updateLabelPosition(null, 'label-z');

        updateLabelPosition(null, 'label-x-final');
        updateLabelPosition(null, 'label-y-final');
        updateLabelPosition(null, 'label-z-final');
        
        // --- Hide Grid Plane Labels ---
        updateLabelPosition(null, 'label-plane-transverse');
        updateLabelPosition(null, 'label-plane-frontal');
        updateLabelPosition(null, 'label-plane-sagittal');
    }
        } else {
            updateLabelPosition(null, 'label-origin');
            updateLabelPosition(null, 'label-x');
            updateLabelPosition(null, 'label-y');
            updateLabelPosition(null, 'label-z');

            updateLabelPosition(null, 'label-x-final');
            updateLabelPosition(null, 'label-y-final');
            updateLabelPosition(null, 'label-z-final');
        }


            updateLabelPosition(showBasis ? uVec.clone().multiplyScalar(6.5) : null, 'label-u');
            updateLabelPosition(showBasis ? xRefVec.clone().multiplyScalar(6.5) : null, 'label-xref');
            updateLabelPosition(showBasis ? uRotVec.clone().multiplyScalar(7.5) : null, 'label-urot');
            updateLabelPosition(showBasis ? nWedgeVec.clone().multiplyScalar(7.0) : null, 'label-nwedge');

            updateLabelPosition(midWedge, 'label-wedge-angle', s0);
            updateLabelPosition(midSingle, 'label-single-angle', s0);

             // ── Update projection label anchor screen positions every frame ──
            if (window._projLabelAnchors) {
                const container = getContainer();
                if (container) {
                    for (const labelId in window._projLabelAnchors) {
                        const entry = window._projLabelAnchors[labelId];
                        if (entry && entry.worldPos) {
                            const screenPos = entry.worldPos.clone().project(camera);
                            entry.x = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
                            entry.y = (-screenPos.y * 0.5 + 0.5) * container.clientHeight;
                        }
                    }
                }
            }

            // --- Label Collision Resolution ---
            resetLabelCollisionPool();
            // Register all visible labels for collision detection
            const allLabelIds = [
                'label-phi', 'label-psi', 'label-theta',
                'proj-lbl-frontal', 'proj-lbl-sagittal', 'proj-lbl-transverse',
                'label-origin', 'label-x', 'label-y', 'label-z',
                'label-x-final', 'label-y-final', 'label-z-final',
                'label-u', 'label-xref', 'label-urot', 'label-nwedge',
                'label-wedge-angle', 'label-single-angle',
                'label-plane-transverse', 'label-plane-frontal', 'label-plane-sagittal'
            ];
            for (const id of allLabelIds) {
                registerLabelForCollision(id);
            }
            resolveAllLabelCollisions();
        }    
