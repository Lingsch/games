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
    version: "Build 10",
    updated: "November 2026",
    kind: "Tab-target MMO, solo",
    blurb: "The same world, a hundred years after the summoner wars. Four peoples, sixteen classes that split in two at level 20, and a chase for three keys to the door below the Last Lamp. Buy a house, take an outpost for your guild, and keep the holidays.",
    facts: ["16 classes", "Levels 1–25", "4 peoples"],
    accent: "#63b7c9"
  },
  {
    title: "Stars Beneath",
    folder: "stars",
    version: "Build 8",
    updated: "November 2026",
    kind: "Space opera MMO, solo",
    blurb: "The same world, two thousand years on. Three paths: a smuggler with an inherited freighter and a debt, a novice of the lamp-keepers on a freezing border fort, or an initiate of the Empire's Dusk Covenant. Recruit a crew, take the helm, and find out why the stars are going out.",
    facts: ["3 paths, 20 classes", "Levels 1–15", "7 worlds, flight, 1 station"],
    accent: "#ffb347"
  },
  {
    title: "Smokestack",
    folder: "smokestack",
    version: "v0.12.1",
    updated: "November 2026",
    kind: "Factory builder",
    blurb: "A Factorio fan game. Mine by hand, then automate: belts and inserters, oil, trains, robots, nuclear power, the circuit network, and a rocket at the end. Same game as the 3DS build.",
    facts: ["210 items", "196 technologies", "Phase 9: circuits"],
    accent: "#ffbe46"
  }
];
