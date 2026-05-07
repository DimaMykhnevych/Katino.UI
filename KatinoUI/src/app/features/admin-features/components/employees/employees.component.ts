import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, EMPTY } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { ManageableUser } from 'src/app/core/models/manageable-user';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
})
export class EmployeesComponent implements OnInit, OnDestroy {
  public dataSource = new MatTableDataSource<ManageableUser>([]);
  public displayedColumns = ['userName', 'email', 'role', 'registryDate', 'status', 'actions'];
  public isLoading = false;

  private _updatingUsers = new Set<string>();
  private _destroy$ = new Subject<void>();

  constructor(
    private _userService: UserService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  public ngOnInit(): void {
    this.loadUsers();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public isUpdating(userId: string | undefined): boolean {
    return !!userId && this._updatingUsers.has(userId);
  }

  public getRoleTranslationKey(role: string | undefined): string {
    const map: Record<string, string> = {
      Admin: 'roles.admin',
      Owner: 'roles.owner',
      User: 'roles.user',
      Sewer: 'roles.sewer',
      DirectManager: 'roles.directManager',
    };
    return map[role || ''] || (role || '');
  }

  public toggleActivation(user: ManageableUser): void {
    if (!user.userId || this._updatingUsers.has(user.userId)) return;
    this._updatingUsers.add(user.userId);
    const newValue = !user.isActive;
    this._userService
      .setActivation(user.userId, newValue)
      .pipe(
        catchError(() => {
          this._toastr.error(this._t('employees.toastr.activationFailed'));
          return EMPTY;
        }),
        finalize(() => this._updatingUsers.delete(user.userId!)),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        user.isActive = newValue;
        this._toastr.success(this._t('employees.toastr.activationSuccess'));
      });
  }

  private loadUsers(): void {
    this.isLoading = true;
    this._userService
      .getManageableUsers()
      .pipe(
        catchError(() => EMPTY),
        finalize(() => (this.isLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((users) => {
        this.dataSource.data = users;
      });
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
