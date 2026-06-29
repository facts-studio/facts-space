// Contenido real de F*cts Studio, estructurado en bloques.
// Formato de bloque: { h }, { p }, { ul }, { ol }, { table }, { note }, { check }.
// (En la Fase 1 esto se editará desde Administrar / vivirá en Supabase.)

// ── Onboarding: cuerpo de cada paso ──────────────────────────────────────────
export const ONBOARDING_BODY = {
  que: [
    { h: "Qué es F*cts" },
    { p: "F*cts es un estudio de diseño, comunicación y desarrollo. Trabajamos entre lo conceptual y lo técnico, entre la idea y la ejecución." },
    { p: "No creemos en fórmulas: creemos en criterio, en procesos que piensan antes de producir y en productos que no solo se ven bien, sino que funcionan." },
    { p: "Cada proyecto se crea como un sistema, no como una pieza aislada. Esa es la base de cómo trabajamos: conectar diseño, estrategia y desarrollo en un mismo flujo para que todo encaje." },
    { p: "Nuestra fuerza está en tener todas las áreas dentro del estudio —diseño, comunicación, social media, producto— y en que cada una entienda cómo afecta a las demás." },

    { h: "Nuestra forma de trabajar" },
    { p: "No nos interesa encajar en etiquetas: a veces hacemos branding, otras producto, otras estrategia o UX/UI. En realidad, hacemos lo que haga falta para que las cosas estén bien hechas." },
    { p: "En F*cts no hay jerarquías entre disciplinas. Diseño, desarrollo y comunicación trabajan juntos desde el inicio, porque lo importante no es que algo parezca bueno, sino que lo sea." },
    { p: "Nos movemos entre lo creativo y lo técnico, y en esa fricción es donde aparecen las buenas ideas." },

    { h: "Unfiltrade®, nuestro cliente principal" },
    { p: "F*cts es una sociedad independiente. Unfiltrade es un holding al que damos servicio integral: somos el estudio que da soporte a toda su infraestructura —desde la estrategia y la comunicación hasta el diseño y el desarrollo de producto." },
    { p: "El holding reúne los distintos proyectos con los que trabajamos a diario, cada uno con su propio enfoque y propósito. Son nuestros clientes del día a día:" },
    { ul: [
      "TradingLab — Formación de trading real y sin humo.",
      "TradingMind — Psicología y mentalidad aplicada al trading.",
      "Flickflow — Herramienta IA de información financiera adaptativa.",
      "The Benchmark (Alex Ruiz) — Portal editorial de análisis financiero.",
      "Alex Ruiz (marca personal) — Nuestro CEO y figura destacada en el sector.",
    ] },
  ],

  cultura: [
    { h: "Cómo trabajamos" },
    { p: "Trabajamos con flexibilidad, pero con una base clara: la responsabilidad individual y colectiva. Cada persona organiza su tiempo con autonomía, sabiendo que lo importante no es cumplir horas, sino cumplir con lo que hacemos y cómo lo hacemos." },
    { p: "La flexibilidad existe porque confiamos en la profesionalidad del equipo y en que todos compartimos un mismo objetivo: hacer las cosas bien y con intención." },
    { p: "Mantenemos una franja común flexible para poder coordinarnos, dar feedback y trabajar en los proyectos juntos. A partir de ahí se puede entrar antes o después a gusto de cada uno. No se trata de fichar, sino de mantenernos conectados." },
    { p: "Trabajamos en oficina de lunes a miércoles; los jueves y viernes se pueden hacer en remoto. Los días presenciales no son una formalidad: son una oportunidad para hablar, compartir referencias, resolver rápido y mantener vivo el ritmo del equipo." },

    { h: "Cómo nos organizamos" },
    { p: "Nos dividimos por áreas, pero pensamos como un solo sistema. Diseño, comunicación, estrategia y desarrollo trabajan juntos desde el inicio, porque cada parte influye en la otra." },
    { h3: "⚙️ Equipo de Producto" },
    { p: "Responsable del desarrollo, experiencia y estructura técnica de los productos digitales. Combina diseño, código y estrategia para crear sistemas funcionales, coherentes y escalables." },
    { h3: "🎨 Equipo Creativo" },
    { p: "Encargado de la dirección visual, conceptual y comunicativa de los proyectos. Desde la identidad hasta la ejecución, da forma a la voz, la estética y la narrativa de cada marca." },
    { p: "Cada perfil aporta su experiencia, pero lo que realmente importa es la cohesión entre roles: diseño que entiende de código, copy que entiende de estrategia, comunicación que entiende de producto. Ese punto común es lo que hace que todo funcione." },

    { h: "Lo que buscamos mantener" },
    { p: "Queremos un entorno sano, exigente y estimulante. Un lugar donde podamos crecer, aprender y sentir orgullo de lo que construimos. Nos mueve la curiosidad, el criterio y las ganas de mejorar cada día." },
    { p: "Sabemos que el nivel se mantiene entre todos: en cómo pensamos, cómo comunicamos y cómo ejecutamos. Nuestra meta es simple, pero ambiciosa: trabajar bien, hacerlo juntos y seguir elevando el listón en cada proyecto que firmamos como F*cts." },
  ],

  politicas: [
    { p: "Aquí tienes un resumen. El detalle completo de horarios, vacaciones, comunicación, organización y seguridad vive en la sección de Políticas." },
    { ul: [
      "🕒 Horarios y flexibilidad — base común orientativa, oficina L–M–X y remoto J–V.",
      "🌴 Vacaciones y festivos — 22 días hábiles al año + tu cumpleaños.",
      "💬 Comunicación y feedback — Slack como canal principal.",
      "⚙️ Organización — ClickUp para tareas, deadlines y horas por proyecto.",
      "🔒 Seguridad — 1Password para todos los accesos.",
    ] },
    { link: { href: "/politicas", label: "Ver todas las políticas →" } },
  ],

  herramientas: [
    { p: "Estas son las herramientas del día a día. Lo importante no es solo usarlas, sino entender para qué sirve cada una y cómo se conecta con el resto. Tienes la ficha completa de cada una en Recursos." },
    { ul: [
      "ClickUp — tareas, deadlines y horas por proyecto.",
      "Google Drive — archivo único del estudio (entregables, briefs, docs).",
      "Figma — diseño colaborativo, UI/UX y prototipos.",
      "Adobe (Ps, Ai, Ae, Pr) — soporte gráfico y audiovisual.",
      "Slack — comunicación interna del equipo y el ecosistema.",
      "Holded — fichaje diario y solicitudes de vacaciones.",
      "Google Calendar — agenda compartida del equipo.",
      "1Password — gestor de contraseñas y accesos.",
    ] },
    { link: { href: "/recursos", label: "Ver herramientas en Recursos →" } },
  ],

  tareas: [
    { h: "Lista de imprescindibles" },
    { p: "Tus primeros pasos al entrar. Pídele al head de tu área las credenciales que necesites." },
    { check: [
      "Inicia sesión en 1Password",
      "Inicia sesión en Google Chrome con tu cuenta @fcts.studio",
      "Descarga Slack Desktop e inicia sesión",
      "Accede a los canales de Slack que te correspondan",
      "Instala Figma Desktop y solicita tus credenciales",
      "Inicia sesión en Holded y tenlo localizado",
      "Instala ClickUp y solicita tus credenciales",
      "Instala Google Drive Desktop e inicia sesión con @fcts.studio",
    ] },
  ],
};

// ── Políticas internas (detalle) ─────────────────────────────────────────────
export const POLICIES = [
  {
    id: "horarios",
    icon: "🕒",
    title: "Horarios y flexibilidad",
    summary: "Franja común orientativa, días de oficina y remoto, y fichaje en Holded.",
    updated: "2026-06-20",
    min: 4,
    body: [
      { stats: [
        { n: "9–18h", label: "franja común", sub: "orientativa y flexible" },
        { n: "3 días", label: "en oficina", sub: "lunes a miércoles" },
        { n: "2 días", label: "en remoto", sub: "jueves y viernes" },
      ] },
      { p: "Trabajamos con una base común de 9:00 a 18:00, pero es un estándar orientativo. Cada persona puede ajustar su jornada —por ejemplo, empezar antes y salir antes— siempre que mantenga la coherencia con el equipo y los proyectos." },

      { h3: "La semana" },
      { week: [
        { d: "Lun", label: "Oficina", tone: "brand" },
        { d: "Mar", label: "Oficina", tone: "brand" },
        { d: "Mié", label: "Oficina", tone: "brand" },
        { d: "Jue", label: "Remoto", tone: "info" },
        { d: "Vie", label: "Remoto", tone: "info" },
      ] },
      { p: "Este formato busca equilibrio: mantener contacto presencial suficiente para compartir ideas y avanzar juntos, sin perder la flexibilidad que facilita concentrarse o adaptarse a lo personal." },
      { p: "Si un día surge algo —una cita, un compromiso o un imprevisto—, se avisa y se compensa cuando sea conveniente. No hace falta justificar cada detalle, pero sí actuar con responsabilidad y sentido común. La flexibilidad funciona porque todos entendemos que depende de mantener el nivel, los plazos y la comunicación." },
      { note: "Por motivos legales fichamos diariamente en Holded. Este registro no se usa para controlar horarios, sino para cumplir con la normativa laboral. Solo se pide constancia: marcar entrada y salida cada día, sin necesidad de ceñirse exactamente a los horarios." },
    ],
  },
  {
    id: "vacaciones",
    icon: "🌴",
    title: "Vacaciones y festivos",
    summary: "22 días hábiles al año + tu cumpleaños, con reparto orientativo por trimestres.",
    updated: "2026-06-20",
    min: 6,
    body: [
      { stats: [
        { n: "22", label: "días hábiles", sub: "de vacaciones al año" },
        { n: "+1", label: "tu cumpleaños 🎂", sub: "día libre extra" },
        { n: "15", label: "festivos oficiales", sub: "en 2026" },
      ] },
      { p: "Las vacaciones pueden distribuirse libremente a lo largo del año, siempre que se garantice la cobertura del equipo y se aprueben según la carga de trabajo." },

      { h3: "Reparto orientativo por trimestre" },
      { quarters: [
        { q: "Q1", months: "Ene–Mar", days: "8–10", level: "Carga baja", tone: "success", fill: "85%", note: "Carga de trabajo regular." },
        { q: "Q2", months: "Abr–Jun", days: "1–3", level: "Carga alta", tone: "warn", fill: "25%", note: "Campañas y eventos." },
        { q: "Q3", months: "Jul–Sep", days: "8–10", level: "Carga baja", tone: "success", fill: "85%", note: "Carga de trabajo regular." },
        { q: "Q4", months: "Oct–Dic", days: "1–3", level: "Bloqueado", tone: "danger", fill: "15%", note: "Black Friday y cierre anual." },
      ] },
      { note: "Los días son orientativos para evitar acumulaciones a final de año, no un reparto fijo. Diciembre puede tener algún día más en su primera mitad; se evitarán vacaciones de ±5 días la semana antes de Navidad." },

      { h3: "Cómo funciona según la carga" },
      { ul: [
        "🟢 Carga baja (Q1 y Q3): días sueltos y periodos largos, con más flexibilidad. Sujeto a aprobación por cobertura.",
        "🔘 Carga alta (Q2): máximo 2 días laborables seguidos, sin periodos largos. Aprobación por carga y cobertura.",
        "❌ Bloqueado (Q4): octubre y noviembre sin vacaciones; diciembre solo en su 1ª mitad con aprobación; nada ±5 días antes de Navidad.",
      ] },

      { h3: "Antelación para solicitar" },
      { timeline: [
        { label: "1–3 días", value: "15 días naturales de antelación" },
        { label: "Más de 3 días", value: "30 días naturales de antelación" },
        { label: "Periodos de +5 días", value: "Comunicar antes del 15 de marzo" },
      ] },

      { note: "🎂 El día de tu cumpleaños es fiesta. Si cae en fin de semana, se mueve a un día próximo (normalmente el viernes anterior o el lunes siguiente)." },
      { p: "Se gestionan por Holded, se comunican al responsable de área y se registran en el calendario compartido. El objetivo es simple: que todos sepamos cuándo alguien estará fuera para planificar y evitar bloqueos." },
    ],
  },
  {
    id: "comunicacion",
    icon: "💬",
    title: "Comunicación y feedback",
    summary: "Slack como canal principal; feedback directo y constructivo.",
    updated: "2026-06-18",
    min: 2,
    body: [
      { p: "Nos comunicamos principalmente por Slack, donde están todos los miembros de Unfiltrade® y colaboradores externos." },
      { cards: [
        { tone: "brand", title: "Canales de área / proyecto", items: ["Para mantener al equipo informado.", "Evitan información dispersa.", "Hilos por tema."] },
        { tone: "info", title: "Mensajes privados", items: ["Solo temas puntuales o sensibles.", "Nada que deba ver el equipo.", "Sin abusar de ellos."] },
        { tone: "success", title: "Feedback", items: ["Constructivo y directo.", "No es tener razón, es mejorar.", "Cuidamos cómo llegamos a ello."] },
      ] },
    ],
  },
  {
    id: "organizacion",
    icon: "⚙️",
    title: "Organización y gestión del trabajo",
    summary: "ClickUp para deadlines, cargas, prioridades y horas por proyecto.",
    updated: "2026-06-18",
    min: 3,
    body: [
      { p: "Todo lo relacionado con deadlines, cargas de trabajo y planificación se gestiona en ClickUp. Ahí centralizamos tareas, avances y prioridades semanales." },
      { p: "También registramos las horas por proyecto dentro de ClickUp. Este seguimiento no es individual ni evaluativo, sino una herramienta para entender la viabilidad de los proyectos y analizar el impacto real de cada flujo de trabajo en el sistema." },
      { p: "No se usan los datos para sacar conclusiones personales, sino para mejorar procesos y optimizar recursos de forma global. ClickUp no está para «controlar», sino para ordenar y facilitar la colaboración: nos permite tener visibilidad, ajustar cargas y anticipar imprevistos antes de que se conviertan en problemas." },
    ],
  },
  {
    id: "seguridad",
    icon: "🔒",
    title: "Seguridad y contraseñas",
    summary: "1Password para todos los accesos profesionales. Nunca fuera de ahí.",
    updated: "2026-06-18",
    min: 2,
    body: [
      { p: "La seguridad es responsabilidad de todos. Usamos 1Password como gestor centralizado de contraseñas para proteger los accesos del estudio y de todas las marcas del ecosistema." },
      { ul: [
        "Todos los accesos profesionales se guardan en 1Password, no en notas, Slack o documentos personales.",
        "Cada persona tiene permisos específicos según su área y debe mantener su vault actualizado.",
        "Está prohibido compartir contraseñas fuera de 1Password, incluso por mensajes privados o email.",
      ] },
      { note: "Si algo falla o se pierde un acceso, se comunica inmediatamente al responsable del área o a dirección para resolverlo." },
    ],
  },
];

// Agrupación para la vista de Políticas.
export const POLICY_GROUPS = [
  { name: "Horarios y descanso", eyebrow: "Día a día", ids: ["horarios", "vacaciones"] },
  { name: "Trabajo en equipo", eyebrow: "Operativa", ids: ["comunicacion", "organizacion"] },
  { name: "Seguridad", eyebrow: "Accesos", ids: ["seguridad"] },
];

// ── Herramientas (software compartido) ───────────────────────────────────────
export const TOOLS = [
  {
    id: "clickup", name: "ClickUp", url: "https://clickup.com", tag: "Gestión",
    what: "El sistema nervioso de la operación: qué hay que hacer, quién lo hace y para cuándo. Da visibilidad de la carga, dependencias y estado real de cada proyecto.",
    when: ["Para toda tarea o proyecto (de un bug a una landing).", "Para planificar sprints, asignar responsables y marcar deadlines.", "Para seguimiento: bloqueos, entregas parciales, avances."],
    avoid: ["No es repositorio de archivos finales → eso es Drive.", "No es para conversaciones largas sin contexto.", "No sustituye reuniones: las prepara."],
  },
  {
    id: "drive", name: "Google Drive", url: "https://drive.google.com", tag: "Archivo",
    what: "El archivo único del estudio: donde vive todo lo que generamos o recibimos. Acceso compartido, control de versiones y continuidad del trabajo.",
    when: ["Entregables, briefs, presentaciones, facturas o documentos de soporte.", "Enlaces compartidos con externos (en carpetas señalizadas)."],
    avoid: ["No es gestor de tareas → eso es ClickUp.", "No es disco personal: nada de copias sueltas.", "No es chat ni lugar para debatir."],
  },
  {
    id: "figma", name: "Figma", url: "https://figma.com", tag: "Diseño",
    what: "Diseño colaborativo: landings, UI/UX, docs visuales y prototipos. Comentar, iterar y ver el diseño en vivo antes de producir. Centraliza componentes y guías.",
    when: ["Interfaces, prototipos navegables y documentos visuales.", "Piezas de contenido que requieran iteración rápida."],
    avoid: ["No es el almacén final de assets → eso es Drive.", "No sirve para retoque o animación avanzada → eso es Adobe.", "Evitar el lienzo infinito sin propósito."],
  },
  {
    id: "adobe", name: "Adobe Suite", url: "https://adobe.com", tag: "Gráfico · A/V",
    what: "Soporte gráfico y audiovisual cuando Figma no llega. Photoshop (retoque, mockups), Illustrator (vectorial, identidades), After Effects (motion), Premiere (vídeo).",
    when: ["Cuando se requiere acabado gráfico, animación o vídeo fuera del alcance de Figma."],
    avoid: ["No sustituye el trabajo colaborativo de Figma en ideación.", "No es repositorio de versiones → los finales van a Drive.", "No se usa sin brief: toda pieza con tarea en ClickUp."],
  },
  {
    id: "slack", name: "Slack", url: "https://slack.com", tag: "Comunicación",
    what: "Nuestra comunicación interna: coordinar conversaciones rápidas, compartir actualizaciones y mantener la información visible para todos.",
    when: ["Comunicación diaria entre equipos y áreas.", "Avisos rápidos o coordinación puntual.", "Hilos por proyecto o departamento; anuncios generales."],
    avoid: ["No es gestor de tareas → las acciones viven en ClickUp.", "No sustituye Drive: los entregables no se adjuntan aquí.", "No abusar de los privados: mejor en canales abiertos."],
  },
  {
    id: "holded", name: "Holded", url: "https://holded.com", tag: "Fichaje · RRHH",
    what: "Registro diario de la jornada laboral (por obligación legal). También para solicitar vacaciones o ausencias.",
    when: ["Fichar entrada y salida cada día.", "Solicitar vacaciones (además de avisar al head de área)."],
    avoid: ["No es canal de comunicación ni gestión de tareas.", "No refleja avances de proyectos → eso está en ClickUp.", "No sustituye la conversación con el responsable."],
  },
  {
    id: "calendar", name: "Google Calendar", url: "https://calendar.google.com", tag: "Agenda",
    what: "Agenda compartida del equipo: reuniones, status, eventos o disponibilidad. Evita solapamientos y mantiene visibilidad de agendas.",
    when: ["Reuniones internas o externas.", "Bloques de disponibilidad (focus time, vacaciones…).", "Eventos de empresa o formaciones."],
    avoid: ["No es gestor de tareas → eso es ClickUp.", "No se usa para guardar documentos ni tomar decisiones."],
  },
  {
    id: "1password", name: "1Password", url: "https://1password.com", tag: "Seguridad",
    what: "Gestor centralizado de contraseñas para proteger los accesos del estudio y de todas las marcas del ecosistema.",
    when: ["Guardar y usar cualquier acceso profesional.", "Mantener tu vault actualizado según tus permisos de área."],
    avoid: ["Nunca guardar accesos en notas, Slack o email.", "Está prohibido compartir contraseñas fuera de 1Password."],
  },
];

// ── Clientes de F*cts ────────────────────────────────────────────────────────
// Unfiltrade® es un holding al que damos servicio; dentro están sus marcas,
// que son nuestros clientes del día a día.
export const CLIENTS = [
  {
    id: "unfiltrade",
    name: "Unfiltrade®",
    kind: "Holding",
    desc: "Holding al que damos servicio integral: estrategia, comunicación, diseño y desarrollo de producto.",
    brands: [
      { id: "tradinglab", name: "TradingLab", tagline: "Trading sin filtros", desc: "Academia de trading en español: estrategias validadas, mentorías en vivo, psicología y comunidad de +3.000 alumnos.", url: "https://tradinglab.es" },
      { id: "tradingmind", name: "TradingMind", tagline: "Tu mente, tu mayor activo", desc: "Academia centrada en la mente del trader: gestión emocional, psicología y estrategia con psicólogos y traders.", url: "https://www.tradingmind.es" },
      { id: "flickflow", name: "Flickflow", tagline: "Datos financieros filtrados por IA", desc: "Plataforma de inteligencia de mercado en tiempo real: gráficos, eventos económicos y asistente de IA (cripto, acciones, forex).", url: "https://flickflow.com" },
      { id: "benchmark", name: "The Benchmark", tagline: "Sin humo, sin ruido, sin postureo", desc: "Newsletter semanal de análisis financiero de Alex Ruiz: claro, útil y con criterio.", url: "https://thebenchmark.es" },
      { id: "alexruiz", name: "Alex Ruiz", tagline: "Marca personal · CEO", desc: "Divulgación y análisis de trading y mercados financieros en YouTube. Figura destacada del sector.", url: "https://www.youtube.com/@AlexRuiiz" },
    ],
  },
];
