import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://losdkdhitteqwomunblt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2RrZGhpdHRlcXdvbXVuYmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDc5MzUsImV4cCI6MjA3OTU4MzkzNX0.pDDcP6K8F_X2uZ7Sjh_amNDY9VOUVOEz0oWNYWpXezc";

// Ensure OAuth and magic links return to the current site (avoids stale redirect domains)
const REDIRECT_TO = `${window.location.origin}/app.html`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("getUser error:", error);
    return null;
  }
  return data.user;
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginLink = document.querySelector("[data-role='login-link']");
  const logoutLink = document.querySelector("[data-role='logout-link']");
  // Only select auth-gated links inside header nav (not body content links)
  const authOnlyLinks = document.querySelectorAll("header nav [data-requires-auth='true']");
  const nav = document.querySelector("header nav");

  const user = await getUser();
  const isAuthed = !!user;

  // Ensure crawler link exists for authed users (guards against stale builds/caches)
  if (isAuthed && nav && !nav.querySelector("[data-role='crawler-link']")) {
    const crawler = document.createElement("a");
    crawler.href = "app.html";
    crawler.textContent = "App";
    crawler.className = "nav-link";
    crawler.dataset.role = "crawler-link";
    crawler.dataset.requiresAuth = "true";
    // insert before login/logout links if present
    const anchorPoint = loginLink || logoutLink;
    if (anchorPoint && anchorPoint.parentElement === nav) {
      nav.insertBefore(crawler, anchorPoint);
    } else {
      nav.appendChild(crawler);
    }
  }

  // nav toggle
  if (loginLink) loginLink.classList.toggle("is-hidden", isAuthed);
  if (logoutLink) logoutLink.classList.toggle("is-hidden", !isAuthed);

  // Disable protected links when logged out; restore them when authed
  authOnlyLinks.forEach((el) => {
    if (!isAuthed) {
      if (!el.dataset.authGuardAttached) {
        el.classList.add("nav-link--disabled");
        el.dataset.authGuardAttached = "true";
        el.addEventListener("click", (e) => {
          e.preventDefault();
          window.location.href = "login.html";
        });
      }
    } else {
      // Re-enable if a prior guard was applied
      if (el.classList.contains("nav-link--disabled")) {
        const restored = el.cloneNode(true);
        restored.classList.remove("nav-link--disabled");
        restored.dataset.authGuardAttached = "";
        el.replaceWith(restored);
      }
    }
  });

  // hard-protect pages by filename
  const path = window.location.pathname.split("/").pop();
  const protectedPages = ["crawler.html"]; // Protected crawler page
  if (!isAuthed && protectedPages.includes(path)) {
    window.location.href = "login.html";
  }

  // === LOGIN PAGE CONTROLS ===
  const googleBtn = document.querySelector("[data-auth-provider='google']");
  const githubBtn = document.querySelector("[data-auth-provider='github']");
  const emailBtn = document.querySelector("#btn-email-login");
  const phoneBtn = document.querySelector("#btn-phone-login");

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: REDIRECT_TO },
        });
        // redirect handled by Supabase project settings
      } catch (e) {
        console.error(e);
        alert("Google login failed.");
      }
    });
  }

  if (githubBtn) {
    githubBtn.addEventListener("click", async () => {
      try {
        await supabase.auth.signInWithOAuth({
          provider: "github",
          options: { redirectTo: REDIRECT_TO },
        });
      } catch (e) {
        console.error(e);
        alert("GitHub login failed.");
      }
    });
  }

  if (emailBtn) {
    emailBtn.addEventListener("click", async () => {
      const email = window.prompt("Enter your email for a magic login link:");
      if (!email) return;
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: REDIRECT_TO },
        });
        if (error) {
          console.error(error);
          alert("Could not send login email: " + error.message);
        } else {
          alert("Check your email for a login link.");
        }
      } catch (e) {
        console.error(e);
        alert("Could not send login email.");
      }
    });
  }

  if (phoneBtn) {
    phoneBtn.addEventListener("click", async () => {
      const phone = window.prompt("Enter your phone number (with country code):");
      if (!phone) return;
      try {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) {
          console.error(error);
          alert("Could not send SMS code: " + error.message);
        } else {
          alert("Check your phone for the code / link.");
        }
      } catch (e) {
        console.error(e);
        alert("Could not send SMS login.");
      }
    });
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
  }
});
