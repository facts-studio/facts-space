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
      "F*cts Space — fichaje diario y solicitudes de vacaciones.",
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
      "Entra en F*cts Space con tu cuenta @fcts.studio",
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
    summary: "Cuándo y dónde trabajamos, y la confianza que lo sostiene.",
    updated: "2026-08-25",
    min: 5,
    body: [
      { stats: [
        { n: "9–18h", label: "franja común", sub: "orientativa y flexible" },
        { n: "3 días", label: "en oficina", sub: "lunes a miércoles" },
        { n: "2 días", label: "en remoto", sub: "jueves y viernes" },
      ] },
      { lead: "Trabajamos con una base común de 9:00 a 18:00, pero es un **estándar orientativo**. Cada persona puede ajustar su jornada —por ejemplo, empezar antes y salir antes— siempre que mantenga la coherencia con el equipo y los proyectos." },

      { h3: "Esto se sostiene con confianza", icon: "🤝" },
      { p: "**Dentro de la jornada de tu contrato, la organización del día es tuya.** No hay que justificar cada rato ni pedir permiso para mover una hora: partimos de que cada persona sabe lo que tiene que sacar adelante y de que confiamos los unos en los otros." },
      { p: "Conviene decirlo claro, y no cuando ya sea un problema: **este sistema es frágil y depende de que todos lo hagamos funcionar.** La flexibilidad no es un derecho adquirido ni un descuido de la empresa — es una forma de trabajar que se mantiene mientras el trabajo salga, los plazos se cumplan y el equipo pueda contar contigo." },
      { check: [
        "**Responde por el trabajo, no por las horas**: lo que se mira es el nivel y los plazos.",
        "**Avisa antes, no expliques después**: un mensaje a tiempo evita el 90% de los problemas.",
        "Estate localizable en la franja común, aunque tu horario esté desplazado.",
        "Si algo se tuerce —vas justo, no llegas, te has atascado—, dilo pronto.",
        "Sé proactivo: si ves un hueco o algo parado, no esperes a que te lo asignen.",
      ] },
      { icon: "⚠️", note: "Si esto deja de funcionar, la alternativa no es mejor para nadie: **horarios rígidos y control**. Mantenerlo depende de todos." },

      { h3: "La semana", icon: "🗓" },
      { week: [
        { d: "Lun", label: "Oficina", tone: "brand" },
        { d: "Mar", label: "Oficina", tone: "brand" },
        { d: "Mié", label: "Oficina", tone: "brand" },
        { d: "Jue", label: "Remoto", tone: "info" },
        { d: "Vie", label: "Remoto", tone: "info" },
      ] },
      { p: "Este formato busca equilibrio: mantener contacto presencial suficiente para compartir ideas y avanzar juntos, sin perder la flexibilidad que facilita concentrarse o adaptarse a lo personal." },
      { p: "Si un día surge algo —una cita, un compromiso o un imprevisto—, **se avisa al responsable de área** y se acuerda con él cómo se recoloca la jornada. No hace falta dar explicaciones de más, pero sí actuar con responsabilidad y sentido común. La flexibilidad funciona porque todos entendemos que depende de mantener el nivel, los plazos y la comunicación." },
      { icon: "⚖️", note: "Registro de jornada: la ley (art. 34.9 del Estatuto de los Trabajadores) obliga a registrar cada día el inicio y el fin de la jornada, y lo hacemos desde este portal. No es una herramienta de control ni de evaluación, pero sí un registro que **debe reflejar la jornada realmente trabajada**. La flexibilidad está en cuándo trabajas, no en lo que anotas: si un día empiezas más tarde, se anota más tarde." },
    ],
  },
  {
    id: "vacaciones",
    icon: "🌴",
    title: "Vacaciones y festivos",
    summary: "Cuántos días tienes, cuándo cogerlos y cómo pedirlos.",
    updated: "2026-08-25",
    min: 7,
    body: [
      { figures: [
        { n: "22", label: "días hábiles al año", sub: "de vacaciones" },
        { n: "+1", label: "tu cumpleaños 🎂", sub: "día libre extra" },
        { n: "15", label: "festivos oficiales", sub: "en 2026" },
      ] },
      { lead: "Las vacaciones se reparten a lo largo del año según la carga de cada trimestre, **siempre que se garantice la cobertura del equipo**. No hay un calendario fijo, pero sí trimestres más abiertos que otros." },

      { h3: "El año de un vistazo", icon: "📊" },
      { loadbar: [
        { q: "Q1", months: "Ene–Mar", days: "8–10", level: "Carga baja", tone: "success" },
        { q: "Q2", months: "Abr–Jun", days: "1–3", level: "Carga alta", tone: "warn" },
        { q: "Q3", months: "Jul–Sep", days: "8–10", level: "Carga baja", tone: "success" },
        { q: "Q4", months: "Oct–Dic", days: "1–3", level: "Solo diciembre", tone: "warn" },
      ] },
      { note: "Los días son orientativos para evitar acumulaciones a final de año, no un reparto fijo." },

      { h3: "Cómo funciona según la carga", icon: "⚖️" },
      { ul: [
        "🟢 Carga baja (Q1 y Q3): días sueltos y periodos largos, con más flexibilidad. Sujeto a aprobación por cobertura.",
        "🔘 Carga alta (Q2): máximo 2 días laborables seguidos, sin periodos largos. Aprobación por carga y cobertura.",
        "❌ Restringido (Q4): octubre y noviembre sin vacaciones. Diciembre sí está permitido, con aprobación por cobertura.",
      ] },

      { h3: "Antelación para solicitar", icon: "⏳" },
      { deflist: [
        { label: "1–3 días", value: "15 días naturales de antelación" },
        { label: "Más de 3 días", value: "30 días naturales de antelación" },
        { label: "Periodos de +5 días", value: "Comunicar antes del 15 de marzo" },
      ] },

      { h3: "Los días son del año natural", icon: "📅" },
      { p: "Las vacaciones corresponden al año en que se generan y se disfrutan dentro de él. **Salvo casos excepcionales, los días que no hayas gastado a 31 de diciembre no se transfieren al año siguiente.** Tampoco cabe su compensación económica: la ley la reserva para la liquidación al terminar el contrato." },
      { p: "**La empresa se compromete a que puedas disfrutarlos.** A lo largo del año verás tu saldo actualizado en el portal, recibirás recordatorios cuando queden días pendientes y las solicitudes se aprueban salvo que comprometan la cobertura del equipo. Si una petición se deniega por carga, se te propone una alternativa." },
      { p: "**Y planificarlos es responsabilidad tuya.** Conoces el reparto por trimestres y sabes que octubre y noviembre están cerrados: si dejas los días para el final, todo el saldo pendiente tiene que caber en diciembre, y diciembre se llena rápido. Si ves que se te acumulan, dilo en el status semanal y se busca hueco." },
      { icon: "⚖️", note: "Marco legal: el art. 38 del Estatuto de los Trabajadores fija el disfrute dentro del año natural. La jurisprudencia europea (asunto C-684/16, Max-Planck) añade que los días solo decaen si la empresa ha informado con diligencia y ha dado ocasión real de disfrutarlos — que es justo lo que hacemos. Quedan a salvo los supuestos legales de aplazamiento: incapacidad temporal, embarazo, parto o lactancia, en los que las vacaciones se disfrutan al terminar la suspensión aunque haya acabado el año natural." },

      { icon: "🎂", note: "El día de tu cumpleaños es fiesta. Si cae en fin de semana, se mueve a un día próximo (el viernes anterior o el lunes siguiente)." },
      { p: "**Se solicitan desde el calendario del portal**, se comunican al responsable de área y quedan registradas en el calendario compartido al aprobarse. El objetivo es simple: que todos sepamos cuándo alguien estará fuera para planificar y evitar bloqueos." },
    ],
  },
  {
    id: "comunicacion",
    icon: "💬",
    title: "Comunicación y feedback",
    summary: "Qué se habla en cada canal y cómo funcionan los tickets.",
    updated: "2026-08-25",
    min: 6,
    body: [
      { h: "Dónde se habla" },
      { lead: "Nos comunicamos principalmente por Slack: el espacio de F*cts y los canales que compartimos con clientes —Unfiltrade® entre ellos— y colaboradores externos." },
      { p: "Los canales se organizan por proyecto, cliente o rol: **cada conversación en el suyo**." },
      { cards: [
        { tone: "brand", title: "Canales de área / proyecto", items: ["Para mantener al equipo informado.", "Evitan información dispersa.", "Hilos por tema."] },
        { tone: "info", title: "Mensajes privados", items: ["Temas puntuales o personales.", "Nada que afecte a un proyecto.", "Sin abusar de ellos."] },
        { tone: "success", title: "Feedback", items: ["Constructivo y directo.", "No es tener razón, es mejorar.", "Cuidamos cómo llegamos a ello."] },
      ] },

      { h3: "Canales generales", icon: "💬" },
      { p: "Además de los de proyecto, cada equipo tiene su canal general — como #general-fcts — para el día a día: avisos, coordinación, dudas rápidas y compartir lo que sea de interés para el resto (referencias, hallazgos, novedades)." },
      { p: "Son el sitio por defecto para hablar cuando el tema no pertenece a un proyecto concreto ni es una petición formal a otro departamento. Si acaba siendo una petición, se abre su ticket; si acaba siendo un proyecto, se abre su canal." },

      { h3: "Los privados, para lo que no tiene repercusión", icon: "🔒" },
      { p: "Los mensajes individuales quedan reservados a cosas concretas que no afecten a nadie más. En cuanto algo tiene que ver con un ticket, un lanzamiento o un proyecto, **va al canal acordado**: si la conversación vive en un privado, el resto del equipo trabaja sin esa información y las decisiones no dejan rastro." },

      { h3: "Canales de proyecto", icon: "🚀" },
      { p: "Cuando arranca un proyecto concreto — un lanzamiento, una campaña, una web — se abre un canal propio (los `proj-…`) y se incorpora a él a los perfiles implicados, sean del departamento que sean." },
      { p: "Mientras el proyecto esté activo, **todo lo que le concierna se habla ahí**: decisiones, avances, bloqueos y dudas. Nada de repartir la conversación entre privados y canales de área — si vive en un solo sitio, todas las partes están alineadas y quien se incorpore más tarde puede ponerse al día leyendo." },

      { h: "Los canales de tickets" },
      { h3: "Un punto único por departamento", icon: "🎯" },
      { p: "Las peticiones entre departamentos no se piden por privado ni sueltas en un canal cualquiera: entran como ticket en el canal compartido del área a la que van dirigidas. Hay dos, uno por departamento." },
      { cards: [
        { tone: "brand", title: "#shared-creative", items: ["Peticiones al Departamento Creativo.", "Recursos, piezas y diseño.", "Punto único de entrada."] },
        { tone: "info", title: "#shared-tech", items: ["Peticiones al Departamento Tecnológico.", "Desarrollo e implementación.", "Punto único de entrada."] },
      ] },
      { p: "En #shared-creative se gestionan: creación de recursos y documentos (PDFs, imágenes, vídeos, copy); recursos en Figma (presentaciones, plantillas); diseño de recursos web (banners, anuncios, creatividades digitales); y landings o interfaces que necesiten diseño previo." },
      { note: "Las landings son en gran parte trabajo de desarrollo, pero primero necesitan diseño: **la petición entra siempre por #shared-creative**. Una vez validado el diseño, es el equipo creativo quien la traslada al equipo tecnológico." },

      { h3: "Los tickets llegan sin dueño", icon: "✋" },
      { p: "**Ningún ticket entra con responsable asignado.** Es responsabilidad de cada miembro del departamento estar atento a su canal, leer lo que entra y adjudicarse lo que pueda asumir. Ante la duda de a quién le toca, **se levanta la mano y se habla** — antes de que el ticket se quede parado esperando a que lo coja otro." },
      { check: [
        "Estar atento al canal de tu departamento: los tickets no te llegan asignados.",
        "Adjudicarte el ticket que vayas a hacer, en cuanto lo cojas.",
        "Mantener el estado del ticket actualizado según avanza.",
        "Toda la conversación, el feedback y la entrega final, en los Comentarios del ticket.",
      ] },
      { p: "Mantener el estado al día no es burocracia: es lo que permite que quien pidió la tarea sepa en qué punto está sin tener que preguntar, y que el resto del equipo vea qué hay en curso." },

      { h: "Trabajar un ticket" },
      { h3: "Cómo se pide", icon: "📝" },
      { p: "**Cada petición es un ticket nuevo.** Se abre con el botón [Nuevo Ticket] del canal y se rellena el formulario, que a propósito solo tiene dos campos:" },
      { timeline: [
        { label: "Título", value: "Breve pero descriptivo de la tarea." },
        { label: "Descripción", value: "Definición extensa, con todos los detalles relevantes." },
      ] },
      { p: "No hay más campos para no entorpecer la petición. Si necesitas adjuntar más información, abre el ticket ya creado y usa la pestaña de Comentarios: ahí puedes escribir y adjuntar todo lo que haga falta. Por esa misma vía se entregan los resultados finales y los feedbacks." },
      { p: "**Los campos de [Estado] y [Asignado a] los gestiona el departamento que recibe la petición**: son ellos quienes saben quién puede ocuparse. Si tienes claro hacia quién va, menciónale con una @ desde los comentarios, pero no lo asignes tú." },

      { h3: "Toda la conversación, dentro del ticket", icon: "🧵" },
      { p: "**Nada de hablar de un ticket fuera de su hilo.** Con varios tickets en paralelo, las conversaciones sueltas se cruzan, se pierde el contexto y acaba habiendo dos versiones de lo mismo. Dentro del ticket queda un histórico claro y todas las partes ven el mismo proceso y el mismo estado." },
      { icon: "⚠️", note: "Todas las tareas de un área deben solicitarse por su canal compartido. **No se aceptan peticiones por privado.**" },
    ],
  },
  {
    id: "organizacion",
    icon: "⚙️",
    title: "Organización y gestión del trabajo",
    summary: "Cómo repartimos el trabajo y dónde vive cada archivo.",
    updated: "2026-08-25",
    min: 8,
    body: [
      { h: "Equipo y tareas" },
      { lead: "Nos organizamos en dos planos: una puesta en común semanal con todo el equipo y este portal, donde el trabajo queda reflejado el resto de los días." },

      { h3: "Status semanales", icon: "🗣" },
      { p: "Cada semana hacemos un status de equipo. Es el momento de levantar la cabeza del trabajo propio y ver el conjunto:" },
      { ul: [
        "Lo cerrado la semana pasada: qué ha salido y qué se ha quedado por el camino.",
        "El trabajo de esta semana: qué hay sobre la mesa y cómo están las cargas.",
        "Temas a comentar, ya vengan de la empresa o de cada uno.",
        "Disponibilidad: vacaciones, ausencias previstas o cualquier cosa que afecte a lo que el resto puede esperar de ti.",
      ] },
      { p: "**El status no es un parte de trabajo: es el sitio donde nos alineamos.** Si algo te afecta o afecta a otros —te vas de vacaciones, vas justo con una entrega, dependes de que alguien termine antes—, es ahí donde se dice. Lo que no se comparte acaba apareciendo tarde y en forma de problema." },

      { h3: "El trabajo vive en el portal", icon: "📋" },
      { p: "Este portal refleja los proyectos activos, los sprints en curso y las tareas de cada cliente. Es donde cualquiera puede ver, sin preguntar, en qué anda el equipo." },
      { icon: "☞", note: "No confundas esto con los tickets de Slack: **los tickets llegan sin dueño y te los adjudicas tú**; las tareas del portal las crea y reparte el responsable de área. Un ticket que se alarga acaba convertido en tarea del portal." },
      { p: "**El responsable de cada área es quien crea las tareas** y las reparte. A partir de ahí, **mantener el estado al día es responsabilidad de cada uno**: mover una tarea cuando la empiezas y cuando la cierras cuesta segundos, y es lo que hace que el tablero valga para algo." },
      { check: [
        "Actualiza el estado de tus tareas según avanzan, no al final de la semana.",
        "Si una tarea se bloquea o se alarga, refléjalo en vez de dejarla en curso indefinidamente.",
        "Si algo no está en el portal, no existe: pídele al responsable de tu área que lo cree.",
      ] },
      { note: "Nada de esto se usa para medir a nadie: sirve para entender la carga real, ajustar plazos y anticipar imprevistos antes de que se conviertan en problemas." },

      { h: "Contenido en Figma" },
      { lead: "En Figma vive casi todo lo que producimos. **Es un espacio común: lo que dejas ahí lo abre, lo hereda y lo reutiliza el resto del equipo.** Ser ordenado no es una cuestión estética, es que el siguiente encuentre lo que busca sin preguntar." },

      { h3: "Carpetas: una por marca", icon: "🗂" },
      { p: "El primer nivel de la organización son las carpetas, y hay una por cada marca o cliente —TradingLab, Unfiltrade, Flickflow, Alex Ruiz—, más dos transversales: **Creative Space**, para exploración y trabajo creativo que aún no pertenece a un cliente, y **F*cts Studio**, para lo nuestro." },
      { p: "**Nada vive fuera de su carpeta.** Un archivo suelto en la raíz es un archivo que nadie va a encontrar dentro de tres semanas." },

      { h3: "Proyectos: el ámbito dentro de la marca", icon: "📁" },
      { p: "Dentro de cada carpeta, los proyectos agrupan por ámbito de trabajo: un canal, un producto, un espacio compartido con el cliente o los recursos reutilizables. Los archivos que quedan directamente en la carpeta son los troncales de esa marca." },
      { p: "Si abres algo nuevo, pregúntate si encaja en un proyecto existente antes de crear otro: **dos proyectos que significan lo mismo son peor que ninguno**." },

      { h3: "Archivos: el nombre dice qué son", icon: "🏷" },
      { p: "Los archivos se nombran con un prefijo que indica su tipo, dos puntos y el nombre concreto: `Site: Academy LAB`, `Instagram: Tradinglab`, `Docs: TradingLab`. Así la rejilla de archivos se lee de un vistazo y todo lo del mismo tipo queda junto." },
      { check: [
        "Usa el prefijo que ya existe para ese tipo de pieza; no inventes uno nuevo si hay equivalente.",
        "Cada archivo abre con una página **Cover**: portada con el nombre y de qué va. Es lo que se ve en la miniatura.",
        "Mantén la portada actualizada: es la primera impresión que tiene el resto del archivo.",
      ] },

      { h3: "Páginas: el orden dentro del archivo", icon: "📄" },
      { p: "Dentro de cada archivo, las páginas van ordenadas y agrupadas con separadores, con un emoji al principio del nombre para reconocerlas rápido. El orden habitual va de lo general a lo concreto: **portada, bloques de trabajo, componentes, exploración y entrega**." },
      { ul: [
        "**Cover** — siempre la primera, sola y sin trabajo dentro.",
        "**Bloques de trabajo** — una página por tipo de pieza (banners, miniaturas, piezas de campaña…).",
        "**Componentes** — lo reutilizable del archivo, separado de las piezas que lo usan.",
        "**Workshop** — pruebas y exploración. Lo descartado se queda aquí, no en medio del trabajo bueno.",
        "**Screens / entrega** — lo validado y listo para desarrollo, al final.",
      ] },
      { icon: "⚠️", note: "El desorden en un espacio común no lo paga quien lo genera, lo paga el siguiente que abre el archivo. Antes de cerrar una sesión de trabajo: nombra las capas y los frames, tira lo que no vale y deja las pruebas en Workshop." },

      { h: "Contenido en Drive" },
      { lead: "En Drive vive **lo que no puede vivir en Figma y lo que necesitan otros departamentos**: documentos entregables, material de eventos, recursos gráficos exportados y, en general, cualquier archivo que alguien tenga que abrir sin entrar en Figma." },

      { h3: "Unidades compartidas", icon: "🗄" },
      { p: "Trabajamos con dos unidades y **la diferencia entre ellas es quién las ve**." },
      { places: [
        { icon: "🤝", title: "Unfiltrade", desc: "El punto de encuentro con el cliente: material de eventos, documentos entregables y recursos gráficos. **Lo que subes aquí lo ve el cliente.**", href: "https://drive.google.com/drive/folders/0AA1tjvqozuv9Uk9PVA", action: "Abrir en Drive" },
        { icon: "✳️", title: "F*cts Studio", desc: "Nuestra unidad interna: recursos para redes, gráfica y los archivos editables de Adobe. Es de donde tiramos para trabajar.", href: "https://drive.google.com/drive/folders/0APZxDGnklTymUk9PVA", action: "Abrir en Drive" },
      ] },
      { p: "Dentro de cada una, el archivo va a la carpeta de la marca y el ámbito al que pertenece, con el mismo criterio que en Figma. Si dudas entre dos carpetas, es señal de que el nombre de alguna no está claro: pregunta antes de duplicar." },

      { h3: "Comparte el enlace, no el archivo", icon: "🔗" },
      { p: "**Acostúmbrate a pasar un link antes que un archivo.** Si te piden un documento de oferta, lo subes a su carpeta de Drive y pasas el enlace por Slack; no lo adjuntas como PDF suelto." },
      { p: "Un adjunto es una foto fija: en cuanto cambia algo, esa copia ya es la versión vieja y sigue circulando. Con el enlace, quien lo abra ve siempre lo último, queda claro dónde está el original y el acceso se puede revocar." },
      { check: [
        "Sube el archivo a su carpeta **antes** de compartirlo, no después de que te lo pidan dos veces.",
        "Comparte enlaces, no adjuntos, salvo que el destinatario no tenga acceso a Drive.",
        "Comprueba los permisos del enlace antes de enviarlo, sobre todo si sale del estudio.",
        "Un archivo, un sitio: si necesitas que esté en dos carpetas, enlázalo — no lo dupliques.",
      ] },
    ],
  },
  {
    id: "seguridad",
    icon: "🔒",
    title: "Seguridad y contraseñas",
    summary: "Dónde se guardan los accesos y qué nunca se comparte.",
    updated: "2026-06-18",
    min: 2,
    body: [
      { lead: "La seguridad es responsabilidad de todos. Usamos 1Password como gestor centralizado de contraseñas para proteger los accesos del estudio y de todas las marcas del ecosistema." },
      { ul: [
        "**Todos los accesos profesionales se guardan en 1Password**, no en notas, Slack o documentos personales.",
        "Cada persona tiene permisos específicos según su área y debe mantener su vault actualizado.",
        "**Está prohibido compartir contraseñas fuera de 1Password**, incluso por mensajes privados o email.",
      ] },
      { note: "Si algo falla o se pierde un acceso, **se comunica inmediatamente** al responsable del área o a dirección para resolverlo." },
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
    id: "clickup", name: "ClickUp", url: "https://clickup.com", tag: "Gestión", category: "Gestión y operativa",
    what: "El sistema nervioso de la operación: qué hay que hacer, quién lo hace y para cuándo. Da visibilidad de la carga, dependencias y estado real de cada proyecto.",
    when: ["Para toda tarea o proyecto (de un bug a una landing).", "Para planificar sprints, asignar responsables y marcar deadlines.", "Para seguimiento: bloqueos, entregas parciales, avances."],
    avoid: ["No es repositorio de archivos finales → eso es Drive.", "No es para conversaciones largas sin contexto.", "No sustituye reuniones: las prepara."],
  },
  {
    id: "drive", name: "Google Drive", url: "https://drive.google.com", tag: "Archivo", category: "Archivo y agenda", icon: "https://fonts.gstatic.com/s/i/productlogos/drive_2020q4/v8/web-96dp/logo_drive_2020q4_color_2x_web_96dp.png",
    what: "El archivo único del estudio: donde vive todo lo que generamos o recibimos. Acceso compartido, control de versiones y continuidad del trabajo.",
    when: ["Entregables, briefs, presentaciones, facturas o documentos de soporte.", "Enlaces compartidos con externos (en carpetas señalizadas)."],
    avoid: ["No es gestor de tareas → eso es ClickUp.", "No es disco personal: nada de copias sueltas.", "No es chat ni lugar para debatir."],
  },
  {
    id: "figma", name: "Figma", url: "https://figma.com", tag: "Diseño", category: "Diseño y producción",
    what: "Diseño colaborativo: landings, UI/UX, docs visuales y prototipos. Comentar, iterar y ver el diseño en vivo antes de producir. Centraliza componentes y guías.",
    when: ["Interfaces, prototipos navegables y documentos visuales.", "Piezas de contenido que requieran iteración rápida."],
    avoid: ["No es el almacén final de assets → eso es Drive.", "No sirve para retoque o animación avanzada → eso es Adobe.", "Evitar el lienzo infinito sin propósito."],
  },
  {
    id: "adobe", name: "Adobe Suite", url: "https://adobe.com", tag: "Gráfico · A/V", category: "Diseño y producción",
    what: "Soporte gráfico y audiovisual cuando Figma no llega. Photoshop (retoque, mockups), Illustrator (vectorial, identidades), After Effects (motion), Premiere (vídeo).",
    when: ["Cuando se requiere acabado gráfico, animación o vídeo fuera del alcance de Figma."],
    avoid: ["No sustituye el trabajo colaborativo de Figma en ideación.", "No es repositorio de versiones → los finales van a Drive.", "No se usa sin brief: toda pieza con tarea en ClickUp."],
  },
  {
    id: "slack", name: "Slack", url: "https://slack.com", tag: "Comunicación", category: "Gestión y operativa", icon: "https://a.slack-edge.com/80588/marketing/img/meta/app-256.png",
    what: "Nuestra comunicación interna: coordinar conversaciones rápidas, compartir actualizaciones y mantener la información visible para todos.",
    when: ["Comunicación diaria entre equipos y áreas.", "Avisos rápidos o coordinación puntual.", "Hilos por proyecto o departamento; anuncios generales."],
    avoid: ["No es gestor de tareas → las acciones viven en ClickUp.", "No sustituye Drive: los entregables no se adjuntan aquí.", "No abusar de los privados: mejor en canales abiertos."],
  },
  {
    id: "calendar", name: "Google Calendar", url: "https://calendar.google.com", tag: "Agenda", category: "Archivo y agenda", icon: "https://fonts.gstatic.com/s/i/productlogos/calendar_2020q4/v11/web-96dp/logo_calendar_2020q4_color_2x_web_96dp.png",
    what: "Agenda compartida del equipo: reuniones, status, eventos o disponibilidad. Evita solapamientos y mantiene visibilidad de agendas.",
    when: ["Reuniones internas o externas.", "Bloques de disponibilidad (focus time, vacaciones…).", "Eventos de empresa o formaciones."],
    avoid: ["No es gestor de tareas → eso es ClickUp.", "No se usa para guardar documentos ni tomar decisiones."],
  },
  {
    id: "1password", name: "1Password", url: "https://1password.com", tag: "Seguridad", category: "Seguridad",
    what: "Gestor centralizado de contraseñas para proteger los accesos del estudio y de todas las marcas del ecosistema.",
    when: ["Guardar y usar cualquier acceso profesional.", "Mantener tu vault actualizado según tus permisos de área."],
    avoid: ["Nunca guardar accesos en notas, Slack o email.", "Está prohibido compartir contraseñas fuera de 1Password."],
  },
  {
    id: "claude", name: "Claude", url: "https://claude.ai", tag: "IA · texto", category: "IA y creación",
    what: "Asistente de IA de Anthropic para redacción, análisis, síntesis y apoyo en código. Acelera tareas de texto y exploración de ideas.",
    when: ["Redactar, revisar y reescribir textos.", "Resumir, analizar o transformar contenido.", "Brainstorming y apoyo en documentación o código."],
    avoid: ["No compartir datos sensibles o de clientes sin permiso.", "Revisar y editar siempre lo que genera.", "No es fuente única de verdad."],
  },
  {
    id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com", tag: "IA · texto", category: "IA y creación",
    what: "Asistente de IA de OpenAI para texto, ideas, investigación rápida y código.",
    when: ["Generar borradores y variaciones de copy.", "Explorar enfoques o resolver dudas puntuales.", "Apoyo en tareas técnicas."],
    avoid: ["No compartir información confidencial.", "Contrastar datos: puede inventar.", "Revisar antes de usar."],
  },
  {
    id: "reve", name: "Reve", url: "https://reve.com", tag: "IA · imagen", category: "IA y creación",
    what: "Generación de imágenes con IA para conceptos visuales, moodboards y exploración creativa.",
    when: ["Generar imágenes y direcciones visuales.", "Explorar conceptos rápido antes de producir."],
    avoid: ["No sustituye el diseño/arte final.", "Cuidar consistencia de marca y derechos de uso."],
  },
  {
    id: "capcut", name: "CapCut", url: "https://www.capcut.com", tag: "Vídeo", category: "IA y creación",
    what: "Edición de vídeo ágil para redes y contenido: cortes, subtítulos, efectos y plantillas.",
    when: ["Montar vídeos para redes sociales.", "Subtítulos, recortes y retoques rápidos."],
    avoid: ["Piezas de marca complejas → Premiere / After Effects.", "Exportar en el formato y resolución acordados."],
  },
  {
    id: "higgsfield", name: "Higgsfield", url: "https://higgsfield.ai", tag: "IA · vídeo", category: "IA y creación", icon: "https://higgsfield.ai/icon.png",
    what: "Generación de vídeo e imagen con IA: planos, movimientos de cámara y piezas cortas a partir de un prompt o una imagen de referencia.",
    when: ["Explorar direcciones audiovisuales antes de producir.", "Piezas cortas y recursos de vídeo para redes.", "Animar una imagen fija o probar un movimiento de cámara."],
    avoid: ["No sustituye la producción real cuando la marca lo exige.", "Cuidar derechos de uso y consistencia de marca.", "Revisar siempre el resultado antes de publicar."],
  },
  {
    id: "elevenlabs", name: "ElevenLabs", url: "https://elevenlabs.io", tag: "IA · voz", category: "IA y creación",
    what: "Voz por IA: locución y doblaje sintético de calidad para vídeo, prototipos y contenido.",
    when: ["Locuciones para vídeo o prototipos.", "Pruebas de narración y voz."],
    avoid: ["Cuidar licencias y consentimiento de voz.", "No para usos engañosos o suplantación."],
  },
  {
    id: "raindrop", name: "Raindrop", url: "https://raindrop.io", tag: "Referencias", category: "Inspiración y referencias",
    what: "Gestor de marcadores del estudio: referencias, inspiración y enlaces útiles, organizados por colecciones.",
    when: ["Guardar inspiración y referencias por área.", "Compartir enlaces útiles con el equipo."],
    avoid: ["No es archivo de entregables → eso es Drive.", "No sustituye la documentación de proyecto."],
  },
];

// ── Clientes de F*cts ────────────────────────────────────────────────────────
// F*cts da servicio a sus clientes. Unfiltrade® es el holding (cliente
// principal) y, dentro de su ecosistema, sus proyectos. Lista plana.
export const CLIENTS = [
  {
    id: "unfiltrade", name: "Unfiltrade®", tagline: "Holding · cliente principal",
    desc: "Holding al que damos servicio integral: estrategia, comunicación, diseño y desarrollo de producto.",
    links: [], head: "Por definir", drive: "", brandbook: "",
  },
  {
    id: "tradinglab", name: "TradingLab", tagline: "Trading sin filtros",
    desc: "Academia de trading en español: estrategias validadas, mentorías en vivo, psicología y comunidad de +3.000 alumnos.",
    links: [{ label: "Web", url: "https://tradinglab.es" }],
    head: "Por definir", drive: "", brandbook: "",
  },
  {
    id: "tradingmind", name: "TradingMind", tagline: "Tu mente, tu mayor activo",
    desc: "Academia centrada en la mente del trader: gestión emocional, psicología y estrategia con psicólogos y traders.",
    links: [{ label: "Web", url: "https://www.tradingmind.es" }],
    head: "Por definir", drive: "", brandbook: "",
  },
  {
    id: "flickflow", name: "Flickflow", tagline: "Datos financieros filtrados por IA",
    desc: "Plataforma de inteligencia de mercado en tiempo real: gráficos, eventos económicos y asistente de IA (cripto, acciones, forex).",
    links: [{ label: "Web", url: "https://flickflow.com" }],
    head: "Por definir", drive: "", brandbook: "",
  },
  {
    id: "benchmark", name: "The Benchmark", tagline: "Sin humo, sin ruido, sin postureo",
    desc: "Newsletter semanal de análisis financiero de Alex Ruiz: claro, útil y con criterio.",
    links: [{ label: "Web", url: "https://thebenchmark.es" }],
    head: "Por definir", drive: "", brandbook: "",
  },
  {
    id: "alexruiz", name: "Alex Ruiz", tagline: "Marca personal · CEO",
    desc: "Divulgación y análisis de trading y mercados financieros. Figura destacada del sector.",
    links: [{ label: "YouTube", url: "https://www.youtube.com/@AlexRuiiz" }],
    head: "Por definir", drive: "", brandbook: "",
  },
];
