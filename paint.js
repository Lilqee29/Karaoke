// ========================================================
//  PAINT v3.0 — Smooth Brush + Fill + Shapes
//  Based on jspaint quadratic curve interpolation
//  Pure vanilla JS + Canvas 2D — zero dependencies
// ========================================================

(function() {
'use strict';

// ── State ────────────────────────────────────────────────
let canvas, ctx;
let _pMode = 'brush';     // brush | fill | eyedropper | eraser
let _pColor = '#000000';
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

// ── Color Utils ──────────────────────────────────────────
function _pHexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16) || 0, g: parseInt(h.substring(2, 4), 16) || 0, b: parseInt(h.substring(4, 6), 16) || 0 };
}

function _pLightenColor(hex, amt) {
  const rgb = _pHexToRgb(hex);
  const h = rgb.r / 255, s = rgb.g / 255, l = rgb.b / 255;
  const max = Math.max(h, s, l), min = Math.min(h, s, l);
  let hue = 0, sat = 0;
  const light = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === h) hue = ((s - l) / d + (s < l ? 6 : 0)) / 6;
    else if (max === s) hue = ((l - h) / d + 2) / 6;
    else hue = ((h - s) / d + 4) / 6;
  }
  const newL = Math.min(100, Math.round(light * 100 + amt));
  const a = sat * Math.min(newL / 100, 1 - newL / 100);
  const f = n => {
    const k = (n + (hue * 360) / 30) % 12;
    const c = newL / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function _pDarkenColor(hex, amt) {
  return _pLightenColor(hex, -amt);
}

// ── Undo/Redo ────────────────────────────────────────────
function _pSaveUndo() {
  if (!canvas) return;
  _pUndoStack.push(canvas.toDataURL());
  if (_pUndoStack.length > _pMaxUndo) _pUndoStack.shift();
  _pRedoStack = [];
}

function _pRestoreUndo(src) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
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

// ── Smooth Brush (quadratic curve interpolation) ────────
// Based on jspaint technique: draw curves through midpoints
// for smooth, natural-looking strokes
let _pPoints = [];

function _pSmoothBrush(x, y) {
  _pPoints.push({ x, y });

  // Need at least 3 points to start drawing curves
  if (_pPoints.length < 3) {
    // For first 2 points, just draw dots
    ctx.save();
    ctx.globalAlpha = _pOpacity;
    ctx.fillStyle = _pColor;
    ctx.beginPath();
    ctx.arc(x, y, _pSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const p0 = _pPoints[_pPoints.length - 3];
  const p1 = _pPoints[_pPoints.length - 2];
  const p2 = _pPoints[_pPoints.length - 1];

  // Midpoint between p0 and p1
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;

  // Midpoint between p1 and p2
  const mx2 = (p1.x + p2.x) / 2;
  const my2 = (p1.y + p2.y) / 2;

  ctx.save();
  ctx.globalAlpha = _pOpacity;
  ctx.strokeStyle = _pColor;
  ctx.fillStyle = _pColor;
  ctx.lineWidth = _pSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw quadratic curve through midpoints
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.quadraticCurveTo(p1.x, p1.y, mx2, my2);
  ctx.stroke();

  // Draw circle at midpoint for smooth joins
  ctx.beginPath();
  ctx.arc(mx, my, _pSize / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Flood Fill ───────────────────────────────────────────
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

// ── Eyedropper ───────────────────────────────────────────
function _pEyeDrop(x, y) {
  const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  _pColor = hex;
  _pUpdateColorUI();
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

// ── Eraser ───────────────────────────────────────────────
function _pErase(x, y) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, _pSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Main Drawing Router ──────────────────────────────────
function _pDraw(x, y) {
  switch (_pMode) {
    case 'brush':
      _pSmoothBrush(x, y);
      break;
    case 'eraser':
      _pErase(x, y);
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
  _pPoints = [p];

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

  // Interpolate between last and current position for smooth lines
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
  _pPoints = [];
}

// ── UI Updates ───────────────────────────────────────────
function _pUpdateColorUI() {
  const preview = document.getElementById('paintColorPreview');
  if (preview) preview.style.background = _pColor;
  const native = document.getElementById('paintColorPicker');
  if (native) native.value = _pColor;
  document.querySelectorAll('.paint-swatch').forEach(s => {
    const match = s.dataset.color?.toLowerCase() === _pColor.toLowerCase();
    s.classList.toggle('active', match);
  });
}

// ── Init ─────────────────────────────────────────────────
window.initPaint = function() {
  canvas = document.getElementById('paintCanvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');

  requestAnimationFrame(() => {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper ? wrapper.clientWidth : 300;
    canvas.height = wrapper ? wrapper.clientHeight : 280;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    _pUndoStack = [];
    _pRedoStack = [];
    _pSaveUndo();
    _pUpdateColorUI();
  });

  canvas.addEventListener('mousedown', _pOnDown);
  canvas.addEventListener('mousemove', _pOnMove);
  canvas.addEventListener('mouseup', _pOnUp);
  canvas.addEventListener('mouseleave', _pOnUp);
  canvas.addEventListener('touchstart', _pOnDown, { passive: false });
  canvas.addEventListener('touchmove', _pOnMove, { passive: false });
  canvas.addEventListener('touchend', _pOnUp);
};

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
  document.querySelectorAll('.paint-tool-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === tool);
  });
  if (navigator.vibrate) navigator.vibrate(10);
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

window.paintSetColor = function(hex) {
  if (!hex || !hex.match(/^#[0-9a-fA-F]{6}$/)) return;
  _pColor = hex;
  _pUpdateColorUI();
};

window.paintPickColor = function(val) {
  _pColor = val;
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

window.paintTogglePanel = function() {
  const panel = document.getElementById('paintExpanded');
  const btn = document.getElementById('paintScrollToggle');
  if (!panel || !btn) return;
  const show = panel.style.display === 'none';
  panel.style.display = show ? 'block' : 'none';
  btn.textContent = show ? '▼' : '▲';
};

// Legacy compat
window.setPaintColor = window.paintSetColor;
window.paintFunc = function(action) {
  if (action === 'undo') window.paintUndo();
  else if (action === 'clear') window.paintClear();
  else if (action === 'save') window.paintSave();
  else if (action === 'eraser') window.paintSetTool('eraser');
};

})();
