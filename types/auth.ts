/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2026-02-07 10:05:28
 * @LastEditors: ouchao
 * @LastEditTime: 2026-02-07 10:50:33
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string; // Optional for Google auth flow abstraction
}

export interface RegisterCredentials {
  email: string;
  password?: string;
  name?: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  leagueId: string;
}
