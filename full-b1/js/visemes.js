/* Rhubarb mouth shapes -> rig lip parameters (restrained, adult articulation).
 * X rest, A closed M/B/P, B clenched teeth (S,T,K,EE), C open (EH), D wide open (AH),
 * E rounded (AW/OH), F puckered (OO/W), G F/V (lower lip under upper teeth), H L (tongue). */
window.VISEMES = {
  X: { open: 0.0, wide: 0.0, round: 0.0, teeth: 0.0, tuck: 0, tongue: 0, press: 0.0 },
  A: { open: 0.0, wide: -0.05, round: 0.05, teeth: 0.0, tuck: 0, tongue: 0, press: 1 },
  // Fable 5.1 revision 2026-10-04: smaller peak openings, less extreme pucker/spread, teeth visible in
  // the clenched shape so narrow apertures read as teeth rather than a dark slit.
  // code-technical revision 2026-10-04: less lateral spread on the most frequent shape (grin look)
  B: { open: 0.26, wide: 0.14, round: 0.0, teeth: 0.9, tuck: 0, tongue: 0, press: 0 },
  C: { open: 0.42, wide: 0.16, round: 0.0, teeth: 0.7, tuck: 0, tongue: 0.2, press: 0 },
  D: { open: 0.68, wide: 0.08, round: 0.05, teeth: 0.55, tuck: 0, tongue: 0.35, press: 0 },
  E: { open: 0.42, wide: -0.18, round: 0.45, teeth: 0.2, tuck: 0, tongue: 0.2, press: 0 },
  F: { open: 0.2, wide: -0.24, round: 0.75, teeth: 0.0, tuck: 0, tongue: 0, press: 0 },
  G: { open: 0.12, wide: 0.08, round: 0.0, teeth: 1.0, tuck: 1, tongue: 0, press: 0 },
  H: { open: 0.34, wide: 0.1, round: 0.0, teeth: 0.6, tuck: 0, tongue: 1, press: 0 },
};
