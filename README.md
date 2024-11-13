# Landscape ERP api powered by Express.js using TypeScript

## Requirements:

1. NodeJs 20.
2. Docker or PostgresSQL installed.

## Get Started

Create RSA public and private key in keys folder. In terminal run
`cd keys && ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key`.

### Local PostgresSQL Setup

Create a database named `mrp_db` where the username & password are `mrp`.

### Docker Setup

Run the following command in the root of your terminal `docker compose up -d`.

### Running the Application

1. Install dependencies `npm i`.
2. Assuming running using UNIX OS, in you terminal in the root of application,
   run `bash migrate.sh` to run all migrations against the db.
3. Start the application `npm start`.
4. Verify the application is running by accessing the default endpoint: `curl http://localhost:4000/api/v1/`.

### Test

1. `npm test` to run all tests.

## Design pattern

1. Dependency inject & inversion.
2. TDD.

## Docs

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
