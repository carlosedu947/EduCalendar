/**
 * EduCalendar - Calendar Engine (Mobile-Optimized)
 * Renderização dinâmica e responsiva das visões Mensal, Semanal, Diária e Agenda.
 */

class AcademicCalendar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentDate = new Date();
    this.currentView = window.innerWidth < 768 ? 'day' : 'month'; // Inicia em Dia ou Semana no mobile
    this.filters = {
      teacherId: 'all',
      subjectId: 'all',
      classroomId: 'all',
      search: ''
    };
    
    this.daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    this.shortDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    this.months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
  }

  setView(view) {
    this.currentView = view;

    // Atualizar botões visuais da visão
    ['month', 'week', 'day', 'agenda'].forEach(v => {
      const btn = document.getElementById(`btn-view-${v}`);
      if (btn) {
        const active = v === view;
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('dark:bg-slate-700', active);
        btn.classList.toggle('shadow-xs', active);
        btn.classList.toggle('text-indigo-600', active);
        btn.classList.toggle('dark:text-indigo-400', active);
      }
    });

    this.render();
  }

  setDate(date) {
    this.currentDate = new Date(date);
    this.render();
  }

  next() {
    if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else if (this.currentView === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    } else if (this.currentView === 'agenda') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    }
    this.render();
  }

  prev() {
    if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else if (this.currentView === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    } else if (this.currentView === 'agenda') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    }
    this.render();
  }

  today() {
    this.currentDate = new Date();
    this.render();
  }

  setFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.render();
  }

  getFilteredClasses() {
    return window.academicStore.getEnrichedClasses(cls => {
      if (this.filters.teacherId !== 'all' && cls.teacherId !== this.filters.teacherId) return false;
      if (this.filters.subjectId !== 'all' && cls.subjectId !== this.filters.subjectId) return false;
      if (this.filters.classroomId !== 'all' && cls.classroomId !== this.filters.classroomId) return false;
      if (this.filters.search) {
        const q = this.filters.search.toLowerCase();
        const match =
          cls.subjectName.toLowerCase().includes(q) ||
          cls.teacherName.toLowerCase().includes(q) ||
          cls.classroomName.toLowerCase().includes(q) ||
          (cls.topic && cls.topic.toLowerCase().includes(q)) ||
          (cls.groupName && cls.groupName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }

  formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  render() {
    if (!this.container) return;

    this.updateHeaderTitle();

    switch (this.currentView) {
      case 'month':
        this.renderMonthView();
        break;
      case 'week':
        this.renderWeekView();
        break;
      case 'day':
        this.renderDayView();
        break;
      case 'agenda':
        this.renderAgendaView();
        break;
    }
  }

  updateHeaderTitle() {
    const titleEl = document.getElementById('calendar-title');
    if (!titleEl) return;

    const monthName = this.months[this.currentDate.getMonth()];
    const year = this.currentDate.getFullYear();

    if (this.currentView === 'month' || this.currentView === 'agenda') {
      titleEl.innerText = `${monthName} de ${year}`;
    } else if (this.currentView === 'week') {
      const startOfWeek = new Date(this.currentDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const d1 = startOfWeek.getDate();
      const m1 = this.months[startOfWeek.getMonth()].slice(0, 3);
      const d2 = endOfWeek.getDate();
      const m2 = this.months[endOfWeek.getMonth()].slice(0, 3);
      titleEl.innerText = `${d1} ${m1} - ${d2} ${m2}`;
    } else if (this.currentView === 'day') {
      const dayName = this.shortDays[this.currentDate.getDay()];
      const dayNum = this.currentDate.getDate();
      titleEl.innerText = `${dayName}, ${dayNum} ${monthName.slice(0, 3)}`;
    }
  }

  /**
   * VISÃO MENSAL
   */
  renderMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const todayStr = this.formatDateKey(new Date());

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const classes = this.getFilteredClasses();
    const classesByDate = {};
    classes.forEach(c => {
      if (!classesByDate[c.date]) classesByDate[c.date] = [];
      classesByDate[c.date].push(c);
    });

    let html = `
      <div class="calendar-month-grid border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
        <!-- Dias da Semana Cabeçalho -->
        <div class="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-center py-2.5 font-bold text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          ${this.shortDays.map((d, i) => `<div class="${i === 0 || i === 6 ? 'text-amber-600 dark:text-amber-400' : ''}">${d}</div>`).join('')}
        </div>
        <!-- Grade de Células de Dias -->
        <div class="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
    `;

    // Dias do mês anterior
    for (let x = firstDayIndex; x > 0; x--) {
      const prevDate = prevLastDate - x + 1;
      const prevMonthDate = new Date(year, month - 1, prevDate);
      const dateKey = this.formatDateKey(prevMonthDate);
      const dayClasses = classesByDate[dateKey] || [];

      html += this.renderMonthCell(prevDate, dateKey, dayClasses, false, false);
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDate; i++) {
      const cellDate = new Date(year, month, i);
      const dateKey = this.formatDateKey(cellDate);
      const isToday = dateKey === todayStr;
      const dayClasses = classesByDate[dateKey] || [];

      html += this.renderMonthCell(i, dateKey, dayClasses, true, isToday);
    }

    // Dias do próximo mês
    const totalCells = firstDayIndex + lastDate;
    const nextDays = (7 - (totalCells % 7)) % 7;
    for (let j = 1; j <= nextDays; j++) {
      const nextMonthDate = new Date(year, month + 1, j);
      const dateKey = this.formatDateKey(nextMonthDate);
      const dayClasses = classesByDate[dateKey] || [];

      html += this.renderMonthCell(j, dateKey, dayClasses, false, false);
    }

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  renderMonthCell(dayNumber, dateKey, dayClasses, isCurrentMonth, isToday) {
    const opacityClass = isCurrentMonth ? 'text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600 bg-slate-50/40 dark:bg-slate-900/30';
    const todayBadge = isToday ? 'bg-indigo-600 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-bold text-[10px] md:text-xs shadow' : 'text-[11px] md:text-xs font-semibold';

    // No desktop exibe cartões, no mobile exibe indicadores compactos
    const maxDisplay = 2;
    const displayedClasses = dayClasses.slice(0, maxDisplay);
    const extraCount = dayClasses.length - maxDisplay;

    // Layout para Mobile (Bolinhas coloridas indicadoras)
    const mobileDots = dayClasses.slice(0, 4).map(cls => `
      <span class="w-1.5 h-1.5 rounded-full inline-block shrink-0" style="background-color: ${cls.color}"></span>
    `).join('');

    // Layout para Desktop (Cards com texto)
    let desktopItemsHtml = displayedClasses.map(cls => `
      <div 
        onclick="window.app.openClassDetails('${cls.id}', event)"
        class="hidden md:flex group text-[11px] p-1 rounded-md border leading-tight cursor-pointer hover:shadow-xs transition-all truncate items-center gap-1"
        style="background-color: ${cls.color}15; border-color: ${cls.color}40; color: ${cls.color};"
        title="${cls.subjectName} (${cls.startTime} - ${cls.endTime})"
      >
        <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${cls.color}"></span>
        <span class="font-bold shrink-0">${cls.startTime}</span>
        <span class="truncate">${cls.subjectName}</span>
      </div>
    `).join('');

    if (extraCount > 0) {
      desktopItemsHtml += `
        <div onclick="window.academicCalendar.setDate('${dateKey}'); window.academicCalendar.setView('day');" 
             class="hidden md:block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold text-center hover:underline cursor-pointer">
          +${extraCount}
        </div>
      `;
    }

    return `
      <div 
        class="min-h-[75px] md:min-h-[110px] p-1 md:p-1.5 flex flex-col justify-between transition-colors hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 relative group cursor-pointer ${opacityClass}"
        onclick="window.academicCalendar.setDate('${dateKey}'); window.academicCalendar.setView('day');"
      >
        <div class="flex items-center justify-between">
          <span class="${todayBadge}">${dayNumber}</span>
          ${dayClasses.length > 0 ? `
            <span class="md:hidden text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
              ${dayClasses.length}
            </span>
          ` : ''}
        </div>

        <!-- Indicador Mobile -->
        <div class="md:hidden flex flex-wrap gap-1 justify-center py-1">
          ${mobileDots}
        </div>

        <!-- Indicador Desktop -->
        <div class="hidden md:flex flex-1 flex-col gap-1 overflow-hidden mt-1" onclick="event.stopPropagation()">
          ${desktopItemsHtml}
        </div>
      </div>
    `;
  }

  /**
   * VISÃO SEMANAL
   */
  renderWeekView() {
    const startOfWeek = new Date(this.currentDate);
    const currentDay = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - currentDay);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      weekDays.push({
        name: this.shortDays[i],
        fullName: this.daysOfWeek[i],
        date: d,
        dateKey: this.formatDateKey(d),
        dayNum: d.getDate(),
        isToday: this.formatDateKey(d) === this.formatDateKey(new Date())
      });
    }

    const classes = this.getFilteredClasses();
    const timeSlots = [
      '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
      '19:00', '20:00', '21:00', '22:00'
    ];

    let html = `
      <div class="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
        <!-- Container Rolável Horizontalmente para Telas Pequenas -->
        <div class="overflow-x-auto">
          <div class="min-w-[700px]">
            <!-- Topo da Semana -->
            <div class="grid grid-cols-8 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-center sticky top-0 z-10">
              <div class="p-3 text-[11px] font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center">
                Hora
              </div>
              ${weekDays.map(w => `
                <div class="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${w.isToday ? 'bg-indigo-50/70 dark:bg-indigo-950/50' : ''}">
                  <div class="text-[10px] font-bold uppercase ${w.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}">${w.name}</div>
                  <div class="text-sm font-extrabold ${w.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}">${w.dayNum}</div>
                </div>
              `).join('')}
            </div>

            <!-- Grade de Horários -->
            <div class="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[550px] overflow-y-auto">
              ${timeSlots.map(time => {
                const hour = parseInt(time.split(':')[0], 10);

                return `
                  <div class="grid grid-cols-8 min-h-[64px]">
                    <div class="text-[11px] font-bold text-slate-400 p-2 text-center border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/50 flex items-start justify-center">
                      ${time}
                    </div>
                    ${weekDays.map(w => {
                      const slotClasses = classes.filter(c => {
                        if (c.date !== w.dateKey) return false;
                        const cHour = parseInt(c.startTime.split(':')[0], 10);
                        return cHour === hour;
                      });

                      return `
                        <div 
                          onclick="window.app.openQuickCreateClass('${w.dateKey}', '${time}')"
                          class="p-1 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0 hover:bg-indigo-50/20 dark:hover:bg-slate-800/30 transition-colors cursor-pointer flex flex-col gap-1 ${w.isToday ? 'bg-indigo-50/10' : ''}"
                        >
                          ${slotClasses.map(cls => `
                            <div 
                              onclick="event.stopPropagation(); window.app.openClassDetails('${cls.id}', event)"
                              class="p-1.5 rounded-lg border text-[11px] leading-tight cursor-pointer hover:shadow-xs transition-all"
                              style="background-color: ${cls.color}18; border-color: ${cls.color}50; color: ${cls.color};"
                            >
                              <div class="font-bold truncate">${cls.subjectName}</div>
                              <div class="text-[10px] opacity-90 truncate">${cls.startTime} - ${cls.endTime}</div>
                              <div class="text-[10px] opacity-80 truncate">🏛 ${cls.classroomName}</div>
                            </div>
                          `).join('')}
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * VISÃO DIÁRIA (Totalmente Adaptada para Mobile)
   */
  renderDayView() {
    const dateKey = this.formatDateKey(this.currentDate);
    const dayClasses = this.getFilteredClasses().filter(c => c.date === dateKey);
    const timeSlots = [
      '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
      '19:00', '20:00', '21:00', '22:00'
    ];

    let html = `
      <div class="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
        <div class="p-3.5 md:p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">
              ${this.daysOfWeek[this.currentDate.getDay()]}, ${this.currentDate.toLocaleDateString('pt-BR')}
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              ${dayClasses.length} aula(s) programada(s)
            </p>
          </div>
          <button 
            onclick="window.app.openQuickCreateClass('${dateKey}')"
            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition"
          >
            <i class="fa-solid fa-plus text-xs"></i> <span class="hidden sm:inline">Nova Aula</span>
          </button>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[580px] overflow-y-auto">
          ${timeSlots.map(time => {
            const hour = parseInt(time.split(':')[0], 10);
            const slotClasses = dayClasses.filter(c => parseInt(c.startTime.split(':')[0], 10) === hour);

            return `
              <div class="flex min-h-[64px] hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <div class="w-16 md:w-20 shrink-0 p-2 md:p-3 text-[11px] md:text-xs font-bold text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/40 flex items-center justify-center">
                  ${time}
                </div>
                <div 
                  onclick="window.app.openQuickCreateClass('${dateKey}', '${time}')"
                  class="flex-1 p-2 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center cursor-pointer"
                >
                  ${slotClasses.length === 0 ? `
                    <span class="text-[11px] text-slate-300 dark:text-slate-700 select-none italic hover:text-indigo-400 transition-colors py-1">
                      + Toque para agendar
                    </span>
                  ` : ''}

                  ${slotClasses.map(cls => `
                    <div 
                      onclick="event.stopPropagation(); window.app.openClassDetails('${cls.id}', event)"
                      class="flex-1 min-w-[200px] p-2.5 md:p-3 rounded-xl border transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between"
                      style="background-color: ${cls.color}15; border-color: ${cls.color}50;"
                    >
                      <div class="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style="background-color: ${cls.color}25; color: ${cls.color}">
                            ${cls.subjectCode || 'AULA'}
                          </span>
                          <h4 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">${cls.subjectName}</h4>
                        </div>
                        <span class="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs shrink-0" style="color: ${cls.color}">
                          ${cls.startTime} - ${cls.endTime}
                        </span>
                      </div>

                      <div class="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span class="flex items-center gap-1 truncate"><i class="fa-solid fa-user-tie text-indigo-500"></i> ${cls.teacherName}</span>
                        <span class="flex items-center gap-1 truncate"><i class="fa-solid fa-door-open text-emerald-500"></i> ${cls.classroomName}</span>
                        ${cls.groupName ? `<span class="flex items-center gap-1 truncate text-slate-500"><i class="fa-solid fa-users text-amber-500"></i> ${cls.groupName}</span>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * VISÃO AGENDA / LISTA
   */
  renderAgendaView() {
    const classes = this.getFilteredClasses();

    if (classes.length === 0) {
      this.container.innerHTML = `
        <div class="p-8 md:p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
          <i class="fa-solid fa-calendar-xmark text-3xl text-slate-300 dark:text-slate-700 mb-2"></i>
          <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma aula encontrada</h4>
          <p class="text-[11px] text-slate-500 mt-1">Tente ajustar os filtros ou agendar uma nova aula.</p>
          <button 
            onclick="window.app.openQuickCreateClass()"
            class="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-indigo-700 transition"
          >
            + Agendar Aula
          </button>
        </div>
      `;
      return;
    }

    const grouped = {};
    classes.forEach(c => {
      if (!grouped[c.date]) grouped[c.date] = [];
      grouped[c.date].push(c);
    });

    let html = `
      <div class="space-y-4">
        ${Object.keys(grouped).map(dateKey => {
          const dateObj = new Date(dateKey + 'T00:00:00');
          const dayName = this.daysOfWeek[dateObj.getDay()];
          const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
          const isToday = dateKey === this.formatDateKey(new Date());

          return `
            <div class="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
              <div class="p-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${isToday ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}"></span>
                  <h3 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">
                    ${dayName}, ${formattedDate}
                  </h3>
                  ${isToday ? '<span class="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">Hoje</span>' : ''}
                </div>
                <span class="text-[11px] text-slate-500 font-semibold">${grouped[dateKey].length} aula(s)</span>
              </div>

              <div class="divide-y divide-slate-100 dark:divide-slate-800/60">
                ${grouped[dateKey].map(cls => `
                  <div 
                    onclick="window.app.openClassDetails('${cls.id}', event)"
                    class="p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div class="flex items-start gap-2.5">
                      <div class="w-1.5 self-stretch rounded-full shrink-0" style="background-color: ${cls.color}"></div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-slate-900 dark:text-white">${cls.subjectName}</span>
                          ${cls.subjectCode ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">${cls.subjectCode}</span>` : ''}
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          ${cls.topic || 'Conteúdo Programático Padrão'}
                        </p>
                        <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <span class="flex items-center gap-1"><i class="fa-solid fa-chalkboard-user text-indigo-500"></i> ${cls.teacherName}</span>
                          <span class="flex items-center gap-1"><i class="fa-solid fa-location-dot text-emerald-500"></i> ${cls.classroomName}</span>
                          <span class="flex items-center gap-1"><i class="fa-solid fa-users text-amber-500"></i> ${cls.groupName || 'Sem turma'}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      <span class="text-xs font-extrabold text-slate-800 dark:text-slate-100">${cls.startTime} - ${cls.endTime}</span>
                      <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        Ver detalhes <i class="fa-solid fa-chevron-right text-[9px]"></i>
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.container.innerHTML = html;
  }
}

window.AcademicCalendar = AcademicCalendar;
