/**
 * EduCalendar - Data Store & Business Logic
 * Gerenciamento centralizado de estado com persistência em LocalStorage + Fallback em memória.
 */

const STORAGE_KEYS = {
  TEACHERS: 'educalendar_teachers',
  COORDINATORS: 'educalendar_coordinators',
  STUDENTS: 'educalendar_students',
  SUBJECTS: 'educalendar_subjects',
  CLASSROOMS: 'educalendar_classrooms',
  CLASSES: 'educalendar_classes',
  CONFIG: 'educalendar_config'
};

// Cores temáticas para matérias e professores
const PALETTE = [
  { bg: '#EEF2FF', border: '#6366F1', text: '#4338CA', name: 'Índigo' },
  { bg: '#ECFDF5', border: '#10B981', text: '#065F46', name: 'Esmeralda' },
  { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', name: 'Âmbar' },
  { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', name: 'Azul' },
  { bg: '#FDF2F8', border: '#EC4899', text: '#9D174D', name: 'Rosa' },
  { bg: '#F5F3FF', border: '#8B5CF6', text: '#5B21B6', name: 'Roxo' },
  { bg: '#FFF7ED', border: '#F97316', text: '#9A3412', name: 'Laranja' },
  { bg: '#F0FDFA', border: '#14B8A6', text: '#115E59', name: 'Teal' },
  { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', name: 'Vermelho' }
];

// Dados Iniciais de Demonstração (Seed Data)
function getInitialData() {
  const today = new Date();
  
  const getOffsetDate = (days) => {
    const d = new Date();
    d.setDate(today.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    coordinators: [
      {
        id: 'coord_1',
        name: 'Dra. Helena Ribeiro',
        email: 'helena.ribeiro@faculdade.edu.br',
        phone: '(11) 98765-4321',
        registration: 'COORD-202401',
        department: 'Engenharia de Software e TI',
        createdAt: '2026-01-15'
      },
      {
        id: 'coord_2',
        name: 'Prof. Me. Carlos Mendes',
        email: 'carlos.mendes@faculdade.edu.br',
        phone: '(11) 97654-3210',
        registration: 'COORD-202402',
        department: 'Ciências Humanas e Negócios',
        createdAt: '2026-01-20'
      }
    ],
    teachers: [
      {
        id: 'prof_1',
        name: 'Prof. Dr. Marcos Silveira',
        email: 'marcos.silveira@faculdade.edu.br',
        phone: '(11) 91234-5678',
        registration: 'PROF-1001',
        specialty: 'Algoritmos e Estruturas de Dados',
        color: '#6366F1',
        createdAt: '2026-02-01'
      },
      {
        id: 'prof_2',
        name: 'Profa. Me. Fernanda Lima',
        email: 'fernanda.lima@faculdade.edu.br',
        phone: '(11) 92345-6789',
        registration: 'PROF-1002',
        specialty: 'Banco de Dados e Big Data',
        color: '#10B981',
        createdAt: '2026-02-01'
      },
      {
        id: 'prof_3',
        name: 'Prof. Rodrigo Tavares',
        email: 'rodrigo.tavares@faculdade.edu.br',
        phone: '(11) 93456-7890',
        registration: 'PROF-1003',
        specialty: 'Desenvolvimento Web e Mobile',
        color: '#F59E0B',
        createdAt: '2026-02-05'
      },
      {
        id: 'prof_4',
        name: 'Profa. Dra. Juliana Barbosa',
        email: 'juliana.barbosa@faculdade.edu.br',
        phone: '(11) 94567-8901',
        registration: 'PROF-1004',
        specialty: 'Inteligência Artificial e Machine Learning',
        color: '#EC4899',
        createdAt: '2026-02-10'
      }
    ],
    students: [
      {
        id: 'stud_1',
        name: 'Lucas Gabriel Oliveira',
        email: 'lucas.oliveira@aluno.edu.br',
        registration: 'ALU-2026001',
        course: 'Engenharia de Software',
        semester: '3º Semestre',
        status: 'Ativo'
      },
      {
        id: 'stud_2',
        name: 'Mariana Souza Dias',
        email: 'mariana.dias@aluno.edu.br',
        registration: 'ALU-2026002',
        course: 'Engenharia de Software',
        semester: '3º Semestre',
        status: 'Ativo'
      },
      {
        id: 'stud_3',
        name: 'Gabriel Costa Andrade',
        email: 'gabriel.andrade@aluno.edu.br',
        registration: 'ALU-2026003',
        course: 'Sistemas de Informação',
        semester: '5º Semestre',
        status: 'Ativo'
      },
      {
        id: 'stud_4',
        name: 'Beatriz Martins Rocha',
        email: 'beatriz.rocha@aluno.edu.br',
        registration: 'ALU-2026004',
        course: 'Engenharia de Software',
        semester: '1º Semestre',
        status: 'Ativo'
      },
      {
        id: 'stud_5',
        name: 'Pedro Henrique Ramos',
        email: 'pedro.ramos@aluno.edu.br',
        registration: 'ALU-2026005',
        course: 'Ciência da Computação',
        semester: '4º Semestre',
        status: 'Ativo'
      }
    ],
    classrooms: [
      {
        id: 'room_1',
        name: 'Sala 101 - Teórica',
        building: 'Bloco A - 1º Andar',
        capacity: 45,
        type: 'Sala de Aula',
        resources: ['Projetor 4K', 'Ar Condicionado', 'Quadro Branco Digital', 'Wi-Fi 6'],
        active: true
      },
      {
        id: 'room_2',
        name: 'Laboratório de Informática 01',
        building: 'Bloco B - Térreo',
        capacity: 32,
        type: 'Laboratório',
        resources: ['32 Computadores i7', 'Ar Condicionado', 'Projetor Interativo', 'Internet Gigabit'],
        active: true
      },
      {
        id: 'room_3',
        name: 'Laboratório de IA e Robótica',
        building: 'Bloco B - 2º Andar',
        capacity: 24,
        type: 'Laboratório',
        resources: ['GPUs Dedicadas', 'Kits de Robótica', 'Bancadas de Prototipagem', 'Ar Condicionado'],
        active: true
      },
      {
        id: 'room_4',
        name: 'Auditório Master',
        building: 'Prédio Central',
        capacity: 150,
        type: 'Auditório',
        resources: ['Som Surround', '2 Projetores Laser', 'Microfones Sem Fio', 'Cabine de Gravação'],
        active: true
      }
    ],
    subjects: [
      {
        id: 'sub_1',
        name: 'Estruturas de Dados Avançadas',
        code: 'ES-301',
        workload: '80h',
        teacherId: 'prof_1',
        coordinatorId: 'coord_1',
        color: '#6366F1',
        description: 'Árvores binárias, grafos, algoritmos de ordenação e complexidade assintótica.'
      },
      {
        id: 'sub_2',
        name: 'Modelagem e Bancos de Dados SQL/NoSQL',
        code: 'BD-202',
        workload: '60h',
        teacherId: 'prof_2',
        coordinatorId: 'coord_1',
        color: '#10B981',
        description: 'Modelagem relacional, PostgreSQL, MongoDB e arquiteturas distribuídas.'
      },
      {
        id: 'sub_3',
        name: 'Programação Web Full Stack',
        code: 'WEB-401',
        workload: '80h',
        teacherId: 'prof_3',
        coordinatorId: 'coord_1',
        color: '#F59E0B',
        description: 'Construção de SPAs modernas, APIs RESTful, Node.js e interfaces reativas.'
      },
      {
        id: 'sub_4',
        name: 'Inteligência Artificial Aplicada',
        code: 'IA-501',
        workload: '60h',
        teacherId: 'prof_4',
        coordinatorId: 'coord_1',
        color: '#EC4899',
        description: 'Fundamentos de redes neurais, processamento de linguagem natural e visão computacional.'
      }
    ],
    classes: [
      {
        id: 'cls_1',
        subjectId: 'sub_1',
        teacherId: 'prof_1',
        classroomId: 'room_2',
        groupName: 'Turma Eng. Software 2026.1',
        date: getOffsetDate(0),
        startTime: '08:00',
        endTime: '10:00',
        topic: 'Implementação de Árvores AVL e Balanceamento',
        status: 'Agendada'
      },
      {
        id: 'cls_2',
        subjectId: 'sub_2',
        teacherId: 'prof_2',
        classroomId: 'room_1',
        groupName: 'Turma BD 2026.1',
        date: getOffsetDate(0),
        startTime: '10:30',
        endTime: '12:30',
        topic: 'Normalização de Dados até a 3ª Forma Normal',
        status: 'Agendada'
      },
      {
        id: 'cls_3',
        subjectId: 'sub_3',
        teacherId: 'prof_3',
        classroomId: 'room_2',
        groupName: 'Turma Web Full Stack',
        date: getOffsetDate(1),
        startTime: '14:00',
        endTime: '16:30',
        topic: 'Arquitetura de Componentes e Hooks Reativos',
        status: 'Agendada'
      },
      {
        id: 'cls_4',
        subjectId: 'sub_4',
        teacherId: 'prof_4',
        classroomId: 'room_3',
        groupName: 'Turma IA Avançada',
        date: getOffsetDate(2),
        startTime: '09:00',
        endTime: '11:30',
        topic: 'Ajuste Fino de Modelos de Linguagem e Embeddings',
        status: 'Agendada'
      },
      {
        id: 'cls_5',
        subjectId: 'sub_1',
        teacherId: 'prof_1',
        classroomId: 'room_1',
        groupName: 'Turma Eng. Software 2026.1',
        date: getOffsetDate(3),
        startTime: '08:00',
        endTime: '10:00',
        topic: 'Grafos: Busca em Largura (BFS) e Profundidade (DFS)',
        status: 'Agendada'
      },
      {
        id: 'cls_6',
        subjectId: 'sub_2',
        teacherId: 'prof_2',
        classroomId: 'room_2',
        groupName: 'Turma BD 2026.1',
        date: getOffsetDate(4),
        startTime: '19:00',
        endTime: '21:30',
        topic: 'Consultas Otimizadas com Índices B-Tree',
        status: 'Agendada'
      }
    ]
  };
}

class AcademicStore {
  constructor() {
    this.memoryStorage = {};
    this.subscribers = [];
    this.init();
  }

  init() {
    try {
      if (!this.storageGet(STORAGE_KEYS.TEACHERS)) {
        this.resetToDefaults();
      }
    } catch (e) {
      console.warn('LocalStorage indisponível, utilizando memória temporária:', e);
      this.resetToDefaults();
    }
  }

  storageGet(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return this.memoryStorage[key] || null;
  }

  storageSet(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
    this.memoryStorage[key] = value;
  }

  get(collection) {
    try {
      const key = STORAGE_KEYS[collection.toUpperCase()];
      if (!key) return [];
      const data = this.storageGet(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Erro ao ler coleção ${collection}:`, e);
      return [];
    }
  }

  getById(collection, id) {
    const items = this.get(collection);
    return items.find(item => item.id === id) || null;
  }

  save(collection, items) {
    try {
      const key = STORAGE_KEYS[collection.toUpperCase()];
      if (!key) return;
      this.storageSet(key, JSON.stringify(items));
      this.notify(collection);
    } catch (e) {
      console.error(`Erro ao salvar coleção ${collection}:`, e);
    }
  }

  add(collection, item) {
    const items = this.get(collection);
    const newItem = {
      ...item,
      id: item.id || `${collection.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: item.createdAt || new Date().toISOString().split('T')[0]
    };
    items.unshift(newItem);
    this.save(collection, items);
    return newItem;
  }

  update(collection, id, updatedData) {
    const items = this.get(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updatedData, updatedAt: new Date().toISOString() };
    this.save(collection, items);
    return items[index];
  }

  delete(collection, id) {
    const items = this.get(collection);
    const filtered = items.filter(item => item.id !== id);
    this.save(collection, filtered);

    if (collection === 'teachers') {
      const subjects = this.get('subjects');
      subjects.forEach(sub => {
        if (sub.teacherId === id) sub.teacherId = '';
      });
      this.save('subjects', subjects);
    }

    return true;
  }

  checkClassConflict(classData, excludeId = null) {
    const { teacherId, classroomId, date, startTime, endTime } = classData;
    const classes = this.get('classes');
    const reasons = [];

    const toMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    if (newStart >= newEnd) {
      reasons.push('O horário de término deve ser posterior ao horário de início.');
      return { hasConflict: true, reasons };
    }

    const sameDayClasses = classes.filter(cls => cls.date === date && cls.id !== excludeId);

    for (const existing of sameDayClasses) {
      const exStart = toMinutes(existing.startTime);
      const exEnd = toMinutes(existing.endTime);

      const hasOverlap = Math.max(newStart, exStart) < Math.min(newEnd, exEnd);

      if (hasOverlap) {
        if (classroomId && existing.classroomId === classroomId) {
          const room = this.getById('classrooms', classroomId);
          const roomName = room ? room.name : 'A sala selecionada';
          reasons.push(`⚠️ Conflito de Sala: "${roomName}" já está ocupada das ${existing.startTime} às ${existing.endTime}.`);
        }

        if (teacherId && existing.teacherId === teacherId) {
          const teacher = this.getById('teachers', teacherId);
          const teacherName = teacher ? teacher.name : 'O professor selecionado';
          reasons.push(`⚠️ Conflito de Professor: "${teacherName}" já possui outra aula agendada das ${existing.startTime} às ${existing.endTime}.`);
        }
      }
    }

    return {
      hasConflict: reasons.length > 0,
      reasons
    };
  }

  getEnrichedClass(cls) {
    const subject = this.getById('subjects', cls.subjectId);
    const teacher = this.getById('teachers', cls.teacherId || (subject ? subject.teacherId : null));
    const classroom = this.getById('classrooms', cls.classroomId);

    return {
      ...cls,
      subjectName: subject ? subject.name : 'Matéria Não Informada',
      subjectCode: subject ? subject.code : '',
      teacherName: teacher ? teacher.name : 'Professor Não Informado',
      teacherColor: teacher ? teacher.color : '#6366F1',
      classroomName: classroom ? classroom.name : 'Sala Não Definida',
      classroomBuilding: classroom ? classroom.building : '',
      color: (subject && subject.color) || (teacher && teacher.color) || '#6366F1'
    };
  }

  getEnrichedClasses(filterFn = null) {
    const classes = this.get('classes');
    let enriched = classes.map(cls => this.getEnrichedClass(cls));
    if (filterFn && typeof filterFn === 'function') {
      enriched = enriched.filter(filterFn);
    }
    return enriched.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }

  getStats() {
    const today = new Date().toISOString().split('T')[0];
    const classes = this.get('classes');
    const todayClasses = classes.filter(c => c.date === today);

    return {
      totalTeachers: this.get('teachers').length,
      totalCoordinators: this.get('coordinators').length,
      totalStudents: this.get('students').length,
      totalSubjects: this.get('subjects').length,
      totalClassrooms: this.get('classrooms').length,
      totalClasses: classes.length,
      todayClassesCount: todayClasses.length
    };
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(collection) {
    this.subscribers.forEach(cb => {
      try {
        cb(collection);
      } catch (e) {
        console.error('Erro no listener do store:', e);
      }
    });
  }

  exportData() {
    const data = {
      teachers: this.get('teachers'),
      coordinators: this.get('coordinators'),
      students: this.get('students'),
      subjects: this.get('subjects'),
      classrooms: this.get('classrooms'),
      classes: this.get('classes'),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.teachers) this.save('teachers', data.teachers);
      if (data.coordinators) this.save('coordinators', data.coordinators);
      if (data.students) this.save('students', data.students);
      if (data.subjects) this.save('subjects', data.subjects);
      if (data.classrooms) this.save('classrooms', data.classrooms);
      if (data.classes) this.save('classes', data.classes);
      this.notify('all');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  resetToDefaults() {
    const defaults = getInitialData();
    Object.keys(defaults).forEach(key => {
      this.save(key, defaults[key]);
    });
    this.notify('all');
  }
}

window.academicStore = new AcademicStore();
window.PALETTE = PALETTE;
