import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface HelpTopic {
  id: string;
  titleKey: string;
  icon: string;
}

// Static help articles for CRM staff. Each topic is its own component, switched by id in the template.
export const HELP_TOPICS: HelpTopic[] = [
  { id: 'receipts', titleKey: 'helpPage.topics.receipts', icon: 'receipt_long' },
];

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent implements OnInit, OnDestroy {
  public readonly topics = HELP_TOPICS;
  public selectedTopicId = HELP_TOPICS[0].id;

  private _destroy$ = new Subject<void>();

  constructor(private _route: ActivatedRoute, private _router: Router) {}

  public ngOnInit(): void {
    this._route.paramMap
      .pipe(takeUntil(this._destroy$))
      .subscribe((params) => {
        const id = params.get('topic');
        if (id && this.topics.some((t) => t.id === id)) {
          this.selectedTopicId = id;
        } else {
          // Unknown or missing topic: show the first one under its own URL
          this._router.navigate(['/help', this.topics[0].id], {
            replaceUrl: true,
          });
        }
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onTopicSelect(id: string): void {
    this._router.navigate(['/help', id]);
  }
}
