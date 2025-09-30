export class User {
  id: string;
  role: string; // 'admin' | 'client'

  constructor(id: string, role: string) {
    this.id = id;
    this.role = role;
  }
}