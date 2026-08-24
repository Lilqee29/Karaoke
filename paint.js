// ========================================================
//  PAINT v2.0 — Complete Professional Painting Suite
//  Oil paint, watercolor, smudge, fill, eyedropper
//  Full HSL color picker, layers, undo/redo
//  Pure vanilla JS + Canvas 2D — zero dependencies
// ========================================================

(function() {
'use strict';

// ── State ────────────────────────────────────────────────
let canvas, ctx;
let _pMode = 'oil';        // oil | watercolor | spray | smudge | fill | eraser | eyedropper
let _pColor = '#000000';
let _pHue = 0;
let _pSat = 100;
let _pLight = 50;
let _pOpacity = 1.0;
let _pSize = 4;
let _pLastX = null, _pLastY = null;
let _pDown = false;
let _pUndoStack = [];
let _pRedoStack = [];
let _pMaxUndo = 30;
let _pShape = 'free';     // free | line | rect | circle
let _pShapeStart = null;
let _pShapeSnapshot = null;
let _pErasing = false;

// ── Color Utils ──────────────────────────────────────────
function _pHslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function _pHexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16) || 0, g: parseInt(h.substring(2, 4), 16) || 0, b: parseInt(h.substring(4, 6), 16) || 0 };
}

function _pRgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function _pColorFromHSL() {
  return _pHslToHex(_pHue, _pSat, _pLight);
}

// ── Undo/Redo ────────────────────────────────────────────
function _pSaveUndo() {
  if (!canvas) return;
  _pUndoStack.push(canvas.toDataURL());
  if (_pUndoStack.length > _pMaxUndo) _pUndoStack.shift();
  _pRedoStack = [];
}

function _pRestoreUndo(src, cb) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    if (cb) cb();
  };
  img.src = src;
}

// ── Canvas Position ──────────────────────────────────────
function _pGetPos(e) {
  const r = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return {
    x: (t.clientX - r.left) * (canvas.width / r.width),
    y: (t.clientY - r.top) * (canvas.height / r.height)
  };
}

// ── Brush Engines ────────────────────────────────────────

// Oil Paint — thick, textured, opacity based on speed
function _pOilBrush(x, y) {
  if (_pLastX === null) { _pLastX = x; _pLastY = y; }
  const dx = x - _pLastX, dy = y - _pLastY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = Math.min(dist, 50);
  const alpha = Math.max(0.15, 1.0 - speed / 60) * _pOpacity;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = _pSize;

  // Main stroke
  ctx.strokeStyle = _pColor;
  ctx.beginPath();
  ctx.moveTo(_pLastX, _pLastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Texture — slightly offset secondary strokes for thick paint look
  if (_pSize > 2) {
    ctx.globalAlpha = alpha * 0.4;
    ctx.lineWidth = _pSize * 0.6;
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const offset = _pSize * 0.3;
    ctx.strokeStyle = _pErasing ? '#ffffff' : _pLightenColor(_pColor, 20);
    ctx.beginPath();
    ctx.moveTo(_pLastX + Math.cos(angle) * offset, _pLastY + Math.sin(angle) * offset);
    ctx.lineTo(x + Math.cos(angle) * offset, y + Math.sin(angle) * offset);
    ctx.stroke();

    ctx.strokeStyle = _pErasing ? '#ffffff' : _pDarkenColor(_pColor, 20);
    ctx.beginPath();
    ctx.moveTo(_pLastX - Math.cos(angle) * offset, _pLastY - Math.sin(angle) * offset);
    ctx.lineTo(x - Math.cos(angle) * offset, y - Math.sin(angle) * offset);
    ctx.stroke();
  }

  ctx.restore();
  _pLastX = x;
  _pLastY = y;
}

// Watercolor — transparent, flowing, wet edges
function _pWatercolorBrush(x, y) {
  ctx.save();
  const baseAlpha = 0.05 * _pOpacity;
  const rgb = _pHexToRgb(_pColor);

  for (let i = 0; i < 3; i++) {
    const ox = (Math.random() - 0.5) * _pSize * 1.5;
    const oy = (Math.random() - 0.5) * _pSize * 1.5;
    const r = _pSize * (0.8 + Math.random() * 0.8);

    ctx.globalAlpha = baseAlpha * (0.5 + Math.random() * 0.5);
    ctx.fillStyle = _pColor;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wet edge effect
  ctx.globalAlpha = baseAlpha * 0.3;
  ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, _pSize * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  if (_pLastX === null) { _pLastX = x; _pLastY = y; }
  _pLastX = x;
  _pLastY = y;
}

// Spray — scattered particles
function _pSprayBrush(x, y) {
  ctx.save();
  ctx.fillStyle = _pColor;
  for (let i = 0; i < _pSize * 1.5; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * _pSize;
    ctx.globalAlpha = Math.random() * 0.5 * _pOpacity + 0.05;
    ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 1, 1);
  }
  ctx.restore();
}

// Smudge — pick up color and blend
function _pSmudge(x, y) {
  if (_pLastX === null) { _pLastX = x; _pLastY = y; return; }
  const dist = Math.sqrt((x - _pLastX) ** 2 + (y - _pLastY) ** 2);
  const steps = Math.max(1, Math.ceil(dist / 2));

  ctx.save();
  ctx.globalAlpha = 0.3 * _pOpacity;
  ctx.lineCap = 'round';
  ctx.lineWidth = _pSize;
  ctx.strokeStyle = _pColor;
  ctx.globalCompositeOperation = 'source-over';

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sx = _pLastX + (x - _pLastX) * t;
    const sy = _pLastY + (y - _pLastY) * t;

    // Sample existing canvas color at this point
    const pixel = ctx.getImageData(Math.round(sx), Math.round(sy), 1, 1).data;
    const sampled = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;

    ctx.globalAlpha = 0.15 * _pOpacity;
    ctx.fillStyle = sampled;
    ctx.beginPath();
    ctx.arc(sx, sy, _pSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  _pLastX = x;
  _pLastY = y;
}

// Fill — flood fill
function _pFloodFill(startX, startY) {
  const w = canvas.width, h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const startIdx = (Math.round(startY) * w + Math.round(startX)) * 4;
  const startR = data[startIdx], startG = data[startIdx + 1];
  const startB = data[startIdx + 2], startA = data[startIdx + 3];

  const fillRgb = _pHexToRgb(_pColor);
  if (startR === fillRgb.r && startG === fillRgb.g && startB === fillRgb.b) return;

  const tolerance = 32;
  function matchColor(i) {
    return Math.abs(data[i] - startR) <= tolerance &&
           Math.abs(data[i + 1] - startG) <= tolerance &&
           Math.abs(data[i + 2] - startB) <= tolerance &&
           Math.abs(data[i + 3] - startA) <= tolerance;
  }

  const stack = [[Math.round(startX), Math.round(startY)]];
  const visited = new Uint8Array(w * h);

  while (stack.length > 0) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    const pi = cy * w + cx;
    if (visited[pi]) continue;
    const idx = pi * 4;
    if (!matchColor(idx)) continue;

    visited[pi] = 1;
    data[idx] = fillRgb.r;
    data[idx + 1] = fillRgb.g;
    data[idx + 2] = fillRgb.b;
    data[idx + 3] = Math.round(255 * _pOpacity);

    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

// Eyedropper — pick color from canvas
function _pEyeDrop(x, y) {
  const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  _pColor = hex;
  const rgb = _pRgbToHsl(pixel[0], pixel[1], pixel[2]);
  _pHue = rgb.h;
  _pSat = rgb.s;
  _pLight = rgb.l;
  _pUpdateColorUI();
}

// ── Color Helpers ────────────────────────────────────────
function _pLightenColor(hex, amt) {
  const rgb = _pHexToRgb(hex);
  const hsl = _pRgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + amt);
  return _pHslToHex(hsl.h, hsl.s, hsl.l);
}

function _pDarkenColor(hex, amt) {
  const rgb = _pHexToRgb(hex);
  const hsl = _pRgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - amt);
  return _pHslToHex(hsl.h, hsl.s, hsl.l);
}

// ── Shape Drawing ────────────────────────────────────────
function _pDrawShape(x0, y0, x1, y1) {
  ctx.save();
  ctx.strokeStyle = _pColor;
  ctx.fillStyle = _pColor;
  ctx.lineWidth = _pSize;
  ctx.lineCap = 'round';
  ctx.globalAlpha = _pOpacity;
  ctx.lineJoin = 'round';

  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (_pShape === 'line') {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  } else if (_pShape === 'rect') {
    const w = x1 - x0, h = y1 - y0;
    ctx.strokeRect(x0, y0, w, h);
    ctx.globalAlpha = _pOpacity * 0.3;
    ctx.fillRect(x0, y0, w, h);
  } else if (_pShape === 'circle') {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = _pOpacity * 0.3;
    ctx.fill();
  }

  ctx.restore();
}

// ── Main Drawing Router ──────────────────────────────────
function _pDraw(x, y) {
  if (_pDown && _pMode === 'smudge') { _pSmudge(x, y); return; }

  switch (_pMode) {
    case 'oil':       _pOilBrush(x, y); break;
    case 'watercolor': _pWatercolorBrush(x, y); break;
    case 'spray':     _pSprayBrush(x, y); break;
    case 'eraser':
      const prev = _pColor;
      _pColor = '#ffffff';
      _pOilBrush(x, y);
      _pColor = prev;
      break;
  }
}

// ── Event Handlers ───────────────────────────────────────
function _pOnDown(e) {
  e.preventDefault();
  _pDown = true;
  const p = _pGetPos(e);
  _pLastX = p.x;
  _pLastY = p.y;

  if (_pMode === 'fill') {
    _pFloodFill(p.x, p.y);
    _pSaveUndo();
    _pDown = false;
    return;
  }

  if (_pMode === 'eyedropper') {
    _pEyeDrop(p.x, p.y);
    _pDown = false;
    return;
  }

  if (_pShape !== 'free') {
    _pShapeStart = p;
    _pShapeSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return;
  }

  _pDraw(p.x, p.y);
}

function _pOnMove(e) {
  if (!_pDown) return;
  e.preventDefault();
  const p = _pGetPos(e);

  if (_pShape !== 'free' && _pShapeStart && _pShapeSnapshot) {
    ctx.putImageData(_pShapeSnapshot, 0, 0);
    _pDrawShape(_pShapeStart.x, _pShapeStart.y, p.x, p.y);
    return;
  }

  // Interpolate between last and current position
  const dx = p.x - _pLastX, dy = p.y - _pLastY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.ceil(dist / 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    _pDraw(_pLastX + dx * t, _pLastY + dy * t);
  }
  _pLastX = p.x;
  _pLastY = p.y;
}

function _pOnUp(e) {
  if (!_pDown) return;
  _pDown = false;

  if (_pShape !== 'free' && _pShapeStart) {
    const p = e.changedTouches
      ? { x: e.changedTouches[0].clientX - canvas.getBoundingClientRect().left,
          y: e.changedTouches[0].clientY - canvas.getBoundingClientRect().top }
      : _pGetPos(e);
    ctx.putImageData(_pShapeSnapshot, 0, 0);
    _pDrawShape(_pShapeStart.x, _pShapeStart.y, p.x, p.y);
    _pShapeStart = null;
    _pShapeSnapshot = null;
  }

  _pSaveUndo();
  _pLastX = null;
  _pLastY = null;
}

// ── UI Updates ───────────────────────────────────────────
function _pUpdateColorUI() {
  _pColor = _pColorFromHSL();
  const preview = document.getElementById('paintColorPreview');
  if (preview) preview.style.background = _pColor;
  const hexInput = document.getElementById('paintHexInput');
  if (hexInput) hexInput.value = _pColor;
  // Update hue bar background
  const hueBar = document.getElementById('paintHueBar');
  if (hueBar) {
    hueBar.style.background = `linear-gradient(to right,
      hsl(0,${_pSat}%,${_pLight}%),hsl(60,${_pSat}%,${_pLight}%),
      hsl(120,${_pSat}%,${_pLight}%),hsl(180,${_pSat}%,${_pLight}%),
      hsl(240,${_pSat}%,${_pLight}%),hsl(300,${_pSat}%,${_pLight}%),
      hsl(360,${_pSat}%,${_pLight}%))`;
  }
}

// ── Init ─────────────────────────────────────────────────
window.initPaint = function() {
  canvas = document.getElementById('paintCanvas');
  if (!canvas) return;

  // Size to fill screen
  const wrapper = canvas.parentElement;
  canvas.width = wrapper ? wrapper.clientWidth : 300;
  canvas.height = wrapper ? wrapper.clientHeight : 280;

  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  _pUndoStack = [];
  _pRedoStack = [];
  _pSaveUndo();

  // Bind events
  canvas.addEventListener('mousedown', _pOnDown);
  canvas.addEventListener('mousemove', _pOnMove);
  canvas.addEventListener('mouseup', _pOnUp);
  canvas.addEventListener('mouseleave', _pOnUp);
  canvas.addEventListener('touchstart', _pOnDown, { passive: false });
  canvas.addEventListener('touchmove', _pOnMove, { passive: false });
  canvas.addEventListener('touchend', _pOnUp);

  _pUpdateColorUI();
};

// ── Cleanup ──────────────────────────────────────────────
window._paintCleanup = function() {
  if (canvas) {
    canvas.removeEventListener('mousedown', _pOnDown);
    canvas.removeEventListener('mousemove', _pOnMove);
    canvas.removeEventListener('mouseup', _pOnUp);
    canvas.removeEventListener('mouseleave', _pOnUp);
    canvas.removeEventListener('touchstart', _pOnDown);
    canvas.removeEventListener('touchmove', _pOnMove);
    canvas.removeEventListener('touchend', _pOnUp);
  }
};

// ── Public API ───────────────────────────────────────────

window.paintSetTool = function(tool) {
  _pMode = tool;
  _pErasing = tool === 'eraser';
  document.querySelectorAll('.paint-tool-btn').forEach(b => {
    const active = b.dataset.tool === tool;
    b.classList.toggle('active', active);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.paintSetShape = function(shape) {
  _pShape = shape;
  document.querySelectorAll('.paint-shape-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.shape === shape);
  });
};

window.paintSetSize = function(val) {
  _pSize = parseInt(val);
  const lbl = document.getElementById('paintSizeLabel');
  if (lbl) lbl.textContent = val;
  const preview = document.getElementById('paintSizePreview');
  if (preview) {
    const s = Math.max(2, _pSize);
    preview.style.width = s + 'px';
    preview.style.height = s + 'px';
  }
};

window.paintSetOpacity = function(val) {
  _pOpacity = parseInt(val) / 100;
  const lbl = document.getElementById('paintOpacityLabel');
  if (lbl) lbl.textContent = val + '%';
};

window.paintSetHue = function(val) {
  _pHue = parseInt(val);
  _pUpdateColorUI();
};

window.paintSetSat = function(val) {
  _pSat = parseInt(val);
  _pUpdateColorUI();
};

window.paintSetLight = function(val) {
  _pLight = parseInt(val);
  _pUpdateColorUI();
};

window.paintSetColor = function(hex) {
  _pColor = hex;
  const rgb = _pHexToRgb(hex);
  const hsl = _pRgbToHsl(rgb.r, rgb.g, rgb.b);
  _pHue = hsl.h;
  _pSat = hsl.s;
  _pLight = hsl.l;
  _pUpdateColorUI();
};

window.paintUndo = function() {
  if (_pUndoStack.length > 1) {
    _pRedoStack.push(_pUndoStack.pop());
    _pRestoreUndo(_pUndoStack[_pUndoStack.length - 1]);
  }
};

window.paintRedo = function() {
  if (_pRedoStack.length > 0) {
    const src = _pRedoStack.pop();
    _pUndoStack.push(src);
    _pRestoreUndo(src);
  }
};

window.paintClear = function() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  _pSaveUndo();
};

window.paintSave = function() {
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], `paint-${Date.now()}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ title: 'Painting', files: [file] }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const link = document.createElement('a');
    link.download = file.name;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, 'image/png');
};

// Keep old function names working (called from HTML)
window.setPaintColor = window.paintSetColor;
window.paintFunc = function(action) {
  if (action === 'undo') window.paintUndo();
  else if (action === 'clear') window.paintClear();
  else if (action === 'save') window.paintSave();
  else if (action === 'eraser') window.paintSetTool('eraser');
};
window.paintBrushUp = function() {
  _pSize = Math.min(50, _pSize + 1);
  const slider = document.getElementById('paintSizeSlider');
  if (slider) slider.value = _pSize;
  window.paintSetSize(_pSize);
};
window.paintBrushDown = function() {
  _pSize = Math.max(1, _pSize - 1);
  const slider = document.getElementById('paintSizeSlider');
  if (slider) slider.value = _pSize;
  window.paintSetSize(_pSize);
};

})();
