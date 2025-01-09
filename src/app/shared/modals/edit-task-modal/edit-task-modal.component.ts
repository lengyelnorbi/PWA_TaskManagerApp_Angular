import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { TaskGroup } from '../../models/TaskGroup';
import { TaskManagementService } from '../../services/task-management.service';
import { Task } from '../../models/Task';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-task-modal',
  templateUrl: './edit-task-modal.component.html',
  styleUrls: ['./edit-task-modal.component.scss']
})
export class EditTaskModalComponent implements OnDestroy {
  taskForm: FormGroup;
  loggedInUser?: firebase.default.User | null;
  subscribtion?: Subscription;

  constructor(
    public dialogRef: MatDialogRef<EditTaskModalComponent>,@Inject(MAT_DIALOG_DATA) public data: Task, private taskManagement: TaskManagementService, private authService: AuthService) {
    this.taskForm = new FormGroup({
      title: new FormControl(data.title, [Validators.required]),
      date: new FormControl(data.date, [Validators.required]),
      priority: new FormControl(data.priority, [Validators.required])
    });
  }

  onNoClick(event: any): void {
    event.preventDefault();
    this.dialogRef.close();
  }

  onSubmit(){
    if(this.taskForm.valid){
      if(navigator.onLine != true){
        if (this.taskForm) {
          const task: Task = {
            id: this.data.id,
            userID: this.data.userID,
            title: this.taskForm.get("title")?.value as string,
            date: this.taskForm.get("date")?.value as string,
            priority: this.taskForm.get("priority")?.value as string,
            isDone: this.data.isDone,
            taskGroupID: this.data.taskGroupID
          };
          this.taskManagement.updateSingleTaskIDB(task, () => {
          });
        }
        this.dialogRef.close();
      }
      else{
        this.subscribtion = this.authService.isUserLoggedInFirebase().subscribe(user => {
          this.loggedInUser = user;
          if(this.loggedInUser && this.taskForm){
            const task: Task = {
              id: this.data.id,
              userID: this.data.userID,
              title: this.taskForm.get("title")?.value as string,
              date: this.taskForm.get("date")?.value as string,
              priority: this.taskForm.get("priority")?.value as string,
              isDone: this.data.isDone,
              taskGroupID: this.data.taskGroupID
            };
            // console.log(task);
            this.taskManagement.updateSingleTaskFirebase(task).then(() => {
            }).catch(error => {
              console.error(error);
            });
            this.dialogRef.close();
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscribtion?.unsubscribe;
  }
}
