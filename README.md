# Loan Service - Servicio de Préstamos

Microservicio de gestión de préstamos para el sistema de software de préstamos, construido con **NestJS**, **TypeScript** y **arquitectura hexagonal**.

## Descripción

Este microservicio forma parte del sistema [loans-software](https://github.com/JuanPar063/loans-software) y es responsable de la lógica de negocio de los préstamos: solicitudes, aprobaciones, seguimiento y gestión del ciclo de vida de cada préstamo.

## Arquitectura Hexagonal

El proyecto implementa la arquitectura hexagonal (ports & adapters):

```
src/
├── application/
│   └── services/          # Casos de uso: solicitar, aprobar, rechazar préstamos
├── domain/                # Entidades del dominio y puertos (interfaces)
├── infrastructure/        # Controladores REST, repositorios, conexión DB
└── migrations/            # Migraciones de base de datos
```

## Tecnologías Utilizadas

- **NestJS** – Framework Node.js para el backend
- - **TypeScript** – Tipado estático
  - - **PostgreSQL** – Base de datos relacional
    - - **Docker** – Contenedorización del servicio
      - - **Jest** – Testing
       
        - ## Funcionalidades
       
        - - Solicitud y registro de nuevos préstamos
          - - Aprobación y rechazo de solicitudes
            - - Consulta del estado de un préstamo
              - - Cálculo de cuotas e intereses
                - - Historial de préstamos por usuario
                 
                  - ## Instalación
                 
                  - ```bash
                    npm install
                    ```

                    ## Ejecución

                    ```bash
                    # Desarrollo
                    npm run start:dev

                    # Producción
                    npm run start:prod
                    ```

                    ## Tests

                    ```bash
                    npm run test
                    npm run test:e2e
                    npm run test:cov
                    ```

                    ## Parte del Ecosistema

                    - [loans-software](https://github.com/JuanPar063/loans-software) – Orquestador principal
                    - - [user-service](https://github.com/JuanPar063/user-service) – Servicio de usuarios
                      - - [admin-service](https://github.com/JuanPar063/admin-service) – Servicio de administración
                        - - [loans-frontend](https://github.com/JuanPar063/loans-frontend) – Frontend
                         
                          - ## Autor
                         
                          - Juan Sebastian Pardo Anzola – [@JuanPar063](https://github.com/JuanPar063)
