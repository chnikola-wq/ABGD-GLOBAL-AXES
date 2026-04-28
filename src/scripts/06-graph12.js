        import * as THREE from 'three';

        function initGraph12() {
            const canvas = document.getElementById('s15-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            const sPhi = document.getElementById('s15-phi');
            const sPsi = document.getElementById('s15-psi');
            const vPhi = document.getElementById('s15-phi-val');
            const vPsi = document.getElementById('s15-psi-val');

            const boneLength = 6;
            const camera = new THREE.PerspectiveCamera(45, 1.5, 0.1, 100);
            camera.position.set(0.001, 30, 0.001);
            camera.up.set(0, 1, 0);
            camera.lookAt(0, 0, 0);

            let pointerXDeg = null;
            
            function getAnglesForT(thetaDeg, phi, psi) {
                const pRad = THREE.MathUtils.degToRad(phi);
                const psRad = THREE.MathUtils.degToRad(psi);
                const tRad = THREE.MathUtils.degToRad(thetaDeg);

                const dummy = new THREE.Object3D();
                const sequence = document.getElementById('sequence-select')?.value || 'ExtXZY';
                
                // Extrinsic Construction via pre-multiplication
                const q = new THREE.Quaternion();
                const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pRad);
                const qZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), psRad);
                const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), tRad);

                if (sequence === 'ExtXZY') {
                    q.multiply(qY).multiply(qZ).multiply(qX);
                } else if (sequence === 'ExtZXY') {
                    q.multiply(qY).multiply(qX).multiply(qZ);
                } else if (sequence === 'ExtYZX') {
                    q.multiply(qX).multiply(qZ).multiply(qY);
                }

                dummy.quaternion.copy(q);
                dummy.updateMatrixWorld(true);

                const globalQ = dummy.quaternion;
                const distalAxis = new THREE.Vector3(0, -1, 0).applyQuaternion(globalQ);
                const latAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(globalQ);

                // 1. Projected Twist (b)
                const projLat = latAxis.clone().projectOnPlane(new THREE.Vector3(0, 1, 0)).normalize();
                const refAxis = new THREE.Vector3(1, 0, 0);
                const dot = refAxis.dot(projLat);
                const cross = new THREE.Vector3().crossVectors(refAxis, projLat);
                const sine = cross.dot(new THREE.Vector3(0, 1, 0));
                const bRad = Math.atan2(sine, dot);

                // 2. Total Intrinsic Torsion (T)
                const alignQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), distalAxis);
                const totalQ = alignQ.clone().invert().multiply(globalQ);
                const tLat = new THREE.Vector3(1, 0, 0).applyQuaternion(totalQ);
                const tDot = refAxis.dot(tLat);
                const tCross = new THREE.Vector3().crossVectors(refAxis, tLat);
                const tSine = tCross.dot(new THREE.Vector3(0, 1, 0));
                const TRad = Math.atan2(tSine, tDot);

                // 3. Screen Angle (S)
                const proxY = boneLength + 0.02;
                const distY = -boneLength - 0.02;

                const pC = new THREE.Vector3(0, proxY, 0).project(camera);
                const pE = new THREE.Vector3(1, proxY, 0).project(camera);
                const dC = new THREE.Vector3(0, distY, 0).applyMatrix4(dummy.matrixWorld).project(camera);
                const dE = new THREE.Vector3(1, distY, 0).applyMatrix4(dummy.matrixWorld).project(camera);

                const toScreen = (ndc) => new THREE.Vector2(
                    (ndc.x * 0.5 + 0.5) * canvas.width, 
                    (-ndc.y * 0.5 + 0.5) * canvas.height
                );

                const pxC = toScreen(pC); 
                const pxE = toScreen(pE);
                const dxC = toScreen(dC); 
                const dxE = toScreen(dE);

                const sRef = new THREE.Vector2(pxE.x - pxC.x, pxE.y - pxC.y).normalize();
                const sLat = new THREE.Vector2(dxE.x - dxC.x, dxE.y - dxC.y).normalize();
                let sAngRad = Math.abs(Math.atan2(sRef.x*sLat.y - sRef.y*sLat.x, sRef.x*sLat.x + sRef.y*sLat.y));
                
                sAngRad *= (TRad < 0 ? -1 : 1);

                return {
                    T_deg: THREE.MathUtils.radToDeg(TRad),
                    b_deg: THREE.MathUtils.radToDeg(bRad),
                    S_deg: THREE.MathUtils.radToDeg(sAngRad)
                };
            }

            function draw() {
                if(canvas.clientWidth === 0) return;
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                camera.aspect = canvas.width / canvas.height;
                camera.updateMatrixWorld(true);
                camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
                camera.updateProjectionMatrix();

                const phi = parseFloat(sPhi.value);
                const psi = parseFloat(sPsi.value);
                vPhi.innerHTML = phi + '&deg;';
                vPsi.innerHTML = psi + '&deg;';

                const pointsProj = [];
                const pointsScreen = [];

                for(let thetaDeg = -130; thetaDeg <= 130; thetaDeg += 0.5) {
                    const data = getAnglesForT(thetaDeg, phi, psi);
                    pointsProj.push({ x: data.T_deg, y: data.b_deg });
                    pointsScreen.push({ x: data.T_deg, y: data.S_deg });
                }

                const MAX_DEG = 120; 
                const scale = Math.min(canvas.width, canvas.height) / (MAX_DEG * 2.2); 
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;

                function mapX(deg) { return cx + (deg * scale); }
                function mapY(deg) { return cy - (deg * scale); }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#a1a1aa';
                ctx.font = '10px monospace';
                
                for(let d = -120; d <= 120; d += 30) {
                    const xPx = mapX(d);
                    const yPx = mapY(d);
                    
                    ctx.strokeStyle = '#27272a';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(xPx, 0); ctx.lineTo(xPx, canvas.height); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(0, yPx); ctx.lineTo(canvas.width, yPx); ctx.stroke();

                    if (d === 0) continue;

                    ctx.strokeStyle = '#52525b';
                    ctx.beginPath(); ctx.moveTo(xPx, cy - 4); ctx.lineTo(xPx, cy + 4); ctx.stroke();
                    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                    ctx.fillText(`${d > 0 ? '+' : ''}${d}°`, xPx, cy + 8);

                    ctx.beginPath(); ctx.moveTo(cx - 4, yPx); ctx.lineTo(cx + 4, yPx); ctx.stroke();
                    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
                    ctx.fillText(`${d > 0 ? '+' : ''}${d}°`, cx - 8, yPx);
                }

                ctx.strokeStyle = '#52525b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); 
                ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); 
                ctx.stroke();

                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                ctx.fillText('0°', cx + 6, cy + 6);

                ctx.strokeStyle = '#4ade80';
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                ctx.beginPath();
                pointsProj.sort((a,b)=>a.x-b.x).forEach((p, i) => {
                    if(i===0) ctx.moveTo(mapX(p.x), mapY(p.y));
                    else ctx.lineTo(mapX(p.x), mapY(p.y));
                });
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 6]);
                ctx.beginPath();
                pointsScreen.sort((a,b)=>a.x-b.x).forEach((p, i) => {
                    if(i===0) ctx.moveTo(mapX(p.x), mapY(p.y));
                    else ctx.lineTo(mapX(p.x), mapY(p.y));
                });
                ctx.stroke();

                if (pointerXDeg !== null) {
                    ctx.setLineDash([]);
                    let closestData = pointsProj[0];
                    let closestS = pointsScreen[0];
                    let minDiff = Infinity;
                    
                    for(let i=0; i<pointsProj.length; i++) {
                        const diff = Math.abs(pointsProj[i].x - pointerXDeg);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestData = pointsProj[i];
                            closestS = pointsScreen[i];
                        }
                    }

                    const xPx = mapX(closestData.x);
                    const yProjPx = mapY(closestData.y);
                    const yScrPx = mapY(closestS.y);

                    ctx.strokeStyle = '#a1a1aa';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath(); ctx.moveTo(xPx, 0); ctx.lineTo(xPx, canvas.height); ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.fillStyle = '#4ade80';
                    ctx.beginPath(); ctx.arc(xPx, yProjPx, 4, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(xPx, yScrPx, 4, 0, Math.PI * 2); ctx.fill();

                    const boxW = 85;
                    const boxH = 54;
                    let boxX = xPx + 12;
                    if (boxX + boxW > canvas.width) boxX = xPx - boxW - 12;
                    
                    let boxY = Math.min(yProjPx, yScrPx) - boxH - 10;
                    if (boxY < 10) boxY = Math.max(yProjPx, yScrPx) + 15;

                    ctx.fillStyle = 'rgba(15, 17, 21, 0.95)';
                    ctx.fillRect(boxX, boxY, boxW, boxH);
                    ctx.strokeStyle = '#3f3f46';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(boxX, boxY, boxW, boxH);

                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#a1a1aa';
                    ctx.fillText(`T: ${closestData.x.toFixed(1)}°`, boxX + 8, boxY + 6);
                    ctx.fillStyle = '#4ade80';
                    ctx.fillText(`b: ${closestData.y.toFixed(2)}°`, boxX + 8, boxY + 22);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`S: ${closestS.y.toFixed(2)}°`, boxX + 8, boxY + 36);
                }
            }

            function updatePointer(e) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
                const scale = Math.min(canvas.width, canvas.height) / (120 * 2.2); 
                const cx = canvas.width / 2;
                let deg = (mouseX - cx) / scale;
                pointerXDeg = Math.max(-120, Math.min(120, deg));
                draw();
            }

            canvas.addEventListener('mousemove', updatePointer);
            canvas.addEventListener('touchmove', (e) => { e.preventDefault(); updatePointer(e); }, { passive: false });
            canvas.addEventListener('mousedown', updatePointer);
            canvas.addEventListener('mouseleave', () => { pointerXDeg = null; draw(); });
            canvas.addEventListener('touchend', () => { pointerXDeg = null; draw(); });

            sPhi.addEventListener('input', draw);
            sPsi.addEventListener('input', draw);
            window.addEventListener('resize', draw);
            document.getElementById('sequence-select')?.addEventListener('change', draw);
            
            document.getElementById('btn-tab-math')?.addEventListener('click', () => {
                setTimeout(draw, 50);
            });
            setTimeout(draw, 150);
        }

        window.addEventListener('load', initGraph12);
