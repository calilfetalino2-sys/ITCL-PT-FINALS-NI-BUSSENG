const contactFormEndpoint = "https://script.google.com/macros/s/AKfycby-km3K07ruu4gq1Ep1wQFSucyj7zlGXY-VvpQP-Jac5WWymMamZwFVnfUsIKxHUEEw/exec";
const contactForm = document.querySelector(".contact-form");
const contactFormStatus = document.getElementById("contact-form-status");
const contactSubmitButton = contactForm.querySelector('button[type="submit"]');

function setContactFormStatus(state, message) {
  contactFormStatus.dataset.state = state;
  contactFormStatus.textContent = message;
}

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactFormEndpoint) {
    setContactFormStatus("error", "The form is not connected. Please try again later.");
    return;
  }

  const formData = new FormData(contactForm);
  contactSubmitButton.disabled = true;
  setContactFormStatus("pending", "Sending your message...");

  const frame = document.createElement("iframe");
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const frameName = `contact-submit-${requestId}`;
  frame.name = frameName;
  frame.title = "Contact form submission";
  frame.hidden = true;

  const submission = document.createElement("form");
  submission.method = "POST";
  submission.action = contactFormEndpoint;
  submission.target = frameName;
  submission.hidden = true;

  const requestIdField = document.createElement("input");
  requestIdField.type = "hidden";
  requestIdField.name = "requestId";
  requestIdField.value = requestId;
  submission.appendChild(requestIdField);

  for (const [name, value] of formData.entries()) {
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = name === "topic" ? "subject" : name;
    field.value = String(value);
    submission.appendChild(field);
  }

  let timeoutId;
  let completed = false;
  const finishSubmission = (success, timedOut = false) => {
    if (completed) return;
    completed = true;
    window.removeEventListener("message", handleSubmissionResponse);
    window.clearTimeout(timeoutId);
    frame.remove();
    submission.remove();
    contactSubmitButton.disabled = false;

    if (success) {
      contactForm.reset();
      setContactFormStatus("success", "Your message has been sent successfully.");
    } else if (timedOut) {
      setContactFormStatus("error", "The form was submitted, but Google did not confirm the save. Please check the spreadsheet before resubmitting.");
    } else {
      setContactFormStatus("error", "Your message could not be sent. Please check the details and try again.");
    }
  };

  const handleSubmissionResponse = (messageEvent) => {
    const response = messageEvent.data;
    if (
      !response ||
      response.type !== "contact-form-result" ||
      response.requestId !== requestId ||
      typeof response.success !== "boolean"
    ) return;
    finishSubmission(response.success);
  };

  window.addEventListener("message", handleSubmissionResponse);
  document.body.append(frame, submission);
  timeoutId = window.setTimeout(() => finishSubmission(false, true), 20000);

  try {
    submission.submit();
  } catch (error) {
    console.error("Could not submit contact form.", error);
    finishSubmission(false);
  }
});

    const topicLinks = document.querySelectorAll('a[href="#vaping"], a[href="#smoking"]');
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      document.documentElement.classList.add("has-scroll-effects");
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      document.querySelectorAll(".scroll-reveal").forEach((section) => {
        revealObserver.observe(section);
      });
    }

    const scrambleTimers = new WeakMap();
    const scrambleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    function scrambleHeading(heading) {
      if (prefersReducedMotion) return;

      const originalText = heading.textContent;
      const characters = Array.from(originalText);
      const startedAt = performance.now();
      const duration = 650;
      const previousTimer = scrambleTimers.get(heading);
      if (previousTimer) clearInterval(previousTimer);

      const timer = setInterval(() => {
        const progress = Math.min((performance.now() - startedAt) / duration, 1);
        const settledCharacters = Math.floor(progress * characters.length);
        heading.textContent = characters.map((character, index) => {
          if (/\s/.test(character) || index < settledCharacters) return character;
          return scrambleCharacters[Math.floor(Math.random() * scrambleCharacters.length)];
        }).join("");

        if (progress === 1) {
          clearInterval(timer);
          scrambleTimers.delete(heading);
          heading.textContent = originalText;
        }
      }, 30);

      scrambleTimers.set(heading, timer);
    }

    topicLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const article = document.getElementById(link.getAttribute("href").slice(1));
        const explainer = article.querySelector("details");
        explainer.open = true;
        scrambleHeading(article.querySelector(".story-heading h1"));
      });
    });
 