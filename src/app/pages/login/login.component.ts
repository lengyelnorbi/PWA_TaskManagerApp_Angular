import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { Validators } from '@angular/forms';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = new FormControl('', [Validators.required]);
  password = new FormControl('', [Validators.required, Validators.minLength(6)]);

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
  }

  async login() {
    await this.authService.loginFirebase(this.email.value as string, this.password.value as string).then(cred =>{
      this.router.navigateByUrl("task-list");
    }).catch(error =>{
      console.error(error);
    })
  }

  ngOnDestroy() {
  }
}
