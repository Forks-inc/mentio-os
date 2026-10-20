# Ágora

Inteligencia política: lo que se dice de tus candidatos, medido y priorizado. Ágora ayuda a los equipos de campaña a analizar la conversación pública sobre sus candidaturas, adversarios y temas de agenda con métricas de participación de voz, sentimiento, relevancia e intención.

La aplicación obtiene los datos mediante una API pública y no usa una base de datos propia. Para probarla con información simulada, ejecuta:

```bash
npm install
npm run demo
```

Para conectarla a un espacio de trabajo, configura `MENTIO_API_KEY` en `.env.local` y ejecuta:

```bash
npm run dev
```

También puedes definir `DASHBOARD_PASSWORD` para proteger el acceso al panel. La contraseña se valida en el servidor.

## Desarrollo

- `npm run typecheck`: revisa los tipos de TypeScript.
- `npm run build`: genera la aplicación para producción.
- `npm run start`: inicia la aplicación compilada.

La marca, el color de acento y la descripción se configuran en `src/brand.config.ts`. La licencia del proyecto es MIT.
