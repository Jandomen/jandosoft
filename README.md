# 🚀 Jandosoft

**Tu sistema operativo de negocios todo-en-uno.**  
Plataforma SaaS multi-inquilino para gestionar tiendas online, equipos, pagos, IA, automatizaciones y más — construida con Next.js 16.

---

## ✨ Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| 🏪 **Tiendas** | Creación y gestión de tiendas digitales, productos, servicios, clientes y pedidos |
| 🤖 **Asistente IA** | Chat inteligente con IA por tienda (OpenAI / OpenRouter) + widget público para visitantes |
| 💳 **Pagos** | Stripe Connect (tarjeta), criptomonedas vía NOWPayments, facturas PDF |
| 👥 **Equipos** | Organizaciones multi-miembro con roles (owner, admin, member) |
| 📊 **Analíticas** | Seguimiento de visitas, páginas vistas y actividad por tienda |
| 🔌 **Integraciones** | Telegram, Discord, Slack, WhatsApp, Twilio, redes sociales, OpenAI |
| 🎨 **Builder Visual** | Editor drag-and-drop + generador de formularios |
| 📅 **Reservas** | Sistema de agendamiento de citas con calendario |
| 📨 **Mensajería** | Chat interno entre usuarios del sistema con SSE en tiempo real |
| 📢 **Campañas** | Panel de campañas de marketing automatizadas |
| 📄 **Facturación** | Generación y almacenamiento de facturas en PDF |
| 🛡️ **Planes** | Free, Basic y Enterprise con límites por tienda y producto |
| 🔐 **Auth** | Registro/login con JWT, cookies httpOnly, bcrypt, roles por organización |
| 🖥️ **Panel Admin** | Dashboard global con usuarios, tiendas, ingresos y actividad en vivo |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript |
| **UI** | React 19 + Tailwind CSS v4 |
| **Animación** | Framer Motion |
| **Base de Datos** | MongoDB + Mongoose 9 |
| **Autenticación** | JWT + bcryptjs + cookies |
| **IA** | OpenAI SDK, OpenRouter (DeepSeek, GPT-4o-mini) |
| **Pagos** | Stripe (Checkout, Connect, Webhooks), NOWPayments |
| **Archivos** | Cloudinary |
| **PDF** | jsPDF |
| **Formularios** | react-hook-form + zod |
| **Drag & Drop** | @dnd-kit |
| **Iconos** | lucide-react |

---

## 📦 Empezando

```bash
# 1. Clonar el repositorio
git clone https://github.com/tuusuario/jandosoft.git
cd jandosoft

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales (MongoDB, Stripe, Cloudinary, etc.)

# 4. Iniciar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🌐 Variables de Entorno

```env
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
NOWPAYMENTS_API_KEY=
ADMIN_USER=
ADMIN_PASSWORD=
```

---

## 📁 Estructura del Proyecto

```
jandosoft/
├── app/               # Rutas API, páginas públicas y layout
├── components/        # Componentes React (admin, builder, chat, store, etc.)
├── lib/               # Modelos MongoDB, auth, stripe, AI, utilerías
├── public/            # Archivos estáticos
└── .antigravitycli/   # (herramienta de desarrollo)
```

---

## 🧪 Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta ESLint |

---

## 📄 Licencia

Todos los derechos reservados © Jandosoft.
