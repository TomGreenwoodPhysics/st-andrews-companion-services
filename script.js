const menuToggle = document.querySelector("#menu-toggle");
const siteNav = document.querySelector("#site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const faqQuestions = document.querySelectorAll(".faq-question");
const enquiryForm = document.querySelector("#enquiry-form");
const formMessage = document.querySelector("#form-message");
const yearElement = document.querySelector("#year");
const siteHeader = document.querySelector(".site-header");
const messageTextarea = document.querySelector("#message");
const messageCount = document.querySelector("#message-count");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const requiredCheckboxGroups = [
  {
    name: "companionship",
    message: "Please choose at least one type of companionship.",
  },
  {
    name: "personality",
    message: "Please choose at least one companion preference, or choose ‘No strong preference’.",
  },
  {
    name: "availability",
    message: "Please choose at least one preferred day/time, or choose ‘Flexible’.",
  },
];

function closeMobileMenu() {
  if (!siteNav || !menuToggle) return;

  siteNav.classList.remove("open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "☰";
}

function getHeaderHeight() {
  return siteHeader ? siteHeader.offsetHeight : 0;
}

function getTargetFromHash(hash) {
  if (!hash || hash === "#") return null;

  const id = decodeURIComponent(hash.slice(1));
  return document.getElementById(id);
}

function scrollToSection(hash, behavior = "smooth") {
  const target = getTargetFromHash(hash);

  if (!target) return false;

  const headerHeight = getHeaderHeight();
  const viewportHeight = window.innerHeight - headerHeight;
  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  const targetHeight = target.offsetHeight;

  let scrollPosition;

  if (targetHeight < viewportHeight) {
    scrollPosition = targetTop - headerHeight - ((viewportHeight - targetHeight) / 2);
  } else {
    const heading = target.querySelector(".section-heading, h1, h2") || target;
    const headingTop = heading.getBoundingClientRect().top + window.scrollY;
    const headingGap = Math.min(170, Math.max(90, viewportHeight * 0.18));

    scrollPosition = headingTop - headerHeight - headingGap;
  }

  window.scrollTo({
    top: Math.max(0, scrollPosition),
    behavior,
  });

  return true;
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map((input) => input.value);
}

function validateCheckboxGroup(group) {
  const inputs = Array.from(document.querySelectorAll(`input[name="${group.name}"]`));

  if (inputs.length === 0) return true;

  const fieldset = document.querySelector(`[data-required-group="${group.name}"]`);
  const errorElement = document.querySelector(`[data-error-for="${group.name}"]`);
  const isValid = inputs.some((input) => input.checked);

  inputs[0].setCustomValidity(isValid ? "" : group.message);

  if (fieldset) {
    fieldset.classList.toggle("invalid", !isValid);
  }

  if (errorElement) {
    errorElement.textContent = isValid ? "" : group.message;
  }

  return isValid;
}

function validateRequiredCheckboxGroups() {
  return requiredCheckboxGroups.every((group) => validateCheckboxGroup(group));
}

function scrollToFirstProblem() {
  const firstInvalidGroup = document.querySelector(".form-fieldset.invalid");
  const firstInvalidField = enquiryForm ? enquiryForm.querySelector(":invalid") : null;
  const target = firstInvalidGroup || firstInvalidField;

  if (!target) return;

  const headerHeight = getHeaderHeight();
  const targetTop = target.getBoundingClientRect().top + window.scrollY;

  window.scrollTo({
    top: Math.max(0, targetTop - headerHeight - 40),
    behavior: "smooth",
  });
}

function updateMessageCount() {
  if (!messageTextarea || !messageCount) return;

  const maxLength = Number(messageTextarea.getAttribute("maxlength")) || 800;
  const currentLength = messageTextarea.value.length;

  messageCount.textContent = `${currentLength} / ${maxLength} characters`;
  messageCount.classList.toggle("near-limit", currentLength >= maxLength * 0.9);
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");

    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "×" : "☰";
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");

  if (!link) return;

  const hash = link.getAttribute("href");
  const target = getTargetFromHash(hash);

  if (!target) return;

  event.preventDefault();

  scrollToSection(hash);
  closeMobileMenu();
  history.pushState(null, "", hash);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeMobileMenu();
  });
});

faqQuestions.forEach((question) => {
  question.addEventListener("click", () => {
    const faqItem = question.closest(".faq-item");
    const isOpen = faqItem.classList.toggle("open");

    question.setAttribute("aria-expanded", String(isOpen));
    question.querySelector("span").textContent = isOpen ? "−" : "+";
  });
});

requiredCheckboxGroups.forEach((group) => {
  document.querySelectorAll(`input[name="${group.name}"]`).forEach((input) => {
    input.addEventListener("change", () => validateCheckboxGroup(group));
  });
});

if (messageTextarea) {
  messageTextarea.addEventListener("input", updateMessageCount);
  updateMessageCount();
}

if (enquiryForm) {
  enquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const groupsAreValid = validateRequiredCheckboxGroups();

    if (!groupsAreValid || !enquiryForm.checkValidity()) {
      enquiryForm.reportValidity();
      scrollToFirstProblem();
      return;
    }

    const formData = new FormData(enquiryForm);
    const fullName = String(formData.get("name") || "").trim();
    const firstName = fullName.split(/\s+/)[0] || "there";

    const enquiry = {
      enquirerName: fullName,
      email: formData.get("email"),
      phone: formData.get("phone"),
      contactMethod: formData.get("contactMethod"),
      relationship: formData.get("relationship"),
      recipientName: formData.get("recipientName"),
      area: formData.get("area"),
      companionshipWanted: getCheckedValues("companionship"),
      preferredCompanionStyle: getCheckedValues("personality"),
      companionGenderPreference: formData.get("companionGender"),
      availability: getCheckedValues("availability"),
      message: String(formData.get("message") || "").trim(),
      serviceBoundaryConfirmed: formData.get("serviceBoundary") === "on",
      consentGiven: formData.get("consent") === "on",
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem("latestCompanionEnquiry", JSON.stringify(enquiry, null, 2));
    console.log("Prototype enquiry:", enquiry);

    if (formMessage) {
      formMessage.textContent = `Thanks, ${firstName}. Your enquiry has been received. We will contact you within 1–2 working days to discuss whether the service is suitable. Prototype note: this form is not connected to email yet.`;
      formMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    enquiryForm.reset();
    updateMessageCount();
    requiredCheckboxGroups.forEach((group) => validateCheckboxGroup(group));
  });
}

window.addEventListener("load", () => {
  if (window.location.hash) {
    setTimeout(() => {
      scrollToSection(window.location.hash, "auto");
    }, 50);
  }
});
