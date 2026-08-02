import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

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
  @Input() entityId?: string; // governing body ID (optional)

  @Output() editStaff = new EventEmitter<StaffModel>();
  @Output() addStaff = new EventEmitter<StaffModel>();
  @Output() deleteStaffEvent = new EventEmitter<string>();
  @Output() viewStaff = new EventEmitter<string>();

  private dialog = inject(MatDialog);
  private staffService = inject(StaffService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  staffMembers: StaffModel[] = [];
  isLoading = false;

  // Search
  private searchSubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchSubject.asObservable();

  get tableRows() {
    return this.staffMembers
      .filter(staff => staff != null)
      .map(staff => ({
        ...staff,
        // You can add computed fields here if needed
      }));
  }

  ngOnInit(): void {
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!orgId) {
      console.error('No orgId provided for staff table.');
      return;
    }

    // Listen to the service's subject for real‑time updates
    this.staffService.staffSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => {
        this.staffMembers = members;
        this.cdr.markForCheck();
      });

    this.loadStaff(orgId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStaff(orgId: string): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.staffService.getStaffByOrgId(orgId).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load staff:', err);
        this.toast.error('Could not load staff members. Please try again.', 'Error');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
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
    // Example: navigate to staff detail page.
    // You can adjust the route as needed.
    const sportId = this.sportId ?? this.route.snapshot.paramMap.get('sportId');
    const entityId = this.entityId ?? this.route.snapshot.paramMap.get('entityId');
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!sportId || !entityId || !orgId) return;
    this.router.navigate(['/sports', sportId, entityId, orgId, 'staff', staff.id]);
    this.viewStaff.emit(staff.id);
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }
}