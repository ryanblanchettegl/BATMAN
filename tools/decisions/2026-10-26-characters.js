// Decision set: wrestler look, final pick. Ryan chose the human direction, then narrowed it to C and F (Ink and Lit dropped).
// Critic rounds 8-11: F Scrapbook passed at 9.0; C Human was 8.8 before its border fix (now fixed-width, re-score pending).
// Each option shows the same 15 real wrestlers (AEW top 5, WWE top 5, legends top 5) so the style is judged on known faces.
// Reference roster is concept-only and never ships. Mockups: concepts/characters.html?v=<human|scrap>&show=stars|starheads|scene
window.DECISIONS = {
  title: "Wrestler look: final pick (shown on real AEW, WWE and legend wrestlers)",
  decisions: [
    { question: "Which human style should the game use?",
      options: [
        { title: "F · Human scrapbook · 9.0 (critic: ship it)", link: "concepts/characters.html?v=scrap&show=stars", visual: "concepts/review/final-scrap-stars.png",
          pitch: "Human faces and bodies built from layered paper: each piece casts a tiny shadow, gear is patterned paper, hair is torn strips, trunks carry cut letters or emblems.",
          pros: ["Only style to pass 9/10", "Best in scenes: patterns identify every wrestler at 70px", "Strongest broadcast and backstage frames"],
          cons: ["More art per wrestler (pattern + emblem)", "Busier than C up close"] },
        { title: "C · Human · 8.8 (border fixed after scoring)", link: "concepts/characters.html?v=human&show=stars", visual: "concepts/review/final-human-stars.png",
          pitch: "The same human faces and bodies in flat colour, cut out with a cream paper border so they separate from crowds and dark sets.",
          pros: ["Cleanest, most human look", "Faces read best close up", "Cheapest per wrestler"],
          cons: ["Plainer gear in scenes", "Relies on the paper border to stand out from the crowd"] },
        { title: "Faces close up: compare both", link: "concepts/characters.html?v=scrap&show=starheads", visual: "concepts/review/final-scrap-starheads.png",
          pitch: "All 15 heads side by side. Switch C/F with the buttons at the top of the page (C shot: concepts/review/final-human-starheads.png).",
          pros: ["Use this to judge likeness and faces"], cons: ["Reference only: pick F or C above"] } ] }
  ]
};
