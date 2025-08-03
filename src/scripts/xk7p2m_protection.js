// Right-click protection and developer tools detection
// Filename: xk7p2m_protection.js

document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("rightClickPopup");
  let popupTimeout;
  let devToolsOpen = false;

  // Sarcastic messages array
  const sarcasticMessages = [
    "🤡 Really? Developer tools? How original!",
    "🙄 Oh wow, F12. You must be a hacker now!",
    "😂 Inspect element won't help you here, buddy!",
    "🤦‍♂️ Code thieves gonna thieve...",
    "🎭 Plot twist: There's nothing interesting here!",
    "🤖 Beep boop, script kiddie detected!",
    "🔍 Looking for vulnerabilities? Good luck with that!",
    "🎪 Welcome to the circus of wannabe developers!",
  ];

  // Show notification
  function showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector(".sarcastic-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = "sarcastic-notification";
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  // Detect developer tools
  function detectDevTools() {
    const threshold = 160;
    if (
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold
    ) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        showNotification(
          sarcasticMessages[
            Math.floor(Math.random() * sarcasticMessages.length)
          ]
        );
      }
    } else {
      devToolsOpen = false;
    }
  }

  // Check for dev tools every 500ms
  setInterval(detectDevTools, 500);

  // Disable common keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
      showNotification("🚫 Keyboard shortcuts disabled! Nice try though 😈");
      return false;
    }
  });

  // Disable right-click context menu
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();

    // Clear any existing timeout
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }

    // Position and show popup
    if (popup) {
      const x = e.pageX;
      const y = e.pageY;

      popup.style.left = x + "px";
      popup.style.top = y + "px";
      popup.classList.remove("hidden");
      popup.classList.add("show");

      // Hide popup after 3 seconds
      popupTimeout = setTimeout(() => {
        popup.classList.remove("show");
        setTimeout(() => {
          popup.classList.add("hidden");
        }, 300);
      }, 3000);
    }

    return false;
  });

  // Hide popup on click anywhere
  document.addEventListener("click", function () {
    if (popup && popup.classList.contains("show")) {
      popup.classList.remove("show");
      setTimeout(() => {
        popup.classList.add("hidden");
      }, 300);
    }
  });

  // Disable text selection on right-click
  document.addEventListener("selectstart", function (e) {
    if (e.detail > 1) {
      e.preventDefault();
    }
  });

  // Console message for the brave souls
  console.clear();
  console.log(
    "%c🔥 WELCOME TO THE VOID 🔥",
    "color: #ff0000; font-size: 20px; font-weight: bold;"
  );
  console.log(
    "%cYou thought you were clever, huh? 😏",
    "color: #ff6600; font-size: 14px;"
  );
  console.log(
    "%cSorry to disappoint, but there's nothing here for you!",
    "color: #ffcc00; font-size: 12px;"
  );
  console.log(
    "%cMaybe try learning to code instead of stealing it? 🤷‍♂️",
    "color: #00ff00; font-size: 12px;"
  );

  // Anti-debugging
  (function () {
    setInterval(function () {
      if (
        window.console &&
        (console.firebug ||
          (console.table && /firebug/i.test(console.table.toString())))
      ) {
        showNotification("🔥 Firebug detected! How 2010 of you...");
      }
    }, 1000);
  })();
});

// Rick Roll function with enhanced features
function startRickRoll(event) {
  event.preventDefault();

  // Show final sarcastic message
  const finalMessages = [
    "🎵 Never gonna give you up! 😂",
    "🎉 Congratulations! You've been Rick Rolled! 🎊",
    "🤡 Did you really think I'd give you my code? LOL!",
    "🎭 Plot twist: This WAS the entertainment! 😈",
    "🎪 Welcome to the Rick Roll hall of fame! 🏆",
  ];

  const randomMessage =
    finalMessages[Math.floor(Math.random() * finalMessages.length)];

  // Create custom notification for Rick Roll
  const notification = document.createElement("div");
  notification.className = "sarcastic-notification rick-roll-notification";
  notification.innerHTML = `
    <div class="notification-content rick-roll-content">
      <span>${randomMessage}</span>
      <button onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);

  // Multiple Rick Roll options for maximum chaos
  const rickRollUrls = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&autoplay=1&start=0",
    "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&start=0&controls=0&modestbranding=1",
    "https://youtu.be/dQw4w9WgXcQ?autoplay=1&t=0s",
  ];

  const randomUrl =
    rickRollUrls[Math.floor(Math.random() * rickRollUrls.length)];

  // Try to open in new window with specific features
  const rickWindow = window.open(
    randomUrl,
    "rickroll",
    "width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no"
  );

  // If popup blocked, fallback to regular tab
  if (
    !rickWindow ||
    rickWindow.closed ||
    typeof rickWindow.closed == "undefined"
  ) {
    window.open(randomUrl, "_blank", "noopener,noreferrer");
  }

  // Hide the popup
  const popup = document.getElementById("rightClickPopup");
  if (popup) {
    popup.classList.remove("show");
    setTimeout(() => {
      popup.classList.add("hidden");
    }, 300);
  }

  // Log to console for extra effect
  console.log(
    "%c🎵 RICK ROLLED! 🎵",
    "color: #ff0000; font-size: 24px; font-weight: bold; background: yellow; padding: 10px;"
  );
  console.log(
    "%cNever gonna give you up, never gonna let you down! 😂",
    "color: #ff6600; font-size: 16px;"
  );

  return false;
}
