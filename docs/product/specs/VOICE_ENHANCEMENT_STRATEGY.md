# Advanced Voice Picking Strategy

> **Goal:** Eliminate picking errors (wrong product, wrong pallet) and enable seamless collaboration between pickers working on the same order/branch.

## 1. Dual Mode Operation
To support both "Super Users" (Voice Only) and "New Hires" (Screen + Voice), the system will support two modes per user profile, plus a Conversational Intelligence Layer.

### "Eyes-Free" Mode (Expert)
- **Primary Input:** Voice Command (`"Pick 5"`, `"Ready"`, `"Short"`)
- **Primary Output:** Text-to-Speech (TTS) instructions (`"Go to Aisle 4, Slot 12. Pick 5 Units."`)
- **Screen:** Minimal/Off to save battery.
- **Workflow:** Optimized for speed.

### "Visual Assist" Mode (Training/Rookie)
- **Primary Input:** Voice OR Screen Tap.
- **Primary Output:** TTS + Visual Card on Zebra Scanner.
- **Screen:** Shows product image, large location text (`Aisle 4`), and a progress bar.
- **Workflow:** Optimized for accuracy. Confirms every step visually.

### Conversational Intelligence (The "Copilot" Layer)
Unlike legacy systems that only understand commands, Logivox uses LLM-powered intent recognition to handle natural queries.
- **Status Checks:** *"How am I doing?"* -> *"You are slightly ahead of schedule. 45 picks to go."*
- **Navigation:** *"Where is the break room?"* -> *"Turn right at the end of Aisle 10."*
- **Inventory Queries:** *"Why pick 5?"* -> *"This is for a promotion. We need extra stock."*

---

## 2. Collaborative Pallet Building (LPNs & Box Numbers)
**The Core Identifier:** Every movable unit (Pallet or Box) must have a unique LPN (License Plate Number).

**Scenario:**
- **Picker A** is building a pallet (LPN: `PAL-101`) for *Branch X*.
- **Picker B** picks an item for *Branch X* but is in a different aisle.

**Current Problem:** Picker B starts a *new* pallet, resulting in two small pallets for one branch.

**Advanced Solution (Smart LPN Assignment):**
1. System tracks **Active LPNs** per Branch/Order.
2. **Voice Instruction:**
   > *"Put to Pallet #101. Currently with User: John in Aisle 3."*

3. **Conversational Query (Finding the Pallet):**
   *   **Picker B:** *"Where is John exactly?"*
   *   **System:** *"He is currently at Slot A-03-12, moving towards Packing Station B."*

**Error Prevention:**
- If Picker B tries to scan a *new* LPN without permission, the system warns:
  > *"Wait. LPN #101 is already open for this Branch. Confirm you want to start a NEW LPN? Say 'Override' to confirm."*

---

## 3. Market Analysis & Strategic Differentiators
*Based on analysis of legacy systems (e.g., Vocollect, Lucas) and current user pain points.*

### 3.1. The "Black Box" Problem (Lack of Feedback)
*   **Market Gap:** Users speak a check digit and wait in silence. If the WiFi drops or the system is thinking, they don't know if they were heard.
*   **Logivox Solution:** **Multimodal Feedback.** Even in "Eyes-Free" mode, the screen acts as a status indicator (Green = Heard, Amber = Processing, Red = Error). In "Visual Assist" mode, the recognized text is displayed instantly.

### 3.2. Rigid Exception Handling ("The Happy Path Trap")
*   **Market Gap:** Legacy state machines force users down a linear path. Handling a damaged barcode or a short pick often requires memorizing complex menu trees.
*   **Logivox Solution:** **Context-Aware Intent Recognition.** Utilizes LLM/NLP to understand natural variances like *"Skip this, barcode is ripped"* or *"Short pick, only 3 here"*, allowing users to handle exceptions without leaving the workflow.

### 3.3. Hardware Fatigue & Lock-in
*   **Market Gap:** Heavy, proprietary terminals ($2k+) and wired headsets that are uncomfortable for 8-hour shifts.
*   **Logivox Solution:** **BYOD / Commodity Hardware.** Runs on standard Android/iOS devices (e.g., Zebra TC5x or smartphones). Supports standard, lightweight Bluetooth headsets (AirPods, Jabra) for better ergonomics.

### 3.4. Accent & Noise Intolerance
*   **Market Gap:** Older phonetic recognizers require 20 minutes of "voice template training" per user and fail with accents or background noise.
*   **Logivox Solution:** **Zero-Shot Recognition.** Powered by modern transformer models (e.g., OpenAI Whisper), requiring **no user training** and capable of understanding diverse accents and filtering out conveyor belt noise.

### 3.5. "Blind" Picking Accuracy
*   **Market Gap:** Users pick based solely on audio description, leading to errors with similar-looking items (e.g., "Red Shirt" vs "Maroon Shirt").
*   **Logivox Solution:** **On-Demand Visuals.** When confidence is low or the SKU is high-risk, the system auto-triggers the screen to show the **Product Image**. *"Check Screen for Color Match."*

---

## 4. Smart Consolidation & Crate Capacity Logic
**The Problem:** Short picks or add-on items often get thrown into random boxes, or pickers lose time searching for the right crate.

**The Solved Workflow (Conversational & Location-Aware):**
**Scenario:** Picker retrieves a "Short Pick" item for the *Manchester* branch.

1.  **System Calculation:**
    *   Finds active crates for *Manchester*.
    *   Checks capacity (Max: 16 items).
    *   Identifies `CRATE-552` (12 items/4 open) located at **Bay 14**.

2.  **Voice Instruction:**
    > *System:* "Pick 1 unit. Take to **Crate #552**. It is waiting at **Bay 14**."

3.  **Conversational Query (User asks for help):**
    *   **User:** "Where is Bay 14?"
    *   **System (Conversational AI):** "Turn left at the end of this aisle. Bay 14 is the staging area for Manchester."

4.  **Validation (The "Block"):**
    *   **User:** *Scans Crate 900.*
    *   **System (Error):** "STOP. Crate 900 is full. Find **Crate #552** at Bay 14."

5.  **Confirmation:**
    *   **User:** *Scans Crate 552.*
    *   **System:** "Confirmed. Crate has 13 items. 3 slots remain."

*This creates a closed-loop system where users cannot mix destinations, and natural conversation prevents frustration when locating consolidation targets.*

---

## 5. Operational Resilience: Intelligent Exception Handling
Traditional voice systems force users to walk to a supervisor desk if a barcode is unreadable or a check digit is scraped off. Logivox empowers the user to solve this in the aisle.

### 5.1. "The Missing Label" Protocol (Check Digit Recovery)
**Problem:** The location label (e.g., "Check Digit 45") is ripped or missing. The user cannot confirm they are at the right slot.
**Old Way:** Walk to supervisor desk -> Look up planogram -> Walk back. (10 mins wasted).
**Logivox Way (Conversational Override):**
1.  **System:** "Go to Aisle 4, Slot 12."
2.  **User:** *Arrives at slot, sees label is ripped.*
3.  **User:** "System, the label is damaged. Give me the check digit."
4.  **System (Security Challenge):** "Okay. To confirm you are at the right slot, read the last 3 digits of the SKU on the product."
5.  **User:** "5-5-9."
6.  **System:** "Correct. The check digit is **45**. Say '45' to confirm."
7.  **User:** "45."
8.  **System:** "Confirmed. Pick 5 units."
*Result: Zero downtime.*

### 5.2. Visual Descriptions & "What does it look like?"
**Problem:** Picking "Item 12345" is abstract. Is it the red box or the blue box?
**Logivox Way:**
1.  **Proactive Description:**
    > *System:* "Pick 5 units of Item 12345. **It is the Red Box with the White Label.**"
2.  **Reactive Query:**
    *   **User:** "What does this look like?"
    *   **System:** "Searching WMS... It is a 2-liter bottle, blue cap, usually in a shrink-wrapped case of 6."

---

## 6. The Voice Command Center ("God Mode" for Supervisors)
To ensure operational efficiency and real-time oversight, we introduce a centralized **Voice Operations Dashboard**. This isn't just a reporting tool; it's an active control plane.

### 5.1. Real-Time "Heat Map" & Monitoring
- **Visual:** A 3D Warehouse Map showing real-time picker locations (dots) and their status.
- **Status Indicators:**
  - 🟢 **Green:** Picking actively (Current Step: "Scan Location").
  - 🟡 **Yellow:** Idle > 2 mins (Current Step: "Waiting").
  - 🔴 **Red:** Error State / Exception (Current Step: "Invalid Scan").
- **Live Transcript:** Supervisors can click on any dot (Picker) to see a live transcription of their voice interaction:
  > *Picker: "Short pick."*
  > *System: "Confirm quantity?"*
  > *Picker: "Three."*

### 5.2. Proactive AI Intervention (The "Virtual Foreman")
Instead of passive charts, the system actively manages workflow anomalies.
- **Dwell Time Nudges:** If a picker is stationary for 5+ minutes in a non-break area:
  > *System (Private Whisper):* "Hey [Name], you've been at Slot A-12 for 5 minutes. Is there an issue with the barcode or stock?"
- **Gamification Prompts:**
  > *System:* "You're 10 picks away from beating your hourly record. Keep it up!"
- **Safety Alerts:**
  > *System:* "Forklift approaching from Aisle 5. Please step aside." (Integration with IoT beacons).

### 5.3. Supervisor "Whisper" Protocol (Two-Way Comms)
Supervisors can inject audio messages directly into a picker's headset without disrupting the workflow.
- **Supervisor-to-Picker:** Supervisor types "Urgent order coming for Truck 5", Picker hears:
  > *System Voice:* "Message from Supervisor: Urgent order coming for Truck 5."
- **Picker-to-Supervisor (Reply):**
  > *Picker:* "Reply: Tell them I need a forklift first."
  > *System:* Transcribes message and sends to Supervisor Dashboard.
- **Live Override:** Supervisor can "take over" the session to guide a trainee through a complex pick.

---

## 6. Human-Robot Collaboration (Cobot Integration)
**Vision:** Pickers stay in the aisle; Robots do the travel.
**Future State:**
1. **Picker:** "Robot, come to aisle 4."
2. **System:** "AMR Unit 5 is dispatched. ETA 30 seconds."
3. **Action:** Robot arrives next to picker.
4. **Picker:** "Loading Order 123 onto Robot."
5. **System:** "Confirmed. Robot 5 departing for Packing Station. Next robot arriving in 15 seconds."
*This eliminates "dead walking time" for humans, boosting productivity by 2x-3x.*

---

## 7. Implementation Plan (Next Session)
1.  **LPN Awareness:** Update `voiceEngine.ts` to track `currentLPN` separately from `currentOrder`.
2.  **Visual Interface:** Create the "Visual Assist" toggle for new hires.
3.  **Command Center UI:** Design the "Heat Map" dashboard for Supervisors.
4.  **Bot Integration Mockup:** Simulating an AMR request command.

---

## 8. Global Voice Architecture & Standards
**Strategic Requirement:** Voice is not just for picking. It MUST be a first-class citizen across the entire Flowstock ecosystem (CAPA, Receiving, Cycle Counting, Packing).

### 8.1. Unified Voice Stack
Currently, we have fragmented implementations (CAPA voice, Hardware Integrations, Picking Voice). We will unify these under a single `VoiceEngine` service.

| Domain | Current State | Future State (Unified) |
| :--- | :--- | :--- |
| **Picking** | Basic Regex | **Logivox Intent Engine (LLM)** |
| **CAPA** | Standalone API | **Logivox Intent Engine (LLM)** |
| **Receiving** | Screen Only | **Voice-Directed Receiving** (Hands-free offloading) |
| **Hardware** | Custom Integrations | **Hardware Abstraction Layer** (Polymorphic support for Vocollect Headsets OR AirPods) |

### 8.2. User Profile Customization (The "Choice" Principle)
Users are not forced into one way of working. The system adapts to *them*.

**New Profile Settings:**
1.  **Voice Persona:**
    -   *Standard (Robotic):* Concise, fast, military-style commands.
    -   *Friendly (Conversational):* Uses "Please", "Thank you", and full sentences.
    -   *Training (Verbose):* Explains *why* a step is needed.
2.  **Input Mode:**
    -   *Listen Always:* Open mic (Wake word free).
    -   *Push-to-Talk:* Button press required (Best for noisy environments).
    -   *Wake Word:* "Hey Logivox..."
3.  **Speed:** 0.8x (Slow/Clear) to 2.5x (Super-User/Review).

### 8.3. Cross-Functional Use Cases
-   **Receiving:** "Unloading PO #555. Pallet 1 is Item A, Qty 50." -> System auto-receives.
-   **Maintenance:** "Record breakdown on Conveyor 3. Belt snapped." -> Creates Work Order.
-   **HR/Admin:** "I'm taking my break now." -> Updates labor tracking status.

*This unification ensures that a user trained on Voice Picking can immediately use Voice Receiving without learning a new syntax.*

---

## 9. Zero-Latency Integration: The End of Middleware
**The Legacy Problem:** Traditional systems (Voxware, older Oracle) rely on a complex chain:
`Voice Device <-> Proprietary Voice Server <-> Async Middleware <-> WMS Database`
*Result:* Data lag (stock updates delay by minutes), sync errors ("Ghost Picks"), and fragile connections.

**The Logivox Advantage (Native Voice Architecture):**
We eliminate the middleman. Logivox Voice is **Application Native**.
`Voice Device <-> Logivox API <-> Logivox Database`

### 9.1. Why "Unified" Matters
1.  **Instant Truth:** When a picker says "Pick 5", inventory is deducted in **0.01 seconds**. If a manager checks stock on the dashboard, they see the *exact* millisecond reality.
2.  **No "Sync" Errors:** There is no "uploading batch" or "downloading tasks". The voice device is a direct client of the WMS core.
3.  **Seamless Supervisor Dashboard:** Because there is no separate voice server, the "Voice Command Center" is just a view of the live WMS.
    *   **Manager Action:** Manager changes a rush order priority in the WMS.
    *   **Picker Reaction:** The *very next* voice prompt changes instantly. No "refresh" needed.

### 9.2. System Resilience
If the Wi-Fi drops, the **Logivox Local Client (PWA)** caches the current pick path.
*   **Offline Mode:** User continues picking securely (validating locally).
*   **Auto-Reconciliation:** When Wi-Fi returns, data streams back instantly without user intervention.
