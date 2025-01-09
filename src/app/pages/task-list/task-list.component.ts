import { Component, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AddTaskGroupModalComponent } from 'src/app/shared/modals/add-task-group-modal/add-task-group-modal.component';
import { AddTaskModalComponent } from 'src/app/shared/modals/add-task-modal/add-task-modal.component';
import { EditTaskGroupModalComponent } from 'src/app/shared/modals/edit-task-group-modal/edit-task-group-modal.component';
import { EditTaskModalComponent } from 'src/app/shared/modals/edit-task-modal/edit-task-modal.component';
import { Task } from 'src/app/shared/models/Task';
import { TaskGroup } from 'src/app/shared/models/TaskGroup';
import { AuthService } from 'src/app/shared/services/auth.service';
import { TaskManagementService } from 'src/app/shared/services/task-management.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit, OnChanges, OnDestroy {
  singleTasks?: Task[];
  taskGroups?: TaskGroup[];
  loggedInUser?: firebase.default.User | null;

  singleTasksByGroup: { [key: number | string]: Task[] } = {};
  subscribtion1?: Subscription;
  subscribtion2?: Subscription;
  subscribtion3?: Subscription;
  subscribtion4?: Subscription;
  subscribtion5?: Subscription;
  subscribtion6?: Subscription;
  subscribtion7?: Subscription;
  subscribtion8?: Subscription;
  alreadyFetched: boolean = false;
  constructor(private dialog: MatDialog, private taskManagement: TaskManagementService, private authService: AuthService){
  }
  ngOnInit() {
    if (!this.subscribtion3) {
      this.subscribtion3 = this.taskManagement.taskChanges.subscribe(
        async () => {
          try {
            // console.log("INSIDE");
            this.alreadyFetched = true;
            console.log(this.alreadyFetched);
            console.log('taskChanges event received. Fetching data...');
            await this.fetchData();
            console.log('Data fetched successfully after taskChanges event!');
          } catch (error) {
            console.error('Error in taskChanges subscription:', error);
          }
        }
      );
    }
    // console.log("OUTSIDE");
    // console.log(this.alreadyFetched);
    if(!this.alreadyFetched){
      this.fetchData();
      this.alreadyFetched = false;
    }
  }

  ngOnChanges(): void{
    if (!this.subscribtion3) {
      this.subscribtion3 = this.taskManagement.taskChanges.subscribe(
        async () => {
          try {
            this.alreadyFetched = true;
            console.log('taskChanges event received. Fetching data...');
            await this.fetchData();
            console.log('Data fetched successfully after taskChanges event!');
          } catch (error) {
            console.error('Error in taskChanges subscription:', error);
          }
        }
      );
    }
    if(!this.alreadyFetched){
      this.fetchData();
      this.alreadyFetched = false;
    }
  }

  async fetchData() {
    if(navigator.onLine != true){
      try {
        console.log('Fetching data...');
        const [singleTasks, taskGroups] = await Promise.all([
          this.taskManagement.getSingleTasksIDB().toPromise(),
          this.taskManagement.getUsersTaskGroupsIDB().toPromise(),
        ]);
    
        this.singleTasks = singleTasks || [];
        this.taskGroups = taskGroups || [];
    
        // console.log('Single Tasks:', this.singleTasks);
        // console.log('Task Groups:', this.taskGroups);
    
        this.refreshSingleTasksByGroup();
        console.log('Data fetched successfully!');
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }
    }
    else{
      this.subscribtion5 = this.authService.isUserLoggedInFirebase().subscribe(async user => {
        this.loggedInUser = user;
        // console.log(this.loggedInUser);
        if(this.loggedInUser){
          this.subscribtion6 = this.taskManagement.getUserSingleTasksFirebase(this.loggedInUser.uid).subscribe(singletasks => {
            this.singleTasks = singletasks;
            // console.log(this.singleTasks);
          });
          this.subscribtion8 = this.taskManagement.getUserTaskGroupsFirebase(this.loggedInUser.uid).subscribe(taskgroups => {
            this.taskGroups = taskgroups;
            this.refreshSingleTasksByGroup();
            // console.log(this.taskGroups);
          });
          if(navigator.onLine && (await this.taskManagement.checkIFOfflineQueueIsEmpty())){
            this.taskManagement.getUserDataFromFirebaseAndMirror(this.loggedInUser);
          }
        }
      });
    }
  }

  refreshSingleTasksByGroup() {
    if (!this.taskGroups || !this.singleTasks) {
      return;
    }

    this.singleTasksByGroup = {};

    if(navigator.onLine != true){
      this.taskGroups.forEach(taskGroup => {
        this.singleTasksByGroup[taskGroup.id!] = this.taskManagement.getTaskGroupSingleIDB(taskGroup);
      }); 
    }
    else{
      if(this.loggedInUser){
        this.taskGroups.forEach(taskGroup => {
          this.subscribtion7 = this.taskManagement.getUserTaskGroupsSingleFirebase(this.loggedInUser?.uid!, taskGroup?.id as string).subscribe(groupTasks => {
          this.singleTasksByGroup[taskGroup.id!] = groupTasks;
          });
        });
      }
    }
  }

  getSingleTasksInGroup(taskGroup: TaskGroup): Task[] {
    return this.singleTasksByGroup[taskGroup.id!] || [];
  }

  deleteTask(task: Task) {
    if(navigator.onLine != true){
      // console.log('Deleting task:', task);
      this.taskManagement.deleteSingleTaskIDB(task, () => {
      });
    }
    else{
      this.taskManagement.deleteSingleTaskFirebase(task.id as string);
      // console.log("DELETE TASK");
    }
  }

  deleteTaskGroup(taskGroup: TaskGroup){
    if(navigator.onLine != true){
      this.taskManagement.deleteTaskGroupIDB(taskGroup, () => {
      });
    }
    else{
      this.taskManagement.deleteTaskGroupFirebase(taskGroup.id as string, this.loggedInUser?.uid as string);
      // console.log("DELETE GROUP");
    }
  }

  toggleTaskStatus(task: Task): void {
    task.isDone = !task.isDone;
    if(navigator.onLine !== true){
      this.taskManagement.updateSingleTaskIDB(task, () =>{
      });
    }
    else{
      this.taskManagement.updateSingleTaskFirebase(task);
    }
  }

  openEditTaskModal(task: any): void {
    const dialogRef = this.dialog.open(EditTaskModalComponent, {
      width: '400px',
      data: task
    });
  
    dialogRef.afterClosed().subscribe(result => {
      // console.log('The dialog was closed', result);
    });
  }

  openEditTaskGroupModal(taskGroup: any): void {
    const dialogRef = this.dialog.open(EditTaskGroupModalComponent, {
      width: '400px',
      data: taskGroup
    });
  
    dialogRef.afterClosed().subscribe(result => {
      // console.log('The dialog was closed', result);
    });
  }

  openAddTaskModal(taskGroup: any): void {
    const dialogRef = this.dialog.open(AddTaskModalComponent, {
      width: '400px',
      data: taskGroup
    });
  
    dialogRef.afterClosed().subscribe(result => {
      // console.log('The dialog was closed', result);
    });
  }

  openAddTaskGroupModal(task: any): void {
    const dialogRef = this.dialog.open(AddTaskGroupModalComponent, {
      width: '400px',
      data: task
    });
  
    dialogRef.afterClosed().subscribe(result => {
      // console.log('The dialog was closed', result);
    });
  }

  ngOnDestroy(): void {
    this.subscribtion1?.unsubscribe();
    this.subscribtion2?.unsubscribe();
    this.subscribtion3?.unsubscribe();
    this.subscribtion4?.unsubscribe();
    this.subscribtion5?.unsubscribe();
    this.subscribtion6?.unsubscribe();
    this.subscribtion7?.unsubscribe();
    this.subscribtion8?.unsubscribe();
  }
}
