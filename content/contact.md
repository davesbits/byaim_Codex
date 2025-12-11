---
title: byAIm – Contact & Booking
bg_class: contact-bg
---

<section class="section-block">
    <div class="section-kicker">Contwaat & booking</div>
    <h1 class="section-heading">Start with a question or a simple booking request.</h1>
    <p class="section-text">
      Use this form to ask a question, suggest a project, or request a charitable
      session. In future, this page will connect to <strong>AI helpers</strong> to
      collect more detail and <strong>Twilio-powered SMS updates</strong>, but for now
      it's a simple, low-pressure contact form.
    </p>
  </section>

  <section class="section-block">
    <div class="contact-grid">
      <form id="contact-form">
        <div class="form-group">
          <label for="name" class="form-label">Your name</label>
          <input id="name" name="name" type="text" class="form-input" autocomplete="name" required />
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email address</label>
          <input id="email" name="email" type="email" class="form-input" autocomplete="email" required />
          <div class="form-helper">
            I'll reply here first. SMS and other options may be added later.
          </div>
        </div>

        <div class="form-group">
          <label for="topic" class="form-label">What do you need?</label>
          <select id="topic" name="topic" class="form-select">
            <option value="question">I have a general question</option>
            <option value="booking">I'd like to book a charitable session</option>
            <option value="organisation">I'm asking on behalf of a charity / organisation</option>
            <option value="cost-tools">I'd like to help test the cost tools</option>
          </select>
        </div>

        <div class="form-group">
          <label for="message" class="form-label">Tell me a little bit about your situation</label>
          <textarea id="message" name="message" class="form-textarea" placeholder="Anything you'd like to share – diagnoses, energy levels, tech setup, or just what's frustrating you most." required></textarea>
        </div>

        <div class="form-group">
          <label for="preferred" class="form-label">Preferred reply type</label>
          <select id="preferred" name="preferred" class="form-select">
            <option value="email">Email only</option>
            <option value="phone">Phone / voice call (details later)</option>
            <option value="either">Either is fine</option>
          </select>
          <div class="form-helper">
            In future, this can include SMS and other options.
          </div>
        </div>

        <button type="submit" class="btn btn--primary" id="submit-btn">Send message</button>
        <div id="form-status" class="form-helper"></div>
      </form>

      <div>
        <div class="section-subheading">What happens next</div>
        <p class="section-text">
          Right now, I'm keeping things intentionally small. As byAIm grows towards
          its <strong>planned public launch in 2026</strong>, this page will become
          the hub for:
        </p>

        <ul class="checklist">
          <li>AI-assisted question triage (so you don't have to write long emails).</li>
          <li>Automated suggestions for sessions and follow-ups.</li>
          <li>SMS reminders and updates for people who prefer texts.</li>
          <li>A clearer pathway for charities and organisations.</li>
        </ul>

        <p class="section-meta">
          For now, treat this as a "note to future us". Once your backend is ready,
          you'll connect this form to Supabase functions, Twilio, and your AI agents.
        </p>
      </div>
    </div>
  </section>

<script type="module">
  import { supabase } from './auth.js';

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const formStatus = document.getElementById('form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    formStatus.textContent = '';
    formStatus.className = 'form-helper';

    // Gather form data
    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      topic: form.topic.value,
      message: form.message.value.trim(),
      preferred_reply: form.preferred.value,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([formData]);

      if (error) throw error;

      // Success
      formStatus.textContent = '✓ Message sent! I\'ll be in touch soon.';
      formStatus.className = 'form-helper form-success';
      form.reset();

    } catch (err) {
      console.error('Contact form error:', err);
      formStatus.textContent = '✗ Something went wrong. Please try again or email directly.';
      formStatus.className = 'form-helper form-error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });
</script>
