# Jandosoft CLI

CLI oficial de **Jandosoft** — Gestiona tu plataforma directamente desde la terminal con un menu interactivo navegable con las flechas del teclado.

## Instalacion

```bash
# Desde la raiz del proyecto
npm run setup
```

Esto instala las dependencias del CLI y crea el enlace global para que puedas ejecutar `jandosoft` desde cualquier lugar.

## Uso Interactivo

```bash
jandosoft
```

Menu navegable con **↑ ↓** y seleccionas con **Enter**:

```
●  Mi Perfil              usuario@email.com
●  Mis Tiendas
●  Organización
─────────────────────────────────────
◆  AI Chat                 IA de Jandosoft
◆  Conversaciones          historial
─────────────────────────────────────
◆  Estado del Servidor
◆  Configuración
─────────────────────────────────────
◆  Cerrar Sesión
─────────────────────────────────────
◆  Salir
```

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `jandosoft` | Menu interactivo |
| `jandosoft login` | Iniciar sesion |
| `jandosoft me` | Mostrar perfil |
| `jandosoft stores` | Listar tiendas |
| `jandosoft stores create --name "..."` | Crear tienda |
| `jandosoft org` | Mostrar organizacion |
| `jandosoft chat` | Chatear con la IA de Jandosoft |
| `jandosoft conversations` | Ver historial de conversaciones |
| `jandosoft status` | Estado del servidor |
| `jandosoft config` | Ver configuracion local |
| `jandosoft logout` | Cerrar sesion |

## AI Chat

El comando `jandosoft chat` inicia una sesion interactiva con la inteligencia artificial de Jandosoft. Escribe `/exit` para salir.

```bash
jandosoft chat
```

El historial de la conversacion se mantiene en memoria durante la sesion, permitiendo que la IA recuerde el contexto de mensajes anteriores.

## Requisitos

- Node.js >= 18.0.0

## Estructura

```
cli/
├── bin/jandosoft.js
├── src/
│   ├── index.js              # CLI con menu interactivo
│   ├── commands/
│   │   ├── login.js
│   │   ├── me.js
│   │   ├── stores.js
│   │   ├── org.js
│   │   ├── chat.js           # AI Chat interactivo
│   │   ├── conversations.js  # Historial de conversaciones
│   │   └── status.js
│   └── lib/
│       ├── api.js            # Cliente HTTP
│       └── config.js         # Config local ~/.jandosoft/
├── package.json
└── README.md
```

## Sesion

El CLI guarda tu sesion en `~/.jandosoft/config.json`. Para cerrar sesion usa `jandosoft logout` o la opcion del menu.
