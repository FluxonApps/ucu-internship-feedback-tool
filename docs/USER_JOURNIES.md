# User Journey Documentation
**Project:** Internship & Feedback Management Platform
**Target Roles:**  Intern, Teammate (Mentor/Peer), Guest

---

## 1. User Personas Overview

| Persona | Primary Goal | Key Features Used |
| :--- | :--- | :--- |
| **Manager** | Onboard internships, manage access & assignments, oversee & publish feedback cycles | People & Access, Internship Creation, Assignment Manager, Feedback Cycle Manager |
| **Intern** | Track personal growth, review feedback, and celebrate achievements | Dashboard, Health Score, Casual Feedback, Achievements List, Analytics |
| **Teammate** | Evaluate intern performance, provide ongoing guidance, and grant recognition | Feedback Cycle Panel, Casual Notes, Achievements Panel, 1:1 Preparation |
| **Guest** | Monitor overall intern progress and review verified assessment milestones | Published Feedback Page, Health Score, Achievements Overview, Analytics |

---

## 2. Core User Journeys

### Journey A: Intern — Growth & Self-Review
> **Objective:** The intern logs in to review their recent performance metrics, read peer feedback, and check earned rewards.

1. **Entry & Dashboard Overview**
   * Intern navigates to the **Intern Dashboard** (`/intern`).
   * System fetches internship data, health metrics, and achievements in parallel using `Promise.all`.

2. **Health & Assessment Check**
   * Intern reviews the **Health Score Section** to get an instant snapshot of their current standing.

3. **Deep-Dive into Feedback**
   * Uses the mobile-friendly sidebar navigation to jump directly to `#feedback` or `#casual-feedback`.
   * Reads structured feedback from official cycles and informal notes submitted by teammates.

4. **Celebrating Milestones**
   * Scrolls to `#achievements` to view newly awarded badges and skills recognized by the team.

5. **Analytics & Prep**
   * Clicks **"View Analytics"** to inspect historical trend charts (`Recharts`) or prepares notes in the **1:1 Preparation** section.

---

### Journey B: Teammate — Evaluation & Recognition
> **Objective:** A teammate provides formal feedback, leaves quick notes, and awards an achievement badge to an intern.

1. **Select Intern**
   * Teammate logs in and selects a specific intern from their active list (`/teammate/internships/[internshipId]`).

2. **Submit Formal Feedback**
   * Opens the `#feedback` section and completes the active evaluation form.

3. **Leave Casual Note (Micro-Feedback)**
   * Navigates to `#casual-feedback` to jot down a quick, date-stamped informal observation.

4. **Grant Achievement**
   * Opens `#achievements` (**AchievementsPanel**).
   * Selects an available badge (e.g., *Fast Learner*, *Bug Hunter*) and awards it to the intern.

---

### Journey C: Manager — Administrative Management & Cycle Oversight

#### 1. Create a New Internship
> **Goal:** Create a new internship for an intern.

* **User Flow:** Log in → Click **Create Internship** → Select an intern → Select a team → Choose a start date → Click **Create Internship**
* **Expected Result:** A new internship card appears in the internships list.
* **UX Observations:** The workflow is straightforward and easy to understand. Each step follows a logical order, making the process intuitive.

#### 2. Provide Access to a New User
> **Goal:** Grant application access to a new intern or teammate.

* **User Flow:** Log in → Open **People & Access** → Enter the user's email address → Select the application role (*Intern* or *Teammate*) → Click **Provision access**
* **Expected Result:** The new user appears in the appropriate table with the status `Awaiting sign-in`.
* **UX Observations & Issues:**
  * **Issue 1:** The form requests only an email address. There is no field for the user's name, which may be confusing. It is assumed that the user's profile information is retrieved after the first successful sign-in, but this is not explained in the interface.
    * *Fix Done:* Added forms for name and surname.
  * **Issue 2 (Form State Bug):** After provisioning access:
    * The form remains filled with the previously entered information.
    * The button continues displaying `Provisioning...` even though the user has already been successfully added to the table.
    * *Fix Done:* The form resets after a successful operation.

#### 3. Manage Assignments

##### A. Creation
> **Goal:** Assign teammates and define their responsibilities within the internship.

* **User Flow:** Open an internship → **Assignments** → **Add teammate** → Select a teammate → Select a start date → Assign responsibilities → Click **Save**
* **Expected Result:** The teammate is successfully assigned to the internship with the selected responsibilities.

##### B. Edition
> **Goal:** Edit team assignment.

* **User Flow:** Log in → Open an internship → **Assignments** → Click **Edit Team** → Select a new team → Choose a start date → Click **Save Team**
* **Expected Result:** The intern is reassigned to the selected team. The previous team assignment is ended automatically, and the new assignment becomes active from the selected start date.

#### 4. Manage Feedback Cycles

##### A. Review Current Feedback Cycle
* **User Flow:** Log in → **Internships** → Select an internship → **Feedback** → **Feedback cycle**
* **Available Manager Actions:**
  * View reviewer status (`Not started` / `Submitted`).
  * Open submitted feedback.
  * Edit due date.
  * Preview feedback before publishing.
  * Cancel the feedback cycle.
  * View published history.
* **UX Observations & Positive Feedback:**
  * Reviewer statuses are easy to understand, and the current and previous feedback cycles are clearly separated.
* **Suggestions Done:**
  * **Suggestion Done 1:** Consider moving the *"What the manager should know or act on"* field to the end of the form or into a separate manager-only section. Its current placement interrupts the flow of feedback intended for the intern and makes the form structure less intuitive.
  * **Suggestion Done 2:** Highlight the *Soft Skills & Cultural Fit* and *Technical Skills* section headers to make the evaluation categories easier to identify and improve the overall readability of the feedback.

##### B. Edit Due Date
* **User Flow:** Feedback cycle → **Edit due date** → Select date → **Save due date**
* **Expected Result:** The deadline is updated without stopping the feedback collection process.
* **UX Observations & Positive Feedback:**
  * The dialog clearly states that changing the due date does not stop feedback collection.

##### C. Preview and Publish Feedback
* **User Flow:** Feedback cycle → **Preview and publish**
* **Available Manager Actions:**
  * Preview exactly what the intern will see.
  * Review ratings and written feedback.
  * Add a manager recommendation.
  * Publish feedback permanently.
* **UX Observations & Positive Feedback:**
  * The warning clearly explains that missing responses cannot be added after publication. Requiring confirmation before publishing helps prevent accidental publication.

##### D. Cancel Feedback Cycle
* **User Flow:** Feedback cycle → **Cancel cycle** → Enter optional reason → **Cancel cycle**
* **Expected Result:** The feedback cycle is closed and no longer accepts submissions.
* **UX Observations & Positive Feedback:**
  * The optional reason provides useful context for future reference.

##### E. Published History
* **User Flow:** Feedback → **Published history** → Expand a published cycle
* **Available Manager Information:**
  * Final ratings.
  * Written feedback from every reviewer.
  * Manager recommendation.
  * Private actionable feedback.
  * Historical feedback records.

---

### Journey D: Guest — External Progress Review
> **Objective:** An external evaluator or HR manager reviews an intern's published portfolio and feedback history.

1. **Access Shared Link**
   * Guest opens the dedicated link (`/guest/internships/[internshipId]`).

2. **High-Level Status Review**
   * Views the intern's display name, overall **Health Score**, and top-level summary.

3. **History & Verified Achievements Inspection**
   * Reviews published evaluation cycles in chronological order.
   * Inspects the read-only **Achievements List** to verify acquired skills.

4. **Trend Analysis**
   * Navigates to `/analytics` to see overall progress trends and score distribution.

---

## 3. Cross-Device Experience & Usability Rules

* **Mobile Adaptability:** All core journeys are fully functional on mobile viewports via responsive Tailwind CSS layouts and touch-optimized controls.
* **Sticky Navigation:** In-page anchor menus (e.g., `#feedback`, `#achievements`) remain accessible on small screens via a fixed, blurred top navigation bar (`backdrop-blur`).
* **Performance:** High-priority pages resolve server-side data calls in parallel using `Promise.all` to eliminate UI blocking and keep navigation latency minimal.
