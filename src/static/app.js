document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Add a small helper to escape HTML content
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear activity select options before repopulating to avoid duplicates
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (bulleted list) or a fallback message
        const participants = details.participants || [];
        const participantsHTML = participants.length
          ? `<h5 class="participants-heading">Participants (${participants.length})</h5>
             <ul class="participants-list">
               ${participants
                 .map(
                   (p) =>
                     `<li>${escapeHtml(p)} <button class="participant-delete" data-activity="${escapeHtml(
                       name
                     )}" data-email="${escapeHtml(p)}">🗑</button></li>`
                 )
                 .join("")}
             </ul>`
          : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the newly registered participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  // Delegate click events for participant delete buttons (call backend and refresh)
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("participant-delete")) {
      const activity = event.target.dataset.activity;
      const email = event.target.dataset.email;

      try {
        const resp = await fetch(
          `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
          { method: "POST" }
        );
        const result = await resp.json();
        if (resp.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          messageDiv.classList.remove("hidden");
          // Refresh activities to reflect removal
          await fetchActivities();
          setTimeout(() => messageDiv.classList.add("hidden"), 5000);
        } else {
          messageDiv.textContent = result.detail || "Failed to unregister";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
        }
      } catch (err) {
        console.error("Error unregistering:", err);
        messageDiv.textContent = "Failed to unregister. Try again.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    }
  });

  fetchActivities();
});
