import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, switchMap } from 'rxjs';
import { NgClass } from '@angular/common';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-favorite-button',
  template: `
    <button
      class="btn btn-sm"
      [ngClass]="{
        disabled: isSubmitting(),
        'btn-outline-primary': !article.favorited,
        'btn-primary': article.favorited,
      }"
      (click)="toggleFavorite()"
    >
      <i class="ion-heart"></i> <ng-content></ng-content>
    </button>
  `,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteButtonComponent {
  destroyRef = inject(DestroyRef);
  isSubmitting = signal(false);

  @Input() article!: Article;
  @Output() toggle = new EventEmitter<boolean>();

  constructor(
    private readonly articleService: ArticlesService,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  toggleFavorite(): void {
    if (!this.userService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting.set(true);

    if (!this.article.favorited) {
      this.articleService
        .favorite(this.article.slug)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.toggle.emit(true);
          },
          error: () => this.isSubmitting.set(false),
        });
    } else {
      this.articleService
        .unfavorite(this.article.slug)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.toggle.emit(false);
          },
          error: () => this.isSubmitting.set(false),
        });
    }
  }
}
