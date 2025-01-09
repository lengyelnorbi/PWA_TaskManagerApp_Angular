import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const user = JSON.parse(localStorage.getItem('user') as string);
  if (user) {
    return true;
  } else {
    window.location.href = '/not-found';
    return false;
  }
};
