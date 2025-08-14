'use strict';

(function () {
  const storageKey = 'campaigns_v1';
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const appEl = document.getElementById('app');
  const toolbarEl = document.getElementById('toolbar');
  const newBtn = document.getElementById('newCampaignBtn');

  const uiState = {
    search: '',
    status: 'all'
  };

  newBtn.addEventListener('click', () => navigateTo('#/create'));
  window.addEventListener('hashchange', handleRoute);
  document.addEventListener('DOMContentLoaded', () => {
    ensureSeed();
    handleRoute();
  });

  function handleRoute() {
    const { path, params } = parseHash(location.hash);
    renderToolbar(path);
    switch (path) {
      case '/create':
        renderCreateOrEdit();
        break;
      case '/edit':
        renderCreateOrEdit(params.id);
        break;
      case '/view':
        renderDetail(params.id);
        break;
      case '/list':
      default:
        renderList();
    }
  }

  function navigateTo(hash) {
    if (location.hash === hash) {
      handleRoute();
      return;
    }
    location.hash = hash;
  }

  function parseHash(hash) {
    const clean = (hash || '#/list').replace(/^#/, '');
    const parts = clean.split('/').filter(Boolean);
    if (parts.length === 0) return { path: '/list', params: {} };
    if (parts[0] === 'create') return { path: '/create', params: {} };
    if (parts[0] === 'edit') return { path: '/edit', params: { id: parts[1] } };
    if (parts[0] === 'view') return { path: '/view', params: { id: parts[1] } };
    return { path: '/list', params: {} };
  }

  function ensureSeed() {
    const existing = loadCampaigns();
    if (existing.length > 0) return;
    const now = Date.now();
    const addDays = (n) => new Date(now + n * 86400000).toISOString().slice(0, 10);
    const sample = [
      {
        id: createId(),
        title: 'Campanha Solidária de Inverno',
        description: 'Arrecadação de agasalhos e cobertores para comunidades carentes durante o inverno.',
        goal: 15000,
        raised: 6200,
        startDate: addDays(-15),
        endDate: addDays(30),
        status: 'active',
        tags: ['solidariedade', 'inverno'],
        createdAt: now,
        updatedAt: now
      },
      {
        id: createId(),
        title: 'Educação para Todos',
        description: 'Doações para kits escolares destinados a crianças em vulnerabilidade social.',
        goal: 25000,
        raised: 21450,
        startDate: addDays(-60),
        endDate: addDays(5),
        status: 'active',
        tags: ['educação', 'crianças'],
        createdAt: now,
        updatedAt: now
      },
      {
        id: createId(),
        title: 'Ajude o Abrigo de Animais',
        description: 'Campanha para ajudar com medicamentos, ração e estrutura do abrigo municipal.',
        goal: 10000,
        raised: 10000,
        startDate: addDays(-120),
        endDate: addDays(-5),
        status: 'completed',
        tags: ['animais', 'saúde'],
        createdAt: now,
        updatedAt: now
      }
    ];
    saveCampaigns(sample);
  }

  function loadCampaigns() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCampaigns(list) {
    localStorage.setItem(storageKey, JSON.stringify(list, null, 2));
  }

  function upsertCampaign(campaign) {
    const list = loadCampaigns();
    const idx = list.findIndex((c) => c.id === campaign.id);
    const time = Date.now();
    if (idx >= 0) {
      campaign.updatedAt = time;
      list[idx] = campaign;
    } else {
      campaign.createdAt = time;
      campaign.updatedAt = time;
      list.unshift(campaign);
    }
    saveCampaigns(list);
  }

  function deleteCampaign(id) {
    const list = loadCampaigns();
    saveCampaigns(list.filter((c) => c.id !== id));
  }

  function createId() {
    return 'cmp_' + Math.random().toString(36).slice(2, 8) + '_' + Date.now().toString(36);
  }

  function formatDate(dateLike) {
    if (!dateLike) return '';
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR');
  }

  function daysLeftString(endDate) {
    if (!endDate) return '';
    const end = new Date(endDate).setHours(0,0,0,0);
    const today = new Date().setHours(0,0,0,0);
    const diff = Math.round((end - today) / 86400000);
    if (diff > 1) return `${diff} dias restantes`;
    if (diff === 1) return '1 dia restante';
    if (diff === 0) return 'Termina hoje';
    return `${Math.abs(diff)} dias atrás`;
  }

  function renderToolbar(path) {
    const listMode = path === '/list';
    const html = listMode ? `
      <div class="card" style="width: 100%">
        <div class="kpi-row">
          ${kpi('Total de Campanhas', String(loadCampaigns().length))}
          ${kpi('Ativas', String(loadCampaigns().filter(c=>c.status==='active').length))}
          ${kpi('Concluídas', String(loadCampaigns().filter(c=>c.status==='completed').length))}
          ${kpi('Meta Total', currency.format(loadCampaigns().reduce((a,c)=>a+c.goal,0)))}
        </div>
        <div class="toolbar" style="padding: 0; margin-top: 6px;">
          <div class="grow">
            <input id="searchInput" class="input" type="search" placeholder="Buscar por nome ou tag" value="${escapeAttr(uiState.search)}" />
          </div>
          <select id="statusFilter">
            ${option('all', 'Todos', uiState.status)}
            ${option('active', 'Ativas', uiState.status)}
            ${option('draft', 'Rascunho', uiState.status)}
            ${option('paused', 'Pausadas', uiState.status)}
            ${option('completed', 'Concluídas', uiState.status)}
          </select>
          <button class="btn" id="clearFiltersBtn">Limpar</button>
          <a class="btn btn-primary" href="#/create">Nova Campanha</a>
        </div>
      </div>
    ` : '';
    toolbarEl.innerHTML = html;

    if (listMode) {
      document.getElementById('statusFilter').addEventListener('change', (e) => {
        uiState.status = e.target.value;
        renderList();
      });
      document.getElementById('searchInput').addEventListener('input', (e) => {
        uiState.search = e.target.value;
        renderList();
      });
      document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        uiState.search = '';
        uiState.status = 'all';
        renderToolbar('/list');
        renderList();
      });
    }
  }

  function renderList() {
    const all = loadCampaigns();
    const query = uiState.search.trim().toLowerCase();
    const filtered = all.filter((c) => {
      const matchesStatus = uiState.status === 'all' ? true : c.status === uiState.status;
      const matchesSearch = query === '' ? true : (
        c.title.toLowerCase().includes(query) ||
        c.tags.some(t => t.toLowerCase().includes(query))
      );
      return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
      appEl.innerHTML = `
        <div class="empty">
          <p>Nenhuma campanha encontrada.</p>
          <p><a class="btn btn-primary" href="#/create">Criar a primeira campanha</a></p>
        </div>
      `;
      return;
    }

    const cards = filtered.map((c) => campaignCard(c)).join('');
    appEl.innerHTML = `<div class="cards-grid">${cards}</div>`;

    appEl.querySelectorAll('[data-action="view"]').forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(`#/view/${btn.dataset.id}`));
    });
    appEl.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(`#/edit/${btn.dataset.id}`));
    });
    appEl.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = loadCampaigns().find(c => c.id === id);
        if (!item) return;
        if (confirm(`Excluir a campanha "${item.title}"? Essa ação não pode ser desfeita.`)) {
          deleteCampaign(id);
          renderToolbar('/list');
          renderList();
        }
      });
    });
  }

  function campaignCard(c) {
    const pct = c.goal > 0 ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0;
    const statusClass = `status-${c.status}`;
    const tags = c.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const meta = `Meta ${currency.format(c.goal)} • Arrecadado ${currency.format(c.raised)}`;
    return `
      <article class="card">
        <div class="card-title">
          <div>
            <h3>${escapeHtml(c.title)}</h3>
            <div class="tags">${tags}</div>
          </div>
          <div class="status-badge dot ${statusClass}">
            <span>${statusLabel(c.status)}</span>
          </div>
        </div>
        <p class="help" style="margin: 6px 0 10px">${escapeHtml(c.description || '')}</p>
        <div class="progress"><div class="bar" style="width: ${pct}%"></div></div>
        <div class="grid-meta" style="margin-top: 8px">
          <div><small class="dim">${escapeHtml(meta)}</small></div>
          <div><small class="dim">Início: ${formatDate(c.startDate)}</small></div>
          <div><small class="dim">Término: ${formatDate(c.endDate)} (${daysLeftString(c.endDate)})</small></div>
        </div>
        <hr class="sep" />
        <div class="list-actions">
          <button class="btn" data-action="view" data-id="${c.id}">Ver</button>
          <button class="btn" data-action="edit" data-id="${c.id}">Editar</button>
          <button class="btn btn-danger" data-action="delete" data-id="${c.id}">Excluir</button>
        </div>
      </article>
    `;
  }

  function renderCreateOrEdit(id) {
    const editing = Boolean(id);
    const item = editing ? loadCampaigns().find(c => c.id === id) : null;
    if (editing && !item) {
      appEl.innerHTML = `<div class="empty">Campanha não encontrada. <a href=\"#/list\">Voltar</a></div>`;
      return;
    }

    const values = item || {
      id: createId(),
      title: '',
      description: '',
      goal: 0,
      raised: 0,
      startDate: new Date().toISOString().slice(0,10),
      endDate: '',
      status: 'draft',
      tags: []
    };

    appEl.innerHTML = `
      <div class="card">
        <h2>${editing ? 'Editar Campanha' : 'Nova Campanha'}</h2>
        <form id="campaignForm" class="form two-col">
          <div class="form-field">
            <label for="title">Título</label>
            <input id="title" name="title" class="input" type="text" required value="${escapeAttr(values.title)}" />
          </div>
          <div class="form-field">
            <label for="goal">Meta (R$)</label>
            <input id="goal" name="goal" class="input" type="number" step="0.01" min="0" value="${values.goal}" />
          </div>
          <div class="form-field" style="grid-column: 1 / -1;">
            <label for="description">Descrição</label>
            <textarea id="description" name="description" rows="4">${escapeHtml(values.description)}</textarea>
          </div>
          <div class="form-field">
            <label for="raised">Arrecadado (R$)</label>
            <input id="raised" name="raised" class="input" type="number" step="0.01" min="0" value="${values.raised}" />
          </div>
          <div class="form-field">
            <label for="status">Status</label>
            <select id="status" name="status">
              ${option('draft', 'Rascunho', values.status)}
              ${option('active', 'Ativa', values.status)}
              ${option('paused', 'Pausada', values.status)}
              ${option('completed', 'Concluída', values.status)}
            </select>
          </div>
          <div class="form-field">
            <label for="startDate">Início</label>
            <input id="startDate" name="startDate" class="input" type="date" value="${values.startDate}" />
          </div>
          <div class="form-field">
            <label for="endDate">Término</label>
            <input id="endDate" name="endDate" class="input" type="date" value="${values.endDate || ''}" />
          </div>
          <div class="form-field" style="grid-column: 1 / -1;">
            <label for="tags">Tags (separadas por vírgula)</label>
            <input id="tags" name="tags" class="input" type="text" value="${escapeAttr(values.tags.join(', '))}" />
          </div>
          <div class="form-actions" style="grid-column: 1 / -1;">
            <a class="btn" href="#/list">Cancelar</a>
            <button class="btn btn-primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('campaignForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const title = String(formData.get('title') || '').trim();
      const goal = Number(formData.get('goal')) || 0;
      const raised = Number(formData.get('raised')) || 0;
      const status = String(formData.get('status'));
      const startDate = String(formData.get('startDate') || '');
      const endDate = String(formData.get('endDate') || '');
      const tagsStr = String(formData.get('tags') || '');
      const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
      const description = String(formData.get('description') || '');

      const errors = [];
      if (title.length < 3) errors.push('Título deve ter ao menos 3 caracteres.');
      if (goal < 0) errors.push('Meta não pode ser negativa.');
      if (raised < 0) errors.push('Arrecadado não pode ser negativo.');
      if (startDate && endDate) {
        const s = new Date(startDate);
        const e2 = new Date(endDate);
        if (e2.getTime() < s.getTime()) errors.push('Término não pode ser antes do início.');
      }
      if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
      }

      const record = {
        id: values.id,
        title,
        description,
        goal,
        raised,
        startDate,
        endDate,
        status,
        tags,
        createdAt: item ? item.createdAt : undefined,
        updatedAt: item ? item.updatedAt : undefined
      };

      upsertCampaign(record);
      navigateTo('#/list');
    });
  }

  function renderDetail(id) {
    const item = loadCampaigns().find(c => c.id === id);
    if (!item) {
      appEl.innerHTML = `<div class=\"empty\">Campanha não encontrada. <a href=\"#/list\">Voltar</a></div>`;
      return;
    }

    const pct = item.goal > 0 ? Math.min(100, Math.round((item.raised / item.goal) * 100)) : 0;

    appEl.innerHTML = `
      <div class="card detail">
        <div style="display:flex; align-items:center; justify-content:space-between; gap: 10px;">
          <h2>${escapeHtml(item.title)}</h2>
          <div class="status-badge dot status-${item.status}">${statusLabel(item.status)}</div>
        </div>
        <p class="help">${escapeHtml(item.description || '')}</p>
        <div class="kpi-row">
          ${kpi('Meta', currency.format(item.goal))}
          ${kpi('Arrecadado', currency.format(item.raised))}
          ${kpi('Início', formatDate(item.startDate))}
          ${kpi('Término', `${formatDate(item.endDate)} (${daysLeftString(item.endDate)})`)}
        </div>
        <div class="progress"><div class="bar" style="width: ${pct}%"></div></div>
        <div class="tags" style="margin-top: 10px;">${item.tags.map(t => `<span class=\"tag\">${escapeHtml(t)}</span>`).join('')}</div>
        <hr class="sep" />
        <div style="display:flex; gap:8px; flex-wrap: wrap;">
          <a class="btn" href="#/edit/${item.id}">Editar</a>
          <button id="shareBtn" class="btn btn-primary">Compartilhar link</button>
          <a class="btn" href="#/list">Voltar</a>
          <span class="grow" style="flex:1 1 auto"></span>
          <button id="deleteBtn" class="btn btn-danger">Excluir</button>
        </div>
      </div>
    `;

    document.getElementById('shareBtn').addEventListener('click', async () => {
      const url = location.origin + location.pathname + `#/view/${item.id}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: item.title, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          alert('Link copiado para a área de transferência');
        } else {
          prompt('Copie o link:', url);
        }
      } catch {}
    });

    document.getElementById('deleteBtn').addEventListener('click', () => {
      if (confirm('Tem certeza que deseja excluir esta campanha?')) {
        deleteCampaign(item.id);
        navigateTo('#/list');
      }
    });
  }

  function kpi(label, value) {
    return `<div class="kpi"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`;
  }

  function statusLabel(status) {
    switch (status) {
      case 'active': return 'Ativa';
      case 'draft': return 'Rascunho';
      case 'paused': return 'Pausada';
      case 'completed': return 'Concluída';
      default: return status;
    }
  }

  function option(value, label, selected) {
    const isSel = String(value) === String(selected) ? 'selected' : '';
    return `<option value="${escapeAttr(value)}" ${isSel}>${escapeHtml(label)}</option>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll('"', '&quot;');
  }
})();