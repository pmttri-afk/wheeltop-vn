// ===================================================
// WHEELTOP EDS — SPA Router & Interactivity
// Correct declaration order: observer → showPage → events → init
// ===================================================


// ===== SCROLL REVEAL OBSERVER (declared FIRST so showPage can use it) =====
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { root: null, threshold: 0.08, rootMargin: '0px 0px -30px 0px' });


// ===== PAGE ROUTER =====
function showPage(pageId) {
  // Hide ALL pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });

  const target = document.getElementById('page-' + pageId);
  if (!target) {
    console.warn('showPage: page not found → page-' + pageId);
    return;
  }

  // Show target
  target.style.display = 'block';
  target.classList.add('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Highlight nav link
  document.querySelectorAll('#main-nav .nav-link').forEach(link => {
    link.classList.remove('is-active');
    if (link.dataset.page === pageId) link.classList.add('is-active');
    // Keep "Dòng Sản Phẩm" highlighted for any product detail page
    if (pageId.startsWith('product-') && link.dataset.page === 'products') {
      link.classList.add('is-active');
    }
  });

  // Trigger cassette simulator re-render
  if (pageId === 'simulators') {
    setTimeout(() => { if (typeof renderCassette === 'function') renderCassette(11); }, 50);
  }

  // Animate cards in this page
  setTimeout(() => {
    target.querySelectorAll('.anim-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      revealObserver.observe(el);
    });
  }, 30);
}


// ===== CLICK ROUTER — handles ALL [data-page] elements =====
document.body.addEventListener('click', e => {
  // Skip if it's a button with its own onclick (stopPropagation handles it)
  const link = e.target.closest('[data-page]');
  if (!link) return;
  // Skip if the element is a <button> — those use inline onclick
  if (link.tagName === 'BUTTON') return;
  e.preventDefault();
  const pageId = link.dataset.page;
  if (pageId) showPage(pageId);
});


// ===== HEADER SCROLL EFFECT =====
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.background = 'rgba(255,255,255,0.98)';
      header.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
      header.style.padding = '12px 0';
    } else {
      header.style.background = 'rgba(255,255,255,0.92)';
      header.style.boxShadow = 'none';
      header.style.padding = '16px 0';
    }
  });
}


// ===================================================
// SIMULATOR 1: SPEED SLIDER & CASSETTE GENERATOR
// ===================================================
const speedSlider = document.getElementById('speed-slider');
const currentSpeedLabel = document.getElementById('current-speed-label');
const cassetteWheel = document.getElementById('cassette-wheel');
const derailleurMock = document.getElementById('derailleur-mock');
const specChain = document.getElementById('spec-chain');
const specPitch = document.getElementById('spec-pitch');

const speedSpecsMap = {
  3:  { chain: '3-Speed (7.8mm)',   pitch: '3.75mm' },
  4:  { chain: '4-Speed (7.4mm)',   pitch: '3.50mm' },
  5:  { chain: '5-Speed (7.1mm)',   pitch: '3.30mm' },
  6:  { chain: '6-Speed (6.8mm)',   pitch: '3.10mm' },
  7:  { chain: '7-Speed (6.5mm)',   pitch: '2.90mm' },
  8:  { chain: '8-Speed (6.3mm)',   pitch: '2.80mm' },
  9:  { chain: '9-Speed (6.6mm)',   pitch: '2.60mm' },
  10: { chain: '10-Speed (5.88mm)', pitch: '2.35mm' },
  11: { chain: '11-Speed (5.50mm)', pitch: '2.18mm' },
  12: { chain: '12-Speed (5.25mm)', pitch: '2.10mm' },
  13: { chain: '13-Speed (4.90mm)', pitch: '1.95mm' },
  14: { chain: '14-Speed (4.60mm)', pitch: '1.80mm' }
};

function renderCassette(speed) {
  if (!cassetteWheel) return;
  cassetteWheel.innerHTML = '';
  const numSpeed = parseInt(speed);
  const maxDiameter = 210;
  const minDiameter = 50;

  for (let i = 1; i <= numSpeed; i++) {
    const ring = document.createElement('div');
    ring.className = 'cassette-ring';
    const diameter = maxDiameter - ((maxDiameter - minDiameter) * (i - 1)) / Math.max(1, numSpeed - 1);
    ring.style.width = `${diameter}px`;
    ring.style.height = `${diameter}px`;
    ring.style.zIndex = 15 - i;
    if (i === 1) ring.classList.add('active-ring');
    cassetteWheel.appendChild(ring);
  }

  const maxShiftX = 35, minShiftX = -10;
  const shiftX = minShiftX + ((maxShiftX - minShiftX) * (numSpeed - 3)) / 11;
  if (derailleurMock) derailleurMock.style.transform = `translateY(-50%) translateX(${shiftX}px)`;
  if (currentSpeedLabel) currentSpeedLabel.textContent = `Líp: ${numSpeed} Tốc Độ`;
  if (speedSpecsMap[numSpeed]) {
    if (specChain) specChain.textContent = speedSpecsMap[numSpeed].chain;
    if (specPitch) specPitch.textContent = speedSpecsMap[numSpeed].pitch;
  }
}

if (speedSlider) {
  speedSlider.addEventListener('input', e => renderCassette(e.target.value));
  renderCassette(11);
}


// ===================================================
// SIMULATOR 2: MICRO-ADJUSTMENT
// ===================================================
const adjMinus = document.getElementById('adj-minus');
const adjPlus = document.getElementById('adj-plus');
const offsetDisplay = document.getElementById('offset-display');
const virtualPulleyCage = document.getElementById('virtual-pulley-cage');
const indicatorMarker = document.getElementById('indicator-marker');
const offsetStatusText = document.getElementById('offset-status-text');
const adjSave = document.getElementById('adj-save');

let currentOffset = 0.00;
const stepValue = 0.20;
const limitValue = 1.00;

function updateMicroAdjust() {
  if (offsetDisplay) offsetDisplay.textContent = `${currentOffset >= 0 ? '+' : ''}${currentOffset.toFixed(2)} mm`;

  if (virtualPulleyCage) {
    const cageTranslate = currentOffset * 25;
    const cageRotate = currentOffset * 8;
    virtualPulleyCage.style.transform = `translateX(${cageTranslate}px) rotate(${cageRotate}deg)`;
  }

  if (indicatorMarker) {
    const percentLeft = 50 + (currentOffset * 40);
    indicatorMarker.style.left = `${percentLeft}%`;
  }

  if (offsetStatusText) {
    if (currentOffset === 0) {
      offsetStatusText.textContent = 'Cùi đề thẳng hàng hoàn hảo';
      offsetStatusText.style.color = '#16a34a';
    } else if (currentOffset > 0) {
      offsetStatusText.textContent = `Lệch phải (Phía ngoài): +${currentOffset.toFixed(2)}mm`;
      offsetStatusText.style.color = '#ff5100';
    } else {
      offsetStatusText.textContent = `Lệch trái (Phía trong): ${currentOffset.toFixed(2)}mm`;
      offsetStatusText.style.color = '#ff5100';
    }
  }
}

if (adjMinus && adjPlus) {
  adjMinus.addEventListener('click', () => {
    if (currentOffset > -limitValue) {
      currentOffset = Math.round((currentOffset - stepValue) * 100) / 100;
      updateMicroAdjust();
    }
  });

  adjPlus.addEventListener('click', () => {
    if (currentOffset < limitValue) {
      currentOffset = Math.round((currentOffset + stepValue) * 100) / 100;
      updateMicroAdjust();
    }
  });
}

if (adjSave) {
  adjSave.addEventListener('click', () => {
    adjSave.textContent = 'Đang Đồng Bộ Bluetooth...';
    adjSave.style.background = '#eab308';
    adjSave.disabled = true;
    setTimeout(() => {
      adjSave.textContent = 'Đã Lưu Cấu Hình!';
      adjSave.style.background = '#22c55e';
      setTimeout(() => {
        adjSave.textContent = 'Lưu Cấu Hình';
        adjSave.style.background = '';
        adjSave.disabled = false;
      }, 1500);
    }, 1500);
  });
}


// ===================================================
// SMART COMPATIBILITY CHECKER
// ===================================================
const btnCheckCompat = document.getElementById('btn-check-compat');
const compatBrand = document.getElementById('compat-brand');
const compatType = document.getElementById('compat-type');
const compatSpeeds = document.getElementById('compat-speeds');
const compatBrake = document.getElementById('compat-brake');
const compatResult = document.getElementById('compat-result');
const resultGroupName = document.getElementById('result-group-name');
const resultImg = document.getElementById('result-img');
const resultDesc = document.getElementById('result-desc');
const tableConfig = document.getElementById('table-config');
const tableCassette = document.getElementById('table-cassette');

if (btnCheckCompat) {
  btnCheckCompat.addEventListener('click', () => {
    const brand  = compatBrand.value;
    const type   = compatType.value;
    const speeds = compatSpeeds.value;
    const brake  = compatBrake.value;

    if (!brand || !type || !speeds || !brake) {
      alert('Vui lòng chọn đầy đủ các thông tin cần thiết.');
      return;
    }

    let resultGroup = '', imageSrc = '', description = '', config = '', cassette = '';

    if (type === 'Road') {
      resultGroup = 'WheelTop EDS TX Series';
      imageSrc = 'https://wheeltop.com/cdn/shop/files/TX7800-daily.jpg?v=1766736267';
      description = `Bộ EDS TX là giải pháp truyền động không dây cao cấp nhất dành cho xe đua ${brand}.`;
      config = `2 x ${speeds}S hoặc 1 x ${speeds}S`;
      cassette = `Hỗ trợ líp nhỏ nhất 11T - lớn nhất 34T`;
    } else if (type === 'Gravel') {
      resultGroup = 'WheelTop EDS GeX Series';
      imageSrc = 'https://wheeltop.com/cdn/shop/files/6700-daily.jpg?v=1766736267';
      description = `Dòng GeX Gravel được tối ưu hóa cho chiếc xe địa hình hỗn hợp ${brand} của bạn.`;
      config = `1 x ${speeds}S hoặc 2 x ${speeds}S`;
      cassette = `Hỗ trợ líp lớn lên tới 42T`;
    } else if (type === 'MTB') {
      resultGroup = 'WheelTop EDS OX2.0 Series';
      imageSrc = 'https://wheeltop.com/cdn/shop/files/OX2.0-93-daily.jpg?v=1766736266';
      description = `Cực kỳ phù hợp cho xe MTB ${brand} của bạn.`;
      config = `1 x ${speeds}S (Cùi đề đơn tối giản)`;
      cassette = `Hỗ trợ líp siêu lớn lên tới 50T - 52T`;
    } else if (type === 'TT') {
      resultGroup = 'WheelTop EDS TT Series';
      imageSrc = 'https://wheeltop.com/cdn/shop/files/TT-_daily.jpg?v=1779346969&width=1000';
      description = `Giải pháp tối ưu khí động học cho xe đua ba môn phối hợp ${brand}.`;
      config = `2 x ${speeds}S hoặc 1 x ${speeds}S`;
      cassette = `Hỗ trợ líp từ 11T đến 30T`;
    }

    if (resultGroupName) resultGroupName.textContent = resultGroup;
    if (resultImg) { resultImg.src = imageSrc; resultImg.alt = resultGroup; }
    if (resultDesc) resultDesc.textContent = description;
    if (tableConfig) tableConfig.textContent = config;
    if (tableCassette) tableCassette.textContent = cassette;

    if (compatResult) {
      compatResult.classList.remove('hidden');
      compatResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}


// ===================================================
// PD2 — THUMBNAIL GALLERY & TABS
// ===================================================

// Thumbnail click → swap main image
document.body.addEventListener('click', e => {
  const thumb = e.target.closest('.pd2-thumb');
  if (!thumb) return;
  const mainImg = document.getElementById(thumb.dataset.target);
  if (!mainImg) return;
  thumb.closest('.pd2-thumbnails').querySelectorAll('.pd2-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  mainImg.style.opacity = '0';
  setTimeout(() => { mainImg.src = thumb.src; mainImg.style.opacity = '1'; }, 200);
});

// Tab click → switch content panel
document.body.addEventListener('click', e => {
  const tab = e.target.closest('.pd2-tab');
  if (!tab) return;
  const page = tab.closest('.page');
  if (!page) return;
  tab.closest('.pd2-tabs').querySelectorAll('.pd2-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  page.querySelectorAll('.pd2-tab-content').forEach(c => c.classList.remove('active'));
  const content = document.getElementById(tab.dataset.tab);
  if (content) content.classList.add('active');
});



// ===================================================
// INITIALIZE — show home page on load
// ===================================================
showPage('home');


// ===================================================
// CONTACT FORM — Web3Forms Integration
// Gửi email tự động đến info@trioneer.vn
// Đăng ký access key tại: https://web3forms.com
// ===================================================

(function () {
  const form   = document.getElementById('quote-form');
  const status = document.getElementById('quote-status');
  const btn    = document.getElementById('quote-submit');

  if (!form || !btn) return;

  function showStatus(msg, type) {
    if (!status) return;
    status.innerHTML     = msg;
    status.style.display = 'block';
    const map = {
      success: ['#f0fdf4', '#16a34a', '#bbf7d0'],
      error  : ['#fef2f2', '#dc2626', '#fecaca'],
      warn   : ['#fffbeb', '#b45309', '#fde68a'],
      info   : ['#eff6ff', '#1d4ed8', '#bfdbfe'],
    };
    const [bg, color, border] = map[type] || map.warn;
    Object.assign(status.style, {
      background  : bg,
      color       : color,
      border      : '1px solid ' + border,
      padding     : '14px 18px',
      borderRadius: '10px',
      marginBottom: '16px',
      fontWeight  : '600',
      fontSize    : '14px',
      lineHeight  : '1.5',
    });
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideStatus() {
    if (status) status.style.display = 'none';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name    = (document.getElementById('quote-name').value    || '').trim();
    const email   = (document.getElementById('quote-email').value   || '').trim();
    const phone   = (document.getElementById('quote-phone').value   || '').trim();
    const bike    = (document.getElementById('quote-bike').value    || '').trim();
    const message = (document.getElementById('quote-message').value || '').trim();

    // ── Validation ──
    if (!name)  { showStatus('⚠️ Vui lòng nhập Họ và Tên.', 'warn');    return; }
    if (!phone) { showStatus('⚠️ Vui lòng nhập Số điện thoại.', 'warn'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('⚠️ Email không hợp lệ.', 'warn'); return;
    }

    // Check access key
    const accessKey = document.getElementById('w3f-access-key').value;
    if (!accessKey || accessKey === 'YOUR_ACCESS_KEY') {
      showStatus('⚙️ Chưa cấu hình access key. Vui lòng đăng ký tại <a href="https://web3forms.com" target="_blank" style="color:inherit;text-decoration:underline;">web3forms.com</a> và thay thế YOUR_ACCESS_KEY trong index.html.', 'warn');
      return;
    }

    // ── Loading ──
    btn.disabled    = true;
    btn.textContent = '⏳ Đang gửi yêu cầu...';
    hideStatus();

    // ── Dynamically set subject with customer name ──
    const subjectField = document.getElementById('w3f-subject');
    if (subjectField) {
      subjectField.value = name + ' — Yêu cầu chào giá WheelTop EDS';
    }

    // ── Build form data as JSON ──
    const formData = {
      access_key      : accessKey,
      subject         : subjectField ? subjectField.value : 'Yêu cầu báo giá WheelTop',
      from_name       : 'WheelTop Vietnam Website',
      'Họ và Tên'     : name,
      'Email'         : email,
      'Số Điện Thoại' : phone,
      'Dòng Xe'       : bike || 'Không điền',
      'Yêu Cầu Chi Tiết' : message || 'Không có ghi chú',
      replyto         : email,
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body    : JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showStatus(
          '✅ Yêu cầu báo giá đã gửi thành công!<br>Chúng tôi sẽ liên hệ lại với <strong>' + name + '</strong> trong vòng 24 giờ.',
          'success'
        );
        form.reset();
      } else {
        console.error('[Web3Forms error]', result);
        showStatus(
          '❌ Gửi không thành công: ' + (result.message || 'Lỗi không xác định') + '.<br>Vui lòng thử lại hoặc liên hệ trực tiếp qua Zalo.',
          'error'
        );
      }
    } catch (err) {
      console.error('[Network error]', err);
      showStatus(
        '❌ Lỗi kết nối mạng (' + err.message + ').<br>Vui lòng kiểm tra internet và thử lại.',
        'error'
      );
    } finally {
      btn.disabled  = false;
      btn.innerHTML = '📧 Yêu Cầu Nhận Báo Giá';
    }
  });
})();

