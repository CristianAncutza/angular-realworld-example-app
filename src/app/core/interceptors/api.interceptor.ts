import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Si ya viene con http, no la tocamos
  if (req.url.startsWith('http')) {
    return next(req);
  }

  // 2. Forzamos la base limpia de tu backend
  const baseUrl = environment.api_url || 'http://localhost:5001/api';

  // 3. Nos aseguramos de que siempre se inserte el '/' intermedio correctamente
  const urlFixed = req.url.startsWith('/') ? `${baseUrl}${req.url}` : `${baseUrl}/${req.url}`;

  const apiReq = req.clone({ url: urlFixed });
  return next(apiReq);
};
