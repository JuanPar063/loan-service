export interface UserExternalPort {
  getUser (id: string): Promise<{ id: string; role: string } | null>;
}