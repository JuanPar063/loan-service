// loan-service/src/infrastructure/adapters/in/ProfileExternalHTTP.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ProfileResponse {
  id_profile: string;
  id_user: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  phone: string;
  address: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class ProfileExternalAdapter {
  private readonly logger = new Logger(ProfileExternalAdapter.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3000';
  }

  /**
   * Obtiene el perfil de un usuario por su ID
   */
  async getProfile(userId: string): Promise<ProfileResponse> {
    try {
      const url = `${this.baseUrl}/profiles/${userId}`;
      this.logger.debug(`🔍 Consultando perfil: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      // ✅ CORRECCIÓN: El endpoint retorna { message: "...", data: {...} }
      // Necesitamos extraer solo la data
      const profileData = response.data?.data || response.data;
      
      if (!profileData) {
        throw new NotFoundException(`Perfil no encontrado para usuario ${userId}`);
      }

      this.logger.debug(`✅ Perfil encontrado: ${profileData.first_name} ${profileData.last_name}`);
      
      return profileData;
    } catch (error: any) {
      this.logger.error(`❌ Error obteniendo perfil para ${userId}:`, error.message);
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`Usuario ${userId} no encontrado`);
      }
      
      // Si falla la comunicación, retornar objeto por defecto para evitar crashes
      this.logger.warn(`⚠️ Retornando perfil por defecto para ${userId}`);
      return {
        id_profile: '',
        id_user: userId,
        first_name: 'Usuario',
        last_name: 'Desconocido',
        document_type: 'N/A',
        document_number: 'N/A',
        phone: 'N/A',
        address: 'N/A',
      };
    }
  }

  /**
   * Obtiene el perfil por número de documento
   */
  async getProfileByDocumentNumber(documentNumber: string): Promise<ProfileResponse> {
    try {
      const url = `${this.baseUrl}/profiles/document/${documentNumber}`;
      this.logger.debug(`🔍 Buscando perfil por documento: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      // ✅ CORRECCIÓN: Extraer data del response
      const profileData = response.data?.data || response.data;
      
      if (!profileData) {
        throw new NotFoundException(`Perfil no encontrado para documento ${documentNumber}`);
      }

      this.logger.debug(`✅ Perfil encontrado: ${profileData.first_name} ${profileData.last_name}`);
      
      return profileData;
    } catch (error: any) {
      this.logger.error(`❌ Error buscando perfil por documento ${documentNumber}:`, error.message);
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`Usuario con documento ${documentNumber} no encontrado`);
      }
      
      throw error;
    }
  }

  /**
   * ✅ NUEVO: Método para validar disponibilidad del servicio
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/health`;
      await firstValueFrom(
        this.httpService.get(url, { timeout: 2000 })
      );
      return true;
    } catch (error) {
      this.logger.warn('⚠️ User Service no disponible');
      return false;
    }
  }
}