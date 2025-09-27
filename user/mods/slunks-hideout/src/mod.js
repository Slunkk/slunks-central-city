"use strict";

/**
 * Streets: adds a spawn usable by Scavs only (so PMC fallback never
 * picks it) and forces Exit_E10_coop to be always open & accessible.
 *
 * Coords:
 *   Position: [46.99708, -0.2861767, 160.0706]
 *   Rotation: 0
 */
class Mod {
  postDBLoad(container) {
    const logger = container.resolve("WinstonLogger");
    const db = container.resolve("DatabaseServer").getTables();

    const locations = db.locations;
    const streetsKey =
      Object.keys(locations).find((k) => k.toLowerCase().includes("streets")) || "tarkovstreets";
    const streets = locations[streetsKey];

    if (!streets || !streets.base) {
      logger.error(`[slunks-hideout] Streets not found. Keys: ${Object.keys(locations).join(", ")}`);
      return;
    }

    // --- 1) Add spawn usable by Scav only ---
    try {
      const spawns = streets.base.SpawnPointParams || streets.base.spawnPointParams || [];
      if (!Array.isArray(spawns) || spawns.length === 0) {
        logger.error("[slunks-hideout] No spawn points on Streets to clone from.");
      } else {
        const template = spawns[0];
        const spawn = JSON.parse(JSON.stringify(template));

        spawn.Id = "slunks_spawn_0001";
        spawn.Position = { x: 46.99708, y: -0.2861767, z: 160.0706 };
        if ("Rotation" in spawn) spawn.Rotation = 0;
        if ("Angles" in spawn) spawn.Angles = { x: 0, y: 0, z: 0 };

        // ✅ Scav-only, so PMC fallback never chooses this
        spawn.Sides = ["Savage"];
        if ("Side" in spawn) spawn.Side = "Savage";
        if ("IsPlayersSpawn" in spawn) spawn.IsPlayersSpawn = false;

        if (typeof spawn.Inertia === "number") spawn.Inertia = 1;
        if (typeof spawn.DelayToCanSpawnSec === "number") spawn.DelayToCanSpawnSec = 0;

        spawns.push(spawn);
        logger.info("[slunks-hideout] Added Scav-only spawn at your coordinates.");
      }
    } catch (e) {
      logger.error(`[slunks-hideout] Spawn add failed: ${e?.message || e}`);
    }

    // --- 2) Make Exit_E10_coop always open (do NOT rename it) ---
    try {
      const exits = streets.base.exits || streets.base.Exits || [];
      if (!Array.isArray(exits) || exits.length === 0) {
        logger.error("[slunks-hideout] No exits found on Streets.");
      } else {
        const exit = exits.find((e) => e?.Name === "Exit_E10_coop");
        if (!exit) {
          logger.warning("[slunks-hideout] Exit_E10_coop not found.");
        } else {
          exit.Chance = 100;
          exit.ExfiltrationTime = 7;    // fine; PTT can still do its PTT-style handling
          exit.PassageRequirement = "None";
          exit.RequirementTip = "";
          exit.MinTime = 0;
          exit.MaxTime = 0;
          exit.PlayersCount = 0;
          exit.Count = 0;

          // Visible/usable for all sides
          if ("EntryPoints" in exit) exit.EntryPoints = "All";
          if ("Side" in exit) exit.Side = "All";
          if ("Sides" in exit && Array.isArray(exit.Sides)) exit.Sides = ["Usec", "Bear", "Savage"];
          if ("RequiredPlayerSide" in exit) exit.RequiredPlayerSide = "All";
          if ("IsExitAccessibleForAll" in exit) exit.IsExitAccessibleForAll = true;

          logger.info("[slunks-hideout] Exit_E10_coop forced open & usable for PMC+Scav.");
        }
      }
    } catch (e) {
      logger.error(`[slunks-hideout] Extract edit failed: ${e?.message || e}`);
    }

    // --- 3) Ensure E1 is visible & PMC-eligible (routing untouched) ---
try {
  const exits = streets.base.exits || streets.base.Exits || [];
  const e1 = exits.find(e => e?.Name === "E1");
  if (!e1) {
    logger.warning("[slunks-hideout] E1 not found.");
  } else {
    // If EntryPoints is missing/blank, allow all – avoids disappearing when your PMC spawns don't match
    if (e1.EntryPoints == null || (Array.isArray(e1.EntryPoints) && e1.EntryPoints.length === 0) || e1.EntryPoints === "") {
      e1.EntryPoints = "All";
    }

    // Make sure PMCs are allowed (some stacks key off these)
    if ("Side" in e1) e1.Side = "All";
    if ("Sides" in e1 && Array.isArray(e1.Sides)) e1.Sides = ["Usec", "Bear", "Savage"];
    if ("RequiredPlayerSide" in e1) e1.RequiredPlayerSide = "All";
    if ("IsExitAccessibleForAll" in e1) e1.IsExitAccessibleForAll = true;

    // Keep it visible/available (doesn’t alter timers/routing)
    if (typeof e1.Enabled === "boolean") e1.Enabled = true;
    if (typeof e1.Visible === "boolean") e1.Visible = true;
    if (typeof e1.Chance === "number") e1.Chance = 100;

    logger.info("[slunks-hideout] E1 normalised for PMC access (routing untouched).");
  }
} catch (e) {
  logger.error(`[slunks-hideout] E1 fix failed: ${e?.message || e}`);
}


    // Log exits for debugging (optional)
    try {
      const exits = streets.base.exits || streets.base.Exits || [];
      logger.info(`[slunks-hideout] Streets exits now: ${exits.map((e) => e.Name).join(", ")}`);
    } catch {}
  }
}

module.exports = { mod: new Mod() };
