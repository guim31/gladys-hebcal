# Calendario hebreo

El calendario judío de su hogar en Gladys: la fecha hebrea, el Shabat y las festividades, las horas de
encendido de velas y de havdalá, la parashá de la semana, el Ómer y los principales zmanim. Como sensores
para el panel y las condiciones de las escenas, y como activadores de escena: atenuar las luces al encender
las velas, apagar el despertador las mañanas de Shabat y de festividad, recibir un aviso una hora antes del
Shabat.

- **Calculado en su hogar**, con el motor de [hebcal.com](https://www.hebcal.com) (`@hebcal/core`): sin
  cuenta, sin acceso a Internet, nada sale de su Gladys.
- **Israel o diáspora**: uno o dos días de festividad, y la parashá correspondiente.
- **Las costumbres de su comunidad**: minutos de encendido antes de la puesta del sol (18, 40 en
  Jerusalén…) y fin del Shabat (8,5° o 42, 50, 72 minutos).

> Probada con su batería de pruebas automáticas contra los horarios publicados por hebcal.com (París,
> Jerusalén, Nueva York, de 2025 a 2027), todavía no en muchas instalaciones reales de Gladys: sus
> comentarios son bienvenidos en el foro de Gladys o en los issues de GitHub. Los horarios son
> orientativos: siga a su rabino para las decisiones halájicas.

## Qué necesita

- Gladys Assistant 5.1.0 o posterior.
- Una vivienda con sus coordenadas en Gladys (**Configuración → Viviendas**): los horarios dependen de la
  posición de la vivienda.
- La zona horaria correcta en Gladys (**Configuración → Sistema**): todas las horas se calculan y se
  muestran en ella.

## Configuración

Instale la integración (**Integraciones → Instalar desde GitHub**, dirección
`https://github.com/guim31/gladys-hebcal`), abra su pestaña **Configuración**, compruebe los campos
siguientes y guarde. Después abra la pestaña **Descubrir** y añada el dispositivo **Calendario hebreo**.

### Vivienda y zona horaria

La integración toma la primera vivienda de Gladys que tiene coordenadas. Si no hay ninguna, la página de la
integración lo indica y la integración vuelve a intentarlo cada 10 minutos. Tras mover la vivienda, reinicie
la integración (o guarde su configuración) para recalcular los horarios enseguida.

### Israel o diáspora

**Automático** elige Israel cuando la zona horaria de Gladys es `Asia/Jerusalem`, y la diáspora en otro
caso. Elija explícitamente si su comunidad sigue el otro calendario.

### Encendido de velas y havdalá

- **Encendido de velas: minutos antes de la puesta del sol**: 18 por defecto. Jerusalén usa 40, Haifa 30,
  Tel Aviv 20; algunas comunidades 15, 20 o 22.
- **Fin del Shabat y de las festividades**: la hora de la havdalá y el fin del Shabat para el dispositivo y
  los activadores. El sol a 8,5° bajo el horizonte (tres estrellas pequeñas, valor por defecto de
  hebcal.com), o 42, 50 o 72 minutos tras la puesta del sol (72: Rabenu Tam).

### Nombres e idioma

- **Idioma de los textos**: los nombres de los sensores, los horarios y los textos de los eventos y de la
  acción de escena (francés por defecto). Los nombres de los sensores se fijan al añadir el dispositivo:
  tras un cambio, elimine el dispositivo y vuelva a añadirlo para renombrarlos. El widget sigue el idioma de
  la persona que lo mira.
- **Nombres de las festividades y los meses**: los nombres habituales del idioma («Pésaj», «Sucot», «Rosh
  Hashaná»; la transliteración cuando no los hay, como para la mayoría de las parashiot), la
  transliteración de hebcal.com (sefardí: «Shavuot»), la asquenazí («Shavuos»), o la escritura hebrea.

## El dispositivo calendario

| Sensor                           | Valor                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| Fecha hebrea                     | «9 Jeshván 5787». Cambia con la puesta del sol, como el día hebreo                 |
| Festividad de hoy                | La festividad, Rosh Jódesh, el ayuno o el día de Janucá («Janucá 3/8»), «Ninguna»  |
| Shabat o festividad en curso     | Encendido del encendido de velas a la havdalá (Shabat, Yom Kipur, días de yom tov) |
| Shabat o festividad mañana       | Encendido cuando el día de mañana es Shabat o un día de yom tov                    |
| Próximo encendido de velas       | «vie, 23 oct, 18:27»                                                               |
| Próxima havdalá                  | «sáb, 24 oct, 19:32»                                                               |
| Porción semanal de la Torá       | La parashá del próximo Shabat, o la festividad que se lee en su lugar              |
| Cuenta del Ómer                  | El día del Ómer (1 a 49), 0 fuera de la cuenta. Cambia con la puesta del sol       |
| Días hasta la próxima festividad | Días hasta el próximo día de yom tov (0 el mismo día)                              |

Cada valor lo envía la integración cuando cambia (con la puesta del sol, el encendido de velas, la havdalá)
y se vuelve a publicar cada 12 horas: no hay nada que consultar. Los días consecutivos (una festividad
seguida del Shabat, los dos días de una festividad en la diáspora) forman un único periodo.

## Widget del panel

**Calendario hebreo** muestra la fecha hebrea, el Shabat o la festividad en curso con su fin, el próximo
encendido de velas y la próxima havdalá, el día del Ómer, la parashá, la festividad del día, la próxima
festividad y, salvo que lo desactive en sus ajustes, los zmanim del día: alba (alot hashajar, 16,1°),
salida del sol, último Shemá (Gra), mediodía (jatzot), puesta del sol y anochecer (tzet, 8,5°).

## Activadores de escena

- **Encendido de velas**: a la hora del encendido, o 10, 15, 30 minutos, 1 o 2 horas antes (campo
  **Cuándo**, obligatorio). También la segunda noche de una festividad, al anochecer. Variables: minutos
  antes, tipo (`shabbat` o `holiday`), nombre, hora (ISO) y hora local.
- **Comienza el Shabat o una festividad**: al encender las velas, una sola vez para días consecutivos.
  Variables: tipo, nombre, incluye un Shabat, fin (ISO) y fin en hora local.
- **Termina el Shabat o una festividad**: a la hora de la havdalá, cuando termina el último de los días
  consecutivos. Variables: tipo, nombre, incluye un Shabat.

El filtro **Shabat o festividad** conserva un solo tipo (vacío: ambos). Un Shabat que también es festividad,
y un periodo que mezcla ambos, cuentan como festividad.

## Acción de escena «Información del día»

Pasa la información de hoy o de mañana (campo **Día**, vacío: hoy) a las acciones siguientes: fecha, fecha
hebrea, festividad, **Shabat o festividad (1 = sí, 0 = no)**, encendido de velas y havdalá de ese día,
parashá, día del Ómer, salida del sol, último Shemá, puesta del sol y anochecer (horas locales, vacías
cuando el día no las tiene). Compruebe el valor 1/0 con un paso **Condición sobre variables**.

## Ejemplos de escenas

- **Luces de Shabat**: activador **Comienza el Shabat o una festividad** → encender el comedor, calefacción
  en confort; **Termina el Shabat o una festividad** → vuelta a la normalidad.
- **Aviso**: activador **Encendido de velas**, **Cuándo** = 1 hora antes → enviar el mensaje «Encendido a
  las {{triggerEvent.data.local_time}}».
- **Sin despertador en Shabat**: a las 21:00, acción **Información del día** con **Día** = mañana, y luego
  una **Condición sobre variables**: «Shabat o festividad» igual a 0 → programar el despertador.
- **Condición**: en cualquier escena, la condición «Shabat o festividad en curso» en Apagado impide que la
  escena se ejecute durante el Shabat.

## Solución de problemas

- **«Ninguna vivienda con coordenadas»**: indique la latitud y la longitud de una vivienda en
  **Configuración → Viviendas**; la integración las tiene en cuenta en menos de 10 minutos.
- **Horarios desplazados una hora**: compruebe la zona horaria de Gladys en **Configuración → Sistema**.
- **Nombres de los sensores en el idioma equivocado**: los nombres se fijan al añadir el dispositivo;
  elimine el dispositivo y vuelva a añadirlo tras cambiar el idioma.
- **Un activador llegó tarde o no llegó tras un reinicio**: un evento previsto mientras la integración
  estaba detenida se envía al reanudarse si es dentro de los 15 minutos, nunca más tarde y nunca dos veces.

## Límites

- Los horarios se calculan para las coordenadas de la vivienda, al nivel del mar, como hebcal.com por
  defecto.
- Cerca de los polos, donde el sol no se pone o no baja a 8,5°, pueden faltar el encendido o la havdalá: no
  se indica entonces ningún periodo de Shabat.
- Los avisos antes del encendido son fijos (10, 15, 30 minutos, 1 o 2 horas).
- Una sola vivienda: la primera vivienda de Gladys que tiene coordenadas.

## Créditos

Calendario, horarios y parashiot: [@hebcal/core](https://github.com/hebcal/hebcal-es6) de Michael J. Radwin
y los colaboradores de hebcal (GPL-2.0-or-later), el motor de hebcal.com. La integración `jewish_calendar`
de Home Assistant inspiró los sensores. Esta integración no está afiliada a hebcal.com. Se publica bajo la
licencia GPL-3.0-or-later.
