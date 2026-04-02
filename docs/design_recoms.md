# SensOrg — Design Recommendations
Date: 2026-03-30
Screenshots analysed:
- Screenshot 2026-03-30 112746.png (Login — mobile)
- Screenshot 2026-03-30 112831.png (Login — desktop)
- Screenshot 2026-03-30 112911.png (Home — Deliveries open, mobile)
- Screenshot 2026-03-30 112932.png (Home — Repair Requests open, mobile)
- Screenshot 2026-03-30 112948.png (Home — Notes open, mobile)
- Screenshot 2026-03-30 113003.png (Home — Checklist open, mobile)
- Screenshot 2026-03-30 113012.png (Home — Nice to know open, mobile)
- Screenshot 2026-03-30 113025.png (Home — Jokes open, mobile)
- Screenshot 2026-03-30 113056.png (Home — all sections collapsed, desktop)
- Screenshot 2026-03-30 113259.png (Excursions page, desktop)
- Screenshot 2026-03-30 113315.png (Profile page, desktop)
- Screenshot 2026-03-30 113430.png (Admin — Archive tab, desktop)
- Screenshot 2026-03-30 113439.png (Bikes page, desktop — partially obscured)
- Screenshot 2026-03-30 113509.png (Excursions page, mobile)

---

## Summary

SensOrg has a clear visual identity built around strong accordion-section colours (orange, red, tan, green, teal, near-black) that make navigation fast and distinctive. The most impactful improvement opportunities are around typography consistency (section header contrast on coloured backgrounds, body text sizing), touch-target reliability in the card rows (action buttons and icon buttons are frequently undersized), and a lack of visual feedback cues that would help users distinguish interactive from non-interactive elements at a glance. Several secondary screens (Profile, Admin Archive, Excursions) feel unfinished compared to the polished Home screen.

---

## Recommendations

### [High] ✅ Done — Section header text contrast on coloured accordion bars

**Screen(s):** 112911, 112932, 112948, 113003, 113012, 113025, 113056
**Observation:** All accordion section headers use white bold text on vivid background colours: orange (Deliveries), dark red (Repair Requests), tan/sand (Notes), green (Checklist), teal (Nice to know), near-black (Jokes). The tan/sand Notes header and the green Checklist header both show noticeably low contrast. The "Notes" label on the sand/tan bar is particularly borderline — the background is roughly #C8A97E and the text is white, which is well below the WCAG AA 4.5:1 threshold for normal-weight text.
**Problem:** Users with low vision or in outdoor/sunlight conditions (bike shop use-case) may be unable to read section labels reliably, which breaks the quick-scan information architecture the colour coding is designed to enable.
**Recommendation:** For the Notes section header, darken the background to at least #9C7A50 or switch to near-black (#1A1A1A) text on the current sand colour. For the Checklist green header, darken the green from its current mid-green to approximately #2D6A2D. Run all six accent colours through a contrast checker targeting 4.5:1 minimum against white text. The DeliveriesSection and all section header components should define a `headerTextColor` or enforce contrast at the Tailwind theme level.

---

### [High] ✅ Done — Touch targets too small on card action icons

**Screen(s):** 112911, 112932, 112948, 113003, 113012
**Observation:** Inside RequestCard, NoteCard, and task card rows, the delete (trash) icon and edit (pencil) icon are rendered at approximately 16–18 px with no visible padding zone around them. The "Open" status badge next to the trash icon in the Deliveries card is similarly compact. In the Checklist section the pencil and trash icons are spaced further apart but still appear to be 16 px tap targets.
**Problem:** Apple HIG and Material Design both specify a minimum 44×44 pt interactive area. Targets below this threshold cause frequent mis-taps, especially in an operational environment where staff are often gloved or using the phone one-handed.
**Recommendation:** Wrap every icon action button in a `<button>` with `min-w-[44px] min-h-[44px] flex items-center justify-center` so the visible icon remains small but the hit area meets the minimum. Apply this universally to the trash, edit, expand/collapse chevron, and status badge buttons across RequestCard, NoteCard, task card rows, and the KbSection article rows.

---

### [High] ✅ Done — RequestCard action button area is cramped and role-ambiguous

**Screen(s):** 112911, 112932
**Observation:** In the open Deliveries card, "Take job" and "Edit" sit as small pill-buttons at the bottom left, while "Open" (a status badge, not a standard button) and a trash icon sit at the bottom right. In the Repair Requests card, "Mechanic" (a label?) and "Done" (an action) are placed side by side at the bottom right with no visual distinction between a status indicator and an action trigger.
**Problem:** The mixed treatment of status labels and action buttons at the bottom of RequestCard creates cognitive overhead. Users must read and parse each element to understand what is tappable vs. informational. "Mechanic" looks like a role tag, but "Done" looks like an action button — yet they share the same row and similar visual weight.
**Recommendation:** Establish a clear visual grammar: status/role indicators (Mechanic, Open) should use a filled chip or badge style, while action buttons (Take job, Edit, Done) should use a clearly outlined or filled button style with a minimum height of 36 px and 12 px horizontal padding. Separate them into distinct zones — metadata/status on the left, primary actions on the right — or stack them. Consider elevating the primary CTA ("Take job", "Done") to a single prominent full-width button at the card bottom, with secondary actions (Edit, Delete) in a trailing icon group.

---

### [High] ✅ Done — Login shop selector: selected state is visually inconsistent

**Screen(s):** 112746, 112831
**Observation:** The three shop selector buttons (Arcos, THB, Plaza) each use a different border colour: Arcos has a yellow/gold border, THB has a pink/magenta border, Plaza has a grey/muted border. None of them shows a filled/selected state — it is entirely unclear which shop is currently selected after the user taps one.
**Problem:** Without a clear selected state, the user cannot confirm their choice at a glance before submitting credentials. In a multi-shop workflow this is a critical affordance gap — a misselected shop will silently scope all the user's data incorrectly.
**Recommendation:** Add an explicit selected state: fill the selected chip with its accent colour and use white or dark text with sufficient contrast, plus a visible checkmark or bold weight increase. Unselected chips should appear clearly inactive (grey border, muted label). The per-shop colour coding is a nice personality touch; preserve it on the selected chip's background rather than just the border. Also ensure the grey border on "Plaza" is distinguishable from a disabled state.

---

### [Medium] ✅ Done — Accordion chevron (expand/collapse) icon alignment and size

**Screen(s):** 112911, 112932, 112948, 113003, 113012, 113025, 113056
**Observation:** The chevron icon on the right side of each accordion header appears at roughly 16 px. On the desktop view (113056) the chevrons are proportionally large enough, but on the mobile view the entire right 30–40 px of the header row is the only tappable expand/collapse zone. The plus (+) icon for adding items shares the same horizontal strip but the two targets are adjacent and very close together.
**Problem:** On mobile, tapping the "+" (add) versus the "v" (collapse) requires precise targeting. These two targets are typically within 8 px of each other, creating a significant mis-tap risk.
**Recommendation:** Increase the chevron tap zone to at least 48 px wide and make the entire header bar (minus the + button area) tappable for expand/collapse. Give the + button its own 44×44 px zone that is clearly separated from the header's expand zone — consider moving + to a position inside the expanded section header rather than at the far right of the collapse strip.

---

### [Medium] ✅ Done — Typography scale is too uniform inside cards

**Screen(s):** 112911, 112932, 112948, 113003
**Observation:** Inside RequestCard and NoteCard, the bike label/ID (e.g. "SG31-55-21", "SG3U-48-04") uses a small mono or near-mono chip style, the request type ("Rental") appears as a tiny label, the date ("31.03.2026") is right-aligned in the same weight as body text, and the notes paragraph is in italic at the same font size as the primary label. All text within a card occupies roughly the same visual weight band (approximately 13–14 px, normal or italic).
**Problem:** Without a clear typographic hierarchy inside the card, the user's eye has no natural entry point. The bike ID — arguably the most operationally critical piece of information — is not visually dominant. The date is secondary but competes with the bike ID for attention.
**Recommendation:** Establish a 3-level card hierarchy: (1) bike ID / article title in `font-semibold text-base` (16 px) as the primary identifier; (2) status, type, and date in `text-sm text-gray-500`; (3) note body in `text-sm text-gray-600 italic`. This creates an F-pattern scan path. Apply the same hierarchy to task cards in the Checklist section (task title bold and larger, recurrence/shop tags smaller and muted).

---

### [Medium] ✅ Done — Notes card: completion circle (checkbox) affordance is unclear

**Screen(s):** 112948
**Observation:** The NoteCard has an unfilled circle in the bottom-right area that appears to be a "mark as done" action. It is small (approximately 20 px diameter), has no label, and sits next to a trash icon with no visual separation.
**Problem:** An empty circle without a label is easily confused with a decorative element rather than an interactive control. Users are unlikely to discover it intuitively, particularly staff new to the app.
**Recommendation:** Replace the bare circle with a Lucide `<Circle>` / `<CheckCircle2>` icon pair that transitions visually on hover/tap, or label it with a small "Done" text beneath. Ensure the tap target is at least 44×44 px. For consistency, the same "complete" affordance pattern used here should mirror the checkbox style used in the Checklist section (which correctly uses a radio/checkbox circle at the left of the task row).

---

### [Medium] ✅ Done — Jokes section visual identity is underdeveloped at thumbnail scale

**Screen(s):** 113025
**Observation:** The Jokes section (near-black header) expands to show a list of items labelled "Image joke" with a small thumbnail. The thumbnail images are very small (approximately 40×40 px), the "Image" tag chip and "admin · 30 Mar 2026" metadata are the same visual size as the item title, and there is no visual hierarchy distinguishing title from metadata.
**Problem:** The Jokes section is meant to be a light, high-delight feature. Its current list treatment makes it look identical to the Notes/KB list, reducing its perceived personality. The tiny thumbnails provide minimal visual value.
**Recommendation:** Render Jokes cards with a larger image preview (full-width or at least 100–120 px tall) similar to how the Excursions page (113509) renders the UFO entry — this creates immediate visual delight. Give the joke title a larger, playful weight. If content is text-only, use a coloured emoji or icon prefix to distinguish joke types at a glance.

---

### [Medium] ✅ Done — Profile page: "Who's working today" section lacks visual breathing room on desktop

**Screen(s):** 113315
**Observation:** On desktop, the "Who's working today" table takes up approximately 30% of the viewport height, followed by two large white cards (Push notifications, Admin panel) that are only lightly populated. The header "Profile" and subtitle "admin · admin" use default body text weight with no decorative element. The role badge chips (admin, cleaner, organiser, general) use a yellow/amber fill that is consistent with the header bar colour — good — but the text inside the chips appears to be very small (approximately 10–11 px).
**Problem:** Role badge text at ~10 px is below accessible minimum size for body content (14 px recommended). The overall page composition on desktop has large tracts of empty white space beneath the active content without visual structure.
**Recommendation:** Increase role badge font size to at least 12 px (preferably 13 px) and add 4 px horizontal padding inside badges. Give the Profile page a page-level title treatment (larger font-size, perhaps matching the Admin page "Admin" heading style). Consider collapsing the two lower cards (Push notifications, Admin panel) into a single "Settings" section with a consistent sectioned list style.

---

### [Medium] ✅ Done — Admin Archive tab: "done" status badge colour clashes with urgency convention

**Screen(s):** 113430
**Observation:** All four archived deliveries show a green "done" pill badge at the far right of each row. The green is bright/saturated and the same shade of green used for the Checklist accordion header, which is an active/in-progress colour elsewhere in the UI.
**Problem:** In the rest of the app, colour encodes urgency and status (red = overdue, green = 3–5 days, via getColorByDue). Using bright green for "done" (a terminal/inactive state) is counterintuitive — done items conventionally use grey or a muted success green. The bright green signal draws the eye to completed items rather than active ones.
**Recommendation:** Style the "done" badge with a muted grey-green (e.g. `bg-gray-200 text-gray-600`) or a desaturated `bg-green-100 text-green-800` to visually retire them. Reserve saturated green for active/on-track states consistent with the getColorByDue logic. Similarly review any "cancelled" badge to ensure it uses grey.

---

### [Medium] ✅ Done — Excursions page: entry cards lack visual hierarchy and are too text-dense on mobile

**Screen(s):** 113259, 113509
**Observation:** On desktop (113259), Excursions entries appear as lightly styled rows with a coloured left accent dot, a title in normal weight, and a subtitle in the same size. The image in the UFO entry is a medium thumbnail at approximately 100×80 px. On mobile (113509), the same layout is used but the content area is narrower, making the metadata line ("by admin · 30 Mar 2026") crowd against the tag chip.
**Problem:** The category dot (orange for Lanzabuggy, grey-blue for UFO) is the primary visual differentiator, but it is very small (~8 px circle). The "+ Add entry" button on desktop is a blue pill button that is stylistically inconsistent with the orange/amber brand colour used everywhere else on Home, Admin, and the BottomNav active state.
**Recommendation:** Scale the category indicator to a left-border strip (4 px wide, full card height) rather than a dot — this is more scannable at speed and follows a common mobile list pattern. Increase the entry title to `font-semibold text-base`. Change the "+ Add entry" button fill to the brand orange (`bg-orange-500`) to maintain colour consistency. On mobile, wrap the metadata onto a second line below the tag chip rather than cramming it inline.

---

### [Medium] ✅ Done — BottomNav: desktop layout wastes the bar's potential

**Screen(s):** 113056, 113259, 113315, 113430
**Observation:** On desktop, the BottomNav renders as a bottom bar with four icons and labels (Home, Bikes, Excursions, Profile). This is a mobile navigation pattern and looks visually sparse and unusual on a wide desktop viewport where a sidebar or top navigation would be conventional.
**Problem:** On desktop, a bottom bar forces content into a narrower central column and occupies valuable vertical space at the bottom of each page, displacing content upwards on shorter screens. The bar's items are very widely spaced at desktop widths, reducing the sense of cohesion.
**Recommendation:** On viewports wider than `md` (768 px), switch BottomNav to a top horizontal navigation bar or a left sidebar. At minimum, constrain the bottom nav to a max-width matching the content column (e.g. `max-w-lg mx-auto`) so it does not stretch the full desktop width. The active icon colour (orange) is correctly applied — preserve this in any responsive variant.

---

### [Low] ✅ Done — Shop location pill in TopBar: inconsistent with header colour on dark backgrounds

**Screen(s):** 112911, 112932, 113056, 113259, 113315
**Observation:** The "Arcos" shop location pill at the top left uses an amber/orange background with dark text on the dark near-black TopBar. This looks good on the dark header. However, the same pill style is applied uniformly regardless of app context.
**Problem:** Minor: the pill is slightly visually disconnected from the rest of the header because it uses the same amber as action elements like the "Sign in" button and active nav icon, potentially reducing its distinctiveness as a location indicator.
**Recommendation:** Keep the current treatment but add a small location-pin icon (Lucide `MapPin`) inside the pill to the left of the shop name, making its semantic purpose immediately apparent. This adds personality and clarity with a single icon.

---

### [Low] ✅ Done — Login screen: no password visibility toggle

**Screen(s):** 112746, 112831
**Observation:** The password field shows only masked dots with no option to reveal the password.
**Problem:** In a workplace setting with shared devices (bike shop floor tablets), users frequently mistype passwords on mobile keyboards and have no way to verify input before submitting, leading to failed logins and frustration.
**Recommendation:** Add a Lucide `Eye` / `EyeOff` toggle icon inside the password input's trailing slot. This is a standard affordance (one-line change) that significantly reduces login friction on mobile.

---

### [Low] ✅ Done — Date format inconsistency across screens

**Screen(s):** 112911 ("31.03.2026"), 112932 ("29 Mar 2026"), 113430 ("28 Mar 2026, 11:41")
**Observation:** Dates are formatted three different ways: DD.MM.YYYY (dot-separated), DD Mon YYYY (abbreviated month name), and DD Mon YYYY, HH:MM.
**Problem:** Inconsistency in date formatting creates unnecessary cognitive friction and erodes the sense of a polished, intentional product. In an operational tool where dates communicate urgency (due dates vs. event dates), a consistent format is important for quick scanning.
**Recommendation:** Standardise on a single locale-appropriate format across all surfaces. Given the European context (shop names suggest Spanish/Canarian), `DD MMM YYYY` (e.g. "29 Mar 2026") is readable and concise. Apply this via a shared `formatDate(date)` utility function in `frontend/src/utils/` and replace all inline `toLocaleDateString` or manual formatting calls with it.

---

### [Low] ✅ Done — Bikes page: search bar placeholder and layout feel unfinished

**Screen(s):** 113439
**Observation:** The Bikes page (partially visible) shows a full-width search bar with no placeholder text visible, and bike entries listed in a flat list with a small "1 active" green status badge. The page title appears to be absent or very small. The snipping tool tooltip visible in the screenshot partially obscures the content.
**Problem:** Without a visible placeholder (e.g. "Search bikes by label…") the search bar purpose is not self-evident. The "1 active" badge colour (green) on a white/light background needs a contrast check — a bright green chip on white may fall below 3:1 for the badge text.
**Recommendation:** Add a descriptive placeholder to the bike search input. Add a page title "Bikes" above or within the search bar header zone, consistent with how the Excursions and Admin pages show a page title. Verify the green badge text meets WCAG AA contrast.

---

### [Low] ✅ Done — Checklist section: completed task visual state is absent in screenshots

**Screen(s):** 113003
**Observation:** Both checklist tasks ("Change bike in system to repair" and "Cleaning") are shown unchecked — there is no visible example of a completed task state. The checkbox circle uses only a thin unfilled stroke.
**Problem:** Without a visible completed/checked state, it is not possible to evaluate whether checked tasks are visually retired (greyed out, strikethrough) or still shown at full prominence. This matters for daily checklist usability.
**Recommendation:** Ensure completed tasks show a clear completion state: filled green checkbox, strikethrough on the task title, and reduced opacity (`opacity-50`) on the row. Move completed tasks below unchecked ones or collapse them under a "Completed" disclosure. This prevents a full checklist from looking undone when all items are actually finished.

---

## Admin Archive Panel — Follow-up Recommendations (2026-04-02)

Screenshots analysed:
- admin archive1.png (Archive tab — Deliveries section expanded, desktop)
- admin archive 2.png (Archive tab — single delivery expanded with Repair Requests / Notes / Tasks sub-sections, desktop)

---

### [High] ✅ Done — DeliveryRow: route label is the only identifier — bikes and reason are buried

**Screen(s):** admin archive1.png
**Observation:** Each `DeliveryRow` renders the shop route ("Plaza → Arcos", "Arcos → Plaza", "THB → Arcos") as the primary title. Below it, reason and bike labels are concatenated with a `·` separator on a single `text-xs text-gray-400` line (e.g. `Rental · S231-55-21`), and the author/date line follows in the same muted style. All three lines after the title use an identical visual weight.
**Problem:** The bike label is often the most operationally useful piece of information in a delivery archive row — a mechanic scanning for a specific bike's history needs to see it prominently. At `text-xs text-gray-400` on a white background, the contrast ratio of gray-400 (#9CA3AF) against white is approximately 2.8:1, which fails WCAG AA for text at this size (requires 4.5:1). Meaning the bike labels are both visually de-prioritised and insufficiently legible.
**Recommendation:** In `DeliveryRow`, give the bike labels a distinct treatment: render them as small inline chips using `bg-gray-100 text-gray-700 rounded px-1.5 py-0.5 text-xs font-medium` (gray-700 on gray-100 passes WCAG AA). Move the reason onto its own line above the bike chips using `text-xs text-gray-500`. Change the author/date line to `text-gray-400` (acceptable at xs since it is purely supplementary). This creates a 3-level hierarchy: route title → reason → bike chips → metadata.

---

### [High] ✅ Done — Tasks sub-section: description text overflows the visual container on dense entries

**Screen(s):** admin archive 2.png
**Observation:** The expanded Tasks section inside the delivery record shows four `TaskRow` entries, each with a multi-sentence description (e.g. "Repair delivery from Plaza has arrived at Arcos. Change the above bike(s) to 'repair' status in the reservation system. by Concierge — completed 01 Apr 2026, 13:51"). The description text runs to three lines without truncation, making rows approximately 80–90 px tall. The four rows together push the visible content below the fold on a standard 1080 p desktop viewport.
**Problem:** In an archive view the description is supplementary — the title is the primary anchor. Showing full description text for every row increases scrolling distance and makes it harder to scan across multiple completed tasks at a glance. The `line-clamp-2` class exists on `NoteRow` and the code for `TaskRow` shows `line-clamp-2` on `t.description` — but the screenshot shows three or more visible lines, suggesting either the clamp is not being applied or the text includes line-breaks that bypass it.
**Recommendation:** Verify that `line-clamp-2` is correctly applied to the `<p>` in `TaskRow` and that Tailwind's `@tailwindcss/line-clamp` plugin (or the built-in v3.3+ utility) is active. If the text contains `\n` newline characters, add `whitespace-pre-line` only when the row is deliberately expanded; default to `whitespace-normal line-clamp-2`. Additionally, consider making the description expandable on tap (toggle `line-clamp-2` via local state) rather than always visible, consistent with the `line-clamp-2` pattern already used in `NoteRow`.

---

### [Medium] ✅ Done — Section accordion header colour tints are imperceptibly faint

**Screen(s):** admin archive1.png, admin archive 2.png
**Observation:** The `Section` component applies `color + '18'` (i.e. 9.4% opacity of the accent colour) as the header background. In practice, Deliveries (#E8772A18), Repair Requests (#B71C1C18), Notes (#D4A57418), and Tasks (#5BA85C18) all render as very pale, nearly indistinguishable tints. In the screenshots the Deliveries, Repair Requests, and Notes headers are visually identical shades of near-white; only a careful side-by-side comparison reveals any colour at all.
**Problem:** The colour tints were presumably added to provide the same section-identity cues as the vivid accordion bars on the Home screen. At 9.4% opacity the cue is too subtle to function — users receive no visual benefit while the code carries the complexity. The faint background also means the `text-gray-800` section title has insufficient visual anchoring against the surrounding white content area, making headers feel unanchored.
**Recommendation:** Increase the opacity suffix from `'18'` (hex 24/255 ≈ 9%) to `'28'` (hex 40/255 ≈ 16%) for a still-light but visible tint, or replace the inline `style` approach with Tailwind semantic classes: `bg-orange-50` for Deliveries, `bg-red-50` for Repair Requests, `bg-amber-50` for Notes, `bg-green-50` for Tasks. These Tailwind tints are pre-calibrated for legibility and consistency.

---

### [Medium] ✅ Done — "Done" and "cancelled" status badges in DeliveryRow are visually identical

**Screen(s):** admin archive1.png
**Observation:** Every visible row in the Deliveries section shows a "done" badge (per the `DeliveryRow` code: `bg-gray-200 text-gray-500` for done, `bg-gray-100 text-gray-400` for anything else). In the screenshot all six badges read "done" and all use the same muted grey chip. There is no visual distinction between "done" and "cancelled" at a glance.
**Problem:** An admin reviewing the archive may need to quickly identify cancelled deliveries (which represent a failed or interrupted workflow) versus completed ones. With identical grey chip styling, they must read the text label in each row rather than scanning by colour. At scale — when the list grows to 50+ rows — this becomes a meaningful scanning inefficiency.
**Recommendation:** Differentiate terminal states with distinct but still muted badge styles: "done" → `bg-green-100 text-green-800` (desaturated, as already recommended in the earlier audit); "cancelled" → `bg-red-100 text-red-700`. Both pass WCAG AA on white backgrounds at `text-xs`. This mirrors common status-chip conventions (green = success, red = cancelled/failed) without reintroducing the over-saturated green flagged in the earlier audit.

---

### [Medium] ✅ Done — Archive panel has no search or filter controls for large data sets

**Screen(s):** admin archive1.png, admin archive 2.png
**Observation:** The panel renders all archived records in four always-expanded (by default, `useState(true)`) sections with no date range filter, status filter, shop filter, or search input. The intro text ("History of completed deliveries, repair requests, archived notes, and completed one-time tasks — newest first") confirms the data is scoped only by recency.
**Problem:** As the archive grows over weeks and months, the panel will accumulate hundreds of rows across the four sections. Without any filter mechanism, finding a specific delivery or task requires scrolling through the full list. The section count badges (e.g. "6" next to Deliveries) give a total but no way to narrow it.
**Recommendation:** Add a single free-text search input above the section list that filters row titles/bike labels/shop names client-side (no API call needed for moderate data sizes). Additionally, add a shop-scoped filter dropdown (using the existing shop list from the admin context) so a manager can restrict the archive to one location. Both controls can live in a compact `flex gap-2` row between the intro paragraph and the first section. The `useArchive` hook can accept optional filter params to push filtering to the API if the data set grows large.

---

### [Medium] ✅ N/A — Sub-section count badges in expanded delivery view use inconsistent visual style

**Screen(s):** admin archive 2.png
**Observation:** In the expanded delivery detail view, the sub-section headers ("Repair Requests 4", "Notes 0", "Tasks 4") show count badges inline with the title text. The badges appear as plain unstyled numbers adjacent to the label with no chip styling — just a number following the title text separated by a space.
**Problem:** Across the rest of `ArchivePanel` (and the `Section` component), count badges use `rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500` — a styled pill. The sub-section count badges in the detail view do not match this style, creating inconsistency within the same panel. A "Notes 0" count badge for an empty section has the same visual weight as "Repair Requests 4", giving no at-a-glance indication of which sub-sections have content.
**Recommendation:** Apply the same `rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500` pill treatment to sub-section count badges for consistency with the top-level `Section` component. For zero-count badges, additionally apply `opacity-40` to visually signal empty sections without hiding the count entirely.

---

### [Low] ✅ Done — Section default-open state causes the full archive to render on every panel mount

**Screen(s):** admin archive1.png
**Observation:** The `Section` component initialises with `useState(true)`, meaning all four sections are expanded and all rows are rendered immediately when the Archive tab is opened. With six delivery rows visible in screenshot 1 and four task rows visible in screenshot 2, the full list for a busy shop could easily be 30–50 rows rendered on mount.
**Problem:** Rendering all rows immediately is not a blocking usability issue at current data sizes, but it creates a flash of a very long page on tab switch. More importantly, it means users see all four sections simultaneously and must scroll past all of them to reach Tasks at the bottom — a section that may be their primary target. The first-opened section (Deliveries) always dominates the initial viewport.
**Recommendation:** Change the default state to collapsed (`useState(false)`) for all sections except the first, or adopt an accordion-exclusive pattern where only one section is open at a time. Alternatively, keep all-open but add `max-h-64 overflow-y-auto` to each expanded section body so individual sections scroll independently, keeping all four headers simultaneously visible without requiring page-level scrolling.

---

### [Low] ✅ Done — Intro description paragraph is redundant for admin users

**Screen(s):** admin archive1.png
**Observation:** The panel opens with: "History of completed deliveries, repair requests, archived notes, and completed one-time tasks — newest first." This text repeats information that is already self-evident from the four labelled, counted section headers directly below it.
**Problem:** Descriptive prose above a clearly-labelled interface adds visual noise and pushes the actual content down the page. Admin users are experienced and do not need the panel's purpose re-explained on every visit.
**Recommendation:** Remove the intro paragraph entirely, or replace it with a single compact metadata line showing the total archived item count and the date range covered (e.g. "47 items · 12 Jan – 02 Apr 2026"), which would be genuinely useful context rather than a restatement of the section titles.
