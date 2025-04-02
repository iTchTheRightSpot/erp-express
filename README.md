# Reservation api powered by Express.js version 4.21.1 using TypeScript & PostgresSQL

A feature-rich reservation system for small businesses, like salons.

## Core Features

### 1. **Monolith Application**
   - **Frontend**: Angular served from Go binary.

### 2. **Authentication & Authorization**
   - **Login**: Email & password-based.
   - **Roles & Permissions**: Role-based access; authorized via 'GSESSION' cookie.

### 3. **Staff Management**
   - **Schedule**:
     - Only staff with `WRITE` permission can create schedules.
     - Bulk schedule creation & no conflicts.
     - Schedules can only be deleted if not linked to a reservation.
     - Weekly recurring schedules.
   - **Services**:
     - Staff with `WRITE` or `DELETE` permission can manage services.
     - Services linked to other data like reservation, or staff can’t be deleted but can be hidden.
     - Only staff with `WRITE` can assign services to others.
   - **Reservations**:
     - Allow Multiple services per reservation.
     - Quoted price required.
     - No overbooking; cannot delete, only cancel.
     - Staff notified on creation or status change.
     - Reservation status set to `COMPLETED` only with payment info.
     - 1-day reminder notifications for pending appointments.

### 4. **Client Management**
   - **Services**:
     - Clients can view all services.
     - Multiple services can be reserved.
     - Max price per service: `DECIMAL(6, 2)`.
   - **Reservations**:
     - Clients see valid available times per staff in their timezone.
     - Reservations for future dates only; no rescheduling, only cancellations.
     - Clients and staff receive notifications on status changes.

### 5. **Payment**
   - **Invoices**: Only staff can send invoices.
   - **Online Payment**: Clients can pay via an online invoice.

## Development docs

1. [Schema design](https://dbdiagram.io/d/landscape-erp-66303ee65b24a634d01e83ea).
2. [PG getting started](https://node-postgres.com/).
3. [PG connection pool](https://node-postgres.com/apis/pool)
4. [PG connecting](https://node-postgres.com/features/connecting)
5. [Jest](https://jestjs.io/docs/getting-started)
6. [Winston logger](https://github.com/winstonjs/winston).
7. [Morgan middleware](https://expressjs.com/en/resources/middleware/morgan.html).
8. [Handling transaction in node](https://stackoverflow.com/questions/9319129/node-js-postgres-database-transaction-management).
9. [Handling transaction using various patterns](https://threedots.tech/post/database-transactions-in-go/).
10. [Db commands PG](https://www.atlassian.com/data/admin/how-to-list-databases-and-tables-in-postgresql-using-psql#:~:text=Listing%20databases,command%20or%20its%20shortcut%20%5Cl%20.).
11. [Path alias](https://github.com/dividab/tsconfig-paths)
12. [PG migration](https://salsita.github.io/node-pg-migrate/migrations/tables)
13. [Argon2](https://www.reddit.com/r/node/comments/19czlh9/best_nodejs_hashing_algorithm_for_auth_in_2024/).
14. [Auth0 Jwt](https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file)
15. [Auth0 Jwt middleware](https://github.com/auth0/express-jwt)
