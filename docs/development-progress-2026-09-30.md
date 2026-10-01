# Lunar Haven Development Progress

**Assessment date:** 2026-09-30  
**Project path:** `D:\game\lunar-haven`  
**Overall status:** Core game loop and presentation are stable; the new crisis, healing, education, and ending-report expansion is implemented and has passed automated checks plus targeted browser sandbox tests. The next phase should focus on full-cycle balancing and extended playtesting.

## 1. Executive Summary

The project has moved beyond the basic prototype stage. The world view, moon phase display, calendar, autonomous NPC movement, dialogue system, task departure/return loop, randomized population rotation, landmark layers, and learning-oriented ending conditions are operational.

The large 2026-09-30 expansion added:

- English/ASCII-only file and folder paths.
- MP3 page-turn, wolf howl, dog bark, church bell, arrow, and animal audio integration.
- Three new transparent paper-cut wolf characters.
- Dark-moon wolf raids entering from the right-side forest.
- Hidden wolves when the beacon is not lit.
- Dog patrol detection, barking, and wolf interception.
- Fence damage when two or more wolves attack together.
- Red flashing and staggering animation for bitten residents.
- Clergy treatment using potion, medicine, and bandage resources.
- Full-moon transformation and a three-day werewolf rampage cycle.
- Higher landmark layers and stronger shadows below the NPC layer.
- Larger, easier-to-read dialogue typography.
- Landing-page education-level and ending-condition selection.
- Medieval chronicle ending pages with recorded story events.
- Parchment learning report with a radar chart and school-level learning indicators.

## 2. Completion Assessment

| Area | Status | Assessment |
|---|---|---|
| Moon phase and dual calendar | Complete | Thirty moon assets, lunar date display, sky moon, and monthly calendar are operational. |
| Horizontal world navigation | Complete | Player drag controls the camera; NPCs do not pull the viewport. |
| NPC autonomous movement | Complete | NPCs walk across long horizontal distances at 15 px/s with multiple Y lanes and collision turnarounds. |
| NPC task lifecycle | Complete | NPCs leave the scene, work off-screen for one turn, and return from outside without duplicate instances or green completion checks. |
| Random NPC population | Complete | Only part of the cast appears at once; hunter and guard rotate in from the forest side. |
| Character art and dialogue avatars | Complete | Independent standees and non-cropped dialogue portraits are connected. |
| Landmark presentation | Complete | Bakery, forge, church, clock tower, forest, and palisade are separate layers below NPCs with stronger depth shadows. |
| English path migration | Complete | Automated scan reports no non-ASCII file or folder names. |
| MP3 day transition | Complete | Every day advance calls `page-turn.mp3`. |
| Dark-moon wolf raid | Implemented / needs long playtest | One to three wolves spawn from the forest; visibility and defense rules are connected. |
| Dog and fence rules | Implemented / sandbox verified | Two-wolf test broke the palisade and infected Barnaby; concealed wolf rendering was verified. |
| Infection visuals | Complete | Bitten NPCs use red pulsing, staggering animation. |
| Clergy healing economy | Implemented / needs full interaction test | Father, monk, or nun can treat the next infected patient with potion + medicine + bandage. |
| Full-moon bell rule | Complete | Automatic bell calls remain only for the full moon. |
| Three-day werewolf rampage | Implemented / needs full-cycle playtest | Untreated infected NPCs transform and damage defense/buildings for three days. |
| Landing setup | Complete | Players choose elementary/junior level and the ending rule before entering town; duplicate teacher buttons were removed. |
| Story chronicle ending | Complete | Game events are recorded and laid out over a generated medieval book WebP. |
| Learning radar report | Complete | A six-axis chart and elementary/junior learning indicators render on a generated parchment WebP. |

## 3. Rules Currently Implemented

### Dark moon

1. On lunar days 29, 30, and 1, a raid starts.
2. One, two, or three wolves enter from the right-side forest.
3. The wolf howl MP3 plays when the raid starts.
4. Without a lit beacon or an active dog patrol, wolf standees are fully concealed.
5. An active Barnaby patrol barks, reveals the raid, and drives off one wolf.
6. A single wolf can be passively stopped by a healthy Barnaby.
7. Two or more wolves break the default forest palisade and bite Barnaby.
8. Prepared hunter/guard units can stop detected wolves; the arrow MP3 plays.
9. Surviving wolves randomly bite residents.

### Infection and healing

1. Bitten residents become infected and visibly stagger with a red pulse.
2. Father Lawrence, Brother August, and Sister Claire can perform prayer treatment.
3. Treatment consumes one healing potion, one medicine, and one bandage.
4. Clergy preparation tasks now produce the three required treatment resources.
5. Any of the three clergy may treat another clergy member if that character is infected.

### Full moon

1. The recorded church bell plays only on the full moon.
2. Untreated infected residents transform into werewolves.
3. Each transformed resident attacks for three days.
4. Rampages reduce town defense and visually damage a random building layer.
5. A prepared silver sword can still suppress the full-moon transformation crisis.

## 4. New and Updated Assets

### Generated with the built-in image generation workflow

- `assets/images/wolves/wolf-scout.png`
- `assets/images/wolves/wolf-raider.png`
- `assets/images/wolves/wolf-alpha.png`
- `assets/images/landmarks/forest-palisade.png`
- `assets/images/landing/landing-village-bottom.webp`
- `assets/images/ui/chronicle-book.webp`
- `assets/images/ui/learning-parchment.webp`

The wolf and palisade assets use transparent backgrounds. The book, parchment, and landing panorama are opaque layout assets.

### Migrated audio

- `assets/audio/voice/page-turn.mp3`
- `assets/audio/voice/wolf-howl.mp3`
- `assets/audio/voice/dog-bark.mp3`
- `assets/audio/voice/cat-meow.mp3`
- `assets/audio/voice/church-bell.mp3`
- `assets/audio/voice/arrow-shot.mp3`

## 5. Important Code Areas

- `js/systems/WolfRaidSystem.js` — raid spawning, concealment, dog detection, defense, and fence destruction.
- `js/systems/InfectionTracker.js` — bite tracking, clergy treatment costs, transformation, and rampage days.
- `js/systems/CrisisCycleSystem.js` — lunar-day crisis scheduling and full-moon-only bell rule.
- `js/systems/StoryJournal.js` — story event collection for the ending chronicle.
- `js/entities/NPC.js` — movement, infection state, off-screen tasks, and beacon task effect.
- `js/ui/LandingPageUI.js` — education-level and ending-condition setup.
- `js/ui/DialogueBoxUI.js` — enlarged dialogue and clergy treatment action.
- `js/ui/SettlementReportUI.js` — chronicle layout, radar chart, and learning indicators.
- `css/world.css` — landmark, palisade, wolf, and building depth layers.
- `css/paper-effects.css` — infected resident visual behavior.
- `css/dialogue.css` — readable dialogue typography.
- `css/codex.css` — medieval book and parchment report layouts.

## 6. Verification Completed

### Automated

- All JavaScript files pass `node --check`.
- Existing lunar phase and character tests pass.
- New gameplay expansion regression test passes.
- Character JSON parses successfully.
- Required audio and image assets exist.
- The project path scan reports zero non-ASCII filenames or folder names.

Run tests with:

```powershell
node tests/test_lunar_phase.js
node tests/test_gameplay_expansion.js
```

### Browser sandbox

- Landing page visually verified with the new bottom panorama.
- Elementary/junior selection and ending-condition selection verified.
- Top teacher-setting button removal verified.
- HUD treatment resources verified.
- Dialogue text verified at 20 px greeting and 16 px option-description sizes.
- Random six-character scene population verified.
- Two-wolf dark-moon raid verified as concealed without a beacon.
- Palisade broken state verified.
- Barnaby and resident infection animations verified.
- Seven-day ending generated a medieval chronicle and junior-high radar report.
- No browser console errors or warnings were observed in the tested flows.

## 7. Remaining Risks and Recommended Next Work

### High priority

1. Play one uninterrupted 29–30 day lunar cycle and tune wolf frequency, resource income, and defense loss.
2. Explicitly test all three discovery branches:
   - beacon lit;
   - dog patrol active;
   - neither active.
3. Test clergy healing for every healer, including self-treatment when the healer is bitten.
4. Observe three complete werewolf rampage days and confirm building damage remains readable but not overly destructive.

### Medium priority

1. Add a visible repair task for the broken palisade.
2. Add a small HUD status for beacon, dog patrol, fence integrity, and prepared defenders.
3. Balance the initial quantities and production rates of potion, medicine, and bandage.
4. Add explicit story entries for beacon lighting, dog detection, fence destruction, and building repair.
5. Review the 1280 px HUD layout; it fits, but the resource row is dense.

### Polish

1. Add separate damaged-state landmark art instead of relying only on filters and tilt.
2. Add wolf hit/retreat animation variants.
3. Improve chronicle pagination when more than 18 story events are recorded.
4. Add radar-chart values and learning-indicator details to printed output metadata.

## 8. Current Milestone

**Milestone:** Feature-complete educational gameplay alpha.  
**Recommended next milestone:** Full-cycle balance beta after completing the high-priority playtest matrix above.

## 9. 2026-09-30 Second-stage Additions

- Added church water as a resource and HUD item; medicinal herbs are now visible in the HUD as well.
- Added Ellie's spring-water collection task. Water and aconite deliveries now explicitly enter the central church storehouse.
- Added a 1–4 day duration slider to normal jobs. Costs, yields, and off-screen absence scale with duration.
- Expanded chronicle logging for assignments, returns, church supplies, palisade construction/destruction, and sky anomalies.
- Added a low-probability sky/time anomaly report, with increased probability during dark-moon wolf activity and a ten-day cooldown.
- The forest palisade is absent at game start and appears only after the blacksmith completes its construction; two or more wolves can destroy it.
- All non-dog characters remain unique. Dogs are the only repeatable character type, capped at two per round.
- Replaced the world panorama with a church-free version so the independent church and clock-tower layers no longer overlap the background.

## 10. Music and Chronicle Revision

- Added `watchmans-toll.mp3` as the looping default-on background track.
- Added HUD music toggle and volume slider. Browsers that block autoplay resume the track on the first player interaction.
- Rewrote the chronicle generator so that it prioritizes labour assignments, returns, stockpiles, fence status, attacks, injuries, healing, and consequences.
- The final book now selects the most meaningful daily chapters and uses lunar time only as context rather than repetitive primary content.

## 11. Moon Sync, Turn Timer, and Chronicle Reading

- Fixed the sky-moon update guard that had been checking a removed canvas. The visible sky image now updates on every lunar time tick using the exact lunar-day asset.
- Added a live turn countdown and progress bar to the HUD. It reports real remaining seconds and recalculates when the player changes simulation speed.
- Reworked the book into scrollable prose pages so longer chapters remain readable.
- Filtered ordinary daybreak notices out of the story book; only decisions, arrivals, supplies, defenses, crises, injuries, and healing can create a chapter.
