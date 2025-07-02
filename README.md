# 🚀 Notificación diaria de tráfico a Telegram

![image](https://github.com/user-attachments/assets/e525158f-95d3-4707-a24b-626a64f3f1f7)

Este script de **Google Apps Script** envía automáticamente todos los días una **notificación a Telegram** con el tráfico web de tu sitio extraído desde **Google Search Console**.  
Incluye **un resumen textual + un gráfico** comparativo.

---

## 🔍 ¿Qué hace este script?

- 📊 Extrae datos de los últimos **28 días** desde Search Console.
- 📅 Compara el día anterior con el **promedio de los mismos días** en semanas previas.
- 🔁 Detecta variaciones: **aumentos** o **caídas** de tráfico.
- 📈 Genera y envía un **mensaje + gráfico** por Telegram.

---

## ✅ Requisitos previos

1. Una cuenta de Google con acceso al **Search Console** del sitio.
2. Un bot de **Telegram** creado con su token.
3. Una hoja de cálculo de Google *(opcional, para registro de datos)*.
4. Acceso a **Google Cloud Console** para crear un proyecto y una cuenta de servicio.

---

## 🤖 Crear el bot de Telegram

1. Abrí Telegram y buscá [@BotFather](https://t.me/BotFather).
2. Enviá el comando `/newbot`.
3. Elegí un nombre y un `username` único.
4. Guardá el **token** que te entrega.
5. Obtené tu `chat_id`:
   - Agregá el bot como contacto.
   - Enviá un mensaje.
   - Visitá:  
     ```
     https://api.telegram.org/bot<TU_TOKEN>/getUpdates
     ```
     y copiá el `chat_id`.

---

## ☁️ Crear cuenta de servicio en Google Cloud

1. Ir a [console.cloud.google.com](https://console.cloud.google.com/).
2. Crear un nuevo proyecto.
3. Activar la **API de Search Console**.
4. Ir a:  
   `IAM y administración > Cuentas de servicio`.
5. Crear una cuenta de servicio y generar una clave **JSON**.
6. Compartir el Search Console con esa cuenta desde:  
   `Search Console > Configuración > Usuarios y permisos`.

---

## 📥 Configurar Google Apps Script

1. Ir a [script.google.com](https://script.google.com).
2. Crear un nuevo proyecto.
3. Pegar el código del script.
4. Cargar las claves como propiedades del script (por ejemplo, usando `PropertiesService`).


---

## ⏰ Automatizar el envío diario (trigger)

1. Dentro del proyecto de **Apps Script**, hacé clic en el menú 🕒 `Reloj` (Triggers).
2. Crear un nuevo trigger (botón inferior derecha ➕).
3. Elegir:
   - **Función**: `main` (o el nombre de tu función principal).
   - **Frecuencia**: `Tiempo basado > Día > Todos los días`.
   - **Hora sugerida**: Temprano por la mañana o según tu huso horario.

> 💡 Recordá que Apps Script usa el huso horario del proyecto. Podés ajustarlo desde:  
> `Archivo > Propiedades del proyecto > Zona horaria`.

---
