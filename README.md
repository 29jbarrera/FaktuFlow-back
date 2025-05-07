# 📊 **Backend – Gestión Financiera Faktuflow**

Este es el backend del software Faktuflow que permite a los usuarios administrar sus facturas, ingresos, gastos y clientes. Proporciona una API REST construida con **Node.js**, **Express** y **PostgreSQL**.

---

## 🚀 **Tecnologías Usadas**

- **Node.js** – Entorno de ejecución de JavaScript en el servidor.
- **Express.js** – Framework para construir APIs REST.
- **PostgreSQL** – Base de datos relacional para almacenar la información.
- **jsonwebtoken (JWT)** – Para autenticación segura.
- **bcryptjs** – Para encriptar contraseñas.
- **pg** – Cliente de PostgreSQL para Node.js.
- **dotenv** – Para gestionar variables de entorno.

---

## 📡 **Endpoints Principales**

### 🧾 **Facturas**

| Método     | Endpoint            | Descripción                |
| ---------- | ------------------- | -------------------------- |
| **POST**   | `/api/facturas`     | Crear una nueva factura    |
| **GET**    | `/api/facturas`     | Obtener facturas paginadas |
| **GET**    | `/api/facturas/:id` | Obtener una factura por ID |
| **PUT**    | `/api/facturas/:id` | Actualizar una factura     |
| **DELETE** | `/api/facturas/:id` | Eliminar una factura       |

### 💰 **Gastos**

| Método     | Endpoint          | Descripción              |
| ---------- | ----------------- | ------------------------ |
| **POST**   | `/api/gastos`     | Registrar un gasto       |
| **GET**    | `/api/gastos`     | Obtener gastos paginados |
| **PUT**    | `/api/gastos/:id` | Actualizar un gasto      |
| **DELETE** | `/api/gastos/:id` | Eliminar un gasto        |

### 📈 **Ingresos**

| Método     | Endpoint            | Descripción                |
| ---------- | ------------------- | -------------------------- |
| **POST**   | `/api/ingresos`     | Registrar un ingreso       |
| **GET**    | `/api/ingresos`     | Obtener ingresos paginados |
| **PUT**    | `/api/ingresos/:id` | Actualizar un ingreso      |
| **DELETE** | `/api/ingresos/:id` | Eliminar un ingreso        |

### 🧑‍💼 **Clientes**

| Método     | Endpoint            | Descripción                |
| ---------- | ------------------- | -------------------------- |
| **POST**   | `/api/clientes`     | Registrar un cliente       |
| **GET**    | `/api/clientes`     | Obtener clientes paginados |
| **PUT**    | `/api/clientes/:id` | Actualizar un cliente      |
| **DELETE** | `/api/clientes/:id` | Eliminar un cliente        |

---

## 6️⃣ **Estructura del Proyecto**

```
faktuflow-back/
│
├── 📂 src/
│ ├── 📂 controllers/ # Lógica de negocio de cada módulo
│ ├── 📂 middlewares/ # Middlewares de autenticación y validación
│ ├── 📂 routes/ # Definición de rutas por entidad
│
├── 📂 db/ # Configuración de la base de datos
├── .env # Variables de entorno (excluidas del repositorio)
├── README.md # Documentación del proyecto
```

---

## 7️⃣ **📩 Contacto**

Si tienes dudas o sugerencias, contáctame en: **javierbarreralopez97@gmail.com**  
🎉 Si quieres cambiar algo, dime y lo ajustamos. 🚀

---

### 📌 **¿Qué incluye este README?**

- ✅ Descripción del proyecto
- ✅ Tecnologías utilizadas
- ✅ Endpoints disponibles
- ✅ Estructura del código
- ✅ Información de contacto
