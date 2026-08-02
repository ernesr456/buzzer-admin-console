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

import { SquadModel } from '../../models/squad.model';
import { SquadService } from '../../services/squad.service';
import { SquadAddDialogComponent } from '../squad-add-dialog/squad-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';

@Component({
  selector: 'app-squad-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './squad-table.component.html',
  styleUrls: ['./squad-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SquadTableComponent implements OnInit, OnDestroy {
  @Input() orgId?: string;

  @Output() addSquad = new EventEmitter<SquadModel>();
  @Output() editSquad = new EventEmitter<SquadModel>();
  @Output() deleteSquadEvent = new EventEmitter<string>();
  @Output() viewSquad = new EventEmitter<string>();

  private dialog = inject(MatDialog);
  private squadService = inject(SquadService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchSubject.asObservable();

  squads: SquadModel[] = [];
  isLoading = false;

  get tableRows() {
    const query = this.searchSubject.getValue().toLowerCase().trim();
    return this.squads
      .filter(squad => squad && squad.displayName)
      .filter(squad =>
        squad.displayName?.toLowerCase().includes(query) ||
        squad.position?.toLowerCase().includes(query)
      )
      .map(squad => ({
        id: squad.id,
        displayName: squad.displayName,
        age: squad.age,
        position: squad.position,
        photoUrl: squad.photoUrl,
        agreementEnd: squad.agreementEnd,
        squad: squad,
      }));
  }

  ngOnInit(): void {
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!orgId) {
      console.error('No orgId provided for squad table.');
      return;
    }

    this.squadService.squadSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(squads => {
        this.squads = squads;
        this.cdr.markForCheck();
      });

    this.loadSquads(orgId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSquads(orgId: string): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.squadService.getSquadByOrgId(orgId).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load squads:', err);
        this.toast.error('Could not load squad members. Please try again.', 'Error');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openAddDialog(): void {
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!orgId) return;

    const dialogRef = this.dialog.open(SquadAddDialogComponent, {
      width: '400px',
      data: { orgId },
    });

    dialogRef.afterClosed().subscribe((newSquad: SquadModel | undefined) => {
      if (newSquad) {
        this.addSquad.emit(newSquad);
        const name = newSquad.displayName || 'Squad member';
        this.toast.success(`"${name}" added successfully.`, 'Added');
      }
    });
  }

  openEditDialog(squad: SquadModel): void {
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!orgId) return;

    const dialogRef = this.dialog.open(SquadAddDialogComponent, {
      width: '400px',
      data: {
        orgId,
        squad,
      },
    });

    dialogRef.afterClosed().subscribe((updatedSquad: SquadModel | undefined) => {
      if (updatedSquad) {
        this.editSquad.emit(updatedSquad);
        const name = updatedSquad.displayName || 'Squad member';
        this.toast.success(`"${name}" updated successfully.`, 'Updated');
      }
    });
  }

  deleteSquad(squad: SquadModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Squad Member',
        message: `Are you sure you want to delete <strong>${squad.displayName || 'this member'}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.squadService.deletesSquad(squad).subscribe({
          next: () => {
            this.deleteSquadEvent.emit(squad.id);
            this.toast.success(`Squad member "${squad.displayName || ''}" deleted successfully.`, 'Deleted');
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.toast.error('Failed to delete squad member. Please try again.', 'Error');
          }
        });
      }
    });
  }

  navigateToDetail(squad: SquadModel): void {
    const orgId = this.orgId ?? this.route.snapshot.paramMap.get('orgId');
    if (!orgId) return;
    this.router.navigate(['/organisations', orgId, 'squads', squad.id]);
    this.viewSquad.emit(squad.id);
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  getDefaultAvatar(): string {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#444"/>
        <circle cx="16" cy="12" r="6" fill="#888"/>
        <circle cx="16" cy="24" r="8" fill="#888"/>
      </svg>
    `);
  }
}