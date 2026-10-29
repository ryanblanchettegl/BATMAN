// Decision set: the new booking screen. Three finalists that scored over 8/10 with the critic agent after 5 rounds.
// All share one build: roster left (drag, touch, keys), card centre (drag up/down), options right (tiles -> pop-ups),
// "Who fits this spot", the agent's facts, "What this card changes", loose feud threads. Mockups: concepts/booker.html?v=<id>
window.DECISIONS = {
  title: "The new booking screen (critic-approved finalists)",
  decisions: [
    { question: "Which booking screen should we build?",
      options: [
        { title: "The Clock Wall · 8.6", link: "concepts/booker.html?v=wall", visual: "concepts/review/r5-wall-filled.jpg",
          pitch: "Time is the card. Each match is as tall as its minutes on a 2:00 ruler, with a red off-air line and a big 'MIN OPEN' block. Feud strings run in a side gutter. Tall matches show a storyboard.",
          pros: ["Answers 'is the show full?' at a glance", "Uses 1080p best (critic's pick to build first)", "Loose feuds sit right in the open time"],
          cons: ["Least hand-made look of the three", "Storyboard frames need the scene.ts render check"] },
        { title: "The Production Truck · 8.3", link: "concepts/booker.html?v=truck", visual: "concepts/review/r5-truck-filled.jpg",
          pitch: "The card is a TV storyboard. Every segment has a scene thumbnail (camera, crowd, cage or ladder, belt). The picked one opens a 3-frame plan: entrance, the turn, the finish. A clock reel runs across the top.",
          pros: ["Most distinctive: booking feels like directing TV", "Rule 9c (every choice is a scene) made visible", "Best for trailers and screenshots"],
          cons: ["Hard gate: 7 thumbnails + 3 frames must hold 60 fps", "Busiest centre column"] },
        { title: "The Corkboard · 8.2", link: "concepts/booker.html?v=cork", visual: "concepts/review/r5-cork-filled.jpg",
          pitch: "The card is pinned to cork. Cards are as tall as their minutes, red yarn ties feud partners, and loose threads hang as stickies you can drop on. Polaroid roster. The right side shows each wrestler's file: friend, feud, what he remembers.",
          pros: ["Warmest hand-made look", "Best relationship content (rule 9b)", "Its skin could be applied to either other layout"],
          cons: ["Time reads less sharply than the Wall", "Cork texture lowers string contrast in places"] } ] }
  ]
};
