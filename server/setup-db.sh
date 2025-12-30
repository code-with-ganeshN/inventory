#!/bin/bash

# Database setup script for inventory management system

echo "Setting up database with required initial data..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Get database connection details from environment or use defaults
DB_NAME=${DB_NAME:-inventory_db}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "Connecting to database: $DB_NAME"

# Run the initialization SQL
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f init-roles.sql

if [ $? -eq 0 ]; then
    echo "Database initialization completed successfully!"
    echo "Default roles created:"
    echo "  - SUPER_ADMIN (ID: 1)"
    echo "  - ADMIN (ID: 2)" 
    echo "  - USER (ID: 3)"
    echo "Default warehouse created:"
    echo "  - Main Warehouse (ID: 1)"
else
    echo "Database initialization failed!"
    exit 1
fi