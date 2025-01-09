import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskListRoutingModule } from './task-list-routing.module';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TaskListComponent } from './task-list.component';
import { MatExpansionModule } from '@angular/material/expansion';

@NgModule({
  declarations: [TaskListComponent],
  imports: [
    CommonModule,
    TaskListRoutingModule,
    MatCardModule,
    MatButtonModule,
    MatExpansionModule
  ]
})
export class TaskListModule { }
