import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpinnerService {
  private loading = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loading.asObservable();

  show(): void {
    this.loading.next(true);
  }

  hide(): void {
    this.loading.next(false);
  }
}
