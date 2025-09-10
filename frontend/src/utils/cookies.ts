import Cookies from 'js-cookie';

export const setCookie = (name: string, value: string, days: number = 7) => {
  Cookies.set(name, value, { 
    expires: days, 
    path: '/',
    sameSite: 'Lax'
  });
};

export const getCookie = (name: string): string | null => {
  return Cookies.get(name) || null;
};

export const deleteCookie = (name: string) => {
  Cookies.remove(name, { path: '/' });
};
