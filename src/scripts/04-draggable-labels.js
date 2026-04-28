    (function() {
        const DRAGGABLE_IDS = ['proj-lbl-frontal', 'proj-lbl-sagittal', 'proj-lbl-transverse', 'label-wedge-angle'];
        const canvasContainer = document.getElementById('canvas-container');
        const dragState = {};

        DRAGGABLE_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            dragState[id] = {
                offsetX: 0, offsetY: 0,
                dragged: false, dragging: false
            };

            el.classList.add('proj-label-draggable');

            // Create leader line
            const leader = document.createElement('div');
            leader.className = 'leader-line';
            leader.id = `leader-${id}`;
            leader.style.display = 'none';
            canvasContainer.appendChild(leader);

            let startX = 0, startY = 0, startOffX = 0, startOffY = 0;

            function onPointerDown(e) {
                if (e.button && e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();

                const state = dragState[id];
                state.dragging = true;

                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;

                startX = clientX;
                startY = clientY;
                startOffX = state.offsetX;
                startOffY = state.offsetY;

                document.addEventListener('mousemove', onPointerMove, { passive: false });
                document.addEventListener('mouseup', onPointerUp);
                document.addEventListener('touchmove', onPointerMove, { passive: false });
                document.addEventListener('touchend', onPointerUp);
            }

            function onPointerMove(e) {
                const state = dragState[id];
                if (!state.dragging) return;
                e.preventDefault();

                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;

                state.offsetX = startOffX + (clientX - startX);
                state.offsetY = startOffY + (clientY - startY);
                state.dragged = true;
                el.classList.add('dragged');
            }

            function onPointerUp() {
                dragState[id].dragging = false;
                document.removeEventListener('mousemove', onPointerMove);
                document.removeEventListener('mouseup', onPointerUp);
                document.removeEventListener('touchmove', onPointerMove);
                document.removeEventListener('touchend', onPointerUp);
            }

            el.addEventListener('mousedown', onPointerDown);
            el.addEventListener('touchstart', onPointerDown, { passive: false });

            // Double-click to reset
            el.addEventListener('dblclick', (e) => {
                e.preventDefault();
                dragState[id].offsetX = 0;
                dragState[id].offsetY = 0;
                window._dragLabelOffsets[id] = { x: 0, y: 0 };
                dragState[id].dragged = false;
                el.classList.remove('dragged');
                el.style.marginLeft = '0px';
                el.style.marginTop = '0px';
            });
        });

        // ── Apply offsets via margin + anchor leader to arc midpoint ──
           function applyDragOffsets() {
            // Skip entirely when simulator tab is hidden — prevents stale zero positions
            const viewSim = document.getElementById('view-sim');
            if (viewSim && viewSim.classList.contains('hidden')) {
                requestAnimationFrame(applyDragOffsets);
                return;
            }

            const containerRect = canvasContainer.getBoundingClientRect();
            const cw = containerRect.width;
            const ch = containerRect.height;

            // Skip if container has no size (e.g. mid-tab-switch)
            if (cw < 10 || ch < 10) {
                requestAnimationFrame(applyDragOffsets);
                return;
            }

            const anchors = window._projLabelAnchors || {};

            DRAGGABLE_IDS.forEach(id => {
                const el = document.getElementById(id);
                const state = dragState[id];
                if (!el || !state || el.classList.contains('hidden')) {
                    const leader = document.getElementById(`leader-${id}`);
                    if (leader) leader.style.display = 'none';
                    return;
                }

                if (state.dragged || state.dragging) {
                    // Read the engine's base position from the live transform
                    const raw = el.style.transform;
                    const match = raw.match(/translate3d\(\s*([\d.-]+)px,\s*([\d.-]+)px/);
                    if (!match) return;

                    const baseX = parseFloat(match[1]);
                    const baseY = parseFloat(match[2]);

                    // Clamp final position within the canvas
                    const elRect = el.getBoundingClientRect();
                    const hw = elRect.width / 2;
                    const hh = elRect.height / 2;
                    const margin = 8;

                    let clampedOffX = state.offsetX;
                    let clampedOffY = state.offsetY;

                    const finalX = baseX + clampedOffX;
                    const finalY = baseY + clampedOffY;

                    if (finalX < hw + margin) clampedOffX = hw + margin - baseX;
                    if (finalX > cw - hw - margin) clampedOffX = cw - hw - margin - baseX;
                    if (finalY < hh + margin) clampedOffY = hh + margin - baseY;
                    if (finalY > ch - hh - margin) clampedOffY = ch - hh - margin - baseY;

                    state.offsetX = clampedOffX;
                    state.offsetY = clampedOffY;

                    // Apply offset as margin — does NOT touch transform
                    el.style.marginLeft = `${clampedOffX.toFixed(1)}px`;
                    el.style.marginTop = `${clampedOffY.toFixed(1)}px`;

                    // Leader line anchored to the ARC MIDPOINT (3D-projected)
                    const anchor = anchors[id];
                    const leader = document.getElementById(`leader-${id}`);
                    if (leader && anchor) {
                        // Label's actual screen position (base + offset)
                        const labelScreenX = baseX + clampedOffX;
                        const labelScreenY = baseY + clampedOffY;

                        // Vector from arc midpoint to label
                        const dx = labelScreenX - anchor.x;
                        const dy = labelScreenY - anchor.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx);

                        if (dist > 15) {
                            leader.style.display = 'block';
                            leader.style.width = `${dist.toFixed(1)}px`;
                            leader.style.left = `${anchor.x.toFixed(1)}px`;
                            leader.style.top = `${anchor.y.toFixed(1)}px`;
                            leader.style.transform = `rotate(${angle}rad)`;
                        } else {
                            leader.style.display = 'none';
                        }
                    }
                } else {
                    el.style.marginLeft = '0px';
                    el.style.marginTop = '0px';
                    const leader = document.getElementById(`leader-${id}`);
                    if (leader) leader.style.display = 'none';
                }
            });

            requestAnimationFrame(applyDragOffsets);
        }

        requestAnimationFrame(applyDragOffsets);
    })();

    // =================================================================
        // --- AUTONOMOUS 2D SCREEN SPACE VISUALISER (THE WHITE ANGLE) ---
        // =================================================================
        (function() {
            const container = document.getElementById('canvas-container');
            if (!container) return;

            const svgNS = "http://www.w3.org/2000/svg";
            const overlay = document.createElementNS(svgNS, "svg");
            overlay.setAttribute('id', 'screen-overlay-auto');
            overlay.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;');

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute('id', 'screen-arc-auto');
            path.setAttribute('fill', 'rgba(255, 255, 255, 0.15)');
            path.setAttribute('stroke', 'white');
            path.setAttribute('stroke-width', '2');
            overlay.appendChild(path);

            const lineRef = document.createElementNS(svgNS, "line");
            lineRef.setAttribute('id', 'screen-line-ref-auto');
            lineRef.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
            lineRef.setAttribute('stroke-width', '2');
            lineRef.setAttribute('stroke-dasharray', '4');
            overlay.appendChild(lineRef);

            const lineDist = document.createElementNS(svgNS, "line");
            lineDist.setAttribute('id', 'screen-line-dist-auto');
            lineDist.setAttribute('stroke', 'white');
            lineDist.setAttribute('stroke-width', '2');
            overlay.appendChild(lineDist);

            const textBg = document.createElementNS(svgNS, "text");
            textBg.setAttribute('id', 'screen-text-bg-auto');
            textBg.setAttribute('fill', 'rgba(0,0,0,0.8)');
            textBg.setAttribute('font-weight', 'bold');
            textBg.setAttribute('font-size', '15');
            textBg.setAttribute('font-family', 'monospace');
            overlay.appendChild(textBg);

            const textFg = document.createElementNS(svgNS, "text");
            textFg.setAttribute('id', 'screen-text-fg-auto');
            textFg.setAttribute('fill', 'white');
            textFg.setAttribute('font-weight', 'bold');
            textFg.setAttribute('font-size', '15');
            textFg.setAttribute('font-family', 'monospace');
            overlay.appendChild(textFg);

            container.appendChild(overlay);

            function renderScreenAngle() {
                requestAnimationFrame(renderScreenAngle);

                if (typeof camera === 'undefined' || typeof distalBoneGroup === 'undefined' || !distalBoneGroup) return;

                const hideAxes = document.getElementById('toggle-hide-axes');
                if (hideAxes && hideAxes.checked) {
                    overlay.style.display = 'none';
                    return;
                }

                // FORCE CAMERA SYNC FOR FLAWLESS REAL-TIME ORBITING
                camera.updateMatrixWorld(true);
                camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
                camera.updateProjectionMatrix();

                const boneLen = 6;
                const proxCenter3D = new THREE.Vector3(0, boneLen + 0.02, 0);
                const proxEnd3D = new THREE.Vector3(1, boneLen + 0.02, 0);
                
                const distCenter3D = new THREE.Vector3(0, -boneLen - 0.02, 0).applyMatrix4(distalBoneGroup.matrixWorld);
                const distEnd3D = new THREE.Vector3(1, -boneLen - 0.02, 0).applyMatrix4(distalBoneGroup.matrixWorld);

                const pC = proxCenter3D.clone().project(camera);
                const pE = proxEnd3D.clone().project(camera);
                const dC = distCenter3D.clone().project(camera);
                const dE = distEnd3D.clone().project(camera);

                if (dC.z > 1.0) { overlay.style.display = 'none'; return; }

                const w = container.clientWidth, h = container.clientHeight;
                const toScreen = (ndc) => ({ x: (ndc.x * 0.5 + 0.5) * w, y: (-ndc.y * 0.5 + 0.5) * h });

                const pxC = toScreen(pC), pxE = toScreen(pE);
                const dxC = toScreen(dC), dxE = toScreen(dE);

                const vecRef = { x: pxE.x - pxC.x, y: pxE.y - pxC.y };
                const vecDist = { x: dxE.x - dxC.x, y: dxE.y - dxC.y };

                const lenRef = Math.sqrt(vecRef.x * vecRef.x + vecRef.y * vecRef.y);
                const lenDist = Math.sqrt(vecDist.x * vecDist.x + vecDist.y * vecDist.y);
                
                if (lenRef < 5 || lenDist < 5) { overlay.style.display = 'none'; return; }

                overlay.style.display = 'block';

                const dirRef = { x: vecRef.x / lenRef, y: vecRef.y / lenRef };
                const dirDist = { x: vecDist.x / lenDist, y: vecDist.y / lenDist };

                const startX = dxC.x;
                const startY = dxC.y;
                const drawLen = 70; 

                document.getElementById('screen-line-dist-auto').setAttribute('x1', startX);
                document.getElementById('screen-line-dist-auto').setAttribute('y1', startY);
                document.getElementById('screen-line-dist-auto').setAttribute('x2', startX + dirDist.x * drawLen);
                document.getElementById('screen-line-dist-auto').setAttribute('y2', startY + dirDist.y * drawLen);

                document.getElementById('screen-line-ref-auto').setAttribute('x1', startX);
                document.getElementById('screen-line-ref-auto').setAttribute('y1', startY);
                document.getElementById('screen-line-ref-auto').setAttribute('x2', startX + dirRef.x * drawLen);
                document.getElementById('screen-line-ref-auto').setAttribute('y2', startY + dirRef.y * drawLen);

                let angleRef = Math.atan2(dirRef.y, dirRef.x);
                let angleDist = Math.atan2(dirDist.y, dirDist.x);
                let screenAngle = angleDist - angleRef;
                
                while (screenAngle > Math.PI) screenAngle -= 2 * Math.PI;
                while (screenAngle < -Math.PI) screenAngle += 2 * Math.PI;

                // --- LIVE HTML TEXT UPDATE ---
                if (typeof window._liveApparentTorsion !== 'undefined' && typeof formatTorsion !== 'undefined') {
                    const liveError = screenAngle - window._liveApparentTorsion;
                    const errEl = document.getElementById('live-cam-err');
                    const angEl = document.getElementById('live-scr-ang');
                    if (errEl) errEl.innerHTML = formatTorsion(liveError);
                    if (angEl) angEl.innerHTML = formatTorsion(screenAngle);
                }

                if (Math.abs(screenAngle) < 0.01) {
                    document.getElementById('screen-arc-auto').setAttribute('d', '');
                    textBg.textContent = ''; textFg.textContent = '';
                    return;
                }

                const arcRadius = 35;
                const arcStart = { x: startX + dirRef.x * arcRadius, y: startY + dirRef.y * arcRadius };
                const arcEnd = { x: startX + dirDist.x * arcRadius, y: startY + dirDist.y * arcRadius };
                
                const sweepFlag = screenAngle > 0 ? 1 : 0;
                const pathData = `M ${startX} ${startY} L ${arcStart.x} ${arcStart.y} A ${arcRadius} ${arcRadius} 0 0 ${sweepFlag} ${arcEnd.x} ${arcEnd.y} Z`;
                document.getElementById('screen-arc-auto').setAttribute('d', pathData);

                const textDeg = (screenAngle * 180 / Math.PI);
                textBg.textContent = `${Math.abs(textDeg).toFixed(1)}°`;
                textFg.textContent = `${Math.abs(textDeg).toFixed(1)}°`;
                
                const midAngle = angleRef + screenAngle / 2;
                const textRad = arcRadius + 20;
                const tx = startX + Math.cos(midAngle) * textRad - 15;
                const ty = startY + Math.sin(midAngle) * textRad + 5;
                
                textBg.setAttribute('x', tx + 2); textBg.setAttribute('y', ty + 2);
                textFg.setAttribute('x', tx);     textFg.setAttribute('y', ty);
            }

            requestAnimationFrame(renderScreenAngle);
        })();
        
