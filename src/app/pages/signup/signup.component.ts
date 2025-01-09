import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models/User';
// import { UserService } from '../../shared/services/user.service';
import { Router } from '@angular/router';
import { TaskManagementService } from 'src/app/shared/services/task-management.service';
import { Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy {
  subscription?: Subscription;
  confPwd: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const password = control.parent?.get('password')?.value;
    const rePassword = control.parent?.get('rePassword')?.value;
    console.log(password === rePassword);
    return password === rePassword ? null : { pwdNoMatch: true };
  };

  signUpForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    rePassword: new FormControl('', [Validators.required, Validators.minLength(6), this.confPwd]),
    name: new FormGroup({
      firstname: new FormControl('', [Validators.required]),
      lastname: new FormControl('', [Validators.required])
    })
  });

  constructor(private location: Location, private authService: AuthService, private router: Router, private taskManagement: TaskManagementService) { }

  ngOnInit(): void {
    this.subscription = this.signUpForm.get('password')?.valueChanges.subscribe(() => {
      this.signUpForm.get('rePassword')?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if(this.signUpForm.valid){
      if(navigator.onLine){
        this.authService.signupFirebase(this.signUpForm.get('email')?.value as string, this.signUpForm.get('password')?.value as string).then(cred => {
          console.log(cred);
          const user: User = {
            id: cred.user?.uid as string,
            email: this.signUpForm.get('email')?.value as string,
            username: (this.signUpForm.get('email')?.value as string).split('@')[0],
            name: {
              firstname: this.signUpForm.get('name.firstname')?.value as string,
              lastname: this.signUpForm.get('name.lastname')?.value as string
            }
          }
          this.taskManagement.createUserFirebase(user).then(_ => {
            this.router.navigateByUrl('/login');
          }).catch(error => {
            console.error(error);
          })
        }).catch(error => {
          console.error(error);
        })
      }
      else{
        // const user2: User = {
        //   email: this.signUpForm.get('email')?.value as string,
        //   username: (this.signUpForm.get('email')?.value as string).split('@')[0],
        //   name: {
        //     firstname: this.signUpForm.get('name.firstname')?.value as string,
        //     lastname: this.signUpForm.get('name.lastname')?.value as string
        //   }
        // }
        // this.taskManagement.signupUserIndexedDB(user2).then(success => {
        //   this.router.navigateByUrl('/login');
        // })
        // .catch(error => {
        //   console.error(error);
        // });
      }
    }
  }

  goBack() {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
