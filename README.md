# Enterprise resource planning (ERP) api powered by Express.js version 4.21.1 using TypeScript & PostgresSQL

## Core Requirements

1. **Personal Identifiable Information**

   - A user should be able to delete their personal info but only after 1 year of inactivity.
   - Data integrity should not be affected.

2. **Roles and Permissions**

   - Data should be protected and only allowed to users with specific roles and or permissions.

3. **Staff**

   - Bare minimum to be a staff is to have a role `STAFF`.
   - **Shifts**
     - Only staffs with `WRITE` permission can create working hours for other staffs.
     - Allow bulk creation of shifts with the following constraints:
     - No conflicts in working hrs.
     - A schedule can only be deleted if not reservation is attached to it, but it can be as not
       visible.
     - Schedule cannot be created for past date.
     - **Autonomous Weekly Recurring Schedule**
       - Similar to marking a reoccurring alarm, autonomous schedule that runs weekly, for shifts
         that have been marked as reoccurring. Cron would fire once a week.
   - **Services**
     - Only staffs with `WRITE or DELETE` permission can create or delete a service.
     - A service cannot be deleted if it has an existing relationship with another table.
       Instead, it's visibility can be marked as false so clients can reserve for said service.
     - Only staff with `WRITE` can assign a service to another staff.
   - **Reservations**
     - Only staffs with `WRITE` permission can cancel a reservation.
     - A reservation can include multiple services.
     - A reservation can can have an amount quoted.
     - No overbooking or time overlap for n number of services for a specific staff.
     - A reservation can never be deleted rather cancelled.
     - Said staff should receive a notification on reservation creation and status change.
     - For a reservation status to be marked as `COMPLETED`, it has to have a payment detail.
       That is an existing relationship with payment_detail.
     - Both staff & client should receive a notification 1 day before a `PENDING` appointment.

4. **Clients**

   - **Services**
     - A client should see all the services offered.
     - n number of services can be for one reservation.
     - Every service can have a max price of `DECIMAL(6, 2)`.
   - **Reservations**
     - A client can only be shown n valid reservation times for 1 staff.
     - Although business can be in a different timezone, valid reservation times should match out to
       said clients timezone.
     - Clients cannot reschedule a reservation. The reservation has to be cancelled
     - A reservation cannot be made for past dates.
     - Clients & staffs should receive notifications on appointment status change.

5. **Payment**
   - Only staffs can send invoices to clients.
   - Clients should be able to pay via online invoice.

## Design pattern

1. Dependency inversion & injection.
2. Test driven development (TDD).
3. Transaction provider pattern.

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
