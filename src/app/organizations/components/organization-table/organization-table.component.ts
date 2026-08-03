import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { OrganizationModel } from '../../model/organization.model';
import { OrganizationService } from '../../services/organization.service';
import { OrganizationAddDialogComponent } from '../organization-add-dialog/organization-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';
import { ParticipantService } from '../../../participants/services/participant.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-organization-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './organization-table.component.html',
  styleUrls: ['./organization-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationTableComponent implements OnInit, OnDestroy {
  @Input() entityId?: string;
  @Input() sportId?: string;

  private dialog = inject(MatDialog);
  private organizationService = inject(OrganizationService);
  private participantService = inject(ParticipantService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  organizations = signal<OrganizationModel[]>([]);
  participantCounts = signal<Record<string, number>>({});
  isLoading = signal(false);
  search = signal('');

  pageSize = signal(10);
  currentPage = signal(0);
  pageSizeOptions = [5, 10, 25, 100];

  filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.organizations().filter((org) => org != null);
    if (!q) return list;
    return list.filter((org) => org.name.toLowerCase().includes(q));
  });

  totalItems = computed(() => this.filteredRows().length);

  paginatedRows = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end = Math.min(start + this.pageSize(), this.totalItems());
    return this.filteredRows().slice(start, end);
  });

  pageStart = computed(() =>
    this.totalItems() === 0 ? 0 : this.currentPage() * this.pageSize() + 1
  );
  pageEnd = computed(() =>
    Math.min((this.currentPage() + 1) * this.pageSize(), this.totalItems())
  );
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  ngOnInit(): void {
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    if (!entityId) {
      console.error('No entityId provided for organization table.');
      return;
    }

    this.organizationService.organizationSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orgs) => {
        this.organizations.set(orgs);
        this.computeParticipantCounts(orgs);
      });

    this.loadOrganizations(entityId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrganizations(entityId: string): void {
    this.isLoading.set(true);
    this.organizationService
      .getOrganizationByEntityId(entityId)
      .pipe(
        catchError((err) => {
          console.error('Failed to load organizations:', err);
          this.toast.error('Could not load organizations. Please try again.', 'Error');
          return of([]);
        })
      )
      .subscribe(() => {
        this.isLoading.set(false);
        this.resetPagination();
      });
  }

  private refreshData(): void {
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    if (!entityId) return;
    this.loadOrganizations(entityId);
  }

  private async computeParticipantCounts(orgs: OrganizationModel[]): Promise<void> {
    const counts: Record<string, number> = {};
    for (const org of orgs) {
      try {
        const partsResp: any = await lastValueFrom(
          this.participantService.getParticipantsByOrganizationId(org.id)
        );
        const parts = Array.isArray(partsResp) ? partsResp : partsResp ? [partsResp] : [];
        counts[org.id] = parts.length;
      } catch (err) {
        console.error('Failed to load participants for org', org.id, err);
        counts[org.id] = 0;
      }
    }
    this.participantCounts.set(counts);
  }

  onSearch(query: string): void {
    this.search.set(query);
    this.currentPage.set(0);
  }

  onPageSizeChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageSize.set(value);
    this.currentPage.set(0);
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  private resetPagination(): void {
    this.currentPage.set(0);
  }

  openAddDialog(): void {
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    if (!entityId) return;

    const dialogRef = this.dialog.open(OrganizationAddDialogComponent, {
      width: '400px',
      data: { entityId },
    });

    dialogRef.afterClosed().subscribe((newOrg: OrganizationModel | undefined) => {
      if (newOrg) {
        this.toast.success(`Organization "${newOrg.name}" added successfully.`, 'Added');
        this.refreshData();
      }
    });
  }

  openEditDialog(organization: OrganizationModel): void {
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    if (!entityId) return;

    const dialogRef = this.dialog.open(OrganizationAddDialogComponent, {
      width: '400px',
      data: {
        entityId,
        organization,
      },
    });

    dialogRef.afterClosed().subscribe((updatedOrg: OrganizationModel | undefined) => {
      if (updatedOrg) {
        this.toast.success(`Organization "${updatedOrg.name}" updated successfully.`, 'Updated');
        this.refreshData();
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

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.organizationService.deletesOrganization(organization).subscribe({
          next: () => {
            this.toast.success(`Organization "${organization.name}" deleted successfully.`, 'Deleted');
            this.refreshData();
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.toast.error('Failed to delete organization. Please try again.', 'Error');
          },
        });
      }
    });
  }

  navigateToDetail(organization: OrganizationModel): void {
    const sportId = this.sportId ?? this.route.snapshot.paramMap.get('sportId');
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    if (!sportId || !entityId) return;
    this.router.navigate(['/sports', sportId, entityId, organization.id]);
  }
}