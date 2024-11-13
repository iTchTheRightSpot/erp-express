#!/bin/bash

DATABASE_URL=postgres://mrp:mrp@localhost:5432/mrp_db npm run migrate up
