# 🎓 EduCalendar - Sistema de Calendário Acadêmico (Desktop, Mobile & Multi-Rede)

Um sistema web completo, moderno e responsivo para visualização de horários e gestão escolar/universitária, com suporte a **PWA, Celulares e Acesso em Qualquer Rede Wi-Fi / Internet**.

---

## 🌐 Como Acessar em Qualquer Rede Wi-Fi ou Celular

### 1. Na Mesma Rede Wi-Fi / Rede Local
Execute o servidor no terminal do computador:
```powershell
python C:\Users\Ruimar\.gemini\antigravity\scratch\academic_calendar_app\server.py
```
- No computador: Acesse `http://localhost:8000/index.html`
- No celular (mesmo Wi-Fi): Abra a câmera e escaneie o **QR Code** no botão **"🔗 Conectar Celular / Wi-Fi"** no topo do site, ou acesse `http://<SEU_IP_LOCAL>:8000/index.html`.

---

### 2. Em Qualquer Rede Wi-Fi Diferente, 4G ou 5G (Acesso Remoto Global)
Se o computador estiver em uma rede e os celulares/outros computadores estiverem em **outras redes Wi-Fi ou dados móveis**:

#### Opção A: Usando Túnel Gratuito da Cloudflare (Sem instalar nada)
No terminal do Windows, execute:
```bash
npx cloudflared tunnel --url http://localhost:8000
```
Ele gerará um link público HTTPS seguro (ex: `https://nome-aleatorio.trycloudflare.com`) acessível de qualquer lugar do planeta!

#### Opção B: Usando LocalTunnel
```bash
npx localtunnel --port 8000
```

#### Opção C: Hospedagem 100% Gratuita e Permanente (GitHub Pages / Vercel)
Como a aplicação é estática e moderna (HTML5, Tailwind CSS, LocalStorage e PWA), você pode colocar a pasta inteira no **GitHub Pages** ou **Vercel** gratuitamente. O link ficará disponível 24h por dia na nuvem.

---

## ✨ Funcionalidades Principais

- 📅 **Calendário Completo**: Visões Mensal, Semanal (por hora), Diária e Lista/Agenda com filtros por professor, sala e matéria.
- ⚠️ **Detecção de Conflitos**: Alerta automático em tempo real para choque de horários de salas ou professores.
- 👥 **Módulos de Cadastro (CRUD)**: Professores, Coordenadores, Alunos, Matérias, Salas e Aulas.
- 📱 **Mobile & PWA**: Barra inferior de navegação rápida, cards dinâmicos para toque e botão para "Adicionar à Tela de Início".
- 🔗 **QR Code Integrado**: Botão no cabeçalho com gerador de QR Code dinâmico para entrada instantânea de smartphones.
- 💾 **Backup & Dados**: Armazenamento automático em `localStorage`, exportação/importação em JSON e restauração de dados demo.
