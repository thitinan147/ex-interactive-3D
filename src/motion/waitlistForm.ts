type StatusKind = "idle" | "loading" | "success" | "error";

function setStatus(
  el: HTMLElement | null,
  kind: StatusKind,
  message: string,
) {
  if (!el) return;
  el.hidden = kind === "idle" || !message;
  el.textContent = message;
  el.dataset.kind = kind;
}

export function bindWaitlistForm() {
  const form = document.querySelector<HTMLFormElement>("#order-form");
  if (!form) return;

  const status = document.querySelector<HTMLElement>("#order-form-status");
  const btn = form.querySelector<HTMLButtonElement>("button[type=submit]");
  const defaultLabel = btn?.dataset.submitLabel ?? btn?.textContent ?? "Join waitlist";
  const endpoint = form.dataset.endpoint?.trim() ?? "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = new FormData(form).get("email");
    if (typeof email !== "string" || !email.includes("@")) {
      setStatus(status, "error", "Enter a valid work email.");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending…";
    }
    setStatus(status, "loading", "Submitting…");

    try {
      if (!endpoint) {
        await new Promise((r) => window.setTimeout(r, 450));
        form.reset();
        setStatus(
          status,
          "success",
          "Registered (demo). Add PUBLIC_FORMSPREE_ENDPOINT to collect live leads.",
        );
        if (btn) btn.textContent = "Registered";
      } else {
        const body = new FormData(form);
        body.delete("_gotcha");
        const res = await fetch(endpoint, {
          method: "POST",
          body,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        form.reset();
        setStatus(status, "success", "You’re on the waitlist. We’ll be in touch.");
        if (btn) btn.textContent = "Registered";
      }

      window.setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = defaultLabel;
        }
        setStatus(status, "idle", "");
      }, 3200);
    } catch {
      setStatus(
        status,
        "error",
        "Couldn’t submit right now. Try again in a moment.",
      );
      if (btn) {
        btn.disabled = false;
        btn.textContent = defaultLabel;
      }
    }
  });
}
