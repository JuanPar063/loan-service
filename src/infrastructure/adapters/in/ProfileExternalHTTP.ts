// loan-service/src/infrastructure/adapters/in/ProfileExternalHTTP.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axiosRetry from 'axios-retry';
import CircuitBreaker from 'opossum';

export interface ProfileResponse {
  id_profile: string;
  id_user: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  phone: string;
  address: string;
  monthly_income?: number;
  created_at?: string;
  updated_at?: string;
  // true cuando se devuelve un perfil degradado porque user-service no respondió.
  degraded?: boolean;
}

const DEGRADED_PROFILE = (userId: string): ProfileResponse => ({
  id_profile: '',
  id_user: userId,
  first_name: 'Usuario',
  last_name: 'Desconocido',
  document_type: 'N/A',
  document_number: 'N/A',
  phone: 'N/A',
  address: 'N/A',
  degraded: true,
});

@Injectable()
export class ProfileExternalAdapter {
  private readonly logger = new Logger(ProfileExternalAdapter.name);
  private readonly baseUrl: string;
  private readonly profileBreaker: CircuitBreaker<[string], ProfileResponse>;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3000';

    // Reintentos automáticos ante errores de red o 5xx (no 4xx).
    axiosRetry(this.httpService.axiosRef, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response?.status ?? 0) >= 500,
    });

    // Circuit breaker: si user-service falla repetidamente, se "abre" y devuelve
    // un perfil degradado en vez de saturar al servicio caído.
    this.profileBreaker = new CircuitBreaker(
      (userId: string) => this.fetchProfile(userId),
      {
        timeout: parseInt(process.env.PROFILE_TIMEOUT_MS || '5000', 10),
        errorThresholdPercentage: 50,
        resetTimeout: parseInt(process.env.PROFILE_RESET_MS || '10000', 10),
        // Un 404 (usuario sin perfil) NO es un fallo del servicio: no debe abrir el circuito.
        errorFilter: (err: any) =>
          err instanceof NotFoundException || err?.response?.status === 404,
      },
    );

    this.profileBreaker.fallback((userId: string, err: any) => {
      this.logger.warn(
        `⚠️ user-service no disponible (circuito ${this.profileBreaker.opened ? 'ABIERTO' : 'fallo'}). ` +
          `Devolviendo perfil DEGRADADO para ${userId}. Causa: ${err?.message ?? 'desconocida'}`,
      );
      return DEGRADED_PROFILE(userId);
    });

    this.profileBreaker.on('open', () =>
      this.logger.error('🔴 Circuit breaker ABIERTO hacia user-service'),
    );
    this.profileBreaker.on('halfOpen', () =>
      this.logger.warn('🟡 Circuit breaker en prueba (half-open) hacia user-service'),
    );
    this.profileBreaker.on('close', () =>
      this.logger.log('🟢 Circuit breaker CERRADO hacia user-service'),
    );
  }

  /** Llamada HTTP real (envuelta por el circuit breaker). */
  private async fetchProfile(userId: string): Promise<ProfileResponse> {
    const url = `${this.baseUrl}/api/v1/profiles/${userId}`;
    const response = await firstValueFrom(this.httpService.get(url));
    const profileData = response.data?.data || response.data;

    if (!profileData) {
      throw new NotFoundException(`Perfil no encontrado para usuario ${userId}`);
    }
    return profileData;
  }

  /**
   * Obtiene el perfil de un usuario. Resiliente: reintentos + circuit breaker.
   * Si user-service está caído devuelve un perfil DEGRADADO (con degraded: true)
   * para no romper la UI, pero el fallo queda explícito y logado (ya no se oculta).
   */
  async getProfile(userId: string): Promise<ProfileResponse> {
    try {
      return await this.profileBreaker.fire(userId);
    } catch (error: any) {
      if (error instanceof NotFoundException || error?.response?.status === 404) {
        throw new NotFoundException(`Usuario ${userId} no encontrado`);
      }
      this.logger.error(`❌ Error obteniendo perfil para ${userId}: ${error?.message}`);
      return DEGRADED_PROFILE(userId);
    }
  }

  /**
   * Obtiene el perfil por número de documento. A diferencia de getProfile, aquí
   * un fallo SÍ se propaga (la búsqueda por documento no debe devolver datos falsos).
   */
  async getProfileByDocumentNumber(documentNumber: string): Promise<ProfileResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/profiles/document/${documentNumber}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const profileData = response.data?.data || response.data;

      if (!profileData) {
        throw new NotFoundException(`Perfil no encontrado para documento ${documentNumber}`);
      }
      return profileData;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Usuario con documento ${documentNumber} no encontrado`);
      }
      this.logger.error(
        `❌ Error buscando perfil por documento ${documentNumber}: ${error?.message}`,
      );
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/v1/health/readiness`;
      await firstValueFrom(this.httpService.get(url, { timeout: 2000 }));
      return true;
    } catch (error) {
      this.logger.warn('⚠️ User Service no disponible');
      return false;
    }
  }
}
