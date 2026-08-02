import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, Subject, takeUntil, combineLatest, map } from 'rxjs';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { OrganizationAddDialogComponent, OrganizationDialogData } from '../components/organization-add-dialog/organization-add-dialog.component';
import { OrganizationModel } from '../model/organization.model';
import { OrganizationService } from '../services/organization.service';
import { ParticipantTableComponent } from '../../participants/components/participant-table/participant-table.component';
import { ParticipantModel } from '../../participants/model/participant.model';
import { CustomDialogComponent, CustomDialogData } from '../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../common/services/toast/toast.service';
import { ParticipantService } from '../../participants/services/participant.service';
import { SquadTableComponent } from '../../squad/components/squad-table/squad-table.component';
import { StaffTableComponent } from '../../staff/components/staff-table/staff-table.component';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    CustomBreadcrumbsComponent,
    MatDialogModule,
    ParticipantTableComponent,
    SquadTableComponent,
    StaffTableComponent,
  ],
  templateUrl: './organization-detail.component.html',
  styleUrls: ['./organization-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDetailComponent implements OnInit, OnDestroy {
  organization$: Observable<OrganizationModel | undefined>;
  sportId!: string;
  entityId!: string;
  orgId!: string;
  participants$!: Observable<ParticipantModel[]>;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orgService: OrganizationService,
    private participantService: ParticipantService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {
    this.organization$ = new Observable<OrganizationModel | undefined>();
    this.participants$ = new Observable<ParticipantModel[]>();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.sportId = params['sportId'];
      this.entityId = params['entityId'];
      this.orgId = params['orgId'];

      if (this.entityId && this.orgId) {
        this.orgService.getOrganizationByEntityId(this.entityId).subscribe({
          error: () => this.toast.error('Failed to load organization', 'Error')
        });
      } else {
        this.toast.error('Missing entity or organization ID', 'Error');
        this.router.navigate(['/sports']);
      }
    });

    this.organization$ = combineLatest([
      this.route.params,
      this.orgService.organizationSubject$
    ]).pipe(
      map(([params, orgs]) => {
        const orgId = params['orgId'];
        return orgs.find(org => org.id === orgId);
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshOrganization(): void {
    if (this.entityId) {
      this.orgService.getOrganizationByEntityId(this.entityId).subscribe();
    }
  }

  onImageError(organization: OrganizationModel): void {
    organization.crestUrl = 'assets/default-crest.png';
  }

  openEditDialog(organization: OrganizationModel): void {
    const dialogData: OrganizationDialogData = {
      entityId: this.entityId,
      organization: organization,
    };

    const dialogRef = this.dialog.open(OrganizationAddDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.toast.success('Organization updated successfully', 'Updated');
        this.refreshOrganization();
      }
    });
  }

  deleteOrganization(organization: OrganizationModel): void {
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

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.orgService.deletesOrganization(organization).subscribe({
          next: () => {
            this.toast.success(`Organization "${organization.name}" deleted successfully.`, 'Deleted');
            this.router.navigate(['/sports', this.sportId, this.entityId]);
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.toast.error('Failed to delete organization.', 'Error');
          }
        });
      }
    });
  }
}