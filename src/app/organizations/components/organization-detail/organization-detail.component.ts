import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, Subject, switchMap, takeUntil, tap, first, of } from 'rxjs';
import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import {
  OrganizationAddDialogComponent,
  OrganizationDialogData
} from '../organization-add-dialog/organization-add-dialog.component';
import { OrganizationModel } from '../../model/organization.model';
import { OrganizationService } from '../../services/organization.service';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    CustomBreadcrumbsComponent,
    MatDialogModule
  ],
  templateUrl: './organization-detail.component.html',
  styleUrls: ['./organization-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationDetailComponent implements OnInit, OnDestroy {
  organization$: Observable<OrganizationModel | undefined>;
  entityId: string | null = null;
  orgId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orgService: OrganizationService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {
    // Initialize with an observable that emits undefined to avoid null issues
    this.organization$ = of(undefined);
  }

  ngOnInit(): void {
    this.organization$ = this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.entityId = params['entityId'];
        this.orgId = params['orgId'];
        if (this.entityId && this.orgId) {
          return this.orgService.getOrganizationById(this.entityId, this.orgId).pipe(
            tap(org => {
            })
          );
        } else {
          return of(undefined);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openEditDialog(): void {
    // Get the current organization snapshot using first()
    this.organization$.pipe(
      first(),
      takeUntil(this.destroy$)
    ).subscribe(currentOrg => {
      if (!currentOrg || !this.entityId) {
        this.toast.error('Organization not found or missing entity ID', 'Error');
        return;
      }

      const dialogData: OrganizationDialogData = {
        entityId: this.entityId,
        organization: currentOrg
      };

      const dialogRef = this.dialog.open(OrganizationAddDialogComponent, {
        width: '500px',
        data: dialogData,
        disableClose: true
      });

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
        if (result) {
          this.toast.success('Organization updated successfully', 'Updated');
        }
      });
    });
  }

  deleteOrganization(organization: OrganizationModel): void {
    if (!this.entityId) {
      this.toast.error('Could not determine the entity', 'Error');
      return;
    }

    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Organization',
        message: `Are you sure you want to delete <strong>${organization.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.orgService.deleteOrganization(this.entityId!, organization.id);
        this.toast.success(`Organization "${organization.name}" deleted successfully.`, 'Deleted');
        // Navigate back to entity detail
        setTimeout(() => {
          this.router.navigate(['/entities', this.entityId]);
        }, 800);
      }
    });
  }
}