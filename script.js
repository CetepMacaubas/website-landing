(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Year in footer
  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile nav
  const toggle = $('[data-nav-toggle]');
  const menu = $('[data-nav-menu]');
  const nav = document.querySelector('.site-nav');

  const setNavOpen = (open) => {
    if (!toggle || !menu || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      setNavOpen(!open);
    });
  }

  // Close menu on link click (mobile)
  $$('.nav-link').forEach((a) => {
    a.addEventListener('click', () => setNavOpen(false));
  });

  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setNavOpen(false);
  });

  // Back to top
  const backToTop = $('[data-back-to-top]');
  const onScroll = () => {
    if (!backToTop) return;
    const visible = window.scrollY > 500;
    backToTop.classList.toggle('is-visible', visible);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Reveal on scroll (respects reduced motion)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = $$('.reveal');
  if (!reducedMotion && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Fake contact form submit (static site)
  const form = $('[data-contact-form]');
  const status = $('[data-form-status]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (status) status.textContent = 'Mensagem pronta para envio. Em um site real, este formulário seria conectado a um serviço de e-mail.';
      form.reset();
    });
  }

  // CEP lookup (ViaCEP)
  const cepForm = $('[data-cep-form]');
  const cepStatus = $('[data-cep-status]');
  const cepResult = $('[data-cep-result]');
  const cepLogradouro = $('[data-cep-logradouro]');
  const cepBairro = $('[data-cep-bairro]');
  const cepLocalidade = $('[data-cep-localidade]');
  const cepSubmit = $('[data-cep-submit]');

  const setCepLoading = (loading) => {
    if (!cepForm) return;
    const btn = cepSubmit || cepForm.querySelector('button[type="submit"]');
    const input = cepForm.querySelector('input[name="cep"]');
    if (btn) btn.disabled = loading;
    if (input) input.disabled = loading;
  };

  const onlyDigits = (v) => String(v || '').replace(/\D/g, '');

  if (cepForm) {
    const input = cepForm.querySelector('input[name="cep"]');
    if (input) {
      input.addEventListener('input', () => {
        const d = onlyDigits(input.value).slice(0, 8);
        input.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
      });
    }

    cepForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const raw = input ? input.value : '';
      const cep = onlyDigits(raw);

      if (cepStatus) cepStatus.textContent = '';
      if (cepResult) cepResult.hidden = true;

      if (cep.length !== 8) {
        if (cepStatus) cepStatus.textContent = 'Informe um CEP válido com 8 dígitos.';
        return;
      }

      try {
        setCepLoading(true);
        if (cepStatus) cepStatus.textContent = 'Consultando...';
        if (cepSubmit) cepSubmit.textContent = 'Consultando...';

        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          headers: { Accept: 'application/json' },
        });
        const data = await res.json();

        if (!res.ok || data?.erro) {
          if (cepStatus) cepStatus.textContent = 'CEP não encontrado. Verifique e tente novamente.';
          return;
        }

        if (cepLogradouro) cepLogradouro.textContent = data.logradouro || '—';
        if (cepBairro) cepBairro.textContent = data.bairro || '—';
        if (cepLocalidade) cepLocalidade.textContent = `${data.localidade || '—'} / ${data.uf || '—'}`;

        if (cepResult) cepResult.hidden = false;
        if (cepStatus) cepStatus.textContent = 'Consulta realizada com sucesso.';
      } catch {
        if (cepStatus) cepStatus.textContent = 'Não foi possível consultar agora. Tente novamente mais tarde.';
      } finally {
        setCepLoading(false);
        if (cepSubmit) cepSubmit.textContent = 'Consultar';
      }
    });
  }
})();
