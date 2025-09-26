import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserExternalPort } from '../../../../../domain/ports/out/user-external.port';

@Injectable()
export class UserHttpAdapter implements UserExternalPort {
  constructor(private readonly httpService: HttpService) {}

  async getUser (id: string): Promise<{ id: string; role: string } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`http://${process.env.USER_SERVICE_URL || 'localhost:3001'}/users/${id}`),
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }
}