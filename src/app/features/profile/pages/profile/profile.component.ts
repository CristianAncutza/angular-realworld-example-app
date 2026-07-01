import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { combineLatest, EMPTY, of } from 'rxjs';
import { UserService } from '../../../../core/auth/services/user.service';
import { Profile } from '../../models/profile.model';
import { ProfileService } from '../../services/profile.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FollowButtonComponent } from '../../components/follow-button.component';
import { Errors } from '../../../../core/models/errors.model';
import { ListErrorsComponent } from '../../../../shared/components/list-errors.component';
import { DefaultImagePipe } from '../../../../shared/pipes/default-image.pipe';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.component.html',
  imports: [
    FollowButtonComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    FollowButtonComponent,
    ListErrorsComponent,
    DefaultImagePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  profile = signal<Profile | null>(null);
  isUser = signal(false);
  errors = signal<Errors | null>(null);
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

  onToggleFollowing(following: boolean) {
    const currentProfile = this.profile();

    if (currentProfile) {
      // Actualizamos el Signal del perfil manteniendo los datos anteriores
      // pero cambiando el estado de "following"
      this.profile.set({
        ...currentProfile,
        following: following,
      });
    }
  }

  ngOnInit() {
    this.profileService
      .get(this.route.snapshot.params['username']) // 1. Obtenemos el perfil de la URL
      .pipe(
        catchError(error => {
          this.errors.set(error.errors || { error: ['Failed to load profile'] });
          return EMPTY;
        }),
        // 2. Cuando llega el perfil, lo combinamos con el Signal convertido a Observable
        switchMap(profile => {
          return combineLatest([
            of(profile),
            toObservable(this.userService.currentUser), // <-- Conversión clave aquí adentro
          ]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      // 3. Nos suscribimos al resultado unificado
      .subscribe(([profile, user]) => {
        this.profile.set(profile);

        // 4. Evaluamos si es nuestro propio perfil
        const isCurrentUser = profile.username === user?.username;
        this.isUser.set(isCurrentUser);
      });
  }
}
