import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { TaskGroup } from '../../models/TaskGroup';
import { TaskManagementService } from '../../services/task-management.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-add-task-group-modal',
  templateUrl: './add-task-group-modal.component.html',
  styleUrls: ['./add-task-group-modal.component.scss']
})
export class AddTaskGroupModalComponent implements OnDestroy {
  taskGroupForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(30)]),
  });
  subscribtion?: Subscription;
  loggedInUser?: firebase.default.User | null;
  
  constructor(public dialogRef: MatDialogRef<AddTaskGroupModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private taskManagement: TaskManagementService, private authService: AuthService ) {
  }

  onNoClick(event: any): void {
    event.preventDefault();
    this.dialogRef.close();
  }

  onSubmit(){
    if(navigator.onLine != true){
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const firebaseUser = JSON.parse(storedUser);
        const taskGroup: TaskGroup = {
          name: this.taskGroupForm.get("name")?.value as string,
          userID: firebaseUser.uid
        }
        // console.log("taskGroup");
        this.taskManagement.addTaskGroupIDB(taskGroup, () => {
        });
        this.dialogRef.close();
      }
      else{
        console.log("User not found");
      }
    }
    else{
      this.subscribtion = this.authService.isUserLoggedInFirebase().subscribe(user => {
        this.loggedInUser = user;
        if(this.loggedInUser){
          const taskGroup: TaskGroup = {
            name: this.taskGroupForm.get("name")?.value as string,
            userID: this.loggedInUser.uid
          }
          console.log(taskGroup);
          this.taskManagement.addTaskGroupFirebase(taskGroup).then(() => {
          }).catch(error => {
            console.error(error);
          });
          this.dialogRef.close();
        }
      })
    }
  }

  ngOnDestroy(): void {
    this.subscribtion?.unsubscribe;
  }
}
