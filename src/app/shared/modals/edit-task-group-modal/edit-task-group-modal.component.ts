import { Component, Inject,OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { TaskGroup } from '../../models/TaskGroup';
import { TaskManagementService } from '../../services/task-management.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-task-group-modal',
  templateUrl: './edit-task-group-modal.component.html',
  styleUrls: ['./edit-task-group-modal.component.scss']
})
export class EditTaskGroupModalComponent implements OnDestroy {
  taskGroupForm: FormGroup;
  loggedInUser?: firebase.default.User | null;
  subscribtion?: Subscription;

  constructor(
    public dialogRef: MatDialogRef<EditTaskGroupModalComponent>,@Inject(MAT_DIALOG_DATA) public data: TaskGroup, private taskManagement: TaskManagementService, private authService: AuthService) {
    this.taskGroupForm = new FormGroup({
      name: new FormControl(data.name, [Validators.required, Validators.maxLength(30)]),
    });
  }

  onNoClick(event: any): void {
    event.preventDefault();
    this.dialogRef.close();
  }

  onSubmit(){
    if(navigator.onLine != true){
      if (this.taskGroupForm) {
        const taskGroup: TaskGroup = {
          id: this.data.id,
          name: this.taskGroupForm.get("name")?.value as string,
          userID: this.data.userID
        };
        this.taskManagement.updateTaskGroupIDB(taskGroup, () => {
        });
      }
      this.dialogRef.close();
    }
    else{
      this.subscribtion = this.authService.isUserLoggedInFirebase().subscribe(user => {
        this.loggedInUser = user;
        if(this.loggedInUser && this.taskGroupForm){
          const taskGroup: TaskGroup = {
            id: this.data.id,
            name: this.taskGroupForm.get("name")?.value as string,
            userID: this.data.userID
          };
          // console.log(taskGroup);
          this.taskManagement.updateTaskGroupFirebase(taskGroup).then(() => {
          }).catch(error => {
            console.error(error);
          });
          this.dialogRef.close();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscribtion?.unsubscribe;
  }
}
