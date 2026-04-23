// Stockage en mémoire partagé entre toutes les instances du navigateur
const sharedStorage = {
  users: {
    client: [],
    seller: []
  }
};

/**
 * Vite middleware pour gérer l'API d'authentification partagée
 * Permet au mobile preview et au navigateur de partager les mêmes données
 */
export function createAuthMiddleware() {
  return (req, res, next) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Routes API pour la gestion partagée des utilisateurs
    if (url.pathname === '/__api__/auth/users') {
      if (req.method === 'GET') {
        // Récupérer tous les utilisateurs
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sharedStorage.users));
        return;
      }
      
      if (req.method === 'POST') {
        // Mettre à jour les utilisateurs
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            sharedStorage.users = data;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }
    }
    
    next();
  };
}
