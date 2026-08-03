import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { OrganizationAddDialogComponent, OrganizationDialogData } from '../components/organization-add-dialog/organization-add-dialog.component';
import { OrganizationModel } from '../model/organization.model';
import { OrganizationService } from '../services/organization.service';
import { ParticipantTableComponent } from '../../participants/components/participant-table/participant-table.component';
import { CustomDialogComponent, CustomDialogData } from '../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../common/services/toast/toast.service';
import { SquadTableComponent } from '../../squad/components/squad-table/squad-table.component';
import { StaffTableComponent } from '../../staff/components/staff-table/staff-table.component';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    CustomBreadcrumbsComponent,
    ParticipantTableComponent,
    SquadTableComponent,
    StaffTableComponent,
  ],
  templateUrl: './organization-detail.component.html',
  styleUrls: ['./organization-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgService = inject(OrganizationService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private destroy$ = new Subject<void>();

  sportId = signal('');
  entityId = signal('');
  orgId = signal('');
  organizations = signal<OrganizationModel[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  organization = computed(() => {
    const id = this.orgId();
    return this.organizations().find(org => org.id === id) ?? null;
  });

  // ✅ CRITICAL: these three signals must be defined
  totalParticipants = computed(() => this.organization()?.counts?.participants ?? 0);
  totalMembers = computed(() => this.organization()?.counts?.squads ?? 0);
  totalStaffs = computed(() => this.organization()?.counts?.staff ?? 0);

  totalOrganizations = computed(() => this.organizations().length);

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const sportId = params['sportId'];
        const entityId = params['entityId'];
        const orgId = params['orgId'];
        if (!entityId || !orgId) {
          this.toast.error('Missing entity or organization ID', 'Error');
          this.router.navigate(['/sports']);
          return;
        }
        this.sportId.set(sportId);
        this.entityId.set(entityId);
        this.orgId.set(orgId);
        this.loadOrganization();
      });

    this.orgService.organizationSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(orgs => {
        this.organizations.set(orgs);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrganization(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.orgService.getOrganizationByEntityId(this.entityId())
      .pipe(
        catchError((err) => {
          console.error('Failed to load organizations:', err);
          this.toast.error('Failed to load organization', 'Error');
          this.error.set('Could not load organization. Please try again.');
          return of([]);
        })
      )
      .subscribe(() => {
        this.isLoading.set(false);
      });
  }

  refreshOrganization(): void {
    this.loadOrganization();
  }

  onImageError(organization: OrganizationModel): void {
    organization.crestUrl = 'assets/default-crest.png';
  }

  openEditDialog(organization: OrganizationModel): void {
    const dialogData: OrganizationDialogData = {
      entityId: this.entityId(),
      organization: organization,
    };
    const dialogRef = this.dialog.open(OrganizationAddDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true,
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
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
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.orgService.deletesOrganization(organization).subscribe({
            next: () => {
              this.toast.success(`Organization "${organization.name}" deleted successfully.`, 'Deleted');
              this.router.navigate(['/sports', this.sportId(), this.entityId()]);
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