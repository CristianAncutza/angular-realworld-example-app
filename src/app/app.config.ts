import {
  ApplicationConfig,
  effect,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { JwtService } from './core/auth/services/jwt.service';
import { UserService, AuthState } from './core/auth/services/user.service';

import { tokenInterceptor } from './core/interceptors/token.interceptor';

import { EMPTY } from 'rxjs';
import { User } from './core/auth/user.model';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideToastr } from 'ngx-toastr';

/**
 * Debug interface for testing - exposes app state in a framework-agnostic way.
 * Tests can use this instead of directly accessing localStorage or internal state.
 */
export interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState;
  getCurrentUser: () => User | null;
}

declare global {
  interface Window {
    __conduit_debug__?: ConduitDebug;
  }
}

/**
 * Sets up the debug interface on window.__conduit_debug__
 */
function setupDebugInterface(jwtService: JwtService, userService: UserService): void {
  let currentAuthState: AuthState = 'loading';
  let currentUser: User | null = null;

  userService.authState.subscribe(state => (currentAuthState = state));
  effect(() => {
    currentUser = userService.currentUser();
  });

  window.__conduit_debug__ = {
    getToken: () => jwtService.getToken(),
    getAuthState: () => currentAuthState,
    getCurrentUser: () => currentUser,
  };
}

/**
 * App initializer: checks auth state at startup.
 *
 * - No token → purgeAuth() to exit 'loading' state → 'unauthenticated'
 * - Token exists → getCurrentUser() to validate it:
 *     - Success → 'authenticated'
 *     - 4XX → 'unauthenticated' (invalid token, cleared)
 *     - 5XX → 'unavailable' (server down, token kept, auto-retry)
 */
export function initAuth(jwtService: JwtService, userService: UserService) {
  return () => {
    setupDebugInterface(jwtService, userService);

    if (jwtService.getToken()) {
      return userService.getCurrentUser();
    } else {
      userService.purgeAuth();
      return EMPTY;
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),

    // 2. UNIFICAMOS TODOS LOS INTERCEPTORES EN UN SOLO PROVIDER
    provideHttpClient(
      withInterceptors([
        tokenInterceptor,
        errorInterceptor, // Ambos interceptores funcionales van juntos aquí
      ]),
      withInterceptorsFromDi(), // Solo si todavía te queda algún interceptor viejo basado en clases
    ),

    // 3. REGISTRAMOS TOASTR PARA ELIMINAR EL ERROR NG0201
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),

    provideAppInitializer(() => {
      const initializerFn = initAuth(inject(JwtService), inject(UserService));
      return initializerFn();
    }),
  ],
};
