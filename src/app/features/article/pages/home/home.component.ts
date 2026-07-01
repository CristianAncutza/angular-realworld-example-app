import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TagsService } from '../../services/tags.service';
import { ArticleListConfig } from '../../models/article-list-config.model';
import { NgClass } from '@angular/common';
import { ArticleListComponent } from '../../components/article-list.component';
import { combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, tap } from 'rxjs/operators';
import { UserService } from '../../../../core/auth/services/user.service';
import { RxLet } from '@rx-angular/template/let';
import { IfAuthenticatedDirective } from '../../../../core/auth/if-authenticated.directive';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [NgClass, ArticleListComponent, RxLet, IfAuthenticatedDirective, RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent implements OnInit {
  searchControl = new FormControl('', { nonNullable: true });
  isAuthenticated = signal(false);
  listConfig = signal<ArticleListConfig>({
    type: 'all',
    filters: {},
  });
  currentPage = signal(1);
  tags$ = inject(TagsService)
    .getAll()
    .pipe(tap(() => this.tagsLoaded.set(true)));
  tagsLoaded = signal(false);
  isFollowingFeed = signal(false);
  destroyRef = inject(DestroyRef);
  isAuthenticated$ = toObservable(this.userService.isAuthenticated);
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.isAuthenticated$, // <-- Corregido: Usamos la variable que definimos arriba
      this.route.params,
      this.route.queryParams,
      this.searchControl.valueChanges.pipe(
        debounceTime(300), // Espera 300ms de silencio al escribir
        distinctUntilChanged(), // No emite si el texto es idéntico al anterior
        startWith(''), // Valor inicial para activar el combineLatest
      ),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef), // Evitamos fugas de memoria
      )
      .subscribe(([isAuthenticated, params, queryParams, searchTerm]) => {
        this.isAuthenticated.set(isAuthenticated);

        const tag = params['tag'];
        const feed = queryParams['feed'];
        const page = queryParams['page'] ? parseInt(queryParams['page'], 10) : 1;

        // Si feed=following pero no está autenticado, redirige a login
        if (feed === 'following' && !isAuthenticated) {
          void this.router.navigate(['/login']);
          return;
        }

        let type: string;
        if (tag) {
          type = 'all';
        } else if (feed === 'following') {
          type = 'feed';
        } else {
          type = 'all';
        }

        // Corregido: Construimos los filtros de forma dinámica para evitar el error 422
        const filters: any = {
          // Pasamos un espacio en blanco. Visualmente para el backend cuenta como string enviado (no nulo / no requerido ausente)
          // pero al hacer los filtros LINQ no coincidirá con nada o pasará la validación sin romper.
          tag: tag || ' ',
          author: queryParams['author'] || ' ',
          favorited: queryParams['favorited'] || ' ',
          search: searchTerm.trim() || ' ', // Si no busca nada, manda espacio para que no chille
          limit: 20,
          offset: (page - 1) * 20,
        };

        if (tag) {
          filters.tag = tag;
        }
        if (queryParams['author']) {
          filters.author = queryParams['author'];
        }
        if (queryParams['favorited']) {
          filters.favorited = queryParams['favorited'];
        }
        // Agrega el término de búsqueda solo si el usuario escribió algo
        if (searchTerm && searchTerm.trim() !== '') {
          filters.search = searchTerm.trim();
        }

        this.currentPage.set(page);
        this.listConfig.set({ type, filters });
        this.isFollowingFeed.set(type === 'feed');
      });
  }

  onPageChange(page: number): void {
    const queryParams: { page?: number; feed?: string } = {};

    // Preserve feed param if present
    const currentFeed = this.route.snapshot.queryParams['feed'];
    if (currentFeed) {
      queryParams.feed = currentFeed;
    }

    // Only add page param if not page 1
    if (page > 1) {
      queryParams.page = page;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }
}
