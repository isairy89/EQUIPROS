import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { DatabaseRepository } from './src/db/repository.ts';
import { seedDatabaseIfNeeded, resetDatabaseToDefault } from './src/db/seed.ts';
import { authIsConfigured, login, logout, requireAuth, verifySessionToken } from './src/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = express();

  // La aplicación se sirve en el mismo origen. Solo habilite orígenes adicionales explícitamente.
  app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : false, credentials: true }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // El seed solo se permite explícitamente en entornos nuevos; nunca al arrancar producción.
  if (process.env.ALLOW_INITIAL_SEED === 'true') {
    seedDatabaseIfNeeded().catch((err) => console.warn('Database seed notice:', err?.message || err));
  }

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', database: 'configured', authConfigured: authIsConfigured(), timestamp: new Date().toISOString() });
  });

  app.post('/api/auth/login', login);
  app.post('/api/auth/logout', requireAuth, logout);
  app.get('/api/auth/session', (req, res) => {
    // Reusa el middleware sin exponer secretos ni tokens.
    requireAuth(req, res, () => res.json({ username: (req as any).session.sub, role: 'admin' }));
  });

  // ==========================================
  // SINCRONIZACIÓN EN TIEMPO REAL (Server-Sent Events)
  // Permite que las 4 PCs vean los cambios de las demás sin recargar.
  // EventSource no puede enviar el header Authorization, por eso el token viaja por query string.
  // ==========================================
  const sseClients = new Set<Response>();

  function broadcastDataChanged(): void {
    for (const client of sseClients) {
      client.write('data: refresh\n\n');
    }
  }

  app.get('/api/events', (req: Request, res: Response) => {
    const session = verifySessionToken(req.query.token as string | undefined);
    if (!session) {
      res.status(401).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 2000\n\n');
    sseClients.add(res);
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  app.use('/api', requireAuth);

  // Notifica a las demás PCs conectadas después de cualquier escritura exitosa (POST/PATCH/DELETE).
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
        broadcastDataChanged();
      }
    });
    next();
  });

  // Estado inicial completo (Bootstrap rápido)
  app.get('/api/initial-state', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await DatabaseRepository.getFullInitialState();
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // Migración desde LocalStorage
  app.post('/api/migrate-local-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await DatabaseRepository.migrateFromLocalStorage(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // Restablecer base de datos a datos iniciales
  app.post('/api/reset-data', async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.ALLOW_DATA_RESET !== 'true') {
      return res.status(403).json({ error: 'El restablecimiento está deshabilitado en este entorno.' });
    }
    try {
      await resetDatabaseToDefault();
      const data = await DatabaseRepository.getFullInitialState();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // --- Clientes ---
  app.get('/api/clientes', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DatabaseRepository.getClientes();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/clientes', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveCliente(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/clientes/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteCliente(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // --- Minas ---
  app.get('/api/minas', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DatabaseRepository.getMinas();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/minas', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveMina(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/minas/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteMina(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // --- Servicios ---
  app.get('/api/servicios', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DatabaseRepository.getServicios();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/servicios', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveServicio(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/servicios/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteServicio(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // --- Precios por Cliente ---
  app.get('/api/precios-cliente', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DatabaseRepository.getPreciosCliente();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/precios-cliente', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.savePrecioCliente(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/precios-cliente/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deletePrecioCliente(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // --- Empleados ---
  app.get('/api/empleados', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DatabaseRepository.getEmpleados();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/empleados', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveEmpleado(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/empleados/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteEmpleado(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // --- Equipos y Vehículos ---
  app.get('/api/equipos', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DatabaseRepository.getEquiposVehiculos();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/equipos', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DatabaseRepository.saveEquipoVehiculo(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/equipos/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteEquipoVehiculo(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // --- Conduces ---
  app.get('/api/conduces', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DatabaseRepository.getConduces();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/conduces', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveConduce(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/conduces/:id/facturacion', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.updateEstadoFacturacion(req.params.id, req.body?.estado);
      res.json({ success: true });
    } catch (err) { next(err); }
  });

  app.delete('/api/conduces/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteConduce(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // --- Gasoil ---
  app.get('/api/gasoil/config', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await DatabaseRepository.getConfiguracionGasoil();
      res.json(config);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/gasoil/config', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveConfiguracionGasoil(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/gasoil/compras', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const compras = await DatabaseRepository.getComprasGasoil();
      res.json(compras);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/gasoil/compras', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveCompraGasoil(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/gasoil/compras/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteCompraGasoil(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/gasoil/despachos', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const despachos = await DatabaseRepository.getDespachosGasoil();
      res.json(despachos);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/gasoil/despachos', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveDespachoGasoil(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/gasoil/despachos/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteDespachoGasoil(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/gasoil/conteos', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conteos = await DatabaseRepository.getConteosGasoil();
      res.json(conteos);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/gasoil/conteos', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await DatabaseRepository.saveConteoGasoil(req.body);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/gasoil/conteos/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await DatabaseRepository.deleteConteoGasoil(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // Central Error Handler for API
  app.use('/api', (err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error(`API Error on ${req.method} ${req.path}:`, err);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
      error: err.message || 'Ocurrió un error interno en la base de datos.',
    });
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // En desarrollo __dirname es la raíz; en el bundle compilado es dist/.
    const staticDir = existsSync(path.resolve(__dirname, 'index.html')) ? __dirname : path.resolve(__dirname, 'dist');
    app.use(express.static(staticDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(staticDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EQUIPROCI Full-Stack Server running at http://0.0.0.0:${PORT} [mode: ${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
