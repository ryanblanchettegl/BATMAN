// Decision set: new desk + booker screen concepts. Mockups: tools/concepts/screens.html?v=<id>
// All six share: three zones (status left, one dominant object centre, consequences right), workbench paper look,
// played items stay dimmed in place, slide-out hover, settle-in motion (0.3s state / 0.5s move), no blur/scale.
const W = (body) => `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg"><rect width="160" height="90" fill="#141414"/><rect x="4" y="6" width="30" height="78" fill="#f3ecd9" opacity=".9"/><rect x="126" y="6" width="30" height="78" fill="#f3ecd9" opacity=".9"/>${body}</svg>`;
window.DECISIONS = {
  title: "New desk and booker screens (three-zone concepts)",
  decisions: [
    { question: "1. The desk (Office): what owns the centre?",
      options: [
        { title: "A · The Road Desk", link: "concepts/screens.html?v=desk-a",
          pitch: "Centre: this week's city map and the next show's poster with Book the show. Tasks as index cards under it. Right: matters stack and push open as they arrive; answered ones stay dimmed.",
          pros: ["Closest to today's desk and Ryan's road", "Poster sells the next show every week", "Low risk to build"], cons: ["The fire is in the side column, easy to miss", "Busiest of the three"],
          visual: W(`<rect x="40" y="6" width="54" height="34" fill="#4c9a54"/><rect x="98" y="6" width="24" height="34" fill="#111" stroke="#fff"/><rect x="40" y="46" width="19" height="16" fill="#fbfbf5"/><rect x="62" y="46" width="19" height="16" fill="#fbfbf5"/><rect x="84" y="46" width="19" height="16" fill="#fbfbf5"/><rect x="128" y="10" width="26" height="18" fill="#ffd9cf"/>`) },
        { title: "B · The Fire First", link: "concepts/screens.html?v=desk-b",
          pitch: "Centre: one big matter card, the week's fire, with its still picture and the answers as big card buttons. Other matters wait beside it. Right: the week's tasks and the next show.",
          pros: ["Matches 'the week opens on a fire' (rule 7a)", "One dominant object, the cyberpunkdreams lesson", "Fits the interruption cap (top 3 a week)"], cons: ["Road and poster shrink to a side card", "A quiet week has a weaker centre"],
          visual: W(`<rect x="40" y="6" width="82" height="54" fill="#f3ecd9"/><rect x="44" y="12" width="30" height="24" fill="#222"/><rect x="78" y="14" width="40" height="8" fill="#3c9a4e"/><rect x="78" y="25" width="40" height="8" fill="#2f6fb5"/><rect x="78" y="36" width="40" height="8" fill="#c8402c"/><rect x="40" y="64" width="40" height="18" fill="#f3ecd9" opacity=".5"/>`) },
        { title: "C · The Week Board", link: "concepts/screens.html?v=desk-c",
          pitch: "Centre: the week as seven day columns with shows, fires and visits pinned on their day. Map and tasks under it. Right: 'word travels' feed of the hallway, press and locker room.",
          pros: ["Whole week readable at a glance", "Shows timing and deadlines clearly", "Gives 'word travels' a home"], cons: ["Seven columns are tight at 1080p", "New layout, most work"],
          visual: W(`${[0,1,2,3,4,5,6].map(i=>`<rect x="${40+i*12}" y="6" width="10" height="40" fill="#0006" stroke="#555"/>`).join('')}<rect x="88" y="14" width="10" height="14" fill="#111" stroke="#fff"/><rect x="52" y="12" width="10" height="10" fill="#ffd9cf"/><rect x="40" y="52" width="48" height="30" fill="#4c9a54"/><rect x="92" y="52" width="30" height="30" fill="#fbfbf5"/>`) } ] },

    { question: "2. The booker: how is the show built?",
      options: [
        { title: "A · The Run Sheet", link: "concepts/screens.html?v=book-a",
          pitch: "Centre: segments as cards top to bottom in running order under a cut-card clock bar. Booked segments stay on the sheet, dimmed and pushed back. Roster on the left, consequences on the right.",
          pros: ["Reads like a real run sheet", "Running order is obvious", "Builds on today's card builder"], cons: ["Long shows scroll in the centre", "Minutes only shown on the bar"],
          visual: W(`<rect x="40" y="6" width="82" height="7" fill="#ffd43b"/>${[0,1,2,3,4].map(i=>`<rect x="40" y="${16+i*14}" width="82" height="11" fill="#f3ecd9" opacity="${i<2?.55:1}"/>`).join('')}`) },
        { title: "B · The Card Table", link: "concepts/screens.html?v=book-b",
          pitch: "Centre: each match and angle is an index card in a grid; drag names from the roster onto them. The main event is a big gold card with both wrestlers drawn and the winner pick.",
          pros: ["Most tactile, drag and drop", "Main event feels like the main event", "Great for screenshots"], cons: ["Running order is less clear", "Drag needs a keys/pad version (rule 5)"],
          visual: W(`<rect x="40" y="6" width="40" height="18" fill="#fbfbf5"/><rect x="82" y="6" width="40" height="18" fill="#fbfbf5"/><rect x="40" y="27" width="40" height="18" fill="#fbfbf5"/><rect x="82" y="27" width="40" height="18" fill="#fbfbf5"/><rect x="40" y="49" width="82" height="34" fill="#fff3c4"/>`) },
        { title: "C · The TV Clock", link: "concepts/screens.html?v=book-c",
          pitch: "Centre: a two-hour TV timeline; each segment is a block as wide as its minutes, ad breaks included, top-of-hour marked. Pick a block to edit it below. Consequences on the right.",
          pros: ["Time is the budget, made visible (97-time)", "Top of the hour judgement is obvious", "Fits Bill's live-show-first plan"], cons: ["Short segments get thin blocks", "Least like a classic booking sim"],
          visual: W(`<rect x="40" y="10" width="82" height="26" fill="#0d0d0d"/><rect x="40" y="14" width="5" height="18" fill="#ffd43b"/><rect x="46" y="14" width="10" height="18" fill="#3c9a4e"/><rect x="57" y="14" width="7" height="18" fill="#f3ecd9"/><rect x="65" y="14" width="12" height="18" fill="#c9d7ef"/><rect x="101" y="14" width="21" height="18" fill="#c8402c"/><rect x="40" y="44" width="82" height="38" fill="#f3ecd9"/>`) } ] }
  ]
};
