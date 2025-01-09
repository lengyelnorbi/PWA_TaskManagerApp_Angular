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
  selector: 'app-add-task-modal',
  templateUrl: './add-task-modal.component.html',
  styleUrls: ['./add-task-modal.component.scss']
})
export class AddTaskModalComponent implements OnDestroy {
  taskForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    date: new FormControl('', [Validators.required]),
    priority: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]+$/)])
  });
  loggedInUser?: firebase.default.User | null;
  subscribtion?: Subscription;

  constructor(public dialogRef: MatDialogRef<AddTaskModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private taskManagement: TaskManagementService, private authService: AuthService ) {
  }

  onNoClick(event: any): void {
    event.preventDefault();
    this.dialogRef.close();
  }

  onSubmit(){
    if(this.taskForm.valid){
      if(navigator.onLine != true){
        const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const firebaseUser = JSON.parse(storedUser);
            // console.log(this.data !== null ? this.data.id : 0);
          const task: Task = {
            userID: firebaseUser.uid,
            title: this.taskForm.get('title')?.value as string,
            date:  this.taskForm.get('date')?.value as string,
            priority: this.taskForm.get('priority')?.value as string,
            isDone: false,
            taskGroupID: this.data !== null ? this.data.id : 0
          }
          // console.log("taskGroup");
          this.taskManagement.addTaskIDB(task, () => {
            this.dialogRef.close();
          });
          } 
          else {
            console.log('User not found');
          }
      }
      else{
        this.subscribtion = this.authService.isUserLoggedInFirebase().subscribe(user => {
          this.loggedInUser = user;
          if(this.loggedInUser){
            const task: Task = {
              userID: this.loggedInUser.uid, //this.data.userID lesz mindig csak még nincs userID
              title: this.taskForm.get('title')?.value as string,
              date:  this.taskForm.get('date')?.value as string,
              priority: this.taskForm.get('priority')?.value as string,
              isDone: false,
              taskGroupID: this.data !== null ? this.data.id : 0
            }
            // console.log(task);
            this.taskManagement.addSingleTaskFirebase(task).then(() => {
              this.dialogRef.close();
            }).catch(error => {
              console.error(error);
            });
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscribtion?.unsubscribe;
  }
}