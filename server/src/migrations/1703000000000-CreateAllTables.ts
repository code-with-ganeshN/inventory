import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTables1703000000000 implements MigrationInterface {
    name = 'CreateAllTables1703000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create roles table
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"),
                CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
            )
        `);

        // Create categories table
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "parent_id" integer,
                "is_active" boolean NOT NULL DEFAULT true,
                "display_order" integer NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
            )
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "email" character varying NOT NULL,
                "password_hash" character varying NOT NULL,
                "first_name" character varying,
                "last_name" character varying,
                "phone" character varying,
                "address" text,
                "role_id" integer NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "is_locked" boolean NOT NULL DEFAULT false,
                "last_login" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Create products table
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" SERIAL NOT NULL,
                "sku" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "category_id" integer,
                "price" numeric(10,2) NOT NULL,
                "cost_price" numeric(10,2),
                "image_url" character varying,
                "stock" integer NOT NULL DEFAULT '0',
                "low_stock_threshold" integer NOT NULL DEFAULT '10',
                "status" character varying NOT NULL DEFAULT 'ACTIVE',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"),
                CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
            )
        `);

        // Create orders table
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "order_number" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "total_amount" numeric(12,2) NOT NULL,
                "tax_amount" numeric(10,2) NOT NULL DEFAULT '0',
                "shipping_address" text,
                "billing_address" text,
                "payment_method" character varying,
                "payment_status" character varying,
                "tracking_number" character varying,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_d39c53244703b8534307adcd073" UNIQUE ("order_number"),
                CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
            )
        `);

        // Create order_items table
        await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" SERIAL NOT NULL,
                "order_id" integer NOT NULL,
                "product_id" integer NOT NULL,
                "quantity" integer NOT NULL,
                "unit_price" numeric(10,2) NOT NULL,
                "total_price" numeric(12,2) NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id")
            )
        `);

        // Create shopping_carts table
        await queryRunner.query(`
            CREATE TABLE "shopping_carts" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "product_id" integer NOT NULL,
                "quantity" integer NOT NULL DEFAULT '1',
                "saved_for_later" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1f1573c5c4aeedc842b4b7b931b" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" 
            FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" 
            FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" 
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "shopping_carts" ADD CONSTRAINT "FK_3d446f7b4faacfd0c3e652ce6c4" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "shopping_carts" ADD CONSTRAINT "FK_3c1744d5e9ce6c5bbda69c95219" 
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE "shopping_carts" DROP CONSTRAINT "FK_3c1744d5e9ce6c5bbda69c95219"`);
        await queryRunner.query(`ALTER TABLE "shopping_carts" DROP CONSTRAINT "FK_3d446f7b4faacfd0c3e652ce6c4"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "shopping_carts"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }
}