import { getCurrentUser, signInWithMagicLink, signOut } from "./auth.js";

async function initAuth() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userEmailSpan = document.querySelector("[data-user-email]");

  const user = await getCurrentUser();

  if (user) {
    if (userEmailSpan) userEmailSpan.textContent = user.email;
    if (loginBtn) loginBtn.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
  } else {
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = window.prompt("Enter your email to sign in:");
      if (!email) return;
      try {
        await signInWithMagicLink(email);
        alert("Check your email for a sign-in link.");
      } catch (err) {
        console.error("Sign-in error", err);
        alert("There was a problem sending the magic link.");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut();
      } catch (err) {
        console.error("Sign-out error", err);
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
