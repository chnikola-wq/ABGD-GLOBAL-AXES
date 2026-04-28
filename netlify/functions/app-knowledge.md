# Bone Deformity Simulator — Combined App Knowledge Base (Eulerian + Global Axes)

> This file is the AI tutor's source of truth for BOTH sister apps:
>   1. Bone Deformity Simulator: Eulerian Approach (intrinsic X → Y' → Z'')
>   2. Bone Deformity Simulator: Non-Eulerian, Global Axes Approach (extrinsic, pre-multiplied)
> Edit this file directly when you change anything in either app.

---

## Part 1 — App Overview (BOTH apps share this overview, then diverge)

The two apps are sister teaching tools that solve the same problem — decomposing a 3-D long-bone malunion into a sequence of rotations — using two complementary frameworks. The **Eulerian Approach** uses an intrinsic X → Y' → Z'' decomposition (each rotation about the most-recently-rotated prime axis); the **Global Axes Approach** uses an extrinsic, pre-multiplied decomposition about the fixed room axes (X, Z, Y by default). Each app has the same 2-tab structure (Simulator + Mathematical Report) and exposes the same three sliders φ (sagittal), ψ (frontal), θ (axial), each clamped to ±45°. The downstream mathematical outputs — total rotation matrix R_tot, Euler axis-angle (Θ, u_rot), Codman residual twist, projected radiographic angles, single-cut osteotomy axis — carry the **same geometric meaning** in both apps. Only the parameterisation of the (φ, ψ, θ) inputs differs: intrinsic prime axes vs extrinsic global axes.

---

## Part 2 — App A: Eulerian Approach (intrinsic X → Y' → Z'')

## Section A — Conventions the App Uses

- **Coordinate system** (right-handed): X = medial–lateral, Y = anterior–posterior, Z = proximal–distal (long axis of the bone).
- **Reference longitudinal axis:** **u** = +Z (the undeformed long axis).
- **Torsional benchmark:** **x**_ref = +X (a fixed transverse direction used to read out residual twist after the rotations are composed).
- **Prime axes (Euler convention):** the three rotations are applied in a fixed hierarchical order — sagittal first (about X), then frontal (about the ROTATED Y'), then axial (about the FINAL Z''). This is the "intrinsic Euler" convention; it is NOT the same as fixed-frame (extrinsic) rotations and the two are not interchangeable.
- **Sign convention:**
  - φ > 0 → procurvatum (apex anterior); φ < 0 → recurvatum
  - ψ > 0 → valgus (distal segment lateral); ψ < 0 → varus
  - θ > 0 → external rotation of the distal segment; θ < 0 → internal rotation
- **Slider domain:** ±45° on each axis (the simulator clamps at this range; the framework itself is valid for any finite rotation).
- **Angle unit:** degrees in the UI; the rotation matrices are evaluated in radians internally.

---

## Section B — Core Formulas

**B.1 — Total rotation matrix (intrinsic Euler, X → Y' → Z''):**
$$R_{\text{tot}} = R_x(\phi)\,R_{y'}(\psi)\,R_{z''}(\theta)$$
where each elementary matrix is the standard right-hand rotation about the named axis.

**B.2 — Euler's theorem (single-hinge equivalent):**
Any R_tot can be written as a single rotation by angle Θ about a unit axis **u**_rot:
$$\cos\Theta = \tfrac{1}{2}\,(\mathrm{tr}\,R_{\text{tot}} - 1)$$
$$\mathbf{u}_{\text{rot}} = \frac{1}{2\sin\Theta}\,(R_{\text{tot}} - R_{\text{tot}}^{\top})^{\vee}$$
(the "vee" map extracts the axis vector from the skew-symmetric part).

**B.3 — Frontal-plane projection angle:**
The clinical varus/valgus angle a surgeon would measure on an AP radiograph is NOT ψ in general — it is the projection of the deformed long axis onto the frontal (X-Z) plane. After applying R_tot to **u**:
$$\mathbf{u}' = R_{\text{tot}}\,\mathbf{u}, \qquad \angle_{\text{frontal}} = \mathrm{atan2}(u'_x,\ u'_z)$$

**B.4 — Floor / transverse-plane projection angle:**
$$\angle_{\text{transverse}} = \mathrm{atan2}(u'_y,\ u'_x)$$
This is the apparent rotation of the bone as seen from a foot-of-bed (axial) view.

**B.5 — Codman twist (residual axial torsion in the projected frame):**
Apply R_tot to the torsional benchmark **x**_ref and read out the residual twist about the original long axis −**u**:
$$f(\phi, \psi, \theta) = \mathrm{atan2}\bigl((\mathbf{x}_{\text{ref}} \times \mathbf{x}_{\text{final}}) \cdot (-\mathbf{u}),\ \mathbf{x}_{\text{ref}} \cdot \mathbf{x}_{\text{final}}\bigr)$$
The **Codman surface** is the plot of this function over the (φ, ψ) plane at θ = 0 — it is the source of the app's central teaching point: pure angular deformity, with NO axial rotation applied, still produces apparent torsion when projected onto a 2-D X-ray.

**B.6 — Wedge axis & Rodrigues closure:**
The single-cut (oblique) osteotomy that corrects R_tot in one cut is performed about the wedge axis
$$\mathbf{n}_{\text{wedge}} = \mathbf{u}_{\text{rot}}^{\perp\,\text{floor}}$$
(the projection of the Euler axis onto the cut plane), with closure angle θ_w obtained from the in-plane component of Θ. The closed configuration is:
$$\mathbf{x}_{\text{final}} = R_{\text{close}}(\mathbf{n}_{\text{wedge}}, -\theta_w)\,R_{\text{ghost}}\,\mathbf{x}_{\text{ref}}$$
implemented via Rodrigues' rotation formula:
$$R(\mathbf{n}, \alpha) = I + \sin\alpha\,[\mathbf{n}]_{\times} + (1 - \cos\alpha)\,[\mathbf{n}]_{\times}^{2}$$

---

## Section C — Framework Components Taught in the App

The app teaches FIVE interlocking framework components. Each component owns a region of clinical questions; identify the right component before reasoning about a question.

**C.1 — Eulerian decomposition (φ, ψ, θ).**
The chosen "intrinsic X → Y' → Z''" hierarchy is what makes the prime-axes representation unique for a given final orientation. Used by: the Simulator's three sliders, the Total Rotation Matrix display, sections 1–4 of the Mathematical Report.

**C.2 — atan2 visualiser (script `01-atan2-visualizer.js`).**
A standalone widget that walks through how atan2 unambiguously maps a 2-D vector to an angle in (−π, π], including the sign discontinuity at the −X axis. Used by: section 8 of the report. Critical for understanding why the projection formulas use atan2 rather than asin or acos.

**C.3 — Codman surface (scripts `02-main-simulator.js`, `09-graph-17.js`).**
The 3-D plot of f(φ, ψ) over the (φ, ψ) plane at θ = 0. Demonstrates Codman's paradox: combined sagittal + frontal angulation with NO axial rotation input still produces residual twist. Used by: section 5.3 ("Codman's Paradox & The Twist Breakdown") and the Graph 17 interactive viewport.

**C.4 — Dual-viewport / MPR tutor (scripts `04-dual-viewport.js`, `05-mpr-tutor.js`).**
A side-by-side simulated frontal + transverse-plane reformat that shows the projection angles a surgeon would actually read off a 2-D image. Drives home the difference between the underlying Euler angles and the apparent radiographic angles.

**C.5 — Osteotomy / wedge-correction model.**
Single-cut (oblique) and closing-wedge corrections, derived from Euler's theorem (Θ, **u**_rot) → wedge axis (**n**_wedge, θ_w) → Rodrigues closure. Used by: section 7 of the report and the simulator's wedge-preview overlay.

---

## Section D — Decision Rules (which component answers the question)

| User question style | Component to invoke |
|---|---|
| "What does the underlying deformity look like?" / "Decompose this rotation." | C.1 — Eulerian decomposition |
| "Why does atan2 give a different answer than acos here?" | C.2 — atan2 visualiser |
| "Why does pure angulation produce apparent torsion on the X-ray?" / "What is Codman's paradox?" | C.3 — Codman surface |
| "What angle would I measure on an AP / lateral / axial film?" | C.4 — MPR / projection model |
| "Plan a single-cut or closing-wedge osteotomy." / "What is the correction axis?" | C.5 — Wedge / Rodrigues model |
| "How does adding rotation θ change the apparent angulation?" | C.1 + C.4 (Euler composition + projection) |
| "Why does the order of the rotations matter?" | C.1 (intrinsic vs extrinsic; non-commutativity) |

---

## Section E — Common Pitfalls the App Deliberately Surfaces

1. **Rotations do NOT commute.** R_x(φ) R_y(ψ) ≠ R_y(ψ) R_x(φ) for any non-trivial φ, ψ. The app's intrinsic X → Y' → Z'' order is a *choice*; if the user is comparing to a paper that used a different order, the (φ, ψ, θ) numbers will differ even though the underlying deformity is the same.
2. **Projected ≠ underlying.** The clinical AP angle ≠ ψ. The only case where they coincide is pure uniplanar (φ = 0, θ = 0) deformity. Multiplanar deformity always produces a coupled projected angle.
3. **Codman's paradox.** A bone with non-zero φ AND non-zero ψ but ZERO axial rotation input STILL exhibits apparent torsion (residual twist of **x**_ref about −**u**). This is geometric, not anatomical.
4. **Single-cut osteotomy direction.** **n**_wedge is the projection of **u**_rot onto the chosen cut plane — NOT **u**_rot itself. The two coincide only when **u**_rot already lies in the cut plane.
5. **±45° slider clamp.** The simulator's range is a UI choice, not a framework limit. The math is correct for any rotation up to π; beyond that the Euler decomposition itself gains discrete branches.

---

## Section F — Things the App Does NOT Cover

State this plainly when asked. Do not confabulate.

- Mechanical-axis / weight-bearing-line analysis (Mikulicz line, MAD, JLCA) — these are CORA-method concepts (Paley); the app uses an Euler-decomposition framework instead.
- Quantitative joint-orientation angles (mLDFA, MPTA, LDTA, etc.).
- Soft-tissue, ligamentous, or articular-surface considerations.
- Patient-specific 3-D printing or pre-operative templating workflows.
- Any biomechanical analysis of fixation hardware (plates, nails, external fixators) — the app is purely about the geometry of the deformity itself.
- Any clinical decision-making (when to operate, how much correction is "enough", outcome prediction). The app is a teaching aid and is NOT a medical device.

---

## Part 3 — App B: Global Axes Approach (extrinsic, pre-multiplied)

### Section A2 — Conventions the Global Axes app uses

- **Coordinate system** (right-handed): X = global lateral, Z = global anterior, Y = global proximal (long axis). NOTE: this differs from the Eulerian app, which uses Z as the long axis. The Global Axes app puts Y up.
- **Sliders:**
  - **φ (Phi)**  → rotation about Global X — procurvatum/recurvatum (sagittal angulation)
  - **ψ (Psi)**  → rotation about Global Z — varus/valgus (frontal angulation)
  - **θ (Theta)** → rotation about Global Y — torsion (axial rotation)
- Composition is **EXTRINSIC**: each rotation is applied about the FIXED global axis, not a rotated prime axis.
- **Pre-multiplication convention:** applying Global X then Global Z then Global Y in time-order yields R_tot = R_y(θ) · R_z(ψ) · R_x(φ) (the most-recently-applied rotation sits on the LEFT).
- **Available global sequences in the UI:** ExtXZY (default), ExtZXY, ExtYZX. The "Global Sequence" dropdown in the control panel chooses which order is being composed.
- **Slider domain:** ±45° on each axis.
- **Sign conventions** match the Eulerian app: φ>0 procurvatum, ψ>0 valgus, θ>0 external rotation.

### Section B2 — Core formulas (Global Axes)

- **B2.1 — Total rotation matrix:**
  $$R_{\text{tot}} = R_y(\theta)\,R_z(\psi)\,R_x(\phi) \quad \text{(default ExtXZY sequence)}$$
  General extrinsic rule: rotations are pre-multiplied in reverse order of application (last applied → leftmost).
- **B2.2 — Euler's theorem (single-hinge equivalent):** same formula as the Eulerian app. The (Θ, u_rot) pair is invariant under reparametrisation — both apps will report the SAME single-cut axis-angle for the SAME final orientation, even though they reach that orientation via different (φ, ψ, θ) numbers.
- **B2.3 — Frontal-plane projection angle:** same atan2 formula as the Eulerian app, applied to R_tot · u where u is now +Y (the global long axis).
- **B2.4 — Floor / transverse projection angle:** analogous, with the appropriate axis swap.
- **B2.5 — Codman twist:** same construction (residual twist of x_ref about −u after applying R_tot). The Codman surface plotted at θ=0 has the SAME geometric meaning. Numerically the surface looks the same up to the φ/ψ/θ → axes mapping.
- **B2.6 — Wedge axis & Rodrigues closure:** identical construction to the Eulerian app — Euler's theorem yields (Θ, u_rot), wedge axis is u_rot's projection onto the chosen cut plane, closure is via Rodrigues' formula.

### Section C2 — Framework components taught in the Global Axes app

The Global Axes app teaches a SUBSET of the Eulerian app's framework, plus one component the Eulerian app doesn't have:

- **C2.1 — Camera Perspective demo** (script `01-camera-perspective.js`). A two-viewport scene that contrasts a "room camera" view of the bone with a perspective/orthographic "monitor camera" view. Used to motivate why the projected radiographic angle differs from the underlying 3-D rotation.
- **C2.2 — atan2 visualiser** (script `02-atan2-visualizer.js`). Identical purpose to the Eulerian app's atan2 component.
- **C2.3 — Global-axes main simulator** (script `03-main-simulator.js`). Sliders + the global-sequence dropdown + the live R_tot matrix + the Euler axis-angle readout + the Codman surface preview + the closing-wedge osteotomy preview.
- **C2.4 — Draggable projection labels** (script `04-draggable-labels.js`). UX layer over the simulator that lets the user re-position the frontal/sagittal/transverse projection labels and the wedge-angle label, with leader lines.
- **C2.5 — MPR / dual-viewport simulator** (script `05-mpr-simulator.js`). Top-and-bottom viewports showing the volume in two simultaneous reformats; same teaching point as the Eulerian app's MPR tutor.
- **C2.6 — Graph 12 / interactive sequence comparison** (script `06-graph12.js`). 2-D canvas plot driven by sliders + a sequence-select dropdown, showing how the projected radiographic angle changes as you re-order the global-axis composition.
- **C2.7 — Wedge / Rodrigues osteotomy model** — taught in the Mathematical Report (no separate script). Same closure math as the Eulerian app's osteotomy model.

### Section D2 — Decision rules — Global Axes vs Eulerian

| User question | Which app/framework to invoke |
|---|---|
| "Why do the Eulerian (φ, ψ, θ) numbers differ from the Global Axes (φ, ψ, θ) for the same X-ray?" | The two apps decompose the SAME R_tot into different parameterisations. Explain that intrinsic rotations apply about rotated prime axes (X, Y', Z'') while extrinsic rotations apply about fixed global axes (X, Z, Y). The (Θ, u_rot) pair is invariant; only the parameterisation differs. |
| "Which framework should I use clinically?" | The Global Axes (extrinsic) framework maps directly to operating-room intuition (the surgeon sees the distal fragment moving about the unchanged proximal frame). The Eulerian (intrinsic) framework maps to the engineering literature on rigid-body orientation. Both are correct; they are just different parameterisations of SO(3). |
| "Does the order of the rotations matter in the Global Axes app?" | YES — extrinsic rotations also do not commute. The "Global Sequence" dropdown (ExtXZY / ExtZXY / ExtYZX) lets the user explore this. R_y R_z R_x ≠ R_y R_x R_z in general. |
| "What is the relationship between intrinsic and extrinsic rotations?" | An intrinsic rotation sequence about (X, Y', Z'') is mathematically equivalent to the extrinsic sequence about (Z, Y, X) — i.e. apply the same elementary rotations in REVERSED order about the fixed axes. This is the key identity that lets you translate between the two apps' (φ, ψ, θ) numbers. |
| (any of the rows from the Eulerian app's decision table) | Use the Eulerian app's component as documented in Part 2. |

### Section E2 — Common pitfalls the Global Axes app deliberately surfaces

1. **Pre-multiplication vs post-multiplication.** Because the Global Axes app pre-multiplies (R_tot = R_last · … · R_first), the leftmost matrix in the displayed product is the LAST rotation applied in time. Students who learned the intrinsic convention (where rotations are usually post-multiplied) often get the order backwards.
2. **The intrinsic-↔-extrinsic equivalence** (intrinsic X-Y'-Z'' = extrinsic Z-Y-X) is exact; the two apps are NOT teaching different physics, they are teaching different bookkeeping.
3. **Codman's paradox is identical in both frameworks** because it is a geometric property of SO(3), not a feature of any one parameterisation.
4. **Long axis orientation differs:** the Global Axes app uses +Y as the bone's long axis (X lateral, Z anterior, Y proximal); the Eulerian app uses +Z as the long axis. Re-orient mentally before comparing numeric outputs.

### Section F2 — Things the Global Axes app does NOT cover

Same exclusions as the Eulerian app — restate them: no mechanical-axis (CORA/Paley) analysis, no joint-orientation angles (mLDFA, MPTA, …), no soft tissue, no fixation hardware biomechanics, no clinical decision-making. Teaching aid only — **NOT a medical device**.
