import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { StaffModel } from '../../mode/staff.model';
import { StaffService } from '../../services/staff.service';
import { StaffAddDialogComponent } from '../staff-add-dialog/staff-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';

@Component({
  selector: 'app-staff-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './staff-table.component.html',
  styleUrls: ['./staff-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffTableComponent implements OnInit, OnDestroy {
  @Input() orgId?: string;
  @Input() sportId?: string;
  @Input() entityId?: string;

  @Output() editStaff = new EventEmitter<StaffModel>();
  @Output() addStaff = new EventEmitter<StaffModel>();
  @Output() deleteStaffEvent = new EventEmitter<string>();
  @Output() viewStaff = new EventEmitter<string>();

  private dialog = inject(MatDialog);
  private staffService = inject(StaffService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  staffMembers = signal<StaffModel[]>([]);
  isLoading = signal(false);
  search = signal('');

  pageSize = signal(10);
  currentPage = signal(0);
  pageSizeOptions = [5, 10, 25, 100];

  filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.staffMembers().filter((staff) => staff != null);
    if (!q) return list;
    return list.filter((staff) => staff.name.toLowerCase().includes(q));
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
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!orgId) {
      console.error('No orgId provided for staff table.');
      return;
    }

    this.staffService.staffSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe((members) => {
        this.staffMembers.set(members);
      });

    this.loadStaff(orgId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStaff(orgId: string): void {
    this.isLoading.set(true);
    this.staffService
      .getStaffByOrgId(orgId)
      .pipe(
        catchError((err) => {
          console.error('Failed to load staff:', err);
          this.toast.error('Could not load staff members. Please try again.', 'Error');
          return of([]);
        })
      )
      .subscribe(() => {
        this.isLoading.set(false);
        this.resetPagination();
      });
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

  goToPage(page: number): void {
    const maxPage = this.totalPages() - 1;
    if (page < 0 || page > maxPage) return;
    this.currentPage.set(page);
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
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!orgId) return;

    const dialogRef = this.dialog.open(StaffAddDialogComponent, {
      width: '400px',
      data: { orgId },
    });

    dialogRef.afterClosed().subscribe((newStaff: StaffModel | undefined) => {
      if (newStaff) {
        this.addStaff.emit(newStaff);
        this.toast.success(`Staff member "${newStaff.name}" added successfully.`, 'Added');
      }
    });
  }

  openEditDialog(staff: StaffModel): void {
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!orgId) return;

    const dialogRef = this.dialog.open(StaffAddDialogComponent, {
      width: '400px',
      data: {
        orgId,
        staff,
      },
    });

    dialogRef.afterClosed().subscribe((updatedStaff: StaffModel | undefined) => {
      if (updatedStaff) {
        this.editStaff.emit(updatedStaff);
        this.toast.success(`Staff member "${updatedStaff.name}" updated successfully.`, 'Updated');
      }
    });
  }

  deleteStaff(staff: StaffModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Staff Member',
        message: `Are you sure you want to delete <strong>${staff.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.staffService.deletesStaff(staff).subscribe({
          next: () => {
            this.deleteStaffEvent.emit(staff.id);
            this.toast.success(`Staff member "${staff.name}" deleted successfully.`, 'Deleted');
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.toast.error('Failed to delete staff member. Please try again.', 'Error');
          },
        });
      }
    });
  }

  navigateToDetail(staff: StaffModel): void {
    const sportId = this.sportId ?? this.route.snapshot.paramMap.get('sportId');
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!sportId || !entityId || !orgId) return;
    this.router.navigate(['/sports', sportId, entityId, orgId, 'staff', staff.id]);
    this.viewStaff.emit(staff.id);
  }
}