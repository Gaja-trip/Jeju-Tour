(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const API_BASE = String(window.JEJU_EVENT_API_BASE || '').replace(/\/$/, '');
  document.body.classList.toggle('is-embedded', new URLSearchParams(location.search).get('embedded') === '1');
  const STORAGE_KEY = 'jeju-riding-30min-challenge-v2';
  const form = $('entryForm');
  const fields = $('entryFields');
  const dateInput = $('challengeDate');
  const photoInput = $('entryPhotos');
  let data = { event: null, participants: [], records: [] };
  let selectedPhotos = [];
  let participantId = '';
  let adminToken = '';
  let busy = false;
  let online = false;
  let refreshing = false;
  let requestId = newId();

  function newId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function message(text, ok = false) {
    $('entryMessage').textContent = text;
    $('entryMessage').className = `challenge-message ${ok ? 'is-ok' : 'is-error'}`;
  }
  function setBusy(value) {
    busy = value;
    fields.disabled = value || !online;
    $('submitEntry').textContent = value ? '저장 중…' : '인증 등록';
    $('importLegacy').disabled = value || !online;
    $('refreshRecords').disabled = value;
  }
  async function api(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal, cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || `서버 요청에 실패했습니다. (${response.status})`);
      if (!result) throw new Error('이 주소에 인증 서버가 연결되어 있지 않습니다.');
      return result;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('서버 연결을 확인해주세요. 전송 중이었다면 같은 내용으로 다시 등록해도 중복 저장되지 않습니다.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  function localDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function resetDate() {
    const today = localDate(new Date());
    dateInput.value = today < data.event.start ? data.event.start : today > data.event.end ? data.event.end : today;
  }
  async function refresh() {
    if (refreshing) return false;
    refreshing = true;
    try {
      const result = await api('/api/event');
      if (!result.event || !Array.isArray(result.records) || !Array.isArray(result.participants)) throw new Error('인증 서버의 응답을 확인해주세요.');
      data = result;
      online = true;
      dateInput.min = data.event.start;
      dateInput.max = data.event.end;
      if (!dateInput.value) resetDate();
      $('serverStatus').textContent = `서버 연결됨 · ${data.event.start} ~ ${data.event.end} · 최근 확인 ${new Date().toLocaleTimeString('ko-KR')}`;
      $('serverStatus').classList.remove('is-error');
      renderAll();
      return true;
    } catch (error) {
      online = false;
      $('serverStatus').textContent = `서버 연결 안 됨 · ${error.message}${data.records.length ? ' 현재 보이는 기록은 마지막으로 불러온 내용입니다.' : ''}`;
      $('serverStatus').classList.add('is-error');
      return false;
    } finally { refreshing = false; setBusy(busy); }
  }
  function weeks() {
    const result = [];
    let cursor = new Date(`${data.event.start}T00:00:00Z`);
    while (cursor.toISOString().slice(0, 10) <= data.event.end) {
      const start = cursor.toISOString().slice(0, 10);
      cursor.setUTCDate(cursor.getUTCDate() + 6);
      const end = cursor.toISOString().slice(0, 10) > data.event.end ? data.event.end : cursor.toISOString().slice(0, 10);
      result.push({ start, end, label: `W${result.length + 1} (${start.slice(5)}~${end.slice(5)})` });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return result;
  }
  function renderAll() {
    if (participantId && !data.participants.some((p) => p.id === participantId)) participantId = '';
    const qualified = data.participants.filter((p) => p.totalDays > 0);
    $('participantCount').textContent = `${qualified.length}명`;
    const ranges = weeks();
    const months = [...new Set(ranges.flatMap((week) => [week.start.slice(0, 7), week.end.slice(0, 7)]))];
    $('summaryTableBody').innerHTML = qualified.length ? qualified.map((member) => `<tr class="${member.id === participantId ? 'is-selected' : ''}">
      <td data-label="참가자"><button type="button" class="challenge-member" data-member="${member.id}" aria-controls="recordTableBody" aria-pressed="${member.id === participantId}">${escapeHtml(member.name)} <span aria-hidden="true">↗</span></button></td>
      <td data-label="인증 일수"><strong>${member.totalDays}일</strong></td>
      <td data-label="주별 점수"><div class="challenge-chip-row">${ranges.map((week) => `<span class="chip">${week.label}: ${member.days.filter((date) => date >= week.start && date <= week.end).length}</span>`).join('')}</div></td>
      <td data-label="월별 점수"><div class="challenge-chip-row">${months.map((month) => `<span class="chip">${Number(month.slice(5))}월: ${member.days.filter((date) => date.startsWith(month)).length}</span>`).join('')}</div></td>
    </tr>`).join('') : '<tr><td colspan="4">30분 이상 인증한 참가자가 아직 없습니다.</td></tr>';
    $('participantFilter').innerHTML = '<option value="">전체 참가자</option>' + [...data.participants].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((member) => `<option value="${member.id}">${escapeHtml(member.name)} (${member.recordCount}건)</option>`).join('');
    $('participantFilter').value = participantId;
    const member = data.participants.find((p) => p.id === participantId);
    $('historyHeading').textContent = member ? `${member.name}님의 인증 내역` : '인증 내역';
    const rows = filteredRecords();
    $('historyCount').textContent = `${rows.length}건`;
    $('exportCsv').disabled = !rows.length;
    $('recordTableBody').innerHTML = rows.length ? rows.map((record) => `<tr>
      <td data-label="날짜">${escapeHtml(record.date)}</td>
      <td data-label="이름"><button type="button" class="challenge-member" data-member="${record.participantId}">${escapeHtml(record.name)}</button></td>
      <td data-label="운동 종류">${escapeHtml(record.activity)}</td><td data-label="시간(분)">${record.minutes}</td>
      <td data-label="상태"><span class="chip ${record.qualified ? 'challenge-qualified' : ''}">${record.qualified ? '30분 이상 인증' : '30분 미만'}</span></td>
      <td data-label="사진 / 관리"><div><div class="challenge-record-photos">${record.photos.length ? record.photos.map((photo, index) => `<button class="challenge-thumbnail" type="button" data-photo="${photo.id}" aria-label="${escapeHtml(record.name)} ${record.date} 사진 ${index + 1} 크게 보기"><img src="${escapeHtml(API_BASE + photo.url)}" alt="${escapeHtml(record.activity)} 인증 사진 ${index + 1}" loading="lazy"></button>`).join('') : '<span class="challenge-muted">사진 없음</span>'}</div>${adminToken ? `<button type="button" class="challenge-delete" data-delete="${record.id}">인증 삭제</button>` : ''}</div></td>
    </tr>`).join('') : '<tr><td colspan="6">등록된 인증이 아직 없습니다.</td></tr>';
  }
  function filteredRecords() { return data.records.filter((r) => !participantId || r.participantId === participantId); }
  function selectParticipant(id, scroll = false) {
    participantId = id;
    renderAll();
    if (scroll) { $('historyHeading').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('historyHeading').focus({ preventScroll: true }); }
  }
  $('participantFilter').addEventListener('change', (event) => selectParticipant(event.target.value));
  $('showAllRecords').addEventListener('click', () => selectParticipant(''));
  document.addEventListener('click', async (event) => {
    const member = event.target.closest('[data-member]');
    if (member) selectParticipant(member.dataset.member, true);
    const photoButton = event.target.closest('[data-photo]');
    if (photoButton) {
      const record = data.records.find((r) => r.photos.some((p) => p.id === photoButton.dataset.photo));
      const photo = record.photos.find((p) => p.id === photoButton.dataset.photo);
      $('fullPhoto').src = API_BASE + photo.url;
      $('fullPhoto').alt = `${record.name} · ${record.date} · ${record.activity} 인증 사진`;
      $('photoCaption').textContent = `${record.name} · ${record.date} · ${record.activity} ${record.minutes}분`;
      $('photoDialog').showModal();
    }
    const deleteButton = event.target.closest('[data-delete]');
    if (deleteButton && !busy) {
      const record = data.records.find((r) => r.id === deleteButton.dataset.delete);
      if (!window.confirm(`${record.name}님의 ${record.date} 인증을 삭제할까요? 참가자 집계에서도 제외됩니다.`)) return;
      setBusy(true);
      deleteButton.disabled = true;
      try {
        await api(`/api/records/${record.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        const synced = await refresh();
        message(synced ? '인증을 삭제했습니다.' : '인증은 삭제되었습니다. 목록은 새로고침 후 확인해주세요.', synced);
      } catch (error) { message(error.message); }
      finally { setBusy(false); deleteButton.disabled = false; }
    }
  });
  $('photoDialog').addEventListener('close', () => $('fullPhoto').removeAttribute('src'));

  function renderPreviews() {
    $('photoPreview').innerHTML = selectedPhotos.map((photo, index) => `<div class="challenge-preview-item"><img src="${photo.url}" alt="첨부 사진 ${index + 1}"><span>사진 ${index + 1}</span><button type="button" data-remove-photo="${index}" aria-label="첨부 사진 ${index + 1} 삭제">삭제</button></div>`).join('');
  }
  $('photoPreview').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-photo]');
    if (!button || busy) return;
    const [removed] = selectedPhotos.splice(Number(button.dataset.removePhoto), 1);
    URL.revokeObjectURL(removed.url);
    requestId = newId();
    renderPreviews();
  });
  photoInput.addEventListener('change', async () => {
    const files = Array.from(photoInput.files);
    photoInput.value = '';
    if (selectedPhotos.length + files.length > 3) return message('사진은 최대 3장까지 첨부할 수 있습니다.');
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024)) return message('JPG, PNG, WebP 사진을 장당 8MB 이하로 선택해주세요. HEIC 사진은 JPG로 변환해주세요.');
    setBusy(true);
    const prepared = [];
    try {
      for (const file of files) {
        // Re-encode to keep mobile uploads small and remove camera GPS/EXIF metadata.
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        try {
          await img.decode();
          const scale = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const context = canvas.getContext('2d');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
          if (!blob) throw new Error('사진을 읽지 못했습니다. 다른 사진을 선택해주세요.');
          prepared.push({ blob, url: URL.createObjectURL(blob) });
        } finally { URL.revokeObjectURL(url); }
      }
      selectedPhotos.push(...prepared);
      requestId = newId();
      renderPreviews();
      message(`${selectedPhotos.length}장의 사진을 첨부했습니다. 인증 등록을 누르면 서버에 저장됩니다.`, true);
    } catch {
      prepared.forEach((photo) => URL.revokeObjectURL(photo.url));
      message('사진을 읽지 못했습니다. 파일이 손상되지 않았는지 확인해주세요.');
    } finally { setBusy(false); }
  });
  form.addEventListener('input', () => { requestId = newId(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !online) return;
    // FormData must be captured before disabling the fieldset.
    const payload = new FormData(form);
    payload.append('requestId', requestId);
    selectedPhotos.forEach((photo, index) => payload.append('photos', photo.blob, `photo-${index + 1}.jpg`));
    setBusy(true);
    try {
      const result = await api('/api/records', { method: 'POST', body: payload });
      selectedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
      selectedPhotos = [];
      renderPreviews();
      form.reset();
      resetDate();
      requestId = newId();
      participantId = result.record.participantId;
      const synced = await refresh();
      message(synced ? '서버에 인증을 저장했습니다. 같은 날의 30분 이상 인증은 1점으로 집계됩니다.' : '서버에 인증은 저장되었습니다. 목록은 새로고침 후 확인해주세요.', synced);
    } catch (error) { message(error.message); }
    finally { setBusy(false); }
  });
  $('refreshRecords').addEventListener('click', () => refresh());
  $('adminForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const token = $('adminToken').value.trim();
      await api('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      adminToken = token;
      $('adminToken').value = '';
      $('adminLogout').hidden = false;
      $('adminMessage').textContent = '관리자로 연결되었습니다. 인증 내역에서 개별 기록을 삭제할 수 있습니다.';
      if (data.event) renderAll();
    } catch (error) { $('adminMessage').textContent = error.message; }
  });
  $('adminLogout').addEventListener('click', () => {
    adminToken = '';
    $('adminLogout').hidden = true;
    $('adminMessage').textContent = '관리자 연결을 해제했습니다.';
    if (data.event) renderAll();
  });
  $('exportCsv').addEventListener('click', () => {
    const escapeCsv = (value) => {
      let text = String(value);
      if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const lines = [['날짜', '이름', '운동 종류', '운동 시간(분)', '30분 이상 인증', '사진 수'], ...filteredRecords().map((r) => [r.date, r.name, r.activity, r.minutes, r.qualified ? 'Y' : 'N', r.photos.length])];
    const blob = new Blob(['\uFEFF' + lines.map((line) => line.map(escapeCsv).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'jeju-riding-challenge-records.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  function legacyRecords() {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }
  // Deterministic import key, including the old identity, permits interrupted imports to resume.
  function legacyKey(record) {
    const text = JSON.stringify([record.id, record.createdAt, record.name, record.date, record.activity, record.minutes]);
    return 'legacy-' + [2166136261, 3335557771, 1234567891, 402653189].map((seed) => {
      let hash = seed;
      for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
      return (hash >>> 0).toString(16).padStart(8, '0');
    }).join('');
  }
  $('importLegacy').hidden = !legacyRecords().length;
  $('importLegacy').addEventListener('click', async () => {
    if (busy || !online) return;
    const records = legacyRecords();
    if (!window.confirm(`이 브라우저의 기존 인증 ${records.length}건을 서버로 가져올까요? 이미 가져온 기록은 중복 저장하지 않습니다.`)) return;
    setBusy(true);
    let saved = 0;
    let existing = 0;
    let failed = 0;
    let lastError = '';
    try {
      for (const record of records) {
        const payload = new FormData();
        for (const key of ['name', 'activity', 'date', 'minutes']) payload.append(key, String(record?.[key] ?? ''));
        payload.append('requestId', legacyKey(record || {}));
        try {
          const result = await api('/api/records', { method: 'POST', body: payload });
          if (result.duplicate) existing++; else saved++;
        } catch (error) { failed++; lastError = error.message; }
        message(`기존 기록 가져오는 중 · 신규 ${saved}건 / 이미 저장 ${existing}건 / 실패 ${failed}건`, true);
      }
      await refresh();
      message(`가져오기 완료 · 신규 ${saved}건 / 이미 저장 ${existing}건 / 실패 ${failed}건. 브라우저 원본은 보존했습니다.${failed ? ` ${lastError}` : ''}`, !failed);
    } finally { setBusy(false); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !busy) refresh(); });
  window.addEventListener('online', () => { if (!busy) refresh(); });
  setInterval(() => { if (!document.hidden && !busy) refresh(); }, 30_000);
  refresh();
})();
