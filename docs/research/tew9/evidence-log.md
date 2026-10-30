# Evidence log — what is verified, and what is not

## Binary pass (added later)

`TEW9.exe` was analysed structurally without executing it.

| Finding | Value |
|---|---|
| Format | PE32 (i386), 3 sections, 112 MB |
| Code section | `.text` = 117,448,704 bytes (forms compiled into it; `.rsrc` only 8 KB) |
| Entropy | 3.54 — **not packed** (no UPX/FSG/MPRESS/PECompact/Themida) |
| Function prologues | 15,369 (`55 8B EC`) |
| Strings | 500,031 runs ≥4 chars, ~648 KB of text |
| Language | Object Pascal / Delphi-Lazarus style (form identifiers), not .NET/Go/Rust |
| Screens | **343 form classes** + 30 tab/nav identifiers recovered |

Recovered screen classes include `frmControlUmbrellaLoan` (alliances are internally
"umbrellas"), `frmControlTournyRobin` (round-robin tournaments), `frmControlInvestmentsCaster`
(buying a broadcaster), `frmControlLockerRoomRib`, `frmControlPactNegotiate`,
`frmPendingTakeover`, `frmOptionsSQL`. See `tew9-recovered-screen-map.md`.

**Not attempted:** full Ghidra decompilation. At 117 MB of Object Pascal with 15.4k functions
it is hours-scale and the behavioural prize is already largely in the handbook. `frmTrialMessage`
(the licence gate) was deliberately not inspected.

---

## Method


| Source | How obtained | Confidence |
|---|---|---|
| TEW IX external editor reference | `Documentation\External Editor Reference List.docx`, read with python-docx (396 lines, 45 KB of text) | `[doc]` — authoritative, shipped by the vendor |
| TEW9.exe strings | Chunked raw read (117,465,088 bytes, 8 MB blocks, code page 28591) | `[bin]` — literal byte evidence |
| WrestleCraft behaviour | `grep`/`Select-String` over `src\*.js`, plus direct file reads | `[code]` — direct source |
| Repo metadata | GitHub REST API + `git` | verified |

## String counts observed in TEW9.exe

`Relationship` 28 · `Morale` 106 · `Chemistry` 38 · `Wrestling` 46 · `Company` 143 ·
`World Editor` 0 · `Delphi` 0 · `TForm` 0.

The zero for `World Editor` is informative: the in-game editor is almost certainly
called something else internally (the reference doc's title is "External Editor"), so
absence of that phrase is **not** evidence the editor is missing.

## Relationship strings recovered verbatim from the binary

`modRelationships` · `frmOptionsRelationship` · `editRelationship` ·
`editRelationshipMass` · `Worker Relationships` · `Edit Relationship` ·
`Current Relationship Status` · `Family Relationship` · `Personal Relationship` ·
`Romantic Relationship` · `Notable Relationships`.

These confirm three axes plus a mass editor and a notable-pairs view. They do **not**
reveal behaviour, only structure.

## Attempts that failed (and why they matter)

1. **Opening `TEW9.mdb`** — 64-bit ACE provider absent; 32-bit Jet/ODBC driver present
   but the DB rejects the connection: *"Not a valid password."* The database is
   encrypted. No table names or rows were read. Any future claim about columns
   (`Worker_Relationships` row layout, indexes) needs the password or a Ghidra pass
   over the data-access layer.
2. **REA `execute_rizin_command`** — failed with `ERR_REA_WINDOWS_NATIVE`. REA's Rizin
   profile is Linux/macOS only on this build; Windows native analysis must go through
   Ghidra.
3. **`Get-Content`/`Invoke-RestMethod` DNS outage** — transient, resolved; earlier
   `ENOTFOUND github.com` was the machine's resolver, not a code fault.
4. **`Encoding.Latin1`** — unavailable on .NET Framework PowerShell; use
   `[Text.Encoding]::GetEncoding(28591)`.

## What has NOT been done

- **No Ghidra deep analysis of `TEW9.exe`.** A 117 MB Delphi PE import is a
  multi-minute-to-hour operation with large memory cost. Deliberately deferred; it is
  the correct next probe if behaviour (not structure) is required.
- **No decompilation, no patching, no memory inspection** of TEW IX. Nothing was run
  or modified.
- **No game data extracted.** No wrestler names, stats, or database rows were read or
  copied; the workbook describes schemas and enumerated *field domains*, not content.
- **No in-game observation.** The game was not launched; no UI was captured.

## Legal / licence position

TEW IX 1.2.60 is installed from `TEW9_Trial_Installer_126.msi` — a trial build. The
shipped README of the analysis target, TEW's EULA, and REA's own disclaimer all bear on
this: REA is for analysing software you own or are authorised to examine. The workbook
therefore transfers **mechanics and data shapes only**, which are not copyrightable,
and reproduces no text, art, database content, or code from TEW IX. Do not ship
decompiled output, the `.mdb`, or transcribed value tables beyond the functional field
domains needed to define a compatible schema.

## Next probes, in priority order

1. **Ghidra on `TEW9.exe`** (REA `open_binary`, then `search_strings` for
   `Provider=Microsoft.Jet`, `Jet OLEDB:Database Password`, `modRelationships`).
   Goal: recover the Jet password and the relationship/morale update routines.
2. **Locate the data-access layer.** Delphi apps typically embed the connection string;
   the password would unlock the real schema (column order, extra tables).
3. **Behavioural check without the source:** run the trial, create a test universe,
   toggle one relationship, and diff the save — *only* if the licence permits it and
   only on a copy. Record what changed as `[observed]`.
4. **Confirm WrestleCraft internals** that were only keyword-counted: `stables` and
   `venues` existing as systems but absent from `ED_TABLES` should be verified by
   reading their editor paths.
