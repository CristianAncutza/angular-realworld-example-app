import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  debugger; // <-- Se detendrá aquí en cada petición

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 404) {
        toastr.error('El recurso solicitado no existe.', 'Error 404');
      }
      if (error.status === 401) {
        toastr.error('No autorizado.', 'Error 401');
      }
      return throwError(() => error);
    }),
  );
};
