import { Injectable, Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

/**
 * Publica eventos de negocio en SNS (arquitectura event-driven / serverless).
 * Es best-effort: si SNS no está configurado o falla, NO rompe el flujo principal
 * (la operación de préstamo/pago ya está confirmada en la BD relacional).
 *
 * En desarrollo apunta a LocalStack vía AWS_ENDPOINT_URL.
 */
@Injectable()
export class EventsPublisher {
  private readonly logger = new Logger(EventsPublisher.name);
  private readonly topicArn = process.env.LOAN_EVENTS_TOPIC_ARN;
  private readonly client?: SNSClient;

  constructor() {
    if (this.topicArn) {
      this.client = new SNSClient({
        region: process.env.AWS_REGION || 'us-east-1',
        endpoint: process.env.AWS_ENDPOINT_URL || undefined, // LocalStack en dev
      });
      this.logger.log(`EventsPublisher activo → ${this.topicArn}`);
    } else {
      this.logger.warn(
        'LOAN_EVENTS_TOPIC_ARN no definido: la publicación de eventos está deshabilitada.',
      );
    }
  }

  async publish(type: string, detail: Record<string, any>): Promise<void> {
    if (!this.client || !this.topicArn) return;
    try {
      await this.client.send(
        new PublishCommand({
          TopicArn: this.topicArn,
          Message: JSON.stringify({ type, ...detail, occurredAt: new Date().toISOString() }),
          MessageAttributes: {
            type: { DataType: 'String', StringValue: type },
          },
        }),
      );
      this.logger.log(`📤 Evento publicado: ${type}`);
    } catch (err: any) {
      this.logger.error(`No se pudo publicar el evento ${type}: ${err?.message}`);
    }
  }
}
