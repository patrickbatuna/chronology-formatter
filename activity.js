document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const form = document.getElementById("formatterForm");
  const activityInput = document.getElementById("activity");
  const activityDateInput = document.getElementById("activityDate");
  const activityTimeInput = document.getElementById("activityTime");
  const timeStatusSelect = document.getElementById("timeStatus");
  const endTimeContainer = document.getElementById("endTimeContainer");
  const endTimeInput = document.getElementById("endTime");
  const meetingLinkType = document.getElementById("meetingLinkType");
  const meetingLink = document.getElementById("meetingLink");
  const deploymentLink = document.getElementById("deploymentLink");
  const sanityLink = document.getElementById("sanityLink");
  const chronologiesInput = document.getElementById("chronologies");
  const outputPreview = document.getElementById("outputPreview");
  const copyButton = document.getElementById("copyButton");
  const copyStatus = document.getElementById("copyStatus");
  const autoSortToggle = document.getElementById("autoSortToggle");

  const spansMidnightCheckbox = document.getElementById("spansMidnight");
  const endDateContainer = document.getElementById("endDateContainer");
  const endDateInput = document.getElementById("endDate");
  const nextDayToggle = document.getElementById("nextDayToggle");
  const editEntryNextDay = document.getElementById("editEntryNextDay");

  const darkModeToggle = document.getElementById("darkModeToggle");

  const quickActionText = document.getElementById("quickActionText");
  const quickActionTime = document.getElementById("quickActionTime");
  const statusInProgress = document.getElementById("statusInProgress");
  const statusDone = document.getElementById("statusDone");
  const addQuickAction = document.getElementById("addQuickAction");
  const refreshTimeBtn = document.getElementById("refreshTimeBtn");
  const chronologyPreview = document.getElementById("chronologyPreview");

  const editEntryModal = document.getElementById("editEntryModal");
  const editEntryTime = document.getElementById("editEntryTime");
  const editEntryText = document.getElementById("editEntryText");
  const editEntryNoStatus = document.getElementById("editEntryNoStatus");
  const editEntryInProgress = document.getElementById("editEntryInProgress");
  const editEntryDone = document.getElementById("editEntryDone");
  const editEntryIndex = document.getElementById("editEntryIndex");
  const saveEditEntry = document.getElementById("saveEditEntry");
  const cancelEditEntry = document.getElementById("cancelEditEntry");
  const refreshEditTimeBtn = document.getElementById("refreshEditTimeBtn");

  const resetButton = document.getElementById("resetButton");
  const importButton = document.getElementById("importButton");
  const importModal = document.getElementById("importModal");
  const importText = document.getElementById("importText");
  const cancelImport = document.getElementById("cancelImport");
  const confirmImport = document.getElementById("confirmImport");

  const chronologyButton = document.getElementById("chronologyButton");
  const chronologyModal = document.getElementById("chronologyModal");
  const closeChronologyModal = document.getElementById("closeChronologyModal");
  const saveChronology = document.getElementById("saveChronology");
  const cancelChronology = document.getElementById("cancelChronology");

  const now = new Date();
  const formattedDate = now.toISOString().split("T")[0];
  const defaultTime = "05:00";

  let chronologyEntries = [];

  /**
   * Initializes dark mode based on the saved preference.
   */
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

  // Handle chronology modal open/close actions.
  chronologyButton.addEventListener("click", function () {
    chronologyModal.classList.remove("hidden");
  });
  closeChronologyModal.addEventListener("click", function () {
    chronologyModal.classList.add("hidden");
  });
  cancelChronology.addEventListener("click", function () {
    chronologyModal.classList.add("hidden");
  });

  saveChronology.addEventListener("click", function () {
    parseChronologyInput();
    updateChronologyPreview();
    if (timeStatusSelect.value === "endOfTimeline") {
      updateEndTimeFromTimelineMode();
    }
    formatAndPreview();
    saveFormValues();
    chronologyModal.classList.add("hidden");
    const originalButtonText = chronologyButton.innerHTML;
    chronologyButton.innerHTML =
      '<i class="fas fa-check mr-2"></i> Chronology Updated';
    setTimeout(() => {
      chronologyButton.innerHTML = originalButtonText;
    }, 1500);
  });

  /**
   * Parses the chronology input text into an array of entries.
   */
  function parseChronologyInput() {
    const chronologyText = chronologiesInput.value.trim();
    const originalEntries = [...chronologyEntries];
    chronologyEntries = [];
    if (!chronologyText) return;
    const lines = chronologyText.split("\n");
    let currentTime = "";
    let hidden = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith("-----")) continue;
      const nameTimeMatch = line.match(/.*\s(\d{2}:\d{2})$/);
      if (nameTimeMatch) {
        currentTime = nameTimeMatch[1];
        continue;
      }
      if (line.startsWith("#")) {
        const prefixLength = line.startsWith("##") ? 2 : 1;
        let message = line.substring(prefixLength).trim();
        let status = "";
        if (message.includes("[Time]")) {
          status = "[Time]";
          message = message.replace(/\[Time\]/g, "").trim();
        } else if (message.includes("[Done]")) {
          status = "[Done]";
          message = message.replace(/\[Done\]/g, "").trim();
        }
        if (message.includes("[HIDDEN]")) {
          hidden = true;
          message = message.replace(/\[HIDDEN\]/g, "").trim();
        } else {
          hidden = false;
        }
        message = message.charAt(0).toUpperCase() + message.slice(1);
        if (currentTime) {
          const matchingOriginal = originalEntries.find(
            (entry) =>
              entry.time === currentTime &&
              entry.message.toLowerCase() === message.toLowerCase()
          );
          chronologyEntries.push({
            time: currentTime,
            message: message,
            status: status,
            hidden: hidden,
            nextDay: matchingOriginal ? matchingOriginal.nextDay : false,
          });
        }
      }
    }
    if (autoSortToggle.checked && chronologyEntries.length > 0) {
      chronologyEntries.sort((a, b) => {
        if (a.nextDay !== b.nextDay) {
          return a.nextDay ? 1 : -1;
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    }
    if (
      chronologyEntries.length > 0 &&
      !chronologyEntries.some((entry) => entry.nextDay)
    ) {
      updateNextDayBasedOnTimeSequence();
    }
  }

  /**
   * Updates the nextDay flags based on the time sequence in the chronology.
   */
  function updateNextDayBasedOnTimeSequence() {
    if (chronologyEntries.length <= 1) return;
    chronologyEntries.forEach((entry) => {
      entry.nextDay = false;
    });
    let prevTime = timeToMinutes(chronologyEntries[0].time);
    for (let i = 1; i < chronologyEntries.length; i++) {
      const currentTime = timeToMinutes(chronologyEntries[i].time);
      if (currentTime < prevTime) {
        for (let j = i; j < chronologyEntries.length; j++) {
          chronologyEntries[j].nextDay = true;
        }
        break;
      }
      prevTime = currentTime;
    }
  }

  /**
   * Updates the quick action time field to the current time.
   */
  function updateQuickActionTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    quickActionTime.value = `${hours}:${minutes}`;
  }

  /**
   * Updates the edit entry time field to the current time with a visual pulse.
   */
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
  updateQuickActionTime();

  /**
   * Updates the chronology preview area based on parsed entries.
   */
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
          '<i class="fas fa-clock mr-1 text-gray-500 dark:text-gray-400"></i>';
      } else if (entry.status === "[Done]") {
        statusClass = "text-green-600 dark:text-green-400";
        statusIcon = '<i class="fas fa-check-circle mr-1"></i>';
      }
      const nextDayBadge = entry.nextDay
        ? '<span class="ml-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-1.5 py-0.5 rounded">Next day</span>'
        : "";
      const entryClasses = entry.hidden
        ? "chronology-entry entry-hidden"
        : "chronology-entry";
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
              : "text-gray-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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

  /**
   * Opens the edit modal for the timeline entry at the given index.
   */
  function handleEditEntry(index) {
    const entry = chronologyEntries[index];
    if (!entry) return;
    editEntryTime.value = entry.time;
    editEntryText.value = entry.message;
    editEntryNextDay.checked = entry.nextDay || false;
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

  /**
   * Toggles the visibility of the timeline entry at the given index.
   */
  function handleToggleVisibility(index) {
    const entry = chronologyEntries[index];
    if (!entry) return;
    entry.hidden = !entry.hidden;
    updateChronologyPreview();
    updateChronologyInput();
    formatAndPreview();
    saveFormValues();
  }

  /**
   * Deletes the timeline entry at the given index after confirmation.
   */
  function handleDeleteEntry(index) {
    if (confirm("Are you sure you want to delete this entry?")) {
      chronologyEntries.splice(index, 1);
      updateChronologyPreview();
      updateChronologyInput();
      if (timeStatusSelect.value === "endOfTimeline") {
        updateEndTimeFromTimelineMode();
      }
      formatAndPreview();
      saveFormValues();
    }
  }

  /**
   * Saves the edited entry from the edit modal.
   */
  function saveEditedEntry() {
    const index = parseInt(editEntryIndex.value);
    const entry = chronologyEntries[index];
    if (!entry) {
      console.error("Entry not found at index:", index);
      editEntryModal.classList.add("hidden");
      return;
    }
    entry.time = editEntryTime.value;
    entry.message = editEntryText.value;
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
    if (timeStatusSelect.value === "endOfTimeline") {
      updateEndTimeFromTimelineMode();
    }
    formatAndPreview();
    saveFormValues();
    editEntryModal.classList.add("hidden");
  }

  /**
   * Regenerates the chronology input text from the entries.
   */
  function updateChronologyInput() {
    const mockName = "User";
    let result = `----- ${formattedDate.replace(/-/g, "-")} -----\n\n`;
    for (const entry of chronologyEntries) {
      result += `${mockName} ${entry.time}\n\n`;
      let entryText = `## ${entry.message} ${entry.status}`;
      if (entry.hidden) {
        entryText += " [HIDDEN]";
      }
      result += `${entryText}\n\n`;
    }
    chronologiesInput.value = result.trim();
  }

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

  refreshTimeBtn.addEventListener("click", function () {
    updateQuickActionTime();
    this.classList.add("animate-pulse");
    setTimeout(() => {
      this.classList.remove("animate-pulse");
    }, 500);
  });

  refreshEditTimeBtn.addEventListener("click", updateEditEntryTime);

  /**
   * Adds a new quick action entry to the chronology.
   */
  function addQuickActionToChronology() {
    const actionText = quickActionText.value.trim();
    if (!actionText) {
      alert("Please enter an action description");
      quickActionText.focus();
      return;
    }
    let status = "";
    if (statusInProgress.checked) {
      status = "[Time]";
    } else if (statusDone.checked) {
      status = "[Done]";
    }
    chronologyEntries.push({
      time: quickActionTime.value,
      message: actionText,
      status: status,
      hidden: false,
      nextDay: nextDayToggle.checked,
    });
    if (autoSortToggle.checked && chronologyEntries.length > 0) {
      chronologyEntries.sort((a, b) => {
        if (a.nextDay !== b.nextDay) {
          return a.nextDay ? 1 : -1;
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
      updateChronologyInput();
    }
    updateChronologyPreview();
    formatAndPreview();
    saveFormValues();
    quickActionText.value = "";
    const originalButtonText = addQuickAction.innerHTML;
    addQuickAction.innerHTML = '<i class="fas fa-check mr-2"></i> Added!';
    setTimeout(() => {
      addQuickAction.innerHTML = originalButtonText;
    }, 1500);
  }

  /**
   * Saves current form values and state to localStorage.
   */
  function saveFormValues() {
    const values = {
      activity: activityInput.value,
      activityDate: activityDateInput.value,
      activityTime: activityTimeInput.value,
      timeStatus: timeStatusSelect.value,
      endTime: endTimeInput.value,
      meetingLinkType: meetingLinkType.value,
      meetingLink: meetingLink.value,
      deploymentLink: deploymentLink.value,
      sanityLink: sanityLink.value,
      chronologiesText: chronologiesInput.value,
      chronologyEntries: chronologyEntries,
      autoSort: autoSortToggle.checked,
      spansMidnight: spansMidnightCheckbox.checked,
      endDate: endDateInput.value,
    };
    localStorage.setItem("chronologyFormData", JSON.stringify(values));
  }

  /**
   * Loads saved form values and state from localStorage.
   */
  function loadFormValues() {
    const savedValues = localStorage.getItem("chronologyFormData");
    if (savedValues) {
      const values = JSON.parse(savedValues);
      activityInput.value = values.activity || "";
      activityDateInput.value = values.activityDate || formattedDate;
      activityTimeInput.value = values.activityTime || defaultTime;
      timeStatusSelect.value = values.timeStatus || "now";
      endTimeInput.value = values.endTime || "";
      meetingLinkType.value = values.meetingLinkType || "Zoom";
      meetingLink.value = values.meetingLink || "";
      deploymentLink.value = values.deploymentLink || "";
      sanityLink.value = values.sanityLink || "";
      if (values.chronologyEntries && values.chronologyEntries.length > 0) {
        chronologyEntries = values.chronologyEntries;
      } else {
        chronologiesInput.value = values.chronologiesText || "";
        parseChronologyInput();
      }
      autoSortToggle.checked =
        values.autoSort !== undefined ? values.autoSort : true;
      spansMidnightCheckbox.checked =
        values.spansMidnight !== undefined ? values.spansMidnight : false;
      if (spansMidnightCheckbox.checked && values.endDate) {
        endDateContainer.classList.remove("hidden");
        endDateInput.value = values.endDate;
      } else {
        endDateContainer.classList.add("hidden");
        endDateInput.value = "";
      }
      if (timeStatusSelect.value === "custom") {
        endTimeContainer.classList.remove("hidden");
        endTimeInput.disabled = false;
        spansMidnightCheckbox.disabled = false;
      } else if (timeStatusSelect.value === "endOfTimeline") {
        endTimeContainer.classList.remove("hidden");
        endTimeInput.disabled = true;
        spansMidnightCheckbox.disabled = true;
        updateEndTimeFromTimelineMode();
      } else if (timeStatusSelect.value === "now") {
        endTimeContainer.classList.add("hidden");
      }
      updateChronologyPreview();
      formatAndPreview();
    } else {
      activityDateInput.value = formattedDate;
      activityTimeInput.value = defaultTime;
    }
  }

  /**
   * Confirms and resets the form, clearing all values.
   */
  function confirmReset() {
    if (
      confirm(
        "Are you sure you want to reset the form? All entered data will be lost."
      )
    ) {
      activityInput.value = "";
      activityDateInput.value = formattedDate;
      activityTimeInput.value = defaultTime;
      timeStatusSelect.value = "now";
      endTimeInput.value = "";
      meetingLinkType.value = "Zoom";
      meetingLink.value = "";
      deploymentLink.value = "";
      sanityLink.value = "";
      chronologiesInput.value = "";
      autoSortToggle.checked = true;
      quickActionText.value = "";
      updateQuickActionTime();
      statusInProgress.checked = false;
      statusDone.checked = false;
      nextDayToggle.checked = false;
      endTimeContainer.classList.add("hidden");
      localStorage.removeItem("chronologyFormData");
      chronologyEntries = [];
      updateChronologyPreview();
      formatAndPreview();
      const originalButtonHTML = resetButton.innerHTML;
      resetButton.innerHTML = '<i class="fas fa-check mr-2"></i> Form Reset!';
      setTimeout(() => {
        resetButton.innerHTML = originalButtonHTML;
      }, 1500);
    }
  }

  /**
   * Updates the end time input based on the last visible timeline entry.
   */
  function updateEndTimeFromTimelineMode() {
    const visibleEntries = chronologyEntries.filter((entry) => !entry.hidden);
    if (visibleEntries.length > 0) {
      const lastEntry = visibleEntries[visibleEntries.length - 1];
      endTimeInput.value = lastEntry.time;
      if (lastEntry.nextDay) {
        spansMidnightCheckbox.checked = true;
        endDateContainer.classList.remove("hidden");
        const nextDay = new Date(activityDateInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        endDateInput.value = nextDay.toISOString().split("T")[0];
      } else {
        spansMidnightCheckbox.checked = false;
        endDateContainer.classList.add("hidden");
      }
    } else {
      endTimeInput.value = "";
      spansMidnightCheckbox.checked = false;
      endDateContainer.classList.add("hidden");
    }
  }

  /**
   * Parses a formatted report text into an object of form data.
   */
  function parseFormattedReport(text) {
    try {
      const lines = text.split("\n");
      let result = {
        activity: "",
        date: "",
        timeRange: "",
        chronologies: [],
        meetingLinkType: "Zoom",
        meetingLink: "",
        deploymentLink: "",
        sanityLink: "",
      };

      let waitingForLink = null;

      function getNextNonEmptyLine(index) {
        let j = index + 1;
        while (j < lines.length) {
          const l = lines[j].trim();
          if (l !== "") return l;
          j++;
        }
        return "";
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (waitingForLink) {
          if (line.startsWith("http") || line !== "") {
            if (waitingForLink === "Zoom") {
              result.meetingLinkType = "Zoom";
              result.meetingLink = line.trim();
            } else if (waitingForLink === "Teams") {
              result.meetingLinkType = "Teams";
              result.meetingLink = line.trim();
            } else if (waitingForLink === "Deployment") {
              result.deploymentLink = line.trim();
            } else if (waitingForLink === "Sanity") {
              result.sanityLink = line.trim();
            }
            waitingForLink = null;
            continue;
          }
        }

        const activityMatch = line.match(/^Activity:\s*(.*)$/i);
        if (activityMatch) {
          const activityText = activityMatch[1].trim();
          if (activityText) {
            result.activity = activityText;
          } else {
            result.activity = getNextNonEmptyLine(i);
          }
          continue;
        }

        const dateTimeMatch = line.match(/^Date\s*\/\s*Time:\s*(.*)$/i);
        if (dateTimeMatch) {
          let dateTimeStr = dateTimeMatch[1].trim();
          if (!dateTimeStr) {
            dateTimeStr = getNextNonEmptyLine(i);
          }
          const dtMatch = dateTimeStr.match(
            /(\d{1,2})\s+(\w+)\s+(\d{4}),\s+(.+)/
          );
          if (dtMatch) {
            const day = dtMatch[1];
            const month = dtMatch[2];
            const year = dtMatch[3];
            const timeRange = dtMatch[4];
            result.date = `${year}-${getMonthNumber(month)}-${day.padStart(
              2,
              "0"
            )}`;
            result.timeRange = timeRange;
          }
          continue;
        }

        if (
          /^(Activity Timeline & Chronology|Timeline & Chronology)\s*$/i.test(
            line
          )
        ) {
          continue;
        }

        if (/^Link\s+Zoom\s*:/i.test(line)) {
          const linkMatch = line.match(/Link\s+Zoom\s*:\s*(https?:\/\/\S+)/i);
          if (linkMatch) {
            result.meetingLinkType = "Zoom";
            result.meetingLink = linkMatch[1].trim();
          } else {
            waitingForLink = "Zoom";
          }
          continue;
        } else if (/^Link\s+Teams\s*:/i.test(line)) {
          const linkMatch = line.match(/Link\s+Teams\s*:\s*(https?:\/\/\S+)/i);
          if (linkMatch) {
            result.meetingLinkType = "Teams";
            result.meetingLink = linkMatch[1].trim();
          } else {
            waitingForLink = "Teams";
          }
          continue;
        } else if (/^(Link\s+Deployment|Deployment\s+Link)\s*:/i.test(line)) {
          const linkMatch = line.match(
            /(?:Link\s+Deployment|Deployment\s+Link)\s*:\s*(https?:\/\/\S+)/i
          );
          if (linkMatch) {
            result.deploymentLink = linkMatch[1].trim();
          } else {
            waitingForLink = "Deployment";
          }
          continue;
        } else if (
          /^(Link\s+Sanity|Sanity\s+check|Sanity\s+Link)\s*:/i.test(line)
        ) {
          const linkMatch = line.match(
            /(?:Link\s+Sanity|Sanity\s+check|Sanity\s+Link)\s*:\s*(https?:\/\/\S+)/i
          );
          if (linkMatch) {
            result.sanityLink = linkMatch[1].trim();
          } else {
            waitingForLink = "Sanity";
          }
          continue;
        } else if (/Link\s/.test(line)) {
          if (line.includes("Link Zoom")) {
            const zoomMatch = line.match(/Link\s+Zoom\s*:\s*(https?:\/\/\S+)/i);
            if (zoomMatch) {
              result.meetingLinkType = "Zoom";
              result.meetingLink = zoomMatch[1].trim();
            }
          }
          if (line.includes("Link Teams")) {
            const teamsMatch = line.match(
              /Link\s+Teams\s*:\s*(https?:\/\/\S+)/i
            );
            if (teamsMatch) {
              result.meetingLinkType = "Teams";
              result.meetingLink = teamsMatch[1].trim();
            }
          }
          if (line.includes("Link Deployment")) {
            const deployMatch = line.match(
              /Link\s+Deployment\s*:\s*(https?:\/\/\S+)/i
            );
            if (deployMatch) {
              result.deploymentLink = deployMatch[1].trim();
            }
          }
          if (line.includes("Link Sanity")) {
            const sanityMatch = line.match(
              /Link\s+Sanity\s*:\s*(https?:\/\/\S+)/i
            );
            if (sanityMatch) {
              result.sanityLink = sanityMatch[1].trim();
            }
          }
          continue;
        }

        const chronologyMatch = line.match(
          /(\d{2}:\d{2})\s+→\s+(.*?)(\s+\[(Done|时间)\])?$/
        );
        if (chronologyMatch) {
          const time = chronologyMatch[1];
          let message = chronologyMatch[2].trim();
          let status = chronologyMatch[3] ? chronologyMatch[3].trim() : "";
          if (status === "[时间]") status = "[Time]";
          result.chronologies.push({
            time,
            message,
            status,
            hidden: false,
          });
          continue;
        }
      }
      return result;
    } catch (error) {
      console.error("Error parsing formatted report:", error);
      return null;
    }
  }

  /**
   * Converts a month name to its corresponding number.
   */
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

  /**
   * Converts a 12-hour time string to 24-hour format.
   */
  function convertTo24Hour(timeStr) {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours);
    if (period.toUpperCase() === "PM" && hours < 12) {
      hours += 12;
    } else if (period.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  /**
   * Fills the form fields with imported data from a formatted report.
   */
  function fillFormWithImportedData(data) {
    if (!data) {
      alert(
        "Could not parse the formatted report. Please check the format and try again."
      );
      return;
    }
    resetFormWithoutConfirmation();
    if (data.activity) {
      activityInput.value = data.activity;
    }
    if (data.date) {
      activityDateInput.value = data.date;
    }
    if (data.timeRange) {
      const timeRangeMatch = data.timeRange.match(
        /(\d{1,2}:\d+\s+[AP]M)\s+-\s+(.*)/
      );
      if (timeRangeMatch) {
        const startTime = timeRangeMatch[1];
        const endTime = timeRangeMatch[2];
        activityTimeInput.value = convertTo24Hour(startTime);
        if (endTime.toLowerCase() === "now") {
          timeStatusSelect.value = "now";
          endTimeContainer.classList.add("hidden");
        } else if (endTime.toLowerCase() === "end of timeline") {
          timeStatusSelect.value = "endOfTimeline";
          endTimeContainer.classList.add("hidden");
        } else {
          timeStatusSelect.value = "custom";
          endTimeContainer.classList.remove("hidden");
          endTimeInput.value = convertTo24Hour(endTime);
        }
      }
    }
    if (
      data.meetingLinkType &&
      ["Zoom", "Teams"].includes(data.meetingLinkType)
    ) {
      meetingLinkType.value = data.meetingLinkType;
    }
    if (data.meetingLink) {
      meetingLink.value = data.meetingLink;
    }
    if (data.deploymentLink) {
      deploymentLink.value = data.deploymentLink;
    }
    if (data.sanityLink) {
      sanityLink.value = data.sanityLink;
    }
    if (data.chronologies && data.chronologies.length > 0) {
      chronologyEntries = data.chronologies.map((entry) => ({
        ...entry,
        nextDay: false,
      }));
      updateNextDayBasedOnTimeSequence();
      updateChronologyInput();
      updateChronologyPreview();
    }
    saveFormValues();
    formatAndPreview();
    const originalButtonText = importButton.innerHTML;
    importButton.innerHTML =
      '<i class="fas fa-check mr-1"></i> Import Successful!';
    setTimeout(() => {
      importButton.innerHTML = originalButtonText;
    }, 1500);
  }

  /**
   * Resets the form fields without confirmation.
   */
  function resetFormWithoutConfirmation() {
    activityInput.value = "";
    activityDateInput.value = formattedDate;
    activityTimeInput.value = defaultTime;
    timeStatusSelect.value = "now";
    endTimeInput.value = "";
    meetingLinkType.value = "Zoom";
    meetingLink.value = "";
    deploymentLink.value = "";
    sanityLink.value = "";
    chronologiesInput.value = "";
    autoSortToggle.checked = true;
    quickActionText.value = "";
    updateQuickActionTime();
    statusInProgress.checked = false;
    statusDone.checked = false;
    nextDayToggle.checked = false;
    endTimeContainer.classList.add("hidden");
    chronologyEntries = [];
    updateChronologyPreview();
  }

  /**
   * Converts a time string (HH:MM) to minutes.
   */
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Generates the final output text using form inputs and timeline entries.
   */
  function generateOutput(
    activity,
    dateTime,
    entries,
    meetingType,
    meetingLink,
    deploymentLinkValue,
    sanityLinkValue
  ) {
    let output = `Activity: \n${activity}\n`;
    output += `Date / Time: ${dateTime}\n \n`;
    output += `Activity Timeline & Chronology\n\n`;
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
    if (meetingLink) {
      output += `\nLink ${meetingType}: ${meetingLink}\n`;
    }
    if (deploymentLinkValue) {
      output += `Link Deployment: ${deploymentLinkValue}\n`;
    }
    if (sanityLinkValue) {
      output += `Link Sanity: ${sanityLinkValue}`;
    }
    return output.trim();
  }

  /**
   * Formats the date and time inputs into a human-readable string.
   */
  function formatDateTime() {
    const dateValue = activityDateInput.value;
    const timeValue = activityTimeInput.value;
    if (!dateValue || !timeValue) {
      return "";
    }
    const dateObj = new Date(dateValue + "T" + timeValue);
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
    const day = dateObj.getDate();
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    let startHours = dateObj.getHours();
    const startMinutes = String(dateObj.getMinutes()).padStart(2, "0");
    const startAmPm = startHours >= 12 ? "PM" : "AM";
    startHours = startHours % 12 || 12;
    const formattedStartTime = `${String(startHours).padStart(
      2,
      "0"
    )}:${startMinutes} ${startAmPm}`;

    let timeRange = "";
    if (timeStatusSelect.value === "now") {
      timeRange = `${formattedStartTime} - Now`;
    } else if (timeStatusSelect.value === "endOfTimeline") {
      let lastTime = endTimeInput.value;
      if (lastTime) {
        const [h, m] = lastTime.split(":").map(Number);
        const lastAmPm = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 || 12;
        const formattedLastTime = `${String(displayHour).padStart(
          2,
          "0"
        )}:${String(m).padStart(2, "0")} ${lastAmPm}`;
        if (spansMidnightCheckbox.checked && endDateInput.value) {
          const endDateObj = new Date(endDateInput.value);
          const endDay = endDateObj.getDate();
          const endMonth = monthNames[endDateObj.getMonth()];
          const endYear = endDateObj.getFullYear();
          timeRange = `${formattedStartTime} - ${endDay} ${endMonth} ${endYear}, ${formattedLastTime}`;
        } else {
          timeRange = `${formattedStartTime} - ${formattedLastTime}`;
        }
      } else {
        timeRange = `${formattedStartTime} - Now`;
      }
    } else {
      const endTimeValue = endTimeInput.value;
      if (endTimeValue) {
        if (spansMidnightCheckbox.checked && endDateInput.value) {
          const endDateObj = new Date(endDateInput.value);
          const endDay = endDateObj.getDate();
          const endMonth = monthNames[endDateObj.getMonth()];
          const endYear = endDateObj.getFullYear();
          const [endH, endM] = endTimeValue.split(":").map(Number);
          const endAmPm = endH >= 12 ? "PM" : "AM";
          const displayEndHour = endH % 12 || 12;
          const formattedEndTime = `${String(displayEndHour).padStart(
            2,
            "0"
          )}:${String(endM).padStart(2, "0")} ${endAmPm}`;
          timeRange = `${formattedStartTime} - ${endDay} ${endMonth} ${endYear}, ${formattedEndTime}`;
        } else {
          const [endH, endM] = endTimeValue.split(":").map(Number);
          const endAmPm = endH >= 12 ? "PM" : "AM";
          const displayEndHour = endH % 12 || 12;
          const formattedEndTime = `${String(displayEndHour).padStart(
            2,
            "0"
          )}:${String(endM).padStart(2, "0")} ${endAmPm}`;
          timeRange = `${formattedStartTime} - ${formattedEndTime}`;
        }
      } else {
        timeRange = formattedStartTime;
      }
    }
    return `${day} ${month} ${year}, ${timeRange}`;
  }

  /**
   * Returns the latest timeline entry time.
   */
  function getLastChronologyTime() {
    if (chronologyEntries.length === 0) {
      return null;
    }
    let sortedEntries = [...chronologyEntries].sort((a, b) => {
      return timeToMinutes(b.time) - timeToMinutes(a.time);
    });
    return sortedEntries[0].time;
  }

  timeStatusSelect.addEventListener("change", function () {
    if (this.value === "custom") {
      endTimeContainer.classList.remove("hidden");
      endTimeInput.disabled = false;
      spansMidnightCheckbox.disabled = false;
      if (spansMidnightCheckbox.checked) {
        endDateContainer.classList.remove("hidden");
      } else {
        endDateContainer.classList.add("hidden");
      }
    } else if (this.value === "endOfTimeline") {
      endTimeContainer.classList.remove("hidden");
      endTimeInput.disabled = true;
      spansMidnightCheckbox.disabled = true;
      updateEndTimeFromTimelineMode();
    } else if (this.value === "now") {
      endTimeContainer.classList.add("hidden");
    }
    formatAndPreview();
    saveFormValues();
  });

  spansMidnightCheckbox.addEventListener("change", function () {
    if (this.checked) {
      endDateContainer.classList.remove("hidden");
      const nextDay = new Date(activityDateInput.value);
      nextDay.setDate(nextDay.getDate() + 1);
      endDateInput.value = nextDay.toISOString().split("T")[0];
    } else {
      endDateContainer.classList.add("hidden");
    }
    formatAndPreview();
    saveFormValues();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    animateFormSubmit();
    formatAndPreview();
    saveFormValues();
  });

  autoSortToggle.addEventListener("change", function () {
    if (this.checked && chronologyEntries.length > 0) {
      chronologyEntries.sort((a, b) => {
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
      updateChronologyInput();
    }
    formatAndPreview();
    updateChronologyPreview();
    saveFormValues();
  });

  /**
   * Generates the formatted output and updates the preview area.
   */
  function formatAndPreview() {
    const activity = activityInput.value.trim();
    const dateTimeString = formatDateTime();
    const meetingTypeValue = meetingLinkType.value;
    const meetingLinkValue = meetingLink.value.trim();
    const deploymentLinkValue = deploymentLink.value.trim();
    const sanityLinkValue = sanityLink.value.trim();

    const output = generateOutput(
      activity,
      dateTimeString,
      chronologyEntries,
      meetingTypeValue,
      meetingLinkValue,
      deploymentLinkValue,
      sanityLinkValue
    );
    outputPreview.textContent = output;
  }

  /**
   * Animates the form submit button.
   */
  function animateFormSubmit() {
    const btn = form.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Formatted!';
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-magic mr-2"></i> Format Chronology';
      }, 1500);
    }, 800);
  }

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

  /**
   * Creates a debounced version of a function.
   */
  const debounce = (fn, delay) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  const debouncedFormat = debounce(() => {
    parseChronologyInput();
    updateChronologyPreview();
    formatAndPreview();
    saveFormValues();
  }, 500);

  const debouncedFormatOnly = debounce(() => {
    formatAndPreview();
    saveFormValues();
  }, 500);

  const formInputs = [
    activityInput,
    activityDateInput,
    activityTimeInput,
    meetingLinkType,
    meetingLink,
    deploymentLink,
    sanityLink,
  ];

  formInputs.forEach((input) => {
    input.addEventListener("input", debouncedFormatOnly);
    if (input.tagName === "SELECT") {
      input.addEventListener("change", debouncedFormatOnly);
    }
  });

  chronologiesInput.addEventListener("input", debouncedFormat);

  const updateOnlyInputs = [
    meetingLinkType,
    meetingLink,
    deploymentLink,
    sanityLink,
  ];

  updateOnlyInputs.forEach((input) => {
    input.addEventListener("input", () => {
      formatAndPreview();
      saveFormValues();
    });
    if (input.tagName === "SELECT") {
      input.addEventListener("change", () => {
        formatAndPreview();
        saveFormValues();
      });
    }
  });

  [endTimeInput, spansMidnightCheckbox, endDateInput].forEach((input) => {
    input.addEventListener("input", () => {
      formatAndPreview();
      saveFormValues();
    });
    if (input.tagName === "SELECT") {
      input.addEventListener("change", () => {
        formatAndPreview();
        saveFormValues();
      });
    }
  });

  autoSortToggle.addEventListener("change", debouncedFormat);

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

  loadFormValues();
});
