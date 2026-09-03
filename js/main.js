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

  function placementFor(element) {
    if (element.closest('.main-nav')) return 'desktop_navigation';
    if (element.closest('.mobile-nav')) return 'mobile_navigation';
    if (element.closest('.call-bar')) return 'mobile_sticky_bar';
    if (element.closest('.cta-band')) return 'footer_cta';
    if (element.closest('.side-cta')) return 'service_sidebar';
    return 'page_content';
  }

  // Preserve service intent when a visitor moves from a service page to the form.
  var serviceByPath = {
    '/services/residential-electrician.html': 'Residential Electrical Work',
    '/services/commercial-electrician.html': 'Commercial or Industrial Work',
    '/services/emergency-electrician.html': 'Emergency Electrical Service',
    '/services/ev-charger-installation.html': 'EV Charger Installation',
    '/services/electrical-inspections.html': 'Electrical Inspection or Code Correction',
    '/services/panel-upgrades.html': 'Panel or Service Upgrade',
    '/services/service-changes.html': 'Panel or Service Upgrade',
    '/services/re-wires-installs.html': 'Rewire or New Circuits',
    '/services/troubleshooting-repairs.html': 'Troubleshooting or Repair',
    '/services/lighting-installation.html': 'Lighting, Fans, Outlets or Switches',
    '/services/outlets-switches-breakers.html': 'Lighting, Fans, Outlets or Switches',
    '/services/generator-hookups.html': 'Generator Connection',
    '/services/surge-protection.html': 'Surge Protection or Grounding',
    '/services/new-construction.html': 'New Construction'
  };
  var pageService = serviceByPath[window.location.pathname];
  if (pageService) {
    document.querySelectorAll('a[href="/contact.html"],a[href="/contact"]').forEach(function (link) {
      link.setAttribute('href', '/contact.html?service=' + encodeURIComponent(pageService) + '&source=' + encodeURIComponent(window.location.pathname) + '#quote-form');
    });
  }

  if (window.location.pathname.indexOf('/thank-you') === 0 && sessionStorage.getItem('ceasars_form_success') === '1') {
    track('generate_lead', { method: 'quote_form', value: 10, currency: 'USD' });
    track('form_submit', { form_id: 'quote-form', service: sessionStorage.getItem('ceasars_form_service') || 'not_selected' });
    sessionStorage.removeItem('ceasars_form_success');
    sessionStorage.removeItem('ceasars_form_service');
  }

  // Contact-intent tracking. A click is useful intent, but is not counted as a completed lead.
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('click_to_call', { event_category: 'lead', event_label: 'phone', phone: '337-309-4115' });
      track('contact_intent', { method: 'phone', placement: a.getAttribute('data-cta') || placementFor(a) });
    });
  });

  document.querySelectorAll('a[href^="sms:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('contact_intent', { method: 'text_message', placement: a.getAttribute('data-cta') || placementFor(a) });
    });
  });

  document.querySelectorAll('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('cta_click', { placement: a.getAttribute('data-cta'), destination: a.getAttribute('href') || '' });
    });
  });

  document.querySelectorAll('a[href^="/contact.html"]:not([data-cta]),a[href^="/contact?"]:not([data-cta])').forEach(function (a) {
    a.addEventListener('click', function () {
      track('estimate_cta_click', { placement: placementFor(a), page_path: window.location.pathname });
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
    var errorBox = document.getElementById('form-error');
    var photo = document.getElementById('job-photo');
    var serviceSelect = form.querySelector('select[name="service"]');
    var sourcePage = document.getElementById('source-page');
    var contextBox = document.getElementById('form-context');
    var formStarted = false;

    var search = new URLSearchParams(window.location.search);
    var requestedService = search.get('service');
    var requestedSource = search.get('source');
    if (requestedService && serviceSelect && Array.prototype.some.call(serviceSelect.options, function (option) { return option.value === requestedService; })) {
      serviceSelect.value = requestedService;
      if (sourcePage) sourcePage.value = requestedSource || document.referrer || 'Service page';
      if (contextBox) {
        contextBox.textContent = requestedService + ' is already selected for you.';
        contextBox.hidden = false;
      }
      track('form_context_applied', { form_id: 'quote-form', service: requestedService });
    } else if (sourcePage && document.referrer) {
      sourcePage.value = document.referrer;
    }

    form.addEventListener('input', function () {
      if (!formStarted) {
        formStarted = true;
        track('form_start', { form_id: 'quote-form' });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
      if (photo && photo.files && photo.files[0] && photo.files[0].size > 8 * 1024 * 1024) {
        if (errorBox) {
          errorBox.textContent = 'That photo is larger than 8 MB. Choose a smaller image or submit without a photo.';
          errorBox.hidden = false;
          errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        track('form_error', { form_id: 'quote-form', reason: 'photo_too_large' });
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      var data = new FormData(form);
      fetch('/', {
        method: 'POST',
        body: data
      }).then(function (r) {
        if (!r.ok) throw new Error('bad status');
        sessionStorage.setItem('ceasars_form_success', '1');
        sessionStorage.setItem('ceasars_form_service', data.get('service') || 'not_selected');
        window.location.href = '/thank-you';
      }).catch(function () {
        track('form_error', { form_id: 'quote-form', reason: 'submission_failed' });
        if (btn) { btn.disabled = false; btn.textContent = 'Request My Estimate'; }
        if (errorBox) {
          errorBox.innerHTML = 'Your request did not send. Please <a href="tel:+13373094115">call 337-309-4115</a> or <a href="sms:+13373094115">text Jevante</a> instead.';
          errorBox.hidden = false;
          errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
