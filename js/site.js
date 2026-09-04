const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => {
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open", !expanded);
  });
  siteNav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    }),
  );
}
const enquiryForm = document.querySelector("#enquiry-form");
if (enquiryForm) {
  const status = enquiryForm.querySelector(".form-status");
  enquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!enquiryForm.checkValidity()) {
      enquiryForm.reportValidity();
      return;
    }
    status.textContent =
      "Thank you. Your enquiry is ready to send - please contact us by email or phone so we can respond directly.";
    status.classList.add("is-visible");
    enquiryForm.reset();
  });
}

// Register Service Worker for performance caching & offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.log("Service Worker registration failed:", err));
  });
}
