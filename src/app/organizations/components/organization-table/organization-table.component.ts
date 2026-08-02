import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { OrganizationModel } from '../../model/organization.model';
import { OrganizationService } from '../../services/organization.service';
import { OrganizationAddDialogComponent } from '../organization-add-dialog/organization-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';

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

  @Output() editOrganization = new EventEmitter<OrganizationModel>();
  @Output() addOrganization = new EventEmitter<OrganizationModel>();
  @Output() deleteOrganizationEvent = new EventEmitter<string>();
  @Output() viewOrganization = new EventEmitter<string>();

  private dialog = inject(MatDialog);
  private organizationService = inject(OrganizationService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Signals
  organizations = signal<OrganizationModel[]>([]);
  isLoading = signal(false);
  search = signal('');

  // Computed filtered rows
  filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.organizations().filter(org => org != null);
    if (!q) return list;
    return list.filter(org => org.name.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    if (!entityId) {
      console.error('No entityId provided for organization table.');
      return;
    }

    // Listen to service subject and update signal
    this.organizationService.organizationSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(orgs => {
        this.organizations.set(orgs);
      });

    this.loadOrganizations(entityId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrganizations(entityId: string): void {
    this.isLoading.set(true);
    this.organizationService.getOrganizationByEntityId(entityId).pipe(
      catchError((err) => {
        console.error('Failed to load organizations:', err);
        this.toast.error('Could not load organizations. Please try again.', 'Error');
        return of([]);
      })
    ).subscribe(() => {
      this.isLoading.set(false);
    });
  }

  onSearch(query: string): void {
    this.search.set(query);
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
        this.addOrganization.emit(newOrg);
        this.toast.success(`Organization "${newOrg.name}" added successfully.`, 'Added');
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
        this.editOrganization.emit(updatedOrg);
        this.toast.success(`Organization "${updatedOrg.name}" updated successfully.`, 'Updated');
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

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.organizationService.deletesOrganization(organization).subscribe({
          next: () => {
            this.deleteOrganizationEvent.emit(organization.id);
            this.toast.success(`Organization "${organization.name}" deleted successfully.`, 'Deleted');
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.toast.error('Failed to delete organization. Please try again.', 'Error');
          }
        });
      }
    });
  }

  navigateToDetail(organization: OrganizationModel): void {
    const sportId = this.sportId ?? this.route.snapshot.paramMap.get('sportId');
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    if (!sportId || !entityId) return;
    this.router.navigate(['/sports', sportId, entityId, organization.id]);
    this.viewOrganization.emit(organization.id);
  }
}