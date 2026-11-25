// The game shelf. To add a game: put its folder next to this file,
// then add one entry below. Nothing else needs to change.
window.SITE = {
  name: "Rod's Games",
  tagline: "Worlds built one playtest at a time. Play in the browser, or add one to your Home Screen for full screen."
};

window.GAMES = [
  {
    title: "Summoners",
    folder: "summoners",          // folder name that holds the game's index.html
    version: "Milestone 3.4",
    updated: "November 2026",
    kind: "Roguelite horde RPG",
    blurb: "Lead a horde as a Necromancer, Druid or Elementalist. Take eight walled cities across a seeded open world. Death ends the run; embers carry on.",
    facts: ["3 summoners", "48 spells", "600 a side"],
    accent: "#e2853a"
  },
  {
    title: "Single-Player MMO",
    folder: "mmo",
    version: "Build 4.3",
    updated: "November 2026",
    kind: "Tab-target MMO, solo",
    blurb: "The same world, a hundred years after the summoner wars. Uncover the Gravelord's plot in the Vale with your two friends, then sail the Saltreach Coast to the Sunken Fleet.",
    facts: ["16 classes", "Levels 1–20", "2 zones"],
    accent: "#63b7c9"
  },
  {
    title: "Oath of the East 3D",
    folder: "oath3d",
    version: "v0.39",
    updated: "November 2026",
    kind: "Open-world action RPG",
    blurb: "A Skyrim-style adventure, the same game as the PSP and Windows builds. Walk the Vale, Ravensgate and the Thornwood, clear hand-built dungeons, and keep your oath. Play it sideways on a phone.",
    facts: ["4 lands", "13 dungeons", "21 quests"],
    accent: "#a995e6"
  }
];
