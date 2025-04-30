# 📊 Backend para aplicación gestión financiera de autónomos

Este es el backend de una aplicación de gestión financiera que permite a los usuarios administrar sus facturas, ingresos, gastos y clientes. Proporciona una API REST construida con **Node.js**, **Express** y **PostgreSQL**.

---

## 🚀 Tecnologías Usadas

- **Node.js** - Entorno de ejecución de JavaScript en el servidor.
- **Express.js** - Framework para construir APIs REST.
- **PostgreSQL** - Base de datos relacional para almacenar la información.
- **jsonwebtoken (JWT)** - Para autenticación segura.
- **bcryptjs** - Para encriptar contraseñas.
- **pg** - Cliente de PostgreSQL para Node.js.
- **dotenv** - Para gestionar variables de entorno.

---

## ⚙️ Instalación y Configuración

### 1️⃣ **Clonar el Repositorio**

```sh
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
```

### 2️⃣ **Instalar Dependencias**

npm install

### 3️⃣ **Configurar Variables de Entorno**

PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_de_tu_base_de_datos
DB_PORT=5432
JWT_SECRET=tu_clave_secreta

### 4️⃣ **Ejecutar el Servidor**

Modo desarrollo: npm run dev

Modo producción: npm start

### 5️⃣ **Endpoints Principales**

🧾 Facturas
Método Endpoint Descripción
POST /api/facturas Crear una factura
GET /api/facturas?page=1&limit=10 Obtener facturas paginadas
GET /api/facturas/:id Obtener una factura específica
PUT /api/facturas/:id Actualizar una factura
DELETE /api/facturas/:id Eliminar una factura

💰 Gastos
Método Endpoint Descripción
POST /api/gastos Registrar un gasto
GET /api/gastos?page=1&limit=10 Obtener gastos paginados
PUT /api/gastos/:id Actualizar un gasto
DELETE /api/gastos/:id Eliminar un gasto

📈 Ingresos
Método Endpoint Descripción
POST /api/ingresos Registrar un ingreso
GET /api/ingresos?page=1&limit=10 Obtener ingresos paginados
PUT /api/ingresos/:id Actualizar un ingreso
DELETE /api/ingresos/:id Eliminar un ingreso

🧑‍💼 Clientes
Método Endpoint Descripción
POST /api/clientes Registrar un cliente
GET /api/clientes?page=1&limit=10 Obtener clientes paginados
PUT /api/clientes/:id Actualizar un cliente
DELETE /api/clientes/:id Eliminar un cliente

### 6️⃣ **Estructura del Proyecto**

📂 faktuflow-back/
├── 📂 src/
│ ├── 📂 controllers/ # Controladores de cada entidad
│ ├── 📂 middlewares/ # Middleware de autenticación y validación
│ ├── 📂 routes/ # Rutas de la API
├── db/ # Configuración de base de datos y entorno
├── .env # Variables de entorno
├── package.json # Dependencias y scripts
├── README.md # Documentación del proyecto

### 7️⃣ **📩 Contacto**

---

Si tienes dudas o sugerencias, contáctame en: 29jbarrera@gmail.com
🎉 Si quieres cambiar algo, dime y lo ajustamos. 🚀

---

### 📌 ¿Qué incluye este README?

✅ Explicación del proyecto  
✅ Instalación y configuración  
✅ Endpoints
✅ Organización del código
