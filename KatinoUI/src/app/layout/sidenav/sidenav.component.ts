import { Component, OnInit, HostListener } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { UserInfo } from 'src/app/core/auth/models/user-info';
import { Roles } from 'src/app/core/models/roles';
import { CurrentUserService } from 'src/app/core/permission/services';
import { AppSettings } from 'src/app/core/settings';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {
  public version = AppSettings.version;
  public sidenavWidth = 4;
  public userInfo: UserInfo = null as any;
  public inventoryPage: string[] = [Roles.Admin];
  public ordersPage: string[] = [Roles.Admin];
  public crmSettingsPage: string[] = [Roles.Admin];
  public sewingQueuePage: string[] = [Roles.Admin, Roles.Sewer];
  public isMobile = false;
  public isSidenavOpened = false;

  constructor(private _currentUserService: CurrentUserService) {
    this.checkScreenSize();
  }

  public ngOnInit(): void {
    this.userInfo = this._currentUserService.userInfo;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  public showTab(tabName: string): boolean {
    switch (tabName) {
      case 'inventory':
        return this.inventoryPage.includes(this.userInfo.role || '');
      case 'orders':
        return this.ordersPage.includes(this.userInfo.role || '');
      case 'crm-settings':
        return this.crmSettingsPage.includes(this.userInfo.role || '');
      case 'sewing-queue':
        return this.sewingQueuePage.includes(this.userInfo.role || '');
      default:
        return false;
    }
  }

  public increase(sidenav: MatSidenav) {
    if (!this.isMobile) {
      sidenav.close();
      setTimeout(() => {
        sidenav.open();
        this.sidenavWidth = 20;
      });
    }
  }

  public decrease(sidenav: MatSidenav) {
    if (!this.isMobile) {
      sidenav.close();
      setTimeout(() => {
        sidenav.open();
        this.sidenavWidth = 4;
      });
    }
  }

  public toggleMobileSidenav(sidenav: MatSidenav): void {
    if (this.isMobile) {
      sidenav.toggle();
      this.isSidenavOpened = sidenav.opened;
    }
  }

  public closeMobileSidenav(sidenav: MatSidenav): void {
    if (this.isMobile && sidenav.opened) {
      sidenav.close();
      this.isSidenavOpened = false;
    }
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.sidenavWidth = 20; // Always expanded on mobile when open
    } else {
      this.sidenavWidth = 4; // Collapsed by default on desktop
    }
  }
}
