import { Injectable } from '@angular/core';
import { Task } from '../models/Task';
import { EventEmitter } from '@angular/core';
import { TaskGroup } from '../models/TaskGroup';
import { Observable } from 'rxjs';
import { User } from '../models/User';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})

export class TaskManagementService{
  private indexedDB!: IDBFactory;
  private db!: IDBDatabase;
  taskChanges: EventEmitter<void> = new EventEmitter<void>();
  //Jelenleg csak az indexedDB-s regisztrációnál van használva
  // private userOfflineQueue: any[] = [];
  private isOnline = navigator.onLine;

  // This method should be called whenever there's a change in tasks
  notifyTaskChanges() {
    this.taskChanges.emit();
  }
  
  constructor(private afs: AngularFirestore) {
    this.indexedDB = window.indexedDB || (window as any).mozIndexedDB || (window as any).webkitIndexedDB || (window as any).msIndexedDB || (window as any).shimIndexedDB;
    window.addEventListener('online', () => this.handleOnlineStatusChange(true));
    window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    // window.addEventListener('sync', () => this.syncDataToFirebase());
    this.openDatabase();
  }

  // processUserOfflineQueue() {
  //   console.log("ITT IS JÁR")
  //   console.log(this.userOfflineQueue.length);
  //   if (navigator.onLine && this.userOfflineQueue.length > 0) {
  //     this.userOfflineQueue.forEach((user) => {
  //       console.log(user);
  //       this.createUserFirebase(user);
  //     });
  //     this.userOfflineQueue = [];
  //   }
  // }

  //Nincs használva, mert az offline regisztráció és bejelentkezés nem biztonságos szinkronizáció szempontjából
  // signupUserIndexedDB(user: User): Promise<boolean>{
  //   // console.log('User object:', user);
  //   return new Promise((resolve, reject) => {
  //     this.withDatabase((db) => {
  //       const transaction = db.transaction('users', 'readwrite');
  //       const store = transaction.objectStore('users');
  //       const addNewUser = store.put(user);

  //       addNewUser.onsuccess = (event) => {
  //         console.error('Added user successfully:', event);
  //         this.userOfflineQueue.push(user);
  //         resolve(true);
  //       };
  //       addNewUser.onerror = (event) => {
  //         console.error('Error getting user:', event);
  //         reject(false);
  //       };
  //     });
  //   });
  // }

  //KÉSZ
  createUserFirebase(user: User){
    return this.afs.collection<User>("Users").doc(user.id ? user.id as string : "null").set(user);
  }

  //KÉSZ
  private handleOnlineStatusChange(isOnline: boolean): void {
    this.isOnline = isOnline;

    if (isOnline) {
      this.syncDataToFirebase();
      console.log("ONLINE");
    }
    else{
      console.log("OFFLINE");
    }
  }

  //KÉSZ
  openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
      } else {
        const request = this.indexedDB.open('task_management', 1);

        request.onerror = (event) => {
          console.error('Error opening database:', event);
          reject(event);
        };

        request.onupgradeneeded = (event) => {
          this.db = (event.target as any).result;
          if (!this.db.objectStoreNames.contains('single_tasks')) {
            const storeSingleTask = this.db.createObjectStore('single_tasks', {
              keyPath: 'id', autoIncrement: true,
            });
            storeSingleTask.createIndex('taskGroupID', 'taskGroupID', {
              unique: false,
            });
            storeSingleTask.createIndex('userID', 'userID', { unique: false });
          }
          if (!this.db.objectStoreNames.contains('task_groups')) {
            const storeTaskGroup = this.db.createObjectStore('task_groups', {
              keyPath: 'id', autoIncrement: true,
            });
            storeTaskGroup.createIndex('userID', 'userID', { unique: false });
          }
          if (!this.db.objectStoreNames.contains('users')) {
            const storeUser = this.db.createObjectStore('users', {
              keyPath: 'id', autoIncrement: true,
            });
            storeUser.createIndex('email', 'email', { unique: true });
          }
          if (!this.db.objectStoreNames.contains('offline_queue')) {
            const storeOfflineQueue = this.db.createObjectStore('offline_queue', {
              keyPath: 'id', autoIncrement: true,
            });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as any).result;
          console.log('Database opened successfully!');
          resolve(this.db);
        };
      }
    });
  }

  //KÉSZ
  withDatabase(callback: (db: IDBDatabase) => void): Promise<void> {
    return this.openDatabase().then((db) => {
      return new Promise<void>((resolve) => {
        const transaction = db.transaction('single_tasks', 'readwrite');
        const store = transaction.objectStore('single_tasks');
        callback(db);
        resolve();
      });
    });
  }

  // initDatabase(): Promise<void> {
  //   console.log("initDatabase");
  //   return this.openDatabase().then((db) => {
  //     return new Promise<void>((resolve) => {
  //       const transaction = this.db.transaction('single_tasks', 'readwrite');
  //       const store = transaction.objectStore('single_tasks');
  //       resolve();
  //     });
  //   });
  // }

  //KÉSZ
  getSingleTasksIDB(): Observable<Task[]> {
    // console.log("getSingleTasksIDB");
    return new Observable<Task[]>((observer) => {
      this.withDatabase((db) => {
        const transaction = db.transaction('single_tasks', 'readwrite');
        const store = transaction.objectStore('single_tasks');
        const taskGroupIDIndex = store.index('taskGroupID');
        const keyRange = IDBKeyRange.only(0);
        const getAllRequest = taskGroupIDIndex.getAll(keyRange);
        getAllRequest.onsuccess = (event) => {
          const result: Task[] = getAllRequest.result;
          observer.next(result);
          observer.complete();
        };
  
        getAllRequest.onerror = (event) => {
          console.error('Error getting task groups:', event);
          observer.error(event);
        };
      });
    });
  }

  //KÉSZ
  updateSingleTaskIDB(task: Task, callback: () => void): void{
    // console.log("updateSingleTaskIDB");
    this.withDatabase((db) => {
      const transaction = db.transaction('single_tasks', 'readwrite');
      const store = transaction.objectStore('single_tasks');
      const getRequest = store.get(task.id as IDBValidKey);

      getRequest.onsuccess = (event) => {
        const existingTask = getRequest.result;

        if (existingTask) {
          this.addDataToOfflineQueueIDB(task, "update", "task");
          existingTask.title = task.title;
          existingTask.isDone = task.isDone;
          existingTask.date = task.date;
          existingTask.priority = task.priority;
          existingTask.taskGroupID = task.taskGroupID;

          const putRequest = store.put(existingTask);

          putRequest.onsuccess = (event) => {
            console.log('Task updated successfully:', existingTask);
            callback();
            this.notifyTaskChanges();
          };

          putRequest.onerror = (event) => {
            console.error('Error updating task:', event);
          };
        } else {
          console.error('Task not found:', task.id);
        }
      };
      getRequest.onerror = (event) => {
        console.error('Error getting task:', event);
      };
    });
  }

  //KÉSZ
  updateTaskGroupIDB(taskGroup: TaskGroup, callback: () => void): void{
    // console.log("updateTaskGroupIDB");
    // console.log(taskGroup.id);
    this.withDatabase((db) => {
      const transaction = db.transaction('task_groups', 'readwrite');
      const store = transaction.objectStore('task_groups');
      const getRequest = store.get(taskGroup.id as IDBValidKey);

      getRequest.onsuccess = (event) => {
        const existingTaskGroup = getRequest.result;

        if (existingTaskGroup) {
          this.addDataToOfflineQueueIDB(taskGroup, "update", "taskGroup");
          existingTaskGroup.name = taskGroup.name;

          const putRequest = store.put(existingTaskGroup);

          putRequest.onsuccess = (event) => {
            console.log('TaskGroup updated successfully:', existingTaskGroup);
            callback();
            this.notifyTaskChanges();
          };

          putRequest.onerror = (event) => {
            console.error('Error updating task:', event);
          };
        } else {
          console.error('Task not found:', taskGroup.id);
        }
      };
      getRequest.onerror = (event) => {
        console.error('Error getting task:', event);
      };
    });
  }

  //KÉSZ
  deleteSingleTaskIDB(task: Task, callback: () => void): void{
    // console.log("deleteSingleTaskIDB");
    this.withDatabase((db) => {
      const transaction = db.transaction('single_tasks', 'readwrite');
      const store = transaction.objectStore('single_tasks');
      const deleteTask = store.delete(task.id as IDBValidKey);

      deleteTask.onsuccess = (event) => {
        this.addDataToOfflineQueueIDB(task, "delete", "task");
        console.error('Deleted task successfully:', event);
        
        callback();

        // Emit an event to notify subscribers about the task change
        this.notifyTaskChanges();
      };
      deleteTask.onerror = (event) => {
        console.error('Error getting task:', event);
      };
    });
  }

  //KÉSZ
  deleteTaskGroupIDB(taskGroup: TaskGroup, callback: () => void): void {
    // console.log("deleteTaskGroupIDB");
    if (taskGroup.id === undefined) {
          return;
    }
    else{

    this.withDatabase((db) => {
      const transaction = db.transaction(['task_groups', 'single_tasks'], 'readwrite');
      const taskGroupStore = transaction.objectStore('task_groups');
      const singleTaskStore = transaction.objectStore('single_tasks');
      const taskGroupIDIndex = singleTaskStore.index('taskGroupID');
      const deleteTaskGroupRequest = taskGroupStore.delete(taskGroup.id as IDBValidKey);
  
      deleteTaskGroupRequest.onsuccess = (event) => {
        this.addDataToOfflineQueueIDB(taskGroup, "delete", "taskGroup");
        console.error('Deleted task group successfully:', event);
  
        const keyRange = IDBKeyRange.only(taskGroup.id);
        const getAllRequest = taskGroupIDIndex.getAll(keyRange);
  
        getAllRequest.onsuccess = (event) => {
          const result: Task[] = getAllRequest.result;
          result.forEach(singleTask => {
            this.addDataToOfflineQueueIDB(singleTask, "delete", "task");
            singleTaskStore.delete(singleTask.id as IDBValidKey);
          });
  
          callback();
  
          // Emit an event to notify subscribers about the task change
          this.notifyTaskChanges();
        };
  
        getAllRequest.onerror = (event) => {
          console.error('Error getting task groups:', event);
        };
      };
  
      deleteTaskGroupRequest.onerror = (event) => {
        console.error('Error deleting task group:', event);
      };
    });
  }
  }

  //KÉSZ
  addTaskGroupIDB(taskGroup: TaskGroup, callback: () => void): void{
    // console.log("addTaskGroupIDB");
    this.withDatabase((db) => {
      const transaction = db.transaction('task_groups', 'readwrite');
      const store = transaction.objectStore('task_groups');
      const addNewTaskGroup = store.put(taskGroup);

      addNewTaskGroup.onsuccess = (event) => {        
        var generatedId = (event.target as any).result;
        taskGroup.id = generatedId;
        this.addDataToOfflineQueueIDB(taskGroup, "add", "taskGroup");
        console.error('Added task successfully:', event);
        callback();
        // Emit an event to notify subscribers about the task change
        this.notifyTaskChanges();
      };
      addNewTaskGroup.onerror = (event) => {
        console.error('Error getting task:', event);
      };
    });
  }

  //KÉSZ
  addTaskIDB(task: Task, callback: () => void): void{
    // console.log("addTaskIDB");
    this.withDatabase((db) => {
      const transaction = db.transaction('single_tasks', 'readwrite');
      const store = transaction.objectStore('single_tasks');
      const addNewTask = store.put(task);

      addNewTask.onsuccess = (event) => {
        var generatedId = (event.target as any).result;
        task.id = generatedId;
        this.addDataToOfflineQueueIDB(task, "add", "task");
        console.error('Added task successfully:', event);
        callback();
        // Emit an event to notify subscribers about the task change
        this.notifyTaskChanges();
      };
      addNewTask.onerror = (event) => {
        console.error('Error getting task:', event);
      };
    });
  }

  //KÉSZ
  getTaskGroupSingleIDB(taskGroup: TaskGroup) : Task[]{
    // console.log("getTaskGroupSingleIDB");
    let singleTasks: Task[] = [];
    this.withDatabase((db) => {
      const transaction = db.transaction('single_tasks', 'readwrite');
      const store = transaction.objectStore('single_tasks');
      const taskGroupIDIndex = store.index('taskGroupID');
      const keyRange = IDBKeyRange.only(taskGroup.id);
      const getAllRequest = taskGroupIDIndex.getAll(keyRange);
      getAllRequest.onsuccess = (event) => {
        const result: Task[] = getAllRequest.result;
        singleTasks.push(...result);
        // singleTasks.forEach(element => {
        // });
      };
    });

    return singleTasks;
  } 

  //KÉSZ
  getUsersTaskGroupsIDB(): Observable<TaskGroup[]> {
    // console.log("getUsersTaskGroupsIDB");
    return new Observable<TaskGroup[]>((observer) => {
      this.withDatabase((db) => {
        const transaction = db.transaction('task_groups', 'readwrite');
        const store = transaction.objectStore('task_groups');
        const getAllRequest = store.getAll();
  
        getAllRequest.onsuccess = (event) => {
          const result: TaskGroup[] = getAllRequest.result;
          observer.next(result);
          observer.complete();
        };
  
        getAllRequest.onerror = (event) => {
          console.error('Error getting task groups:', event);
          observer.error(event);
        };
      });
    });
  }

  //KÉSZ
  addSingleTaskFirebase(task: Task){
    task.id = this.afs.createId();
    return this.afs.collection<Task>("Tasks").doc(task.id).set(task);
  }

  //KÉSZ
  addTaskGroupFirebase(taskGroup: TaskGroup){
    taskGroup.id = this.afs.createId();
    return this.afs.collection<TaskGroup>("TaskGroups").doc(taskGroup.id).set(taskGroup);
  }

  //KÉSZ
  getUserSingleTasksFirebase(userID: string){
    return this.afs.collection<Task>("Tasks", ref => ref.where('userID', "==", userID).where('taskGroupID', "==", 0)).valueChanges();
  }

  //KÉSZ
  getUserTaskGroupsFirebase(userID: string){
    return this.afs.collection<TaskGroup>("TaskGroups", ref => ref.where('userID', "==", userID)).valueChanges();
  }

  //KÉSZ
  getUserTaskGroupsSingleFirebase(userID: string, taskGroupID: string){
    return this.afs.collection<Task>("Tasks", ref => ref.where('userID', "==", userID).where('taskGroupID', "==", taskGroupID)).valueChanges();
  }

  //KÉSZ
  deleteSingleTaskFirebase(taskID: string){
    console.log("Single DELETED FIREBASE");
    this.afs.collection<Task>("Tasks").doc(taskID).delete();
  }

  //KÉSZ
  deleteTaskGroupFirebase(taskGroupID: string, userID: string){
    console.log("DELETING TASKGROUP FIREBASE");
    //a feltöltött verzióban user_id van userID helyett és ezért nem törlődnek a group-al együtt a taskok is
    const tasksCollectionRef = this.afs.collection<Task>("Tasks", ref =>
    ref.where('userID', '==', userID).where('taskGroupID', '==', taskGroupID)
    );
    tasksCollectionRef.snapshotChanges().subscribe(tasksSnapshot => {
      console.log(tasksSnapshot);
      tasksSnapshot.forEach(taskSnapshot => {
        const taskData = taskSnapshot.payload.doc.data() as Task;
        const taskID = taskSnapshot.payload.doc.id;

        this.deleteSingleTaskFirebase(taskID);
      });
    });
    // console.log(taskGroupID);
    this.afs.collection<TaskGroup>("TaskGroups").doc(taskGroupID).delete();
  }

  //KÉSZ
  updateSingleTaskFirebase(task: Task){
    return this.afs.collection<Task>("Tasks").doc(task.id as string).set(task);
  }

  //KÉSZ
  updateTaskGroupFirebase(taskGroup: TaskGroup){
    return this.afs.collection<TaskGroup>("TaskGroups").doc(taskGroup.id as string).set(taskGroup);
  }

  //---------------------------------------------------------------

  //KÉSZ
  getUserDataFromFirebaseAndMirror(user: firebase.default.User) {
    // console.log(user.uid);
    // this.getAllDataFromFirebase("Users", "id", user.uid).then(data => {
    //   const users = data;
    //   this.initDatabaseTableContents(users, "users");
    // });
    this.getAllDataFromFirebase("TaskGroups", "userID", user.uid).then(data => {
      const taskGroups = data;
      this.initDatabaseTableContents(taskGroups, "task_groups");
      console.log("Mirrored TaskGroups successfully!");
    });
    this.getAllDataFromFirebase("Tasks", "userID", user.uid).then(data => {
      const tasks = data;
      this.initDatabaseTableContents(tasks, "single_tasks");
      console.log("Mirrored Tasks successfully!");
    });
  }

  //KÉSZ
  initDatabaseTableContents(data: any[], table: string): void {
    this.withDatabase((db) => {
      const transaction = db.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      store.clear();
      data.forEach(d => {
        const add = store.put(d);

        add.onsuccess = (event) => {
          // console.error('Added task successfully:', event);
        };
        add.onerror = (event) => {
          console.error('Error getting task:', event);
        };
      })
    });
  }

  //KÉSZ
  getAllDataFromFirebase(collectionName: string, searchBy: string, userID: string): Promise<any[]> {
    return this.afs.collection(collectionName, ref => ref.where(searchBy, "==", userID)).get().toPromise()
      .then((querySnapshot) => {
        const data: any[] = [];
        querySnapshot?.forEach((doc) => {
          data.push(doc.data());
        });
        return data;
      })
      .catch((error) => {
        console.error('Error getting data from Firebase:', error);
        throw error;
      });
  }

  //KÉSZ
  addDataToOfflineQueueIDB(data: any, type: string, model: string): void{
    this.withDatabase((db) => {
      const transaction = db.transaction('offline_queue', 'readwrite');
      const store = transaction.objectStore('offline_queue');
      const d = {
        data: data,
        type: type,
        model: model
      }
      const offlineQueue = store.put(d);

      offlineQueue.onsuccess = (event) => {
        console.error('Added data successfully to offlineQueue:', event);
      };
      offlineQueue.onerror = (event) => {
        console.error('Error adding data to offlineQueue:', event);
      };
    });
  }

  //KÉSZ
  checkIFOfflineQueueIsEmpty(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.withDatabase((db) => {
        const transaction = db.transaction('offline_queue', 'readwrite');
        const store = transaction.objectStore('offline_queue');
        const offlineQueueNum = store.count();
  
        offlineQueueNum.onsuccess = function (event) {
          const count = (event.target as IDBRequest).result ?? 0;
          if (count === 0) {
            console.log('The table is empty.');
            resolve(true);
          } else {
            console.log('The table is not empty. It has ' + count + ' records.');
            resolve(false);
          }
        };
  
        offlineQueueNum.onerror = function (event) {
          console.error('Error checking offline queue: ' + (event.target as IDBRequest).error);
          reject(false);
        };
      });
    });
  }

  //KÉSZ
  syncDataToFirebase(): void {
    this.withDatabase((db) => {
      const transaction = db.transaction('offline_queue', 'readwrite');
      const store = transaction.objectStore('offline_queue');
      const offlineQueue = store.getAll();
      var addOfflineQueue: any[] = [];
      var updateOfflineQueue: any[] = [];
      var deleteOfflineQueue: any[] = []; 
  
      offlineQueue.onsuccess = (event) => {
        offlineQueue.result.forEach(data => {
          // console.log("ELSO OFFLINE QUEUE LEKERES");
          if(data.model === "task" || data.model === "taskGroup"){
            if(data.type === "add"){
              addOfflineQueue.push(data);
            }
          }
        });
        this.syncAddTypesToFirebase(addOfflineQueue).then(() => {
          const newTransaction = db.transaction('offline_queue', 'readwrite');
          const newStore = newTransaction.objectStore('offline_queue');
          const newOfflineQueue = newStore.getAll();

          newOfflineQueue.onsuccess = (event) => {
            // console.log("newOfflineQueue", newOfflineQueue.result);
            // console.log("MASODIK OFFLINE QUEUE LEKERES");
            newOfflineQueue.result.forEach(data => {
              if(data.model === "task"){
                switch(data.type)
                {
                  case "delete":
                    deleteOfflineQueue.push(data);
                    // console.log("delete task sync");
                    break;
                  case "update":
                    updateOfflineQueue.push(data);
                    // console.log("update task sync");
                    break;
                }
              }
              else if(data.model === "taskGroup"){
                switch(data.type)
                {
                  case "delete":
                    deleteOfflineQueue.push(data);
                    // console.log("delete taskGroup sync");
                    break;
                  case "update":
                    updateOfflineQueue.push(data);
                    // console.log("update taskGroup sync");
                    break;
                }
              }
            });
            this.syncUpdateTypesToFirebase(updateOfflineQueue);
            this.syncDeleteTypesToFirebase(deleteOfflineQueue);
        
        };
      }).catch((error) => {
        console.error('Error during syncAddTypesToFirebase:', error);
      });
      };
      offlineQueue.onerror = (event) => {
        console.error('Error adding change to offline queue:', event);
      };
    });
  }

  //KÉSZ
  syncAddTypesToFirebase(data: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const addPromises: Promise<void>[] = [];
        var syncSingleTasks: any[] = [];
        var syncTaskGroups: any[] = [];
        data.forEach(d => {
          if(d.model === "task"){
            syncSingleTasks.push(d);
          }
          else if(d.model === "taskGroup"){
            syncTaskGroups.push(d);
          }
        });
        syncTaskGroups.forEach(dd => {
          const addPromise = this.addTaskGroupFirebaseWhenSync(dd.data, dd.data.id)
              .then(() => this.deleteDataFromOfflineQueueIDB(dd.id));
            addPromises.push(addPromise);
        });
        syncSingleTasks.forEach(dd => {
          const addPromise = this.addSingleTaskFirebaseWhenSync(dd.data, dd.data.id)
              .then(() => this.deleteDataFromOfflineQueueIDB(dd.id));
            addPromises.push(addPromise);
        });

        Promise.all(addPromises)
          .then(() => resolve())
          .catch((error) => reject(error));
      } catch (e) {
        reject(e);
      }
    });
  }

  //KÉSZ
  addSingleTaskFirebaseWhenSync(task: Task, offlineQueueID: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      task.id = this.afs.createId();
      this.changeIDWhileSyncOnUpdateTypes(offlineQueueID, task.id)
        .then(() => this.afs.collection<Task>("Tasks").doc(task.id as string).set(task))
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  //KÉSZ
  addTaskGroupFirebaseWhenSync(taskGroup: TaskGroup, offlineQueueID: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      taskGroup.id = this.afs.createId();
      this.changeIDWhileSyncOnUpdateTypes(offlineQueueID, taskGroup.id)
        .then(() => this.afs.collection<TaskGroup>("TaskGroups").doc(taskGroup.id as string).set(taskGroup))
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  //KÉSZ
  changeIDWhileSyncOnUpdateTypes(offlineQueueID: number, firebaseID: string): Promise<boolean>{
    return new Promise((resolve, reject) => {
      this.withDatabase((db) => {
        const transaction = db.transaction('offline_queue', 'readwrite');
        const store = transaction.objectStore('offline_queue');
        const forUpdate = store.getAll();
        var toUpdateID: any[] = [];
        var toUpdateTaskGroupID: any[] = [];
        forUpdate.onsuccess = (event) => {
          forUpdate.result.forEach(data => {
            if(data.data.id === offlineQueueID){
              toUpdateID.push(data);
            }
            if(data.data.taskGroupID === offlineQueueID){
              toUpdateTaskGroupID.push(data);
            }
          });
          toUpdateID.forEach(d => {
            let a = store.get(d.id);
            a.onsuccess = (event) => {
              var exists = a.result;
              if(exists){
                exists.data.id = firebaseID;
                store.put(exists);
              }
            };
            a.onerror = (event) => {
              console.error('Error while syncing:', event);
            }
          });
          toUpdateTaskGroupID.forEach(d => {
            let a = store.get(d.id);
            a.onsuccess = (event) => {
              var exists = a.result;
              if(exists){
                exists.data.taskGroupID = firebaseID;
                store.put(exists);
              }
            };
            a.onerror = (event) => {
              console.error('Error while syncing:', event);
            }
          });
          // console.log("ITT FUT LE AZ ID RESOLVE");
          resolve(true);
        };
        forUpdate.onerror = (event) => {
          console.error('Error getting task:', event);
          reject(false);
        };
      });
    });
  }

  //KÉSZ
  syncUpdateTypesToFirebase(dataList: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const updatePromises: Promise<void>[] = [];
        dataList.forEach(data => {
          // console.log("UPDATE SYNC");
          // console.log(data);
          if (data.model === "task") {
            const updatePromise = this.updateSingleTaskFirebase(data.data)
              .then(() => this.deleteDataFromOfflineQueueIDB(data.id));
            updatePromises.push(updatePromise);
          } else if (data.model === "taskGroup") {
            const updatePromise = this.updateTaskGroupFirebase(data.data)
              .then(() => this.deleteDataFromOfflineQueueIDB(data.id));
            updatePromises.push(updatePromise);
          }
        });

        Promise.all(updatePromises)
          .then(() => resolve())
          .catch((error) => {
            console.error('Error in syncUpdateTypesToFirebase:', error);
            reject(error);
          });
      } catch (e) {
        console.error('Unexpected error in syncUpdateTypesToFirebase:', e);
        reject(e);
      }
      });
  }

  //????
  // updateSingleTaskFirebaseWhileSync(task: Task) : Promise<void> {
  //   // console.log("UPDATE SINGLE TASK");
  //   // console.log(task);
  //   return this.afs.collection("Tasks").doc(task.id as string).update(task);
  // }

  //KÉSZ
  syncDeleteTypesToFirebase(data: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const deletePromises: Promise<void>[] = [];
  
        data.forEach(data => {
          // console.log("DELETE SYNC");
          // console.log(data);
          if (data.model === "task") {
            const deletePromise = this.deleteSingleTaskFirebaseWhileSync(data.data.id)
              .then(() => this.deleteDataFromOfflineQueueIDB(data.id));
            deletePromises.push(deletePromise);
          } else if (data.model === "taskGroup") {
            const deletePromise = this.deleteTaskGroupFirebaseWhileSync(data.data.id, data.data.userID)
              .then(() => this.deleteDataFromOfflineQueueIDB(data.id));
            deletePromises.push(deletePromise);
          }
        });
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch((error) => reject(error));
      } catch (e) {
        reject(e);
      }
    });
  }

  //KÉSZ
  deleteSingleTaskFirebaseWhileSync(taskID: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.afs.collection<Task>("Tasks").doc(taskID).delete()
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  //KÉSZ
  deleteTaskGroupFirebaseWhileSync(taskGroupID: string, userID: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tasksCollectionRef = this.afs.collection<Task>("Tasks", ref =>
        ref.where('user_id', '==', userID).where('taskGroupID', '==', taskGroupID)
      );
  
      const tasksDeletionPromises: Promise<void>[] = [];
  
      tasksCollectionRef.snapshotChanges().subscribe(tasksSnapshot => {
        tasksSnapshot.forEach(taskSnapshot => {
          const taskData = taskSnapshot.payload.doc.data() as Task;
          const taskID = taskSnapshot.payload.doc.id;
  
          const taskDeletionPromise = this.deleteSingleTaskFirebaseWhileSync(taskID);
          tasksDeletionPromises.push(taskDeletionPromise);
        });
  
        // Wait for all task deletion promises to complete before deleting the task group
        Promise.all(tasksDeletionPromises)
          .then(() => {
            // console.log(taskGroupID);
            return this.afs.collection<TaskGroup>("TaskGroups").doc(taskGroupID).delete();
          })
          .then(() => resolve())
          .catch((error) => reject(error));
      });
    });
  }


  //KÉSZ
  deleteDataFromOfflineQueueIDB(deleteID: number): void{
    this.withDatabase((db) => {
      const transaction = db.transaction('offline_queue', 'readwrite');
      const store = transaction.objectStore('offline_queue');
      const deleteFromOfflineQueue = store.delete(deleteID);
      
      deleteFromOfflineQueue.onsuccess = (event) => {
        console.log('Successfully deleted from offline queue:');
      };
  
      deleteFromOfflineQueue.onerror = (event) => {
        console.error('Error deleting from offline queue:', event);
      };
    });
  }
}