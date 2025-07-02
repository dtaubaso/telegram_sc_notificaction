# Notificación de tráfico diaria a Telegram

Esta función de Google Apps Script envía una notificación diaria a Telegram con el tráfico de Search Console de un sitio.

Para ello:

Extrae datos de los últimos 28 días.

Toma el día anterior y lo compara con el promedio de los mismos días de la semana anteriores

Detectar cambios (aumento o caída).

Generar un mensaje con el resumen de tráfico y un gráfico.

## Pasos previos:

Cuenta de Google con acceso a Search Console.

Crear un bot en Telegram y obtener el token.

Crear una hoja de cálculo de Google (opcional, si se desea registrar datos).

Acceso a Google Cloud Console para crear un proyecto y una cuenta de servicio.

## Crear el bot de Telegram:

Ir a @BotFather en Telegram.

Usar el comando /newbot.

Elegir nombre y username.

Guardar el token que entrega BotFather.

Obtener el chat ID:

Agregar el bot como contacto.

Enviar un mensaje.

Visitar: https://api.telegram.org/bot<token>/getUpdates para ver el chat_id.

## Crear cuenta de servicio en Google Cloud

Ir a console.cloud.google.com.

Crear un proyecto nuevo.

Activar la API de Search Console.

Ir a “IAM y administración > Cuentas de servicio”.

Crear una cuenta de servicio y generar una clave JSON.

Compartir el Search Console con esa cuenta (desde Search Console > Configuración > Usuarios y permisos).

## Copiar el script en Google Apps Script

Ir a script.google.com.

Crear nuevo proyecto.

Cargar las claves como propiedades del script:
