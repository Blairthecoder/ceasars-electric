/* Ceasar's Electric - shared behavior + GA4 lead tracking */
(function () {
  // Mobile nav toggle
  var burger = document.querySelector('.hamburger');
  var mobile = document.querySelector('.mobile-nav');
  if (burger && mobile) {
    burger.addEventListener('click', function () {
      var isOpen = mobile.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    mobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobile.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && mobile.classList.contains('open')) {
        mobile.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
        burger.focus();
      }
    });
  }

  // gtag helper (safe if GA not loaded)
  function track(event, params) {
    try { if (typeof window.gtag === 'function') window.gtag('event', event, params || {}); } catch (e) {}
  }

  // Click-to-call tracking (all tel: links)
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('click_to_call', { event_category: 'lead', event_label: 'phone', phone: '337-309-4115' });
      track('generate_lead', { method: 'phone_call', value: 1 });
    });
  });

  // Email click tracking
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('email_click', { event_category: 'lead', event_label: 'email' });
    });
  });

  // Social profile click tracking
  document.querySelectorAll('a[data-social]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('social_click', { network: a.getAttribute('data-social') });
    });
  });

  // Quote form (contact page)
  var form = document.getElementById('quote-form');
  if (form) {
    var btn = form.querySelector('button[type="submit"]');
    var successBox = document.getElementById('form-success');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      // Netlify Forms: url-encoded POST to the page itself (form-name comes from the hidden field)
      var enc = Object.keys(data).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]); });
      function done() {
        track('generate_lead', { method: 'quote_form', value: 10, currency: 'USD' });
        track('form_submit', { form_id: 'quote-form' });
        if (successBox) { successBox.style.display = 'block'; form.style.display = 'none'; }
        window.scrollTo({ top: form.getBoundingClientRect().top + window.pageYOffset - 120, behavior: 'smooth' });
      }
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: enc.join('&')
      }).then(function (r) {
        if (!r.ok) throw new Error('bad status');
        done();
      }).catch(function () {
        // Fallback to a prefilled email if the submission is blocked
        var body = ['Name: ' + data.name, 'Phone: ' + data.phone, 'Email: ' + data.email,
          'Service: ' + data.service, 'Property: ' + data.property, 'ZIP: ' + data.zip,
          'Area: ' + data.area, 'Preferred date: ' + data.date, '', 'Details:', data.message].join('\n');
        window.location.href = 'mailto:ceasarselectric@gmail.com?subject=' +
          encodeURIComponent('New quote request - ' + (data.service || 'Electrical service')) +
          '&body=' + encodeURIComponent(body);
        done();
      });
    });
  }

  // Gallery lightbox (simple)
  var gitems = document.querySelectorAll('[data-lightbox]');
  if (gitems.length) {
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;background:rgba(8,21,37,.92);display:none;align-items:center;justify-content:center;z-index:200;padding:24px;cursor:zoom-out;';
    var bimg = document.createElement('img');
    bimg.style.cssText = 'max-width:92vw;max-height:88vh;border-radius:12px;box-shadow:0 30px 80px rgba(0,0,0,.6);';
    box.appendChild(bimg); document.body.appendChild(box);
    box.addEventListener('click', function () { box.style.display = 'none'; });
    gitems.forEach(function (el) {
      el.style.cursor = 'zoom-in';
      el.addEventListener('click', function () {
        var img = el.querySelector('img');
        if (img) { bimg.src = img.src; box.style.display = 'flex'; }
      });
    });
  }
})();
