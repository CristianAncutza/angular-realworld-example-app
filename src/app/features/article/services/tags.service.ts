import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class TagsService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<string[]> {
    return this.http.get<{ tags: string[] }>(`${environment.api_url}/tags`).pipe(map(data => data.tags));
  }
}
