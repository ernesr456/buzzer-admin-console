import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, Subject, switchMap, takeUntil, first, of } from 'rxjs';
import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { OrganizationAddDialogComponent, OrganizationDialogData } from '../organization-add-dialog/organization-add-dialog.component';
import { OrganizationModel } from '../../model/organization.model';
import { OrganizationService } from '../../services/organization.service';
import { ParticipantTableComponent } from '../../../participants/components/participant-table/participant-table.component';
import { ParticipantModel } from '../../../participants/model/participant.model';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';
import { EntityService } from '../../../entities/services/entity.service';
import { ParticipantService } from '../../../participants/services.service';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    CustomBreadcrumbsComponent,
    MatDialogModule,
    ParticipantTableComponent,
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
    private entityService: EntityService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {
    this.organization$ = of(undefined);
    this.participants$ = of([]);
  }

  ngOnInit(): void {
    this.organization$ = this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.sportId = params['sportId'];
        this.entityId = params['entityId'];
        this.orgId = params['orgId'];
        if (this.entityId && this.orgId) {
          return this.orgService.getOrganizationById(this.entityId, this.orgId).pipe(
            switchMap(org => {
              if (!org) {
                this.toast.error('Organization not found', 'Error');
                this.router.navigate(['/sports', this.sportId, this.entityId]);
                return of(undefined);
              }
              this.participants$ = this.participantService.getParticipantsForOrganization(this.orgId);
              return of(org);
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

  private refreshOrganization(): void {
    this.orgService.refreshOrganization(this.entityId, this.orgId);
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
        this.orgService.deleteOrganization(this.entityId, organization.id);
        this.toast.success(`Organization "${organization.name}" deleted successfully.`, 'Deleted');
        this.router.navigate(['/sports', this.sportId, this.entityId]);
      }
    });
  }

  onParticipantAdded(newParticipant: ParticipantModel): void {
    this.toast.success(`Participant "${newParticipant.name}" added successfully.`, 'Added');
    this.refreshOrganization();
  }

  onParticipantEdited(updatedParticipant: ParticipantModel): void {
    this.toast.success(`Participant "${updatedParticipant.name}" updated successfully.`, 'Updated');
    this.refreshOrganization();
  }

  onParticipantDeleted(participantId: string): void {
    this.toast.success('Participant deleted successfully.', 'Deleted');
    this.refreshOrganization();
  }
}