# AEP Virginia Public Projects Review — 2026-05-05

Source pages reviewed:

- https://aeptransmission.com/projects.php
- https://aeptransmission.com/virginia/
- https://aeptransmission.com/virginia/geojson/map-setup.json
- Public Virginia project pages linked from the Virginia project list and map configuration

## Access Notes

The public site is accessible.

The main `projects.php` page is mostly a state selector. The Virginia project page contains a visible project list. The state map uses `geojson/map-setup.json`, which exposes marker/project metadata including map coordinates, project names, URLs, and map status color.

The public HTML list and the map JSON do not perfectly match. The map JSON includes extra/older/sub-project entries not shown in the visible list, such as Amherst-Reusens, Joshua Falls-Gladstone, Shipman-Schuyler, and Independence sub-project pages.

## Virginia Page Visible List

### Projects Pending Approval

- Abert - Reusens Transmission Improvements Project
- Altavista - Leesville Transmission Improvements Project
- Claytor - Floyd Transmission Line Rebuild Project
- Conaway Transmission Improvements Project
- Levisa Substation Project
- Midway - South Christiansburg Transmission Line Rebuild Project
- Saltville - Wolf Hills Transmission Line Rebuild Project
- Sourwood - Hales Branch Transmission Line Rebuild Project

### Approved Projects

- Central Virginia Transmission Reliability Project
- Fieldale - Ridgeway Transmission Line Rebuild Project
- Glade - Whitetop Battery Energy Storage Project
- Independence Area Project
- Reusens - Roanoke Transmission Line Rebuild Project
- Stuart Area Improvements Project

### Additional Projects

- Danville Area Transmission Line Rebuild Project
- Fort Robinson - Hill Transmission Line Rebuild Project
- Fries - Independence Transmission Line Rebuild Project
- Hillman Highway - Saltville Transmission Line Rebuild Project
- Mount Heron - Coal Creek Transmission Line Rebuild Project
- Pure Salmon Transmission Improvements Project
- Washington County Improvements Project: South Abingdon-Arrowhead
- Wildwood Commerce Transmission Project

## Map JSON Project Entries

The map JSON includes 26 project/link entries:

- Abert - Reusens Transmission Improvements Project — pending/yellow — lat 37.48970025837541, lng -79.20652545815679
- Altavista - Leesville Transmission Improvements Project — pending/yellow — lat 37.117022, lng -79.332791
- Amherst - Reusens — approved/green — lat 37.522361375098, lng -78.949951180257
- Claytor - Floyd Transmission Line Rebuild Project — pending/yellow — lat 37.020148089593285, lng -80.46247511018622
- Conaway Transmission Improvements Project — pending/yellow — lat 37.33326418544689, lng -82.15051535973087
- Danville Area Transmission Line Rebuild Project — approved/green — lat 36.609685324313, lng -79.370959282969
- Fieldale - Ridgeway Transmission Line Rebuild Project — approved/green — lat 36.62583325965, lng -79.867858886719
- Fort Robinson - Hill Transmission Line Rebuild Project — approved/green — lat 36.648093122123, lng -82.582305916585
- Fries - Independence Transmission Line Rebuild Project — approved/green — lat 36.667498, lng -81.075174
- Hillman Highway - Saltville Transmission Line Rebuild Project — approved/green — lat 36.808295140498, lng -81.805847142823
- Joshua Falls - Gladstone — approved/green — lat 37.522361375098, lng -78.949951180257
- Levisa Substation Project — pending/yellow — lat 37.238765, lng -82.074286
- Midway - South Christiansburg Transmission Line Rebuild Project — pending/yellow — lat 37.143389, lng -80.406084
- Mount Heron - Coal Creek Transmission Line Rebuild Project — approved/green — lat 37.148659856032, lng -81.943382229656
- Projects Overview — secondary-gray — CVTRP link — lat 37.522361375098, lng -78.949951180257
- Projects Overview — secondary-gray — Independence link — lat 36.631100931187, lng -81.161063435575
- Pure Salmon Transmission Improvements Project — approved/green — lat 37.001523, lng -81.77582
- Reusens - Roanoke Transmission Line Rebuild Project — approved/green — lat 37.342415, lng -79.555089
- Saltville - Wolf Hills Transmission Line Rebuild Project — pending/yellow — lat 36.765862, lng -81.942583
- Shipman - Schuyler / Soapstone - James River — approved/green — lat 37.522361375098, lng -78.949951180257
- Sourwood - Hales Branch Transmission Line Rebuild Project — pending/yellow — lat 37.322922, lng -81.901813
- Stuart Area Improvements Project — approved/green — lat 36.628974289093, lng -80.380096435547
- Substation Upgrades — approved/green — Independence sub-project — lat 36.631100931187, lng -81.161063435575
- Transmission Upgrades — approved/green — Independence sub-project — lat 36.631100931187, lng -81.161063435575
- Washington County Improvements Project: South Abingdon-Arrowhead — approved/green — lat 36.688491568494, lng -81.928413386922
- Wildwood Commerce Transmission Project — approved/green — lat 36.803732005938, lng -80.786521912669

## Public Project Page Pattern

The project pages commonly contain:

- Project title
- Project updates / releases
- Public overview text
- Project maps, often overview and detailed map PDFs
- SCC approval process references for qualifying Virginia projects
- SCC application PDFs for some projects
- Fact sheets or FAQs for some projects
- Outreach contact/team information

## ROWFlow Modeling Takeaways

The public website reinforces several ROWFlow requirements:

1. Master project and public-facing project names are not enough. Some projects are naturally bundles of sub-projects/components.
2. Project status has multiple public-facing stages: pending approval, approved, and additional/older projects. Internally, ROWFlow needs richer lifecycle statuses.
3. Maps are central from the beginning. Even the public site uses map markers and detailed route maps as primary communication artifacts.
4. Public-facing project pages rely heavily on documents: news releases, overview maps, detailed maps, SCC applications, fact sheets, FAQs.
5. SCC approval is a major lifecycle gate for Virginia transmission projects.
6. Independence-style projects show why component/sub-project modeling matters: a single area project can include separate substation and transmission upgrades.
7. ROWFlow should support public/document artifacts as project-level or component-level deliverables, not just parcel documents.

## Raw Scrape Artifact

A raw scrape summary was saved at:

- `rowflow/docs/aep_virginia_projects_scrape.json`
