const sidebarToggles = document.querySelectorAll('[data-sidebar-toggle]');

sidebarToggles.forEach((trigger) => {
  const menu = document.getElementById(trigger.getAttribute('aria-controls'));
  if (!menu) return;

  trigger.addEventListener('click', () => {
    const willExpand = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(willExpand));
    menu.hidden = !willExpand;
  });
});

const domainTrigger = document.querySelector('[aria-controls="domain-menu"]');
const domainLabel = document.querySelector('[data-domain-label]');
const domainMenu = document.getElementById('domain-menu');
const regionTitle = document.querySelector('[data-region-title]');

document.querySelectorAll('[data-domain-option]').forEach((option) => {
  option.addEventListener('click', (event) => {
    event.preventDefault();
    const name = option.dataset.domainOption;
    domainLabel.textContent = name;
    regionTitle.textContent = name;
    domainTrigger.setAttribute('aria-expanded', 'false');
    domainMenu.hidden = true;
  });
});

const serverRows = [...document.querySelectorAll('[data-server-row]')];
const serverSearch = document.querySelector('.server-search input');
const statusFilter = document.getElementById('status-filter');
const resultCount = document.querySelector('[data-result-count]');
const emptyRow = document.querySelector('.empty-row');
const closedSummary = document.querySelector('[data-summary="closed"]');
const bookedSummary = document.querySelector('[data-summary="booked"]');
const totalSummary = document.querySelector('[data-summary="total"]');
const syncStatus = document.querySelector('[data-sync-status]');

function updateSummary() {
  const closedCount = serverRows.filter((row) => row.dataset.status === 'closed').length;
  const bookedCount = serverRows.filter((row) => row.dataset.booked === 'true').length;

  closedSummary.textContent = `${closedCount} 个`;
  bookedSummary.textContent = `${bookedCount} 个`;
  totalSummary.textContent = String(serverRows.length);
}

function applyFilters() {
  const query = serverSearch.value.trim().toLocaleLowerCase('zh-CN');
  const status = statusFilter.value;
  let visibleCount = 0;

  serverRows.forEach((row) => {
    const matchesQuery = !query || row.textContent.toLocaleLowerCase('zh-CN').includes(query);
    const matchesStatus = status === 'all' || row.dataset.status === status;
    const visible = matchesQuery && matchesStatus;
    row.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  emptyRow.hidden = visibleCount !== 0;
  resultCount.textContent = visibleCount === serverRows.length
    ? `展示最新 ${serverRows.length} 个游戏服`
    : `显示 ${visibleCount} / ${serverRows.length} 个游戏服`;
}

function currentTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

function markSynced(message) {
  syncStatus.textContent = message || `${currentTime()} 已同步 · 30 秒自动刷新`;
}

function flashButton(button, message) {
  const label = button.querySelector('span') || button;
  const original = label.textContent;
  button.disabled = true;
  label.textContent = message;

  window.setTimeout(() => {
    label.textContent = original;
    button.disabled = false;
  }, 900);
}

serverSearch.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);

document.querySelector('[data-action="refresh"]').addEventListener('click', (event) => {
  applyFilters();
  updateSummary();
  markSynced();
  flashButton(event.currentTarget, '已刷新');
});

document.querySelector('[data-action="sync"]').addEventListener('click', (event) => {
  applyFilters();
  updateSummary();
  markSynced();
  flashButton(event.currentTarget, '已同步');
});

document.querySelectorAll('[data-action="schedule"]').forEach((button) => {
  button.addEventListener('click', () => {
    const row = button.closest('[data-server-row]');
    const bookingCell = row.querySelector('.booking-cell');
    const willBook = row.dataset.booked !== 'true';

    row.dataset.booked = String(willBook);
    bookingCell.textContent = willBook ? '待执行' : '未预约';
    bookingCell.classList.toggle('booked', willBook);
    bookingCell.classList.toggle('muted', !willBook);
    button.textContent = willBook ? '取消预约' : '预约开服';
    updateSummary();
  });
});

document.querySelector('[data-action="open-now"]').addEventListener('click', (event) => {
  const row = serverRows.find((item) => item.dataset.status === 'closed');
  if (!row) {
    flashButton(event.currentTarget, '暂无待开区服');
    return;
  }

  const serverName = row.querySelector('td strong').textContent;
  const state = row.querySelector('.state');
  const bookingCell = row.querySelector('.booking-cell');
  const actionCell = row.lastElementChild;

  row.dataset.status = 'open';
  row.dataset.booked = 'false';
  state.className = 'state open';
  state.textContent = '已开服';
  bookingCell.className = 'muted booking-cell';
  bookingCell.textContent = '未预约';
  actionCell.className = 'muted';
  actionCell.textContent = '—';

  updateSummary();
  applyFilters();
  markSynced(`${serverName} 已开服 · ${currentTime()} 已同步`);
  flashButton(event.currentTarget, '开服成功');
});

const quickSearch = document.querySelector('.search input');
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    quickSearch.focus();
  }
});

const collapseButton = document.querySelector('.collapse');
collapseButton.addEventListener('click', () => {
  const collapsed = document.body.classList.toggle('sidebar-collapsed');
  collapseButton.setAttribute('aria-label', collapsed ? '展开侧栏' : '收起侧栏');
});

updateSummary();
applyFilters();
markSynced();
window.setInterval(markSynced, 30000);
