# Bone Deformity Simulator: Eulerian Approach — App Knowledge Base

> This file is the AI tutor's source of truth about what the app teaches.
> Edit this file directly when you change anything in the app.
> No code changes needed — chat.mjs reads this file on every cold start.

---

## App Overview

**Title:** Bone Deformity Simulator: Eulerian Approach (a.k.a. "Deformity Engine")
**Type:** 2-tab interactive teaching tool with a 3-D simulator and a written mathematical report.
**Scope:** General long-bone deformity analysis. The app is anatomy-agnostic — the same Eulerian framework applies to femur, tibia, humerus, and forearm bones; numeric examples in the report are calibrated for a generic diaphyseal segment.

**Tabs:**
1. **Simulator** — 3-D viewport with sliders for sagittal angulation φ (procurvatum / recurvatum), frontal angulation ψ (varus / valgus), and axial rotation θ (torsion). Side panel shows live values for the total rotation matrix R_tot and the equivalent single-hinge axis-angle (Euler's theorem). Includes a draggable-projection-label overlay, a dual-viewport (frontal + transverse) MPR tutor, a closing-wedge osteotomy preview, and an interactive Codman-surface visualiser.
2. **Mathematical Report** — full written derivation in 9 sections, plus three large interactive 3-D figures (Graphs 15, 16, 17).

---

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
