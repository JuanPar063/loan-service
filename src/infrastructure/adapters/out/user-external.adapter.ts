import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserExternalPort } from '../../../domain/ports/out/user-external.port';

@Injectable()
export class UserExternalAdapter implements UserExternalPort {
  constructor(private readonly httpService: HttpService) {}

  async getUser(id: string): Promise<{ id: string; role: string } | null> {
    try {
      // Assume external user service at http://user-service/users/{id}
      const response = await firstValueFrom(
        this.httpService.get(`http://user-service/users/${id}`)
      );
      return response.data;
    } catch (error) {
      // If external service fails, return null or handle error
      console.error('Error fetching user from external service:', error);
      return null;
    }
  }
}