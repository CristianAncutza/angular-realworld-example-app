import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { UserService } from '../../../core/auth/services/user.service';
import { User } from '../../../core/auth/user.model';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { Comment } from '../models/comment.model';
import { AsyncPipe, DatePipe } from '@angular/common';
import { DefaultImagePipe } from '../../../shared/pipes/default-image.pipe';

@Component({
  selector: 'app-article-comment',
  template: `
    @if (comment) {
      <div class="card">
        <div class="card-block">
          <p class="card-text">
            {{ comment.body }}
          </p>
        </div>
        <div class="card-footer">
          <a class="comment-author" [routerLink]="['/profile', comment.author.username]">
            <img [src]="comment.author.image | defaultImage" class="comment-author-img" />
          </a>
          &nbsp;
          <a class="comment-author" [routerLink]="['/profile', comment.author.username]">
            {{ comment.author.username }}
          </a>
          <span class="date-posted">
            {{ comment.createdAt | date: 'longDate' }}
          </span>
          @if (canModify()) {
            <span class="mod-options">
              <i class="ion-trash-a" (click)="delete.emit(true)"></i>
            </span>
          }
        </div>
      </div>
    }
  `,
  imports: [RouterLink, DatePipe, DefaultImagePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCommentComponent {
  @Input() comment!: Comment;
  @Output() delete = new EventEmitter<boolean>();

  canModify = computed(() => {
    const user = inject(UserService).currentUser();
    return user?.username === this.comment.author.username; // Ajusta según tu lógica exacta
  });
}
