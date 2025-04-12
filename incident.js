document.addEventListener("DOMContentLoaded", function () {
  // ---------------------------------------------------------------------------
  // Main Form Components: Get references to primary form elements and inputs
  // ---------------------------------------------------------------------------
  const form = document.getElementById("formatterForm");
  const incidentStatusSelect = document.getElementById("incidentStatus");
  const issueTitleInput = document.getElementById("issueTitle");
  const incidentDateInput = document.getElementById("incidentDate");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");
  const rootCauseInput = document.getElementById("rootCause");
  const chronologiesInput = document.getElementById("chronologies");
  const outputPreview = document.getElementById("outputPreview");
  const copyButton = document.getElementById("copyButton");
  const copyStatus = document.getElementById("copyStatus");
  const autoSortToggle = document.getElementById("autoSortToggle");
  const timeStatusSelect = document.getElementById("timeStatus");

  // ---------------------------------------------------------------------------
  // End Time & Midnight Handling: Elements for handling incidents spanning midnight
  // ---------------------------------------------------------------------------
  const spansMidnightCheckbox = document.getElementById("spansMidnight");
  const endDateContainer = document.getElementById("endDateContainer");
  const endDateInput = document.getElementById("endDate");
  const endTimeSection = document.querySelector(
    "label[for='endTime']"
  ).parentElement;

  // ---------------------------------------------------------------------------
  // Service Impact and Action Taken Sections: Input and preview elements
  // ---------------------------------------------------------------------------
  const serviceImpactText = document.getElementById("serviceImpactText");
  const actionTakenText = document.getElementById("actionTakenText");
  const addServiceImpact = document.getElementById("addServiceImpact");
  const addActionTaken = document.getElementById("addActionTaken");
  const serviceImpactPreview = document.getElementById("serviceImpactPreview");
  const actionTakenPreview = document.getElementById("actionTakenPreview");

  // Arrays to store entries for service impact and action taken
  let serviceImpactEntries = [];
  let actionTakenEntries = [];

  // ---------------------------------------------------------------------------
  // Dark Mode: Get the dark mode toggle element
  // ---------------------------------------------------------------------------
  const darkModeToggle = document.getElementById("darkModeToggle");

  // ---------------------------------------------------------------------------
  // Quick Actions & Timeline: Elements for quick timeline entries and actions
  // ---------------------------------------------------------------------------
  const quickActionText = document.getElementById("quickActionText");
  const quickActionTime = document.getElementById("quickActionTime");
  const statusInProgress = document.getElementById("statusInProgress");
  const statusDone = document.getElementById("statusDone");
  const addQuickAction = document.getElementById("addQuickAction");
  const refreshTimeBtn = document.getElementById("refreshTimeBtn");
  const chronologyPreview = document.getElementById("chronologyPreview");
  const nextDayToggle = document.getElementById("nextDayToggle");

  // ---------------------------------------------------------------------------
  // Edit Entry Modal: Elements for editing a timeline entry
  // ---------------------------------------------------------------------------
  const editEntryModal = document.getElementById("editEntryModal");
  const editEntryTime = document.getElementById("editEntryTime");
  const editEntryText = document.getElementById("editEntryText");
  const editEntryNoStatus = document.getElementById("editEntryNoStatus");
  const editEntryInProgress = document.getElementById("editEntryInProgress");
  const editEntryDone = document.getElementById("editEntryDone");
  const editEntryNextDay = document.getElementById("editEntryNextDay");
  const editEntryIndex = document.getElementById("editEntryIndex");
  const saveEditEntry = document.getElementById("saveEditEntry");
  const cancelEditEntry = document.getElementById("cancelEditEntry");
  const refreshEditTimeBtn = document.getElementById("refreshEditTimeBtn");

  // ---------------------------------------------------------------------------
  // Import & Reset: Elements for importing reports and resetting the form
  // ---------------------------------------------------------------------------
  const resetButton = document.getElementById("resetButton");
  const importButton = document.getElementById("importButton");
  const importModal = document.getElementById("importModal");
  const importText = document.getElementById("importText");
  const cancelImport = document.getElementById("cancelImport");
  const confirmImport = document.getElementById("confirmImport");

  // ---------------------------------------------------------------------------
  // Chronology Modal: Elements for managing the timeline chronology
  // ---------------------------------------------------------------------------
  const chronologyButton = document.getElementById("chronologyButton");
  const chronologyModal = document.getElementById("chronologyModal");
  const closeChronologyModal = document.getElementById("closeChronologyModal");
  const saveChronology = document.getElementById("saveChronology");
  const cancelChronology = document.getElementById("cancelChronology");

  // ---------------------------------------------------------------------------
  // Default Values: Set the current date and time for initial field values
  // ---------------------------------------------------------------------------
  const now = new Date();
  const formattedDate = now.toISOString().split("T")[0];
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}`;

  // Array to store timeline chronology entries
  let chronologyEntries = [];

  // ---------------------------------------------------------------------------
  // Time Status Selection: Handle changes in the time status dropdown
  // ---------------------------------------------------------------------------
  timeStatusSelect.addEventListener("change", function () {
    const selectedOption = this.value;

    if (selectedOption === "now") {
      endTimeSection.classList.add("hidden");
      endDateContainer.classList.add("hidden");
    } else if (selectedOption === "timeline") {
      endTimeSection.classList.remove("hidden");
      endTimeInput.disabled = true;
      spansMidnightCheckbox.disabled = true;

      // Set end time based on the latest timeline entry
      updateEndTimeFromLatestEntry();
    } else {
      endTimeSection.classList.remove("hidden");
      endTimeInput.disabled = false;
      spansMidnightCheckbox.disabled = false;

      if (spansMidnightCheckbox.checked) {
        endDateContainer.classList.remove("hidden");
      } else {
        endDateContainer.classList.add("hidden");
      }
    }

    // Update timeline next-day flags, preview, and save the state
    updateNextDayBasedOnTimeSequence();
    updateChronologyPreview();
    formatAndPreview();
    saveFormValues();
  });

  // ---------------------------------------------------------------------------
  // Dark Mode Initialization and Toggle
  // ---------------------------------------------------------------------------
  function initializeDarkMode() {
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  darkModeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    const isDarkMode = document.documentElement.classList.contains("dark");
    localStorage.setItem("darkMode", isDarkMode);
  });

  initializeDarkMode();

  // ---------------------------------------------------------------------------
  // Chronology Modal Handlers: Open and close the modal for editing timeline
  // ---------------------------------------------------------------------------
  chronologyButton.addEventListener("click", function () {
    chronologyModal.classList.remove("hidden");
  });

  closeChronologyModal.addEventListener("click", function () {
    chronologyModal.classList.add("hidden");
  });

  cancelChronology.addEventListener("click", function () {
    chronologyModal.classList.add("hidden");
  });

  // ---------------------------------------------------------------------------
  // Midnight Span Handling: Adjust UI when the incident spans midnight
  // ---------------------------------------------------------------------------
  spansMidnightCheckbox.addEventListener("change", function () {
    if (this.checked) {
      endDateContainer.classList.remove("hidden");
      const nextDay = new Date(incidentDateInput.value);
      nextDay.setDate(nextDay.getDate() + 1);
      endDateInput.value = nextDay.toISOString().split("T")[0];
    } else {
      endDateContainer.classList.add("hidden");
    }
    debouncedFormat();
  });

  // ---------------------------------------------------------------------------
  // Save Chronology Modal: Parse and save timeline entries, update end time if
  // necessary, then provide feedback upon successful update.
  // ---------------------------------------------------------------------------
  saveChronology.addEventListener("click", function () {
    parseChronologyInput();
    updateChronologyPreview();

    if (timeStatusSelect.value === "timeline" && chronologyEntries.length > 0) {
      const visibleEntries = chronologyEntries.filter((entry) => !entry.hidden);
      if (visibleEntries.length > 0) {
        const lastEntry = visibleEntries[visibleEntries.length - 1];
        endTimeInput.value = lastEntry.time;
      }
    }

    formatAndPreview();
    saveFormValues();
    chronologyModal.classList.add("hidden");

    const originalButtonText = chronologyButton.innerHTML;
    chronologyButton.innerHTML =
      '<i class="fas fa-check mr-2"></i> Timeline Updated';
    setTimeout(() => {
      chronologyButton.innerHTML = originalButtonText;
    }, 1500);
  });

  // ---------------------------------------------------------------------------
  // Parse Chronology Input: Convert entered timeline text into structured data
  // and automatically detect entries that belong to the next day.
  // ---------------------------------------------------------------------------
  function parseChronologyInput() {
    const chronologyText = chronologiesInput.value.trim();
    chronologyEntries = [];
    if (!chronologyText) return;

    const lines = chronologyText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== "");

    if (
      lines.length &&
      lines[0].startsWith("-----") &&
      lines[0].endsWith("-----")
    ) {
      // Placeholder for chat transcript style parsing
      // (Existing parsing code for transcript format can be inserted here)
    } else {
      // Standard timeline format: Parse lines in the format "HH:MM → message"
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const timelineMatch = line.match(/^(\d{1,2}:\d{2})\s*→\s*(.+)$/);
        if (timelineMatch) {
          let fullText = timelineMatch[2].trim();
          let status = "";
          let message = fullText;
          let hidden = false;

          // Remove any explicit NEXT_DAY markers (they are detected automatically)
          if (fullText.includes("[NEXT_DAY]")) {
            fullText = fullText.replace(/\[NEXT_DAY\]/g, "").trim();
          }

          if (fullText.includes("[HIDDEN]")) {
            hidden = true;
            fullText = fullText.replace(/\[HIDDEN\]/g, "").trim();
          }

          const statusMatch = fullText.match(/\[(Time|Done|时间)\]$/);
          if (statusMatch) {
            status =
              statusMatch[1] === "时间" ? "[Time]" : `[${statusMatch[1]}]`;
            message = fullText
              .substring(0, fullText.length - statusMatch[0].length)
              .trim();
          }
          chronologyEntries.push({
            time: timelineMatch[1],
            message: message,
            status: status,
            hidden: hidden,
            nextDay: false, // Will be set in nextDay detection
          });
        }
      }
    }

    // Automatically update nextDay flags for timeline entries
    updateNextDayBasedOnTimeSequence();
  }

  // ---------------------------------------------------------------------------
  // Quick Action Time: Initialize the quick action time field with current time
  // ---------------------------------------------------------------------------
  function updateQuickActionTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    quickActionTime.value = `${hours}:${minutes}`;
  }

  // ---------------------------------------------------------------------------
  // Update Edit Time: Set the edit entry modal time to the current time
  // ---------------------------------------------------------------------------
  function updateEditEntryTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    editEntryTime.value = `${hours}:${minutes}`;

    refreshEditTimeBtn.classList.add("animate-pulse");
    setTimeout(() => {
      refreshEditTimeBtn.classList.remove("animate-pulse");
    }, 500);
  }

  // ---------------------------------------------------------------------------
  // Service Impact Preview: Update the service impact preview section
  // ---------------------------------------------------------------------------
  function updateServiceImpactPreview() {
    if (serviceImpactEntries.length === 0) {
      serviceImpactPreview.innerHTML =
        "<span class='text-gray-500 dark:text-gray-400'>No entries yet.</span>";
      return;
    }

    let previewHTML = "";
    serviceImpactEntries.forEach((entry, index) => {
      const entryClasses = entry.hidden
        ? "chronology-entry entry-hidden"
        : "chronology-entry";

      previewHTML += `<div class="${entryClasses} mb-2 pb-2 border-b border-gray-100 dark:border-gray-800 relative group" data-index="${index}">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <span>- ${entry.text}</span>
          </div>
          <div class="entry-actions flex space-x-1">
            <button class="edit-impact-btn p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Edit" data-index="${index}">
              <i class="fas fa-edit text-xs"></i>
            </button>
            <button class="toggle-impact-visibility-btn p-1 ${
              entry.hidden
                ? "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }" title="${entry.hidden ? "Show" : "Hide"}" data-index="${index}">
              <i class="fas ${
                entry.hidden ? "fa-eye" : "fa-eye-slash"
              } text-xs"></i>
            </button>
            <button class="delete-impact-btn p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete" data-index="${index}">
              <i class="fas fa-trash-alt text-xs"></i>
            </button>
          </div>
        </div>
      </div>`;
    });

    serviceImpactPreview.innerHTML = previewHTML;
  }

  // ---------------------------------------------------------------------------
  // Timeline Next-Day Flag Update: Set the nextDay flag for timeline entries
  // based on their time order.
  // ---------------------------------------------------------------------------
  function updateNextDayBasedOnTimeSequence() {
    if (chronologyEntries.length <= 1) return;

    const sortableEntries = [...chronologyEntries].filter(
      (entry) => !entry.hidden
    );

    let prevTimeMinutes = -1;
    let currentDayEntries = [];
    let nextDayEntries = [];

    // Detect when time values reset (indicating a new day)
    for (let i = 0; i < sortableEntries.length; i++) {
      const entry = sortableEntries[i];
      const currentTimeMinutes = timeToMinutes(entry.time);

      if (prevTimeMinutes !== -1 && currentTimeMinutes < prevTimeMinutes) {
        nextDayEntries = sortableEntries.slice(i);
        currentDayEntries = sortableEntries.slice(0, i);
        break;
      }

      prevTimeMinutes = currentTimeMinutes;
    }

    // Update each entry's nextDay flag accordingly
    chronologyEntries.forEach((entry) => {
      entry.nextDay = false;
      if (
        nextDayEntries.find(
          (e) => e.time === entry.time && e.message === entry.message
        )
      ) {
        entry.nextDay = true;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Action Taken Preview: Update the action taken preview section
  // ---------------------------------------------------------------------------
  function updateActionTakenPreview() {
    if (actionTakenEntries.length === 0) {
      actionTakenPreview.innerHTML =
        "<span class='text-gray-500 dark:text-gray-400'>No entries yet.</span>";
      return;
    }

    let previewHTML = "";
    actionTakenEntries.forEach((entry, index) => {
      const entryClasses = entry.hidden
        ? "chronology-entry entry-hidden"
        : "chronology-entry";

      previewHTML += `<div class="${entryClasses} mb-2 pb-2 border-b border-gray-100 dark:border-gray-800 relative group" data-index="${index}">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <span>- ${entry.text}</span>
          </div>
          <div class="entry-actions flex space-x-1">
            <button class="edit-action-btn p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Edit" data-index="${index}">
              <i class="fas fa-edit text-xs"></i>
            </button>
            <button class="toggle-action-visibility-btn p-1 ${
              entry.hidden
                ? "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }" title="${entry.hidden ? "Show" : "Hide"}" data-index="${index}">
              <i class="fas ${
                entry.hidden ? "fa-eye" : "fa-eye-slash"
              } text-xs"></i>
            </button>
            <button class="delete-action-btn p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete" data-index="${index}">
              <i class="fas fa-trash-alt text-xs"></i>
            </button>
          </div>
        </div>
      </div>`;
    });

    actionTakenPreview.innerHTML = previewHTML;
  }

  // ---------------------------------------------------------------------------
  // Add Service Impact Entry: Append a new service impact entry to the list
  // ---------------------------------------------------------------------------
  function addServiceImpactEntry() {
    const impactText = serviceImpactText.value.trim();
    if (!impactText) {
      alert("Please enter service impact");
      serviceImpactText.focus();
      return;
    }

    serviceImpactEntries.push({
      text: impactText,
      hidden: false,
    });

    updateServiceImpactPreview();
    formatAndPreview();
    saveFormValues();

    serviceImpactText.value = "";
    const originalButtonText = addServiceImpact.innerHTML;
    addServiceImpact.innerHTML = '<i class="fas fa-check mr-2"></i> Added!';
    setTimeout(() => {
      addServiceImpact.innerHTML = originalButtonText;
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // Add Action Taken Entry: Append a new action taken entry to the list
  // ---------------------------------------------------------------------------
  function addActionTakenEntry() {
    const actionText = actionTakenText.value.trim();
    if (!actionText) {
      alert("Please enter action taken");
      actionTakenText.focus();
      return;
    }

    actionTakenEntries.push({
      text: actionText,
      hidden: false,
    });

    updateActionTakenPreview();
    formatAndPreview();
    saveFormValues();

    actionTakenText.value = "";
    const originalButtonText = addActionTaken.innerHTML;
    addActionTaken.innerHTML = '<i class="fas fa-check mr-2"></i> Added!';
    setTimeout(() => {
      addActionTaken.innerHTML = originalButtonText;
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // Service Impact Entry Actions: Delegate edit, toggle visibility, and delete
  // actions for service impact entries.
  // ---------------------------------------------------------------------------
  serviceImpactPreview.addEventListener("click", function (e) {
    if (e.target.closest(".edit-impact-btn")) {
      const button = e.target.closest(".edit-impact-btn");
      const index = parseInt(button.dataset.index);
      const entry = serviceImpactEntries[index];
      const newText = prompt("Edit service impact:", entry.text);
      if (newText !== null && newText.trim() !== "") {
        entry.text = newText.trim();
        updateServiceImpactPreview();
        formatAndPreview();
        saveFormValues();
      }
    } else if (e.target.closest(".toggle-impact-visibility-btn")) {
      const button = e.target.closest(".toggle-impact-visibility-btn");
      const index = parseInt(button.dataset.index);
      serviceImpactEntries[index].hidden = !serviceImpactEntries[index].hidden;
      updateServiceImpactPreview();
      formatAndPreview();
      saveFormValues();
    } else if (e.target.closest(".delete-impact-btn")) {
      const button = e.target.closest(".delete-impact-btn");
      const index = parseInt(button.dataset.index);
      if (confirm("Are you sure you want to delete this impact?")) {
        serviceImpactEntries.splice(index, 1);
        updateServiceImpactPreview();
        formatAndPreview();
        saveFormValues();
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Action Taken Entry Actions: Delegate edit, toggle visibility, and delete
  // actions for action taken entries.
  // ---------------------------------------------------------------------------
  actionTakenPreview.addEventListener("click", function (e) {
    if (e.target.closest(".edit-action-btn")) {
      const button = e.target.closest(".edit-action-btn");
      const index = parseInt(button.dataset.index);
      const entry = actionTakenEntries[index];
      const newText = prompt("Edit action taken:", entry.text);
      if (newText !== null && newText.trim() !== "") {
        entry.text = newText.trim();
        updateActionTakenPreview();
        formatAndPreview();
        saveFormValues();
      }
    } else if (e.target.closest(".toggle-action-visibility-btn")) {
      const button = e.target.closest(".toggle-action-visibility-btn");
      const index = parseInt(button.dataset.index);
      actionTakenEntries[index].hidden = !actionTakenEntries[index].hidden;
      updateActionTakenPreview();
      formatAndPreview();
      saveFormValues();
    } else if (e.target.closest(".delete-action-btn")) {
      const button = e.target.closest(".delete-action-btn");
      const index = parseInt(button.dataset.index);
      if (confirm("Are you sure you want to delete this action?")) {
        actionTakenEntries.splice(index, 1);
        updateActionTakenPreview();
        formatAndPreview();
        saveFormValues();
      }
    }
  });

  // Attach entry addition events to respective buttons and keypress events
  addServiceImpact.addEventListener("click", addServiceImpactEntry);
  addActionTaken.addEventListener("click", addActionTakenEntry);

  serviceImpactText.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addServiceImpactEntry();
    }
  });

  actionTakenText.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addActionTakenEntry();
    }
  });

  // ---------------------------------------------------------------------------
  // Initialize Quick Action Time with Current Time
  // ---------------------------------------------------------------------------
  updateQuickActionTime();

  // ---------------------------------------------------------------------------
  // Timeline Preview: Update the visual preview of the timeline chronology
  // ---------------------------------------------------------------------------
  function updateChronologyPreview() {
    if (chronologyEntries.length === 0) {
      chronologyPreview.innerHTML =
        "<span class='text-gray-500 dark:text-gray-400'>No entries yet.</span>";
      return;
    }

    let previewHTML = "";
    chronologyEntries.forEach((entry, index) => {
      let statusClass = "";
      let statusIcon = "";
      if (entry.status === "[Time]") {
        statusClass = "text-blue-600 dark:text-blue-400";
        statusIcon =
          "<i class='fas fa-clock mr-1 text-gray-500 dark:text-gray-400'></i>";
      } else if (entry.status === "[Done]") {
        statusClass = "text-green-600 dark:text-green-400";
        statusIcon = "<i class='fas fa-check-circle mr-1'></i>";
      }
      const entryClasses = entry.hidden
        ? "chronology-entry entry-hidden"
        : "chronology-entry";
      const nextDayBadge = entry.nextDay
        ? '<span class="ml-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-1.5 py-0.5 rounded">Next day</span>'
        : "";
      previewHTML += `<div class="${entryClasses} mb-2 pb-2 border-b border-gray-100 dark:border-gray-800 relative group" data-index="${index}">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <span class="font-semibold">${entry.time}</span> → 
            <span class="${statusClass}">${statusIcon}${
        entry.message
      }${nextDayBadge}</span>
          </div>
          <div class="entry-actions flex space-x-1">
            <button class="edit-entry-btn p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Edit" data-index="${index}">
              <i class="fas fa-edit text-xs"></i>
            </button>
            <button class="toggle-visibility-btn p-1 ${
              entry.hidden
                ? "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }" title="${entry.hidden ? "Show" : "Hide"}" data-index="${index}">
              <i class="fas ${
                entry.hidden ? "fa-eye" : "fa-eye-slash"
              } text-xs"></i>
            </button>
            <button class="delete-entry-btn p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete" data-index="${index}">
              <i class="fas fa-trash-alt text-xs"></i>
            </button>
          </div>
        </div>
      </div>`;
    });
    chronologyPreview.innerHTML = previewHTML;
  }

  // ---------------------------------------------------------------------------
  // Timeline Entry Actions: Handle edit, visibility toggle, and deletion via delegation
  // ---------------------------------------------------------------------------
  chronologyPreview.addEventListener("click", function (e) {
    if (e.target.closest(".edit-entry-btn")) {
      const button = e.target.closest(".edit-entry-btn");
      const index = parseInt(button.dataset.index);
      handleEditEntry(index);
    } else if (e.target.closest(".toggle-visibility-btn")) {
      const button = e.target.closest(".toggle-visibility-btn");
      const index = parseInt(button.dataset.index);
      handleToggleVisibility(index);
    } else if (e.target.closest(".delete-entry-btn")) {
      const button = e.target.closest(".delete-entry-btn");
      const index = parseInt(button.dataset.index);
      handleDeleteEntry(index);
    }
  });

  // ---------------------------------------------------------------------------
  // Edit Timeline Entry: Open the edit modal and populate fields with entry data
  // ---------------------------------------------------------------------------
  function handleEditEntry(index) {
    const entry = chronologyEntries[index];
    if (!entry) return;
    editEntryTime.value = entry.time;
    editEntryText.value = entry.message;
    editEntryNextDay.checked = entry.nextDay;

    if (entry.status === "[Time]") {
      editEntryInProgress.checked = true;
    } else if (entry.status === "[Done]") {
      editEntryDone.checked = true;
    } else {
      editEntryNoStatus.checked = true;
    }

    editEntryIndex.value = index;
    editEntryModal.classList.remove("hidden");
  }

  // ---------------------------------------------------------------------------
  // Toggle Timeline Entry Visibility: Show or hide a timeline entry
  // ---------------------------------------------------------------------------
  function handleToggleVisibility(index) {
    const entry = chronologyEntries[index];
    if (!entry) return;
    entry.hidden = !entry.hidden;
    updateChronologyPreview();
    updateChronologyInput();

    if (timeStatusSelect.value === "timeline") {
      updateEndTimeFromLatestEntry();
    }

    formatAndPreview();
    saveFormValues();
  }

  // ---------------------------------------------------------------------------
  // Delete Timeline Entry: Remove a timeline entry after user confirmation
  // ---------------------------------------------------------------------------
  function handleDeleteEntry(index) {
    if (confirm("Are you sure you want to delete this entry?")) {
      chronologyEntries.splice(index, 1);
      updateChronologyPreview();
      updateChronologyInput();
      updateEndTimeFromLatestEntry();
      formatAndPreview();
      saveFormValues();
    }
  }

  // ---------------------------------------------------------------------------
  // Save Edited Timeline Entry: Apply changes from the edit modal and sort if needed
  // ---------------------------------------------------------------------------
  function saveEditedEntry() {
    const index = parseInt(editEntryIndex.value);
    const entry = chronologyEntries[index];
    if (!entry) {
      console.error("Entry not found at index:", index);
      editEntryModal.classList.add("hidden");
      return;
    }
    entry.time = editEntryTime.value;
    entry.message = editEntryText.value.trim();
    entry.nextDay = editEntryNextDay.checked;

    if (editEntryInProgress.checked) {
      entry.status = "[Time]";
    } else if (editEntryDone.checked) {
      entry.status = "[Done]";
    } else {
      entry.status = "";
    }

    if (autoSortToggle.checked) {
      chronologyEntries.sort((a, b) => {
        if (a.nextDay !== b.nextDay) {
          return a.nextDay ? 1 : -1;
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    }

    updateChronologyPreview();
    updateChronologyInput();

    if (timeStatusSelect.value === "timeline") {
      updateEndTimeFromLatestEntry();
    }

    formatAndPreview();
    saveFormValues();
    editEntryModal.classList.add("hidden");
  }

  // ---------------------------------------------------------------------------
  // Update Chronology Input: Convert structured timeline entries back into text
  // ---------------------------------------------------------------------------
  function updateChronologyInput() {
    let result = "";
    for (const entry of chronologyEntries) {
      let entryText = `${entry.time} → ${entry.message}`;

      // Append status marker if available
      if (entry.status) {
        entryText += ` ${entry.status}`;
      }

      // Append hidden marker if applicable
      if (entry.hidden) {
        entryText += " [HIDDEN]";
      }

      result += entryText + "\n";
    }

    if (chronologiesInput) {
      chronologiesInput.value = result.trim();
    } else {
      console.error("chronologiesInput element not found");
    }
  }

  // ---------------------------------------------------------------------------
  // Status Checkbox Exclusivity: Ensure only one status checkbox is selected at a time
  // ---------------------------------------------------------------------------
  statusInProgress.addEventListener("change", function () {
    if (this.checked && statusDone.checked) {
      statusDone.checked = false;
    }
  });
  statusDone.addEventListener("change", function () {
    if (this.checked && statusInProgress.checked) {
      statusInProgress.checked = false;
    }
  });

  // ---------------------------------------------------------------------------
  // Refresh Quick Action Time: Update the quick action time to the current time
  // ---------------------------------------------------------------------------
  refreshTimeBtn.addEventListener("click", function () {
    updateQuickActionTime();
    this.classList.add("animate-pulse");
    setTimeout(() => {
      this.classList.remove("animate-pulse");
    }, 500);
  });
  refreshEditTimeBtn.addEventListener("click", updateEditEntryTime);

  // ---------------------------------------------------------------------------
  // Add Quick Action to Timeline: Append a new quick entry to the chronology
  // ---------------------------------------------------------------------------
  function addQuickActionToChronology() {
    let actionText = quickActionText.value.trim();
    if (!actionText) {
      alert("Please enter an action description");
      quickActionText.focus();
      return;
    }
    // Remove any preexisting NEXT_DAY markers since detection is automatic
    actionText = actionText.replace(/\[NEXT_DAY\]/gi, "").trim();
    const actionTime = quickActionTime.value;
    let status = "";
    if (statusInProgress.checked) {
      status = "[Time]";
    } else if (statusDone.checked) {
      status = "[Done]";
    }
    chronologyEntries.push({
      time: actionTime,
      message: actionText,
      status: status,
      hidden: false,
      nextDay: nextDayToggle.checked,
    });

    if (autoSortToggle.checked) {
      chronologyEntries.sort((a, b) => {
        if (a.nextDay !== b.nextDay) {
          return a.nextDay ? 1 : -1;
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    }

    updateChronologyPreview();
    updateChronologyInput();

    if (timeStatusSelect.value === "timeline") {
      updateEndTimeFromLatestEntry();
    }

    formatAndPreview();
    saveFormValues();
    quickActionText.value = "";
    const originalButtonText = addQuickAction.innerHTML;
    addQuickAction.innerHTML = '<i class="fas fa-check mr-2"></i> Added!';
    setTimeout(() => {
      addQuickAction.innerHTML = originalButtonText;
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // Save Form Values: Persist all form data to localStorage
  // ---------------------------------------------------------------------------
  function saveFormValues() {
    const values = {
      incidentStatus: incidentStatusSelect.value,
      issueTitle: issueTitleInput.value,
      incidentDate: incidentDateInput.value,
      startTime: startTimeInput.value,
      endTime: endTimeInput.value,
      timeStatus: timeStatusSelect.value,
      spansMidnight: spansMidnightCheckbox.checked,
      endDate: endDateInput.value,
      rootCause: rootCauseInput.value,
      serviceImpactEntries: serviceImpactEntries,
      actionTakenEntries: actionTakenEntries,
      chronologies: chronologiesInput.value,
      autoSort: autoSortToggle.checked,
    };
    localStorage.setItem("incidentReportData", JSON.stringify(values));
  }

  // ---------------------------------------------------------------------------
  // Load Form Values: Retrieve and populate saved form data from localStorage
  // ---------------------------------------------------------------------------
  function loadFormValues() {
    const savedValues = localStorage.getItem("incidentReportData");
    if (savedValues) {
      const values = JSON.parse(savedValues);
      incidentStatusSelect.value = values.incidentStatus || "OPEN";
      issueTitleInput.value = values.issueTitle || "";
      incidentDateInput.value = values.incidentDate || formattedDate;
      startTimeInput.value = values.startTime || currentTime;
      endTimeInput.value = values.endTime || currentTime;
      rootCauseInput.value = values.rootCause || "Still Investigating";

      timeStatusSelect.value = values.timeStatus || "now";
      if (timeStatusSelect.value === "now") {
        endTimeSection.classList.add("hidden");
        endDateContainer.classList.add("hidden");
      } else if (timeStatusSelect.value === "timeline") {
        endTimeSection.classList.remove("hidden");
        endTimeInput.disabled = true;
        spansMidnightCheckbox.disabled = true;
        endDateContainer.classList.add("hidden");
      } else {
        endTimeSection.classList.remove("hidden");
        endTimeInput.disabled = false;
        spansMidnightCheckbox.disabled = false;
        spansMidnightCheckbox.checked = values.spansMidnight || false;
        if (spansMidnightCheckbox.checked) {
          endDateContainer.classList.remove("hidden");
          endDateInput.value = values.endDate || "";
        } else {
          endDateContainer.classList.add("hidden");
        }
      }

      if (
        values.serviceImpactEntries &&
        Array.isArray(values.serviceImpactEntries)
      ) {
        serviceImpactEntries = values.serviceImpactEntries;
      } else if (values.serviceImpact) {
        const impacts = formatBulletPoints(values.serviceImpact);
        serviceImpactEntries = impacts.map((text) => ({ text, hidden: false }));
      }

      if (
        values.actionTakenEntries &&
        Array.isArray(values.actionTakenEntries)
      ) {
        actionTakenEntries = values.actionTakenEntries;
      } else if (values.actionTaken) {
        const actions = formatBulletPoints(values.actionTaken);
        actionTakenEntries = actions.map((text) => ({ text, hidden: false }));
      }

      chronologiesInput.value = values.chronologies || "";
      autoSortToggle.checked =
        values.autoSort !== undefined ? values.autoSort : true;

      updateServiceImpactPreview();
      updateActionTakenPreview();
      parseChronologyInput();
      updateChronologyPreview();
      formatAndPreview();
    } else {
      incidentStatusSelect.value = "OPEN";
      rootCauseInput.value = "Still Investigating";
      incidentDateInput.value = formattedDate;
      startTimeInput.value = currentTime;
      endTimeInput.value = currentTime;
      timeStatusSelect.value = "now";
      endTimeSection.classList.add("hidden");
    }
  }

  // ---------------------------------------------------------------------------
  // Reset Form: Clear all form fields and localStorage data
  // ---------------------------------------------------------------------------
  function confirmReset() {
    if (
      confirm(
        "Are you sure you want to reset the form? All entered data will be lost."
      )
    ) {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${currentHours}:${currentMinutes}`;

      incidentStatusSelect.value = "OPEN";
      issueTitleInput.value = "";
      incidentDateInput.value = formattedDate;
      startTimeInput.value = currentTime;
      endTimeInput.value = currentTime;
      rootCauseInput.value = "Still Investigating";

      timeStatusSelect.value = "now";
      endTimeSection.classList.add("hidden");
      spansMidnightCheckbox.disabled = true;
      endDateContainer.classList.add("hidden");
      spansMidnightCheckbox.checked = false;
      nextDayToggle.checked = false;
      serviceImpactEntries = [];
      actionTakenEntries = [];
      chronologyEntries = [];

      serviceImpactText.value = "";
      actionTakenText.value = "";
      chronologiesInput.value = "";
      autoSortToggle.checked = true;

      localStorage.removeItem("incidentReportData");

      updateServiceImpactPreview();
      updateActionTakenPreview();
      updateChronologyPreview();
      formatAndPreview();

      const originalButtonHTML = resetButton.innerHTML;
      resetButton.innerHTML = '<i class="fas fa-check mr-2"></i> Form Reset!';
      setTimeout(() => {
        resetButton.innerHTML = originalButtonHTML;
      }, 1500);
    }
  }

  // ---------------------------------------------------------------------------
  // Parse Formatted Report: Convert a formatted report string into a data object
  // ---------------------------------------------------------------------------
  function parseFormattedReport(text) {
    try {
      text = text.replace(/\u00A0/g, " ").replace(/[\u2028\u2029]/g, "\n");
      const lines = text.split(/\r?\n/);
      let result = {
        status: "OPEN",
        issueTitle: "",
        date: "",
        startTime: "",
        endTime: "",
        timeStatus: "now",
        spansMidnight: false,
        endDate: "",
        rootCause: "Still Investigating",
        serviceImpactEntries: [],
        actionTakenEntries: [],
        chronologyEntries: [],
      };

      let currentSection = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line === "[CLOSED]" || line === "[OPEN]") {
          result.status = line.replace(/\[|\]/g, "");
          continue;
        }

        if (line.startsWith("Issue:")) {
          result.issueTitle = line.substring("Issue:".length).trim();
          continue;
        }

        if (line.startsWith("Date time:")) {
          const dateTimeText = line.substring("Date time:".length).trim();
          if (dateTimeText.includes(" - Now")) {
            const startPart = dateTimeText.split(" - Now")[0].trim();
            const startMatch = startPart.match(
              /(\d+)\s+(\w+)\s+(\d{4}),\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i
            );

            if (startMatch) {
              const startDay = startMatch[1].padStart(2, "0");
              const startMonth = startMatch[2];
              const startYear = startMatch[3];
              const startTime = startMatch[4];

              result.date = `${startYear}-${getMonthNumber(
                startMonth
              )}-${startDay}`;
              result.startTime = convertTo24Hour(startTime);
              result.timeStatus = "now";
              result.spansMidnight = false;
            }
            continue;
          }

          const containsMultipleDates = countMonthOccurrences(dateTimeText) > 1;
          if (containsMultipleDates) {
            const parts = dateTimeText.split("-").map((part) => part.trim());
            if (parts.length === 2) {
              const startMatch = parts[0].match(
                /(\d+)\s+(\w+)\s+(\d{4}),\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i
              );
              const endMatch = parts[1].match(
                /(\d+)\s+(\w+)\s+(\d{4}),\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i
              );
              if (startMatch && endMatch) {
                const startDay = startMatch[1].padStart(2, "0");
                const startMonth = startMatch[2];
                const startYear = startMatch[3];
                const startTime = startMatch[4];

                const endDay = endMatch[1].padStart(2, "0");
                const endMonth = endMatch[2];
                const endYear = endMatch[3];
                const endTime = endMatch[4];

                result.date = `${startYear}-${getMonthNumber(
                  startMonth
                )}-${startDay}`;
                result.startTime = convertTo24Hour(startTime);
                result.endTime = convertTo24Hour(endTime);
                result.timeStatus = "custom";
                result.spansMidnight = true;
                result.endDate = `${endYear}-${getMonthNumber(
                  endMonth
                )}-${endDay}`;
              }
            }
          } else {
            const dateMatch = dateTimeText.match(
              /(\d+)\s+(\w+)\s+(\d{4}),\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\s*-\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i
            );
            if (dateMatch) {
              const day = dateMatch[1].padStart(2, "0");
              const month = dateMatch[2];
              const year = dateMatch[3];
              const startTime = dateMatch[4];
              const endTime = dateMatch[5];

              result.date = `${year}-${getMonthNumber(month)}-${day}`;
              result.startTime = convertTo24Hour(startTime);
              result.endTime = convertTo24Hour(endTime);
              result.timeStatus = "custom";
              result.spansMidnight = false;
            }
          }
          continue;
        }

        if (line.startsWith("Root Cause:")) {
          result.rootCause = line.substring("Root Cause:".length).trim();
          continue;
        }

        if (line === "Service Impact:" || line.startsWith("Service Impact:")) {
          currentSection = "serviceImpact";
          const contentAfterHeader = line
            .substring("Service Impact:".length)
            .trim();
          if (contentAfterHeader && contentAfterHeader.startsWith("-")) {
            result.serviceImpactEntries.push({
              text: contentAfterHeader.substring(1).trim(),
              hidden: false,
            });
          }
          continue;
        } else if (
          line === "Action Taken:" ||
          line.startsWith("Action Taken:")
        ) {
          currentSection = "actionTaken";
          const contentAfterHeader = line
            .substring("Action Taken:".length)
            .trim();
          if (contentAfterHeader && contentAfterHeader.startsWith("-")) {
            result.actionTakenEntries.push({
              text: contentAfterHeader.substring(1).trim(),
              hidden: false,
            });
          }
          continue;
        } else if (
          line === "Incident Timeline and Chronology:" ||
          line.startsWith("Incident Timeline and Chronology:")
        ) {
          currentSection = "chronology";
          continue;
        }

        if (currentSection === "serviceImpact") {
          if (line.startsWith("-")) {
            result.serviceImpactEntries.push({
              text: line.substring(1).trim(),
              hidden: false,
            });
          } else if (
            line.trim() &&
            !line.startsWith("Action Taken:") &&
            !line.startsWith("Incident Timeline")
          ) {
            result.serviceImpactEntries.push({
              text: line.trim(),
              hidden: false,
            });
          }
        } else if (currentSection === "actionTaken") {
          if (line.startsWith("-")) {
            result.actionTakenEntries.push({
              text: line.substring(1).trim(),
              hidden: false,
            });
          } else if (line.trim() && !line.startsWith("Incident Timeline")) {
            result.actionTakenEntries.push({
              text: line.trim(),
              hidden: false,
            });
          }
        } else if (currentSection === "chronology") {
          const timeMatch = line.match(/^(\d{1,2}:\d{2})\s*→\s*(.+)$/);
          if (timeMatch) {
            const time = timeMatch[1];
            let message = timeMatch[2].trim();
            let status = "";

            // Automatic detection of status (ignoring explicit NEXT_DAY marker)
            const statusMatch = message.match(/\[(Time|Done|时间)\]$/);
            if (statusMatch) {
              status =
                statusMatch[1] === "时间" ? "[Time]" : `[${statusMatch[1]}]`;
              message = message
                .substring(0, message.length - statusMatch[0].length)
                .trim();
            }
            result.chronologyEntries.push({
              time: time,
              message: message,
              status: status,
              hidden: false,
              nextDay: false,
            });
          }
        }
      }

      if (result.chronologyEntries.length > 0) {
        detectNextDayEntries(result.chronologyEntries);
      }

      result.timeStatus = "custom";

      return result;
    } catch (error) {
      console.error("Error parsing formatted report:", error);
      alert("Error parsing the report: " + error.message);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Next Day Detection: Mark timeline entries that belong to the next day
  // ---------------------------------------------------------------------------
  function detectNextDayEntries(entries) {
    if (entries.length <= 1) return;

    const sortableEntries = [...entries].filter((entry) => !entry.hidden);

    let prevTimeMinutes = -1;
    let nextDayStartIndex = -1;

    for (let i = 0; i < sortableEntries.length; i++) {
      const entry = sortableEntries[i];
      const currentTimeMinutes = timeToMinutes(entry.time);

      if (prevTimeMinutes !== -1 && currentTimeMinutes < prevTimeMinutes) {
        nextDayStartIndex = i;
        break;
      }

      prevTimeMinutes = currentTimeMinutes;
    }

    if (nextDayStartIndex !== -1) {
      const nextDayEntries = sortableEntries.slice(nextDayStartIndex);

      entries.forEach((entry) => {
        // Reset the flag before applying
        entry.nextDay = false;
        if (
          nextDayEntries.find(
            (e) => e.time === entry.time && e.message === entry.message
          )
        ) {
          entry.nextDay = true;
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Helper Functions: Count month occurrences and return corresponding month number
  // ---------------------------------------------------------------------------
  function countMonthOccurrences(text) {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthPattern = new RegExp(months.join("|"), "gi");
    const matches = text.match(monthPattern) || [];
    return matches.length;
  }

  function getMonthNumber(monthName) {
    const months = {
      January: "01",
      February: "02",
      March: "03",
      April: "04",
      May: "05",
      June: "06",
      July: "07",
      August: "08",
      September: "09",
      October: "10",
      November: "11",
      December: "12",
    };
    return months[monthName] || "01";
  }

  // ---------------------------------------------------------------------------
  // Fill Form with Imported Data: Populate form fields with parsed report data
  // ---------------------------------------------------------------------------
  function fillFormWithImportedData(data) {
    if (!data) {
      alert(
        "Could not parse the incident report. Please check the format and try again."
      );
      return;
    }

    if (data.status) {
      incidentStatusSelect.value = data.status;
    }
    if (data.issueTitle) {
      issueTitleInput.value = data.issueTitle;
    }
    if (data.date) {
      incidentDateInput.value = data.date;
    }
    if (data.startTime) {
      startTimeInput.value = data.startTime;
    }
    if (data.timeStatus) {
      timeStatusSelect.value = data.timeStatus;
      if (timeStatusSelect.value === "now") {
        endTimeSection.classList.add("hidden");
        endDateContainer.classList.add("hidden");
      } else if (timeStatusSelect.value === "timeline") {
        endTimeSection.classList.remove("hidden");
        endTimeInput.disabled = true;
        spansMidnightCheckbox.disabled = true;
        endDateContainer.classList.add("hidden");
      } else {
        endTimeSection.classList.remove("hidden");
        endTimeInput.disabled = false;
        spansMidnightCheckbox.disabled = false;
        if (data.endTime) {
          endTimeInput.value = data.endTime;
        }
      }
    } else {
      if (data.endTime) {
        endTimeInput.value = data.endTime;
        timeStatusSelect.value = "custom";
        endTimeSection.classList.remove("hidden");
      } else {
        timeStatusSelect.value = "now";
        endTimeSection.classList.add("hidden");
      }
    }

    spansMidnightCheckbox.checked = data.spansMidnight || false;
    if (spansMidnightCheckbox.checked && timeStatusSelect.value === "custom") {
      endDateContainer.classList.remove("hidden");
      endDateInput.value = data.endDate || "";
    } else {
      endDateContainer.classList.add("hidden");
    }
    if (data.rootCause) {
      rootCauseInput.value = data.rootCause;
    }
    if (data.serviceImpactEntries && data.serviceImpactEntries.length > 0) {
      serviceImpactEntries = data.serviceImpactEntries;
      updateServiceImpactPreview();
    }
    if (data.actionTakenEntries && data.actionTakenEntries.length > 0) {
      actionTakenEntries = data.actionTakenEntries;
      updateActionTakenPreview();
    }
    if (data.chronologyEntries && data.chronologyEntries.length > 0) {
      chronologyEntries = data.chronologyEntries;
      updateNextDayBasedOnTimeSequence();
      updateChronologyInput();
      updateChronologyPreview();

      if (timeStatusSelect.value === "timeline") {
        updateEndTimeFromLatestEntry();
      }
    }

    formatAndPreview();
    saveFormValues();

    const originalButtonText = importButton.innerHTML;
    importButton.innerHTML =
      '<i class="fas fa-check mr-1"></i> Import Successful!';
    setTimeout(() => {
      importButton.innerHTML = originalButtonText;
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // Time Conversion Helpers
  // ---------------------------------------------------------------------------
  function convertTo24Hour(timeStr) {
    const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2];
      const period = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;
      if (period === "PM" && hours < 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }
      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    }
    if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
      const parts = timeStr.split(":");
      return `${parts[0].padStart(2, "0")}:${parts[1]}`;
    }
    return timeStr;
  }

  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // ---------------------------------------------------------------------------
  // Format and Preview Report: Generate the formatted incident report
  // ---------------------------------------------------------------------------
  function formatAndPreview() {
    const status = incidentStatusSelect.value;
    const issueTitle = issueTitleInput.value.trim();
    const dateTimeString = formatDateTime();
    const rootCause = rootCauseInput.value.trim();
    const output = generateOutput(
      status,
      issueTitle,
      dateTimeString,
      rootCause,
      serviceImpactEntries,
      actionTakenEntries,
      chronologyEntries
    );
    outputPreview.textContent = output;
  }

  // ---------------------------------------------------------------------------
  // Format Bullet Points: Convert multi-line text input into an array of strings
  // ---------------------------------------------------------------------------
  function formatBulletPoints(text) {
    if (!text.trim()) return [];
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  // ---------------------------------------------------------------------------
  // Date and Time Formatting: Format the incident start and end date/time string
  // ---------------------------------------------------------------------------
  function formatDateTime() {
    const dateValue = incidentDateInput.value;
    const startTimeValue = startTimeInput.value;
    const timeStatus = timeStatusSelect.value;

    if (!dateValue || !startTimeValue) {
      return "";
    }

    const startDateObj = new Date(dateValue + "T" + startTimeValue);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const startDay = startDateObj.getDate();
    const startMonth = monthNames[startDateObj.getMonth()];
    const startYear = startDateObj.getFullYear();
    const formattedStartTime = formatTimeTo12Hour(startTimeValue);

    let endTimeFormatted = "";

    if (timeStatus === "now") {
      const visibleEntries = chronologyEntries.filter((entry) => !entry.hidden);
      if (visibleEntries.length > 0) {
        const lastEntry = visibleEntries[visibleEntries.length - 1];
        endTimeFormatted = formatTimeTo12Hour(lastEntry.time);

        if (lastEntry.nextDay) {
          const nextDateObj = new Date(dateValue);
          nextDateObj.setDate(nextDateObj.getDate() + 1);
          const endDay = nextDateObj.getDate();
          const endMonth = monthNames[nextDateObj.getMonth()];
          const endYear = nextDateObj.getFullYear();
          return `${startDay} ${startMonth} ${startYear}, ${formattedStartTime} - ${endDay} ${endMonth} ${endYear}, ${endTimeFormatted}`;
        }
      } else {
        endTimeFormatted = "Now";
      }
    } else if (timeStatus === "timeline") {
      const visibleEntries = chronologyEntries.filter((entry) => !entry.hidden);
      if (visibleEntries.length > 0) {
        const lastEntry = visibleEntries[visibleEntries.length - 1];
        endTimeFormatted = formatTimeTo12Hour(lastEntry.time);

        if (lastEntry.nextDay) {
          const nextDateObj = new Date(dateValue);
          nextDateObj.setDate(nextDateObj.getDate() + 1);
          const endDay = nextDateObj.getDate();
          const endMonth = monthNames[nextDateObj.getMonth()];
          const endYear = nextDateObj.getFullYear();
          return `${startDay} ${startMonth} ${startYear}, ${formattedStartTime} - ${endDay} ${endMonth} ${endYear}, ${endTimeFormatted}`;
        }
      } else {
        endTimeFormatted = formatTimeTo12Hour(endTimeInput.value);
      }
    } else {
      const spansMidnight = spansMidnightCheckbox.checked;
      const endDateValue = spansMidnight ? endDateInput.value : dateValue;

      if (spansMidnight && endDateValue) {
        const endDateObj = new Date(endDateValue);
        const endDay = endDateObj.getDate();
        const endMonth = monthNames[endDateObj.getMonth()];
        const endYear = endDateObj.getFullYear();
        endTimeFormatted = formatTimeTo12Hour(endTimeInput.value);
        return `${startDay} ${startMonth} ${startYear}, ${formattedStartTime} - ${endDay} ${endMonth} ${endYear}, ${endTimeFormatted}`;
      } else {
        endTimeFormatted = formatTimeTo12Hour(endTimeInput.value);
      }
    }

    return `${startDay} ${startMonth} ${startYear}, ${formattedStartTime} - ${endTimeFormatted}`;
  }

  // ---------------------------------------------------------------------------
  // Format Time to 12-Hour: Convert a "HH:MM" time string to 12-hour format with AM/PM
  // ---------------------------------------------------------------------------
  function formatTimeTo12Hour(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  // ---------------------------------------------------------------------------
  // Generate Formatted Output: Build the final incident report message.
  // ---------------------------------------------------------------------------
  function generateOutput(
    status,
    issueTitle,
    dateTime,
    rootCause,
    serviceImpacts,
    actionsTaken,
    entries
  ) {
    let output = `[${status}]\n \n`;
    if (issueTitle) {
      output += `Issue: ${issueTitle}\n \n`;
    }
    if (dateTime) {
      output += `Date time: ${dateTime}\n \n`;
    }
    if (rootCause) {
      output += `Root Cause: ${rootCause}\n \n`;
    }
    if (serviceImpacts.length > 0) {
      output += "Service Impact:\n";
      for (const impact of serviceImpacts) {
        if (!impact.hidden) {
          output += `- ${impact.text}\n`;
        }
      }
      output += " \n";
    }
    if (actionsTaken.length > 0) {
      output += "Action Taken: \n";
      for (const action of actionsTaken) {
        if (!action.hidden) {
          output += `- ${action.text}\n`;
        }
      }
      output += " \n";
    }
    if (entries.length > 0) {
      output += "Incident Timeline and Chronology:\n";
      for (const entry of entries) {
        if (!entry.hidden) {
          let statusText = "";
          if (entry.status === "[Time]") {
            statusText = "[时间]";
          } else if (entry.status === "[Done]") {
            statusText = "[Done]";
          }
          output += `${entry.time} → ${entry.message} ${statusText}\n`;
        }
      }
    }
    return output.trim();
  }

  // ---------------------------------------------------------------------------
  // Animate Form Submission: Change the button text to show processing status
  // ---------------------------------------------------------------------------
  function animateFormSubmit() {
    const btn = form.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Formatted!';
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-magic mr-2"></i> Format Report';
      }, 1500);
    }, 800);
  }

  // ---------------------------------------------------------------------------
  // Copy Report to Clipboard: Allow user to copy formatted report with feedback
  // ---------------------------------------------------------------------------
  copyButton.addEventListener("click", function () {
    if (!outputPreview.textContent) return;
    navigator.clipboard
      .writeText(outputPreview.textContent)
      .then(() => {
        copyStatus.style.opacity = "1";
        copyButton.innerHTML = '<i class="fas fa-check mr-2"></i> Copied!';
        setTimeout(() => {
          copyStatus.style.opacity = "0";
          copyButton.innerHTML = '<i class="fas fa-copy mr-2"></i> Copy';
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        copyStatus.textContent = "Failed to copy!";
        copyStatus.style.opacity = "1";
        copyStatus.classList.add("text-red-400");
        setTimeout(() => {
          copyStatus.style.opacity = "0";
          copyStatus.textContent = "Copied to clipboard!";
          copyStatus.classList.remove("text-red-400");
        }, 2000);
      });
  });

  // ---------------------------------------------------------------------------
  // Form Submission: Animate submission, update output preview, and save state
  // ---------------------------------------------------------------------------
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    animateFormSubmit();
    formatAndPreview();
    saveFormValues();
  });

  // ---------------------------------------------------------------------------
  // Extract Status Marker: Retrieve any status marker from a text string
  // ---------------------------------------------------------------------------
  function extractStatusMarker(text) {
    const match = text.match(/\[(Time|Done|时间)\]$/);
    if (!match) return { message: text, status: "" };
    const status = match[1] === "时间" ? "[Time]" : `[${match[1]}]`;
    const message = text.substring(0, text.length - match[0].length).trim();
    return { message, status };
  }

  // ---------------------------------------------------------------------------
  // Auto-Sort Timeline Entries: Re-sort timeline entries when toggled
  // ---------------------------------------------------------------------------
  autoSortToggle.addEventListener("change", function () {
    if (this.checked && chronologyEntries.length > 0) {
      chronologyEntries.sort((a, b) => {
        if (a.nextDay !== b.nextDay) {
          return a.nextDay ? 1 : -1;
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
      updateChronologyInput();
    }
    formatAndPreview();
    updateChronologyPreview();
    saveFormValues();
  });

  // ---------------------------------------------------------------------------
  // Debounce Utility: Prevent excessive function calls (e.g., on input events)
  // ---------------------------------------------------------------------------
  const debounce = (fn, delay) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  // ---------------------------------------------------------------------------
  // Event Listeners for Live Formatting: Update output on input changes
  // ---------------------------------------------------------------------------
  [
    incidentStatusSelect,
    issueTitleInput,
    incidentDateInput,
    startTimeInput,
    endTimeInput,
    rootCauseInput,
    chronologiesInput,
    timeStatusSelect,
  ].forEach((input) => {
    input.addEventListener("input", debouncedFormat);
    if (input.tagName === "SELECT") {
      input.addEventListener("change", debouncedFormat);
    }
  });

  autoSortToggle.addEventListener("change", debouncedFormat);

  // ---------------------------------------------------------------------------
  // Close Modals on Outside Click: Hide modals when clicking outside
  // ---------------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    if (e.target === importModal) {
      importModal.classList.add("hidden");
      importText.value = "";
    }
    if (e.target === chronologyModal) {
      chronologyModal.classList.add("hidden");
    }
    if (e.target === editEntryModal) {
      editEntryModal.classList.add("hidden");
    }
  });

  // ---------------------------------------------------------------------------
  // Import Modal Handlers: Open, cancel, and confirm import of a formatted report
  // ---------------------------------------------------------------------------
  importButton.addEventListener("click", function () {
    importModal.classList.remove("hidden");
    importText.focus();
  });

  cancelImport.addEventListener("click", function () {
    importModal.classList.add("hidden");
    importText.value = "";
  });

  confirmImport.addEventListener("click", function () {
    const importTextData = importText.value.trim();
    if (!importTextData) {
      alert("Please paste a formatted report to import.");
      return;
    }
    const parsedData = parseFormattedReport(importTextData);
    fillFormWithImportedData(parsedData);
    importModal.classList.add("hidden");
    importText.value = "";
  });

  // ---------------------------------------------------------------------------
  // Edit Entry Modal Handlers: Cancel or save changes in the edit modal
  // ---------------------------------------------------------------------------
  cancelEditEntry.addEventListener("click", function () {
    editEntryModal.classList.add("hidden");
  });
  saveEditEntry.addEventListener("click", saveEditedEntry);
  addQuickAction.addEventListener("click", addQuickActionToChronology);
  quickActionText.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addQuickActionToChronology();
    }
  });
  resetButton.addEventListener("click", confirmReset);

  // ---------------------------------------------------------------------------
  // Load saved form values on startup
  // ---------------------------------------------------------------------------
  loadFormValues();
  if (timeStatusSelect.value === "now") {
    endTimeSection.classList.add("hidden");
  }

  // ---------------------------------------------------------------------------
  // Debounced formatting to reduce excessive processing on input changes
  // ---------------------------------------------------------------------------
  const debouncedFormat = debounce(() => {
    parseChronologyInput();
    updateChronologyPreview();
    formatAndPreview();
    saveFormValues();
  }, 500);
});
