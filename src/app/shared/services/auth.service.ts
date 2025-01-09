import { Injectable } from '@angular/core';
import { User } from '../models/User';
import { TaskManagementService } from './task-management.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user_id: string = "";
  collectionName = "Users";

  setUserId(uid: string){
    this.user_id = uid;
  }

  getUserId(){
    return this.user_id;
  }

  constructor(private taskManagement: TaskManagementService, private auth: AngularFireAuth, private afs: AngularFirestore) { }

  signupFirebase(email: string, password: string){
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  loginFirebase(email: string, password: string){
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  logoutFirebase(){
    return this.auth.signOut();
  }

  isUserLoggedInFirebase(){
    return this.auth.user;
  }
  
  // loginIndexedDB(email: string, password: string){
  //   return null
  // }

  // logoutIndexedDB(){
  //   return null
  // }

  // isUserLoggedInIndexedDB(){
  //   return null
  // }
}
