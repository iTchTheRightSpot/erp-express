#!/bin/bash

DATABASE_URL=postgres://erp:erp@localhost:5432/erp_db npm run migrate up
