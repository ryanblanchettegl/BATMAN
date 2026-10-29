# TEW IX recovered screen map (from the binary)

Evidence class `[bin]`: 500,031 printable strings extracted from `TEW9.exe`, from which
**343 form identifiers** and 30 tab/nav identifiers were recovered. These are the
application's own screen classes, so this is a weaker claim than source code but a much
stronger one than the handbook's prose: it is the actual inventory of what the program
*has screens for*.

## What the binary is

| Property | Value |
|---|---|
| Format | PE32 (i386), 3 sections |
| Size | 112 MB; `.text` 117,448,704 bytes of code + compiled form resources |
| Entropy | 3.54 (not packed — no UPX/FSG/MPRESS/PECompact/Themida signatures) |
| Function prologues | 15,369 (`55 8B EC`) |
| Strings | 500,031 runs ≥4 chars, 648 KB total |
| Language | Delphi/Lazarus-style (form/unit identifiers), **not** .NET, Go or Rust |
| Form resources | compiled into `.text` (only 8 KB of `.rsrc`), which explains the size |

The earlier assumption that this was Delphi *because* of `QlmCLRHost` was wrong in reasoning
but right in outcome: the licensing layer is CLR-hosted, the game itself is Object Pascal.

## Screens by domain

### Booking (16)
`BookingAngle`, `BookingAngleInvolved`, `BookingAngleNotes`, `BookingAngleQuick`,
`BookingAuto`, `BookingBattleRoyal`, `BookingBelts`, `BookingCompetitors`,
`BookingCreateMatch`, `BookingHistory`, `BookingMatch`, `BookingMatchDetails`,
`BookingMatchNotes`, `BookingMoves`, `BookingMovesAdd`, `BookingTurnChange`.

`BookingAuto` confirms an **auto-booker** for a single card; `BookingBattleRoyal` and
`BookingMoves*` confirm battle royals and per-match move selection as first-class flows.

### Show night (27)
`ShowAbsent`, `ShowAfterSpeech`, `ShowBookingAnalysis`, `ShowBookingTeam`,
`ShowBookingTeamIdea`, `ShowBookingTeamSpend`, `ShowBookingTeamStore`, `ShowBroadcasting`,
`ShowCoverage`, `ShowFinance`, `ShowFinanceBreakdown`, `ShowGimmickRecap`, `ShowHOTR`,
`ShowHOTRDuo`, `ShowIncident`, `ShowIncidentDuo`, `ShowInjuryReview`, `ShowLocal`,
`ShowLocation`, `ShowMediaScrum`, `ShowMeeting`, `ShowMinor`, `ShowNightOff`,
`ShowOverReview`, `ShowPreShow`, `ShowRename`, `ShowTurn`.

- `ShowAfterSpeech` / `ShowMeeting` = the post-show and booking-team speeches.
- `ShowHOTR` / `ShowHOTRDuo` — **unresolved acronym**. Appears for singles and duo; most
  likely a heat/highlight review but I will not guess further. `[infer: unknown]`

### Control (the office) — 118 screens
This is where the game actually lives. Grouped:

**Roster and people** — `Roster`, `RosterAlter` (alter egos), `RosterBonus`,
`RosterClients`, `RosterEgo`, `Morale`, `LockerRoom`, `LockerRoomMeddle`,
`LockerRoomRib`, `LockerRoomSelect`, `SickBay`, `Available`, `Expiry`, `Shortlist`.

`LockerRoomMeddle` and `LockerRoomRib` are **actions on the room** — meddling and ribbing —
not just a read-out. That is a whole interaction layer the handbook describes only in prose.

**Creative** — `Creative`, `CharacterIdea`, `Gimmick`, `GimmickChange`, `GimmickIdeas`,
`GimmickRename`, `Storylines`, `StorylinesAdd`, `StorylinesIdea`, `StorylinesIntroduce`,
`BookingTeam`, `BookingTeamSelect`, `InnerCircle`, `InnerCircleSelect`, `Promise`.

**Product and company** — `Product`, `ProductChange`, `Production`, `ProductionRivals`,
`Brands`, `Divisions`, `Stables`, `StablesEdit`, `HiringRules`, `Goals`, `DirtyTricks`,
`DrugTest`, `Ace` (the figurehead slot), `FedInfo`, `Geo`, `GeoNewFed`, `StartFed`.

**Titles and competition** — `Belts`, `BeltEdit`, `BeltReplace`, `BeltDefences`,
`BeltsMove`, `Tourny`, `TournyElim`, `TournyManage`, `TournyRemain`, `TournyRobin`,
`Battles`.

`TournyRobin` is decisive: tournaments support **round-robin** as well as **elimination**.

**Finance and investment** — `Finance`, `FinanceBreakDown`, `FinanceEstimates`, `Merch`,
`Ticket`, `Investments`, `InvestmentsBelt`, `InvestmentsCaster`,
`InvestmentsDojo`, `InvestmentsDonate`, `InvestmentsFed`, `InvestmentsHQ`, `InvestmentsSell`,
`InvestmentsUpgradeCaster`, `InvestmentsVenue`, `Media`.

`InvestmentsCaster` and `InvestmentsUpgradeCaster` confirm you can **buy and upgrade a
broadcaster** — the handbook mentions owning outlets but this is the actual purchase flow.

**Alliances ("umbrella")** — `UmbrellaApply`, `UmbrellaCreate`, `UmbrellaInvite`,
`UmbrellaLoan`, `UmbrellaMember`, plus `AllianceControlBelts`, `AllianceCriteria`,
`AllianceTitleEdit`, `AllianceTitleReplace`, `AllianceTitles`, `Trades`.

So the internal name for an alliance is an **umbrella**, and membership, loans and title
control are separate screens.

**Scheduling** — `Schedule`, `ScheduleCard`, `ScheduleOrder`, `ScheduleRedo`,
`ScheduleStandardise`, `ScheduleTV`, `House`, `HouseBook`, `HouseLoop`, `Child`,
`ChildLoose`, `ChildProduction`, `ChildStaff`, `Development`, `DevelopmentChoice`,
`DojoSelection`, `PMHire`.

`ScheduleStandardise` and `HouseLoop` imply bulk schedule templating and repeating house-show
loops — practical tooling the handbook does not document.

**Avatars and user** — `User`, `UserLog`, `UserStats`, `ChangeAvatar`, `ChangeAvatarFed`,
`ChangeAvatarRegen`, `ChangeAvatarSelect`, `Diary`.

### Pending decisions (15) — the interruption layer
`PendingCandidate`, `PendingExcursion`, `PendingGeneric`, `PendingGraduate`, `PendingHiring`,
`PendingIncidentSolo`, `PendingLocalOffer`, `PendingPayRise`, `PendingReneg`,
`PendingSocialMedia`, `PendingTakeover`, `PendingTrade`, `PendingTradeWaiting`,
`PendingWorkerOffer`, `PendingWorkerRivals`.

This is the day-to-day inbox model: each of these is a modal decision the game forces on
you. `PendingSocialMedia` and `PendingTakeover` are notable — social-media events and
company takeovers are their own decision types.

### Profiles (36)
**Worker** — `ProfileWorker`, `Achieve`, `Available`, `CV`, `Characters`, `Chemistry`,
`Contract`, `History`, `InjuryHistory`, `Over`, `Relation`, `Skill`, `SkillTrack`, `Talk`,
`Title`, `Top10`.
**Company** — `ProfileFed`, `Alumni`, `Awards`, `Business`, `Fame`, `FameAdd`, `Feuds`,
`Hall`, `History`, `Pacts`, `PowerCV`, `Product`, `Stables`, `Staff`, `Teams`, `Titles`,
`Tour`.

`ProfileWorkerCharacters` = alter egos/characters list; `ProfileFedPacts` = treaty/pact
history; `ProfileWorkerSkillTrack` = skill history, i.e. the game *does* track progression.

### Media and broadcasting (8)
`MediaDeal`, `MediaMedia`, `MediaNegotiate`, `MediaOther`, `MediaPurpose`, `MediaRatings`,
`MediaRequirements`, `MediaTime`.

A structured **negotiation wizard**: requirements → purpose → time → ratings → deal.

### Editors (24 + 5)
`OptionEditAlliance`, `Belt`, `BeltNames`, `Card`, `CardNames`, `Caster`, `Contract`,
`Dojo`, `Era`, `Fed`, `FedSchedule`, `Gimmick`, `Injury`, `Location`, `Match`,
`Narrative`, `Stable`, `StableNames`, `TV`, `Team`, `TeamNames`, `Tribute`, `Worker`,
`WorkerNames`.

Plus `EditorCopyTeam`, `EditorSearchByName`, `External`, `ExternalReport`.

`OptionEditCaster` proves broadcasters are directly editable; `OptionEditNarrative` and
`OptionEditEra` confirm the two major IX-era systems; `OptionEditFedSchedule` is a
per-company schedule editor.

### Creation and data (14)
`CreateAccess`, `CreateDatabase`, `CreateMDB`, `CreateMod`, `CreatePic`, `DatabasePopulate`,
`DataSet`, `DataCheck`, `Converter`, `Import`, `External`, `Initialize`,
`CustomiseBInfo`, `NewFeatures`.

`CreateAccess` confirms the **Microsoft Access** dependency is explicit in the UI, matching
the `.mdb` observation. `NewFeatures` is an in-game changelog screen.

### Filters (16)
`FilterDev`, `FilterEditorAlliance`, `FilterEditorDate`, `FilterEditorDateRange`,
`FilterEditorFed`, `FilterEditorLocation`, `FilterEditorWorker`, `FilterLineage`,
`FilterLocal`, `FilterMedium`, `FilterProfileRoster`, `FilterRoster`, `FilterRoster2`,
`FilterShowLocation`, `FilterSmall`, `FilterWorkers`.

Filtering is a first-class subsystem with date-range and lineage variants — the editor is
built to operate on sets, not single rows.

### Other
`Calendar`, `JobMarket`, `IndependentShows`, `TributeShows`, `TributeShowsAdd`, `Venues`,
`GeoTags`, `DojoAffiliation`, `DojoGraduation`, `DojoSetup`, `DojoUpgrade`,
`IncidentDisciplinary`, `ResultsExpanded`, `SearchByName`, `Skin`, `Notepad`,
`TemplateName`, `RenameIdea`, `TrialMessage`, `Welcome`, `Intro`, `GameSplash`,
`GameSplashMulti`, `GameSplashPM`, `NewGameSetup`, `NewGamePlayers`, `NewGameFeds`,
`NewGameFedSelect`, `CopySaveGame`, `SizeCriteria`, `TeamHistory`, `GimmickRestore`.

`TrialMessage` is the trial gate. It was **not** inspected; the earlier refusal on licence
circumvention stands.

## Systems the binary proves exist that the handbook barely documents

| System | Evidence |
|---|---|
| Round-robin tournaments | `TournyRobin`, `TournyElim`, `TournyRemain` |
| Buying / upgrading a broadcaster | `InvestmentsCaster`, `InvestmentsUpgradeCaster` |
| Locker-room actions (meddle, rib) | `LockerRoomMeddle`, `LockerRoomRib` |
| Company pacts with cash negotiation | `PactCash`, `PactNegotiate`, `ProfileFedPacts` |
| Social media as a pending decision | `PendingSocialMedia` |
| Company takeovers as a pending decision | `PendingTakeover` |
| Skill progression history | `ProfileWorkerSkillTrack` |
| Bulk schedule templating and house-show loops | `ScheduleStandardise`, `HouseLoop` |
| SQL-facing options | `OptionsSQL` |
| Sandbox editor | `OptionsSandbox` |
| Explicit chemistry/relationship global editors | `OptionsChemistry`, `OptionsRelationship` |

## What this does not give

- **No field-level data.** The `.mdb` is password-protected; the forms tell us screens exist,
  not what their controls hold.
- **No formulas.** The rating maths stays where the handbook left it.
- **No DFM property extraction.** Form resources are compiled into `.text` as binary blobs;
  recovering captions would need a DFM parser, not a string scan.

## Why a full Ghidra decompile was not worth it

117 MB of Object Pascal with 15,369 functions would take hours and tens of gigabytes, and the
prize — behaviour — is already 90% documented in the handbook. The high-yield move was
strings plus identifier archaeology, which is what this document is. If field-level mechanics
are ever needed, the cheaper path remains recovering the Jet password to read the database,
not decompiling the program.
