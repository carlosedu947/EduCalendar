/**
 * EduCalendar - Main Application Controller (Mobile, Multi-Wi-Fi & Remote Access)
 * Controle de abas, renderização responsiva, compartilhamento por QR Code e integração com redes Wi-Fi.
 */

class AppController {
  constructor() {
    this.currentTab = 'calendar';
    this.store = window.academicStore;
    this.calendar = null;
    this.editingEntity = null;
    this.editingId = null;

    this.init();
  }

  init() {
    // Registrar Service Worker para suporte PWA/Mobile
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('SW registration skipped:', err);
      });
    }

    // Inicializar Calendário
    this.calendar = new window.AcademicCalendar('calendar-grid-container');
    window.academicCalendar = this.calendar;

    // Registrar observador do store
    this.store.subscribe((collection) => {
      this.refreshCurrentView();
      this.updateQuickBadges();
      this.populateFilterDropdowns();
    });

    // Configurar Navegação Desktop & Mobile
    this.setupNavigation();

    // Configurar Tema
    this.initTheme();

    // Preencher Selects de Filtro
    this.populateFilterDropdowns();
    this.updateQuickBadges();

    // Renderizar Visão Inicial
    this.switchTab('calendar');

    // Registrar Teclas de Atalho
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeShareModal();
        this.closeMenuSheet();
      }
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    this.closeMenuSheet();
    this.closeSidebarMobile();

    document.querySelectorAll('.nav-link').forEach(btn => {
      const active = btn.dataset.tab === tabName;
      btn.classList.toggle('active-tab', active);
      btn.classList.toggle('text-indigo-600', active);
      btn.classList.toggle('bg-indigo-50', active);
      btn.classList.toggle('dark:bg-indigo-950/40', active);
      btn.classList.toggle('dark:text-indigo-400', active);
    });

    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      const active = btn.dataset.tab === tabName;
      btn.classList.toggle('active', active);
    });

    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.add('hidden');
    });

    const activeSection = document.getElementById(`tab-${tabName}`);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }

    switch (tabName) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'calendar':
        this.calendar.render();
        break;
      case 'teachers':
        this.renderTeachersTable();
        break;
      case 'coordinators':
        this.renderCoordinatorsTable();
        break;
      case 'students':
        this.renderStudentsTable();
        break;
      case 'subjects':
        this.renderSubjectsTable();
        break;
      case 'classrooms':
        this.renderClassroomsTable();
        break;
      case 'classes':
        this.renderClassesTable();
        break;
    }

    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }

  setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.dataset.tab;
        if (tab === 'menu') {
          this.toggleMenuSheet();
        } else if (tab) {
          this.switchTab(tab);
        }
      });
    });

    const toggleBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        if (backdrop) backdrop.classList.toggle('hidden');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        this.closeSidebarMobile();
      });
    }
  }

  closeSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  }

  toggleMenuSheet() {
    const sheet = document.getElementById('mobile-menu-sheet');
    if (sheet) sheet.classList.toggle('hidden');
  }

  closeMenuSheet() {
    const sheet = document.getElementById('mobile-menu-sheet');
    if (sheet) sheet.classList.add('hidden');
  }

  refreshCurrentView() {
    this.switchTab(this.currentTab);
  }

  updateQuickBadges() {
    const stats = this.store.getStats();
    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.innerText = count;
    };

    setBadge('badge-teachers', stats.totalTeachers);
    setBadge('badge-coordinators', stats.totalCoordinators);
    setBadge('badge-students', stats.totalStudents);
    setBadge('badge-subjects', stats.totalSubjects);
    setBadge('badge-classrooms', stats.totalClassrooms);
    setBadge('badge-classes', stats.totalClasses);
  }

  populateFilterDropdowns() {
    const teachers = this.store.get('teachers');
    const subjects = this.store.get('subjects');
    const classrooms = this.store.get('classrooms');

    const teacherSelect = document.getElementById('filter-teacher');
    if (teacherSelect) {
      const current = teacherSelect.value;
      teacherSelect.innerHTML = `<option value="all">Todos os Professores</option>` +
        teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      teacherSelect.value = current || 'all';
    }

    const subjectSelect = document.getElementById('filter-subject');
    if (subjectSelect) {
      const current = subjectSelect.value;
      subjectSelect.innerHTML = `<option value="all">Todas as Matérias</option>` +
        subjects.map(s => `<option value="${s.id}">${s.code ? `[${s.code}] ` : ''}${s.name}</option>`).join('');
      subjectSelect.value = current || 'all';
    }

    const roomSelect = document.getElementById('filter-classroom');
    if (roomSelect) {
      const current = roomSelect.value;
      roomSelect.innerHTML = `<option value="all">Todas as Salas</option>` +
        classrooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
      roomSelect.value = current || 'all';
    }
  }

  /* ==========================================================================
     COMPARTILHAMENTO & CONEXÃO MULTI-WI-FI (QR CODE & REDE)
     ========================================================================== */
  openShareModal() {
    const modal = document.getElementById('share-modal');
    if (!modal) return;

    const currentUrl = window.location.href;
    const inputEl = document.getElementById('share-url-input');
    const qrImg = document.getElementById('share-qr-image');

    if (inputEl) inputEl.value = currentUrl;
    if (qrImg) {
      // Gera QR Code nítido a partir da URL atual
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(currentUrl)}`;
    }

    modal.classList.remove('hidden');
  }

  closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.add('hidden');
  }

  copyShareUrl() {
    const inputEl = document.getElementById('share-url-input');
    if (inputEl) {
      inputEl.select();
      navigator.clipboard.writeText(inputEl.value).then(() => {
        this.showToast('Link copiado para a área de transferência!', 'success');
      }).catch(() => {
        document.execCommand('copy');
        this.showToast('Link copiado!', 'success');
      });
    }
  }

  updateCustomQR(newUrl) {
    const qrImg = document.getElementById('share-qr-image');
    if (qrImg && newUrl) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(newUrl)}`;
    }
  }

  /* ==========================================================================
     DASHBOARD
     ========================================================================== */
  renderDashboard() {
    const stats = this.store.getStats();
    const today = new Date().toISOString().split('T')[0];
    const todayClasses = this.store.getEnrichedClasses(c => c.date === today);
    const classrooms = this.store.get('classrooms');

    document.getElementById('dash-total-students').innerText = stats.totalStudents;
    document.getElementById('dash-total-teachers').innerText = stats.totalTeachers;
    document.getElementById('dash-total-subjects').innerText = stats.totalSubjects;
    document.getElementById('dash-total-rooms').innerText = stats.totalClassrooms;
    document.getElementById('dash-today-classes').innerText = stats.todayClassesCount;

    const todayContainer = document.getElementById('dash-today-list');
    if (todayContainer) {
      if (todayClasses.length === 0) {
        todayContainer.innerHTML = `
          <div class="text-center py-6 text-slate-400">
            <i class="fa-solid fa-mug-hot text-2xl mb-1.5"></i>
            <p class="text-xs">Nenhuma aula programada para hoje.</p>
          </div>
        `;
      } else {
        todayContainer.innerHTML = todayClasses.map(cls => `
          <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-1.5 self-stretch rounded-full shrink-0" style="background-color: ${cls.color}"></div>
              <div>
                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">${cls.subjectName}</h4>
                <p class="text-[11px] text-slate-500">${cls.teacherName} • ${cls.classroomName}</p>
              </div>
            </div>
            <span class="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">${cls.startTime} - ${cls.endTime}</span>
          </div>
        `).join('');
      }
    }

    const roomOccupancyContainer = document.getElementById('dash-room-occupancy');
    if (roomOccupancyContainer) {
      roomOccupancyContainer.innerHTML = classrooms.map(room => {
        const roomClassesToday = todayClasses.filter(c => c.classroomId === room.id);
        const isOccupied = roomClassesToday.length > 0;

        return `
          <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">${room.name}</h4>
                <p class="text-[10px] text-slate-400">${room.building || 'Prédio Principal'}</p>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${isOccupied ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}">
                ${isOccupied ? `${roomClassesToday.length} aula(s)` : 'Livre'}
              </span>
            </div>
            <div class="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5">
              <span>Capacidade: <strong>${room.capacity}</strong></span>
              <span class="text-[10px] text-indigo-500 font-semibold">${room.type}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /* ==========================================================================
     TABELAS & CARDS CRUD
     ========================================================================== */
  renderTeachersTable() {
    const teachers = this.store.get('teachers');
    const tableBody = document.getElementById('teachers-table-body');
    const cardsContainer = document.getElementById('teachers-cards-container');
    if (!tableBody && !cardsContainer) return;

    if (teachers.length === 0) {
      const emptyHtml = `<div class="p-8 text-center text-slate-400 text-xs">Nenhum professor cadastrado.</div>`;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhum professor cadastrado.</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = emptyHtml;
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = teachers.map(t => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
          <td class="p-3.5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0" style="background-color: ${t.color || '#6366F1'}">
                ${t.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div class="font-bold text-xs text-slate-900 dark:text-white">${t.name}</div>
                <div class="text-[11px] text-slate-400">${t.registration || '-'}</div>
              </div>
            </div>
          </td>
          <td class="p-3.5 text-xs text-slate-600 dark:text-slate-300">${t.email}</td>
          <td class="p-3.5 text-xs text-slate-600 dark:text-slate-300">${t.phone || '-'}</td>
          <td class="p-3.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">${t.specialty || '-'}</td>
          <td class="p-3.5">
            <span class="inline-block w-4 h-4 rounded-full border border-slate-200" style="background-color: ${t.color || '#6366F1'}"></span>
          </td>
          <td class="p-3.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="window.app.openEditModal('teachers', '${t.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar">
                <i class="fa-solid fa-pen text-xs"></i>
              </button>
              <button onclick="window.app.deleteItem('teachers', '${t.id}', '${t.name}')" class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Excluir">
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = teachers.map(t => `
        <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs" style="background-color: ${t.color || '#6366F1'}">
              ${t.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 dark:text-white">${t.name}</h4>
              <p class="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">${t.specialty || 'Sem especialidade'}</p>
              <p class="text-[10px] text-slate-400">${t.email}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="window.app.openEditModal('teachers', '${t.id}')" class="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <i class="fa-solid fa-pen text-xs"></i>
            </button>
            <button onclick="window.app.deleteItem('teachers', '${t.id}', '${t.name}')" class="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  renderCoordinatorsTable() {
    const coordinators = this.store.get('coordinators');
    const tableBody = document.getElementById('coordinators-table-body');
    const cardsContainer = document.getElementById('coordinators-cards-container');
    if (!tableBody && !cardsContainer) return;

    if (coordinators.length === 0) {
      const emptyHtml = `<div class="p-8 text-center text-slate-400 text-xs">Nenhum coordenador cadastrado.</div>`;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">Nenhum coordenador cadastrado.</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = emptyHtml;
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = coordinators.map(c => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
          <td class="p-3.5">
            <div class="font-bold text-xs text-slate-900 dark:text-white">${c.name}</div>
            <div class="text-[11px] text-slate-400">${c.registration || '-'}</div>
          </td>
          <td class="p-3.5 text-xs text-slate-600 dark:text-slate-300">${c.email}</td>
          <td class="p-3.5 text-xs text-slate-600 dark:text-slate-300">${c.phone || '-'}</td>
          <td class="p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">${c.department || '-'}</td>
          <td class="p-3.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="window.app.openEditModal('coordinators', '${c.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-pen text-xs"></i>
              </button>
              <button onclick="window.app.deleteItem('coordinators', '${c.id}', '${c.name}')" class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = coordinators.map(c => `
        <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white">${c.name}</h4>
            <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">${c.department || '-'}</p>
            <p class="text-[10px] text-slate-400">${c.email} • ${c.phone || ''}</p>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="window.app.openEditModal('coordinators', '${c.id}')" class="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <i class="fa-solid fa-pen text-xs"></i>
            </button>
            <button onclick="window.app.deleteItem('coordinators', '${c.id}', '${c.name}')" class="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  renderStudentsTable() {
    const students = this.store.get('students');
    const tableBody = document.getElementById('students-table-body');
    const cardsContainer = document.getElementById('students-cards-container');
    if (!tableBody && !cardsContainer) return;

    if (students.length === 0) {
      const emptyHtml = `<div class="p-8 text-center text-slate-400 text-xs">Nenhum aluno cadastrado.</div>`;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhum aluno cadastrado.</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = emptyHtml;
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = students.map(s => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
          <td class="p-3.5 font-bold text-xs text-slate-900 dark:text-white">${s.name}</td>
          <td class="p-3.5 text-xs text-slate-500 font-mono">${s.registration || '-'}</td>
          <td class="p-3.5 text-xs text-slate-600 dark:text-slate-300">${s.email}</td>
          <td class="p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">${s.course || '-'}</td>
          <td class="p-3.5 text-xs text-slate-500">${s.semester || '-'}</td>
          <td class="p-3.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="window.app.openEditModal('students', '${s.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-pen text-xs"></i>
              </button>
              <button onclick="window.app.deleteItem('students', '${s.id}', '${s.name}')" class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = students.map(s => `
        <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white">${s.name}</h4>
            <p class="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">${s.course || 'Sem curso'} • ${s.semester || ''}</p>
            <p class="text-[10px] text-slate-400 font-mono">RA: ${s.registration} • ${s.email}</p>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="window.app.openEditModal('students', '${s.id}')" class="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <i class="fa-solid fa-pen text-xs"></i>
            </button>
            <button onclick="window.app.deleteItem('students', '${s.id}', '${s.name}')" class="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  renderSubjectsTable() {
    const subjects = this.store.get('subjects');
    const tableBody = document.getElementById('subjects-table-body');
    const cardsContainer = document.getElementById('subjects-cards-container');
    if (!tableBody && !cardsContainer) return;

    if (subjects.length === 0) {
      const emptyHtml = `<div class="p-8 text-center text-slate-400 text-xs">Nenhuma matéria cadastrada.</div>`;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhuma matéria cadastrada.</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = emptyHtml;
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = subjects.map(sub => {
        const teacher = this.store.getById('teachers', sub.teacherId);
        const coordinator = this.store.getById('coordinators', sub.coordinatorId);

        return `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
            <td class="p-3.5">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${sub.color || '#6366F1'}"></span>
                <div>
                  <div class="font-bold text-xs text-slate-900 dark:text-white">${sub.name}</div>
                  <div class="text-[10px] text-slate-400 font-mono">${sub.code || ''}</div>
                </div>
              </div>
            </td>
            <td class="p-3.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">${sub.workload || '-'}</td>
            <td class="p-3.5 text-xs text-slate-700 dark:text-slate-300">${teacher ? teacher.name : '<span class="text-slate-400 italic">Não atribuído</span>'}</td>
            <td class="p-3.5 text-xs text-slate-500">${coordinator ? coordinator.name : '-'}</td>
            <td class="p-3.5 text-xs text-slate-400 max-w-[200px] truncate">${sub.description || '-'}</td>
            <td class="p-3.5 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="window.app.openEditModal('subjects', '${sub.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button onclick="window.app.deleteItem('subjects', '${sub.id}', '${sub.name}')" class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = subjects.map(sub => {
        const teacher = this.store.getById('teachers', sub.teacherId);
        return `
          <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${sub.color || '#6366F1'}"></span>
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white">${sub.name}</h4>
                <p class="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">${teacher ? teacher.name : 'Sem professor'} • ${sub.workload || ''}</p>
                ${sub.code ? `<span class="text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">${sub.code}</span>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="window.app.openEditModal('subjects', '${sub.id}')" class="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-pen text-xs"></i>
              </button>
              <button onclick="window.app.deleteItem('subjects', '${sub.id}', '${sub.name}')" class="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderClassroomsTable() {
    const classrooms = this.store.get('classrooms');
    const tableBody = document.getElementById('classrooms-table-body');
    const cardsContainer = document.getElementById('classrooms-cards-container');
    if (!tableBody && !cardsContainer) return;

    if (classrooms.length === 0) {
      const emptyHtml = `<div class="p-8 text-center text-slate-400 text-xs">Nenhuma sala cadastrada.</div>`;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhuma sala cadastrada.</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = emptyHtml;
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = classrooms.map(r => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
          <td class="p-3.5 font-bold text-xs text-slate-900 dark:text-white">${r.name}</td>
          <td class="p-3.5 text-xs text-slate-600 dark:text-slate-300">${r.building || '-'}</td>
          <td class="p-3.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">${r.type || 'Sala de Aula'}</td>
          <td class="p-3.5 text-xs text-slate-700 dark:text-slate-200 font-bold">${r.capacity} alunos</td>
          <td class="p-3.5 text-xs text-slate-500">
            <div class="flex flex-wrap gap-1 max-w-[280px]">
              ${(r.resources || []).map(res => `<span class="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">${res}</span>`).join('')}
            </div>
          </td>
          <td class="p-3.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="window.app.openEditModal('classrooms', '${r.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-pen text-xs"></i>
              </button>
              <button onclick="window.app.deleteItem('classrooms', '${r.id}', '${r.name}')" class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = classrooms.map(r => `
        <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white">${r.name}</h4>
            <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">${r.type || 'Sala'} • Cap: ${r.capacity} alunos</p>
            <p class="text-[10px] text-slate-400">${r.building || ''}</p>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="window.app.openEditModal('classrooms', '${r.id}')" class="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <i class="fa-solid fa-pen text-xs"></i>
            </button>
            <button onclick="window.app.deleteItem('classrooms', '${r.id}', '${r.name}')" class="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  renderClassesTable() {
    const classes = this.store.getEnrichedClasses();
    const tableBody = document.getElementById('classes-table-body');
    const cardsContainer = document.getElementById('classes-cards-container');
    if (!tableBody && !cardsContainer) return;

    if (classes.length === 0) {
      const emptyHtml = `<div class="p-8 text-center text-slate-400 text-xs">Nenhuma aula agendada.</div>`;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Nenhuma aula agendada.</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = emptyHtml;
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = classes.map(cls => {
        const dateObj = new Date(cls.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR');

        return `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
            <td class="p-3.5">
              <div class="font-bold text-xs text-slate-900 dark:text-white">${formattedDate}</div>
              <div class="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">${cls.startTime} - ${cls.endTime}</div>
            </td>
            <td class="p-3.5">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${cls.color}"></span>
                <div>
                  <div class="font-bold text-xs text-slate-800 dark:text-slate-200">${cls.subjectName}</div>
                  <div class="text-[10px] text-slate-400">${cls.topic || '-'}</div>
                </div>
              </div>
            </td>
            <td class="p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">${cls.teacherName}</td>
            <td class="p-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">${cls.classroomName}</td>
            <td class="p-3.5 text-xs text-slate-500">${cls.groupName || '-'}</td>
            <td class="p-3.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Confirmada
              </span>
            </td>
            <td class="p-3.5 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="window.app.openEditModal('classes', '${cls.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button onclick="window.app.deleteItem('classes', '${cls.id}', 'Aula de ${cls.subjectName}')" class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = classes.map(cls => {
        const dateObj = new Date(cls.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR');

        return `
          <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-2">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${cls.color}"></span>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white">${cls.subjectName}</h4>
              </div>
              <span class="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">${cls.startTime} - ${cls.endTime}</span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
              <span>📅 ${formattedDate} • 🏛 ${cls.classroomName}</span>
              <div class="flex items-center gap-1">
                <button onclick="window.app.openEditModal('classes', '${cls.id}')" class="p-1.5 text-slate-500 hover:text-indigo-600">
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button onclick="window.app.deleteItem('classes', '${cls.id}', 'Aula de ${cls.subjectName}')" class="p-1.5 text-slate-500 hover:text-red-600">
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /* ==========================================================================
     MODAIS DINÂMICOS
     ========================================================================= */
  openCreateModal(entity) {
    this.editingEntity = entity;
    this.editingId = null;

    const modal = document.getElementById('generic-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    const titles = {
      teachers: 'Novo Professor',
      coordinators: 'Novo Coordenador',
      students: 'Novo Aluno',
      subjects: 'Nova Matéria',
      classrooms: 'Nova Sala',
      classes: 'Agendar Nova Aula'
    };

    title.innerText = titles[entity] || 'Novo Cadastro';
    body.innerHTML = this.getFormHtml(entity, {});

    modal.classList.remove('hidden');
  }

  openEditModal(entity, id) {
    this.editingEntity = entity;
    this.editingId = id;

    const item = this.store.getById(entity, id);
    if (!item) return;

    const modal = document.getElementById('generic-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    const titles = {
      teachers: 'Editar Professor',
      coordinators: 'Editar Coordenador',
      students: 'Editar Aluno',
      subjects: 'Editar Matéria',
      classrooms: 'Editar Sala',
      classes: 'Editar Aula'
    };

    title.innerText = titles[entity] || 'Editar Cadastro';
    body.innerHTML = this.getFormHtml(entity, item);

    modal.classList.remove('hidden');
  }

  openQuickCreateClass(date = null, startTime = '08:00') {
    const todayStr = date || new Date().toISOString().split('T')[0];
    const [h, m] = startTime.split(':').map(Number);
    const endH = String(Math.min(23, h + 2)).padStart(2, '0');
    const endTime = `${endH}:${String(m).padStart(2, '0')}`;

    this.openCreateModal('classes');
    setTimeout(() => {
      const dateInput = document.getElementById('field-date');
      const startInput = document.getElementById('field-startTime');
      const endInput = document.getElementById('field-endTime');
      if (dateInput) dateInput.value = todayStr;
      if (startInput) startInput.value = startTime;
      if (endInput) endInput.value = endTime;
    }, 50);
  }

  openClassDetails(id, event) {
    if (event) event.stopPropagation();
    this.openEditModal('classes', id);
  }

  closeModal() {
    const modal = document.getElementById('generic-modal');
    if (modal) modal.classList.add('hidden');
    this.editingEntity = null;
    this.editingId = null;
  }

  getFormHtml(entity, data = {}) {
    const teachers = this.store.get('teachers');
    const coordinators = this.store.get('coordinators');
    const subjects = this.store.get('subjects');
    const classrooms = this.store.get('classrooms');

    switch (entity) {
      case 'teachers':
        return `
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
              <input type="text" id="field-name" value="${data.name || ''}" class="form-input" required placeholder="Ex: Prof. Dr. Marcos Silveira">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail *</label>
                <input type="email" id="field-email" value="${data.email || ''}" class="form-input" required placeholder="marcos@faculdade.edu.br">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp</label>
                <input type="text" id="field-phone" value="${data.phone || ''}" class="form-input" placeholder="(11) 98765-4321">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matrícula</label>
                <input type="text" id="field-registration" value="${data.registration || ''}" class="form-input" placeholder="PROF-1001">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Especialidade / Área</label>
                <input type="text" id="field-specialty" value="${data.specialty || ''}" class="form-input" placeholder="Engenharia de Software">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cor de Identificação</label>
              <div class="flex items-center gap-2">
                <input type="color" id="field-color" value="${data.color || '#6366F1'}" class="h-10 w-16 p-0 border rounded-xl cursor-pointer">
                <span class="text-[11px] text-slate-500">Cor de destaque das aulas no calendário.</span>
              </div>
            </div>
          </div>
        `;

      case 'coordinators':
        return `
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
              <input type="text" id="field-name" value="${data.name || ''}" class="form-input" required placeholder="Ex: Dra. Helena Ribeiro">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail *</label>
                <input type="email" id="field-email" value="${data.email || ''}" class="form-input" required placeholder="helena@faculdade.edu.br">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                <input type="text" id="field-phone" value="${data.phone || ''}" class="form-input" placeholder="(11) 98765-4321">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matrícula</label>
                <input type="text" id="field-registration" value="${data.registration || ''}" class="form-input" placeholder="COORD-2024">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Curso / Departamento *</label>
                <input type="text" id="field-department" value="${data.department || ''}" class="form-input" required placeholder="Engenharia de Software">
              </div>
            </div>
          </div>
        `;

      case 'students':
        return `
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
              <input type="text" id="field-name" value="${data.name || ''}" class="form-input" required placeholder="Ex: Lucas Gabriel Oliveira">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail *</label>
                <input type="email" id="field-email" value="${data.email || ''}" class="form-input" required placeholder="lucas@aluno.edu.br">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matrícula (R.A.) *</label>
                <input type="text" id="field-registration" value="${data.registration || ''}" class="form-input" required placeholder="ALU-2026001">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Curso</label>
                <input type="text" id="field-course" value="${data.course || ''}" class="form-input" placeholder="Engenharia de Software">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Semestre / Turma</label>
                <input type="text" id="field-semester" value="${data.semester || ''}" class="form-input" placeholder="3º Semestre">
              </div>
            </div>
          </div>
        `;

      case 'subjects':
        return `
          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Disciplina *</label>
                <input type="text" id="field-name" value="${data.name || ''}" class="form-input" required placeholder="Ex: Estruturas de Dados">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Código / Sigla</label>
                <input type="text" id="field-code" value="${data.code || ''}" class="form-input" placeholder="ES-301">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Carga Horária</label>
                <input type="text" id="field-workload" value="${data.workload || '80h'}" class="form-input" placeholder="80h">
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Professor Titular</label>
                <select id="field-teacherId" class="form-input">
                  <option value="">Selecione o Professor...</option>
                  ${teachers.map(t => `<option value="${t.id}" ${data.teacherId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Coordenador</label>
                <select id="field-coordinatorId" class="form-input">
                  <option value="">Selecione o Coordenador...</option>
                  ${coordinators.map(c => `<option value="${c.id}" ${data.coordinatorId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cor da Disciplina</label>
                <input type="color" id="field-color" value="${data.color || '#6366F1'}" class="h-10 w-full p-0 border rounded-xl cursor-pointer">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ementa / Descrição</label>
              <textarea id="field-description" rows="2" class="form-input" placeholder="Tópicos da matéria...">${data.description || ''}</textarea>
            </div>
          </div>
        `;

      case 'classrooms':
        return `
          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Sala *</label>
                <input type="text" id="field-name" value="${data.name || ''}" class="form-input" required placeholder="Ex: Laboratório de TI 01">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bloco / Prédio</label>
                <input type="text" id="field-building" value="${data.building || ''}" class="form-input" placeholder="Bloco B - Térreo">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Espaço *</label>
                <select id="field-type" class="form-input" required>
                  <option value="Sala de Aula" ${data.type === 'Sala de Aula' ? 'selected' : ''}>Sala de Aula Teórica</option>
                  <option value="Laboratório" ${data.type === 'Laboratório' ? 'selected' : ''}>Laboratório de Informática / Prático</option>
                  <option value="Auditório" ${data.type === 'Auditório' ? 'selected' : ''}>Auditório</option>
                  <option value="Sala de Reunião" ${data.type === 'Sala de Reunião' ? 'selected' : ''}>Sala de Reunião</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Capacidade Máxima (Alunos) *</label>
                <input type="number" id="field-capacity" value="${data.capacity || 35}" min="1" max="500" class="form-input" required>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Recursos Disponíveis (Separados por vírgula)</label>
              <input type="text" id="field-resources" value="${(data.resources || ['Projetor', 'Ar Condicionado', 'PCs']).join(', ')}" class="form-input" placeholder="Projetor 4K, 32 PCs, Ar Condicionado">
            </div>
          </div>
        `;

      case 'classes':
        const todayStr = new Date().toISOString().split('T')[0];
        return `
          <div class="space-y-3">
            <div id="conflict-alert" class="hidden p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex flex-col gap-1"></div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matéria / Disciplina *</label>
              <select id="field-subjectId" class="form-input" required onchange="window.app.onSubjectSelected(this.value)">
                <option value="">Selecione a matéria...</option>
                ${subjects.map(s => `<option value="${s.id}" ${data.subjectId === s.id ? 'selected' : ''}>${s.code ? `[${s.code}] ` : ''}${s.name}</option>`).join('')}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Professor Responsável *</label>
                <select id="field-teacherId" class="form-input" required onchange="window.app.triggerConflictCheck()">
                  <option value="">Selecione o professor...</option>
                  ${teachers.map(t => `<option value="${t.id}" ${data.teacherId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sala / Ambiente *</label>
                <select id="field-classroomId" class="form-input" required onchange="window.app.triggerConflictCheck()">
                  <option value="">Selecione a sala...</option>
                  ${classrooms.map(r => `<option value="${r.id}" ${data.classroomId === r.id ? 'selected' : ''}>${r.name} (${r.capacity} lug.)</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label class="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Data *</label>
                <input type="date" id="field-date" value="${data.date || todayStr}" class="form-input text-xs" required onchange="window.app.triggerConflictCheck()">
              </div>
              <div>
                <label class="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Início *</label>
                <input type="time" id="field-startTime" value="${data.startTime || '08:00'}" class="form-input text-xs" required onchange="window.app.triggerConflictCheck()">
              </div>
              <div>
                <label class="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fim *</label>
                <input type="time" id="field-endTime" value="${data.endTime || '10:00'}" class="form-input text-xs" required onchange="window.app.triggerConflictCheck()">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Turma / Grupo</label>
                <input type="text" id="field-groupName" value="${data.groupName || ''}" class="form-input" placeholder="Ex: Turma Eng. Software 2026.1">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tema da Aula</label>
                <input type="text" id="field-topic" value="${data.topic || ''}" class="form-input" placeholder="Ex: Introdução a Árvores AVL">
              </div>
            </div>
          </div>
        `;
    }
  }

  onSubjectSelected(subjectId) {
    if (!subjectId) return;
    const subject = this.store.getById('subjects', subjectId);
    if (subject && subject.teacherId) {
      const teacherSelect = document.getElementById('field-teacherId');
      if (teacherSelect && !teacherSelect.value) {
        teacherSelect.value = subject.teacherId;
      }
    }
    this.triggerConflictCheck();
  }

  triggerConflictCheck() {
    if (this.editingEntity !== 'classes') return;

    const teacherId = document.getElementById('field-teacherId')?.value;
    const classroomId = document.getElementById('field-classroomId')?.value;
    const date = document.getElementById('field-date')?.value;
    const startTime = document.getElementById('field-startTime')?.value;
    const endTime = document.getElementById('field-endTime')?.value;
    const alertEl = document.getElementById('conflict-alert');

    if (!alertEl || !date || !startTime || !endTime) return;

    const result = this.store.checkClassConflict({
      teacherId,
      classroomId,
      date,
      startTime,
      endTime
    }, this.editingId);

    if (result.hasConflict) {
      alertEl.innerHTML = result.reasons.map(r => `<div>${r}</div>`).join('');
      alertEl.classList.remove('hidden');
    } else {
      alertEl.classList.add('hidden');
      alertEl.innerHTML = '';
    }
  }

  saveModal() {
    if (!this.editingEntity) return;

    const entity = this.editingEntity;
    const id = this.editingId;
    const getVal = (fieldId) => document.getElementById(`field-${fieldId}`)?.value?.trim() || '';

    let payload = {};

    switch (entity) {
      case 'teachers':
        payload = {
          name: getVal('name'),
          email: getVal('email'),
          phone: getVal('phone'),
          registration: getVal('registration'),
          specialty: getVal('specialty'),
          color: getVal('color') || '#6366F1'
        };
        if (!payload.name || !payload.email) {
          this.showToast('Preencha Nome e E-mail.', 'error');
          return;
        }
        break;

      case 'coordinators':
        payload = {
          name: getVal('name'),
          email: getVal('email'),
          phone: getVal('phone'),
          registration: getVal('registration'),
          department: getVal('department')
        };
        if (!payload.name || !payload.email || !payload.department) {
          this.showToast('Preencha os campos obrigatórios.', 'error');
          return;
        }
        break;

      case 'students':
        payload = {
          name: getVal('name'),
          email: getVal('email'),
          registration: getVal('registration'),
          course: getVal('course'),
          semester: getVal('semester'),
          status: 'Ativo'
        };
        if (!payload.name || !payload.email || !payload.registration) {
          this.showToast('Preencha Nome, E-mail e Matrícula.', 'error');
          return;
        }
        break;

      case 'subjects':
        payload = {
          name: getVal('name'),
          code: getVal('code'),
          workload: getVal('workload'),
          teacherId: getVal('teacherId'),
          coordinatorId: getVal('coordinatorId'),
          color: getVal('color') || '#6366F1',
          description: getVal('description')
        };
        if (!payload.name) {
          this.showToast('Informe o nome da matéria.', 'error');
          return;
        }
        break;

      case 'classrooms':
        const resStr = getVal('resources');
        payload = {
          name: getVal('name'),
          building: getVal('building'),
          type: getVal('type'),
          capacity: parseInt(getVal('capacity'), 10) || 30,
          resources: resStr ? resStr.split(',').map(s => s.trim()).filter(Boolean) : []
        };
        if (!payload.name || !payload.type) {
          this.showToast('Preencha o nome e o tipo de sala.', 'error');
          return;
        }
        break;

      case 'classes':
        payload = {
          subjectId: getVal('subjectId'),
          teacherId: getVal('teacherId'),
          classroomId: getVal('classroomId'),
          date: getVal('date'),
          startTime: getVal('startTime'),
          endTime: getVal('endTime'),
          groupName: getVal('groupName'),
          topic: getVal('topic'),
          status: 'Agendada'
        };

        if (!payload.subjectId || !payload.teacherId || !payload.classroomId || !payload.date || !payload.startTime || !payload.endTime) {
          this.showToast('Preencha todos os campos obrigatórios da aula.', 'error');
          return;
        }

        const conflictCheck = this.store.checkClassConflict(payload, id);
        if (conflictCheck.hasConflict) {
          this.showToast(conflictCheck.reasons[0], 'error');
          this.triggerConflictCheck();
          return;
        }
        break;
    }

    if (id) {
      this.store.update(entity, id, payload);
      this.showToast('Registro atualizado com sucesso!', 'success');
    } else {
      this.store.add(entity, payload);
      this.showToast('Registro salvo com sucesso!', 'success');
    }

    this.closeModal();
  }

  deleteItem(entity, id, label) {
    if (confirm(`Tem certeza que deseja excluir "${label}"?`)) {
      this.store.delete(entity, id);
      this.showToast('Registro excluído com sucesso.', 'info');
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-indigo-600 text-white',
      warning: 'bg-amber-600 text-white'
    };

    const icons = {
      success: 'fa-circle-check',
      error: 'fa-triangle-exclamation',
      info: 'fa-circle-info',
      warning: 'fa-circle-exclamation'
    };

    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto ${colors[type] || colors.info}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> <span>${message}</span>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  initTheme() {
    const isDark = localStorage.getItem('educalendar_theme') === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    this.updateThemeButton(isDark);
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('educalendar_theme', isDark ? 'dark' : 'light');
    this.updateThemeButton(isDark);
  }

  updateThemeButton(isDark) {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = isDark
        ? '<i class="fa-solid fa-sun text-amber-400"></i>'
        : '<i class="fa-solid fa-moon text-slate-600 dark:text-slate-300"></i>';
    });
  }

  downloadBackup() {
    const jsonStr = this.store.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `educalendar_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Backup exportado!', 'success');
  }

  importBackup(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const res = this.store.importData(e.target.result);
      if (res.success) {
        this.showToast('Dados restaurados com sucesso!', 'success');
      } else {
        this.showToast(`Erro ao importar: ${res.error}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  resetDemoData() {
    if (confirm('Atenção: Isso redefinirá todos os dados para a demonstração original. Deseja continuar?')) {
      this.store.resetToDefaults();
      this.showToast('Dados de demonstração restaurados.', 'info');
    }
  }

  printSchedule() {
    window.print();
  }
}

function startEduCalendar() {
  if (!window.app) {
    window.app = new AppController();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startEduCalendar);
} else {
  startEduCalendar();
}
