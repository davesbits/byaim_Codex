import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://losdkdhitteqwomunblt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2RrZGhpdHRlcXdvbXVuYmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDc5MzUsImV4cCI6MjA3OTU4MzkzNX0.pDDcP6K8F_X2uZ7Sjh_amNDY9VOUVOEz0oWNYWpXezc";

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
  const loginLink  = document.querySelector("[data-role='login-link']");
  const logoutLink = document.querySelector("[data-role='logout-link']");
  const authOnlyLinks = document.querySelectorAll("[data-requires-auth='true']");

  const user = await getUser();
  const isAuthed = !!user;

  // nav toggle
  if (loginLink)  loginLink.style.display  = isAuthed ? "none" : "inline-flex";
  if (logoutLink) logoutLink.style.display = isAuthed ? "inline-flex" : "none";

  // lightly disable protected links for logged-out state
  authOnlyLinks.forEach((el) => {
    if (!isAuthed) {
      el.classList.add("nav-link--disabled");
      el.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "login.html";
      });
    }
  });

  // hard-protect pages by filename
  const path = window.location.pathname.split("/").pop();
  const protectedPages = ["members.html", "business.html", "support.html"];
  if (!isAuthed && protectedPages.includes(path)) {
    window.location.href = "login.html";
  }

  // === LOGIN PAGE CONTROLS ===
  const googleBtn = document.querySelector("[data-auth-provider='google']");
  const githubBtn = document.querySelector("[data-auth-provider='github']");
  const emailBtn  = document.querySelector("#btn-email-login");
  const phoneBtn  = document.querySelector("#btn-phone-login");

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        await supabase.auth.signInWithOAuth({ provider: "google" });
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
        await supabase.auth.signInWithOAuth({ provider: "github" });
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
        const { error } = await supabase.auth.signInWithOtp({ email });
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
