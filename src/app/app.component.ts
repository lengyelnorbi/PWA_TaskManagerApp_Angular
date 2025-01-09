import { Component, OnDestroy } from '@angular/core';
import { AuthService } from './shared/services/auth.service';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter, interval, timestamp } from 'rxjs';
import { User } from 'firebase/auth';
import { SwUpdate } from "@angular/service-worker";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  title = 'TaskManagerApp';
  page = '';
  routes: Array<string> = [];
  loggedInUser?: firebase.default.User | null;
  id?: string | null;
  subscription?: Subscription;

  constructor(private router: Router, private authService: AuthService, private swUpdate: SwUpdate) {
  }

  ngOnInit() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/ngsw-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }

    this.subscription = interval(3000).subscribe(() => {
      // Összehasonlítja a szerver-kliens manifest fájlokat
      this.swUpdate.checkForUpdate().then(update => {
        /*
        Ha történt módosítás (új alkalmazás verzió érhető el),
        újratölti az alkalmazást és betölti az új/módosított fájlokat
        */
        if (update) {
          alert('New version is available, refresh the application!');
          window.location.reload();
        }
      })
    })
    
    this.routes = this.router.config.map(conf => conf.path) as string[];

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((evts: any) => {
      const currentPage = (evts.urlAfterRedirects as string).split('/')[1] as string;
      if (this.routes.includes(currentPage)) {
        this.page = currentPage;
      }
    });
    this.authService.isUserLoggedInFirebase().subscribe(user => {
      this.loggedInUser = user;
      this.id = user?.uid;
      this.authService.setUserId(user?.uid as string);
      localStorage.setItem('user', JSON.stringify(this.loggedInUser));
    }, error =>{
      console.error(error);
      localStorage.setItem('user', JSON.stringify('null'));
    })
  }
    
  changePage(selectedPage: string) {
    this.page = selectedPage;
    this.router.navigateByUrl(selectedPage);
  }

  onToggleSidenav(sidenav: MatSidenav) {
    sidenav.toggle();
  }

  onClose(event: any, sidenav: MatSidenav) {
    if (event === true) {
      sidenav.close();
    }
  }

  logout(_?: boolean) {
    this.authService.logoutFirebase().then(() => {
      // console.log("Logged out!");
      localStorage.setItem('user', JSON.stringify('null'));
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/login']);
        window.location.reload();
      });
    }).catch(error => {
      console.error(error);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
