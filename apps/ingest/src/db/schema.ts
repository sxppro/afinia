import {
  AccountTypeEnum,
  OwnershipTypeEnum,
  TransactionStatusEnum,
} from 'afinia-common/types/up-api';
import { and, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import {
  alias,
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Schema
 */
export const schema = pgSchema('afinia');

/**
 * Enums
 */
export const transactionStatusEnum = pgEnum(
  'transaction_status',
  TransactionStatusEnum
);
export const accountTypeEnum = pgEnum('account_type', AccountTypeEnum);
export const accountOwnershipTypeEnum = pgEnum(
  'account_ownership_type',
  OwnershipTypeEnum
);

/**
 * Tables
 */
export const accountTable = schema
  .table('account', {
    account_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    provider_id: uuid().unique().notNull(),
    type: accountTypeEnum().notNull(),
    ownership_type: accountOwnershipTypeEnum().notNull(),
    display_name: text().notNull(),
    currency_code: text().notNull(),
    value: text().notNull(),
    value_in_base_units: integer().notNull(),
    created_at: timestamp({ withTimezone: true }).notNull(),
    updated_at: timestamp({ withTimezone: true }),
    updated_by: text(),
    /**
     * Approximate account deletion time.
     * When an account is deleted, it must be
     * inferred when it is no longer in the
     * `/accounts` endpoint)
     */
    deleted_at: timestamp({ withTimezone: true }),
  })
  .enableRLS();

export const categoryTable = schema
  .table(
    'category',
    {
      category_id: text().primaryKey(),
      category_name: text().notNull(),
      category_parent_id: text(),
    },
    (table) => [
      foreignKey({
        columns: [table.category_parent_id],
        foreignColumns: [table.category_id],
        name: 'category_parent_category_fk',
      }),
    ]
  )
  .enableRLS();

export const tagTable = schema
  .table('tag', {
    tag_id: text().primaryKey(),
  })
  .enableRLS();

export const transactionTable = schema
  .table(
    'transaction',
    {
      transaction_id: integer().primaryKey().generatedAlwaysAsIdentity(),
      // Transaction ID from provider
      provider_id: uuid().unique().notNull(),
      type: text(),
      status: transactionStatusEnum().notNull(),
      // Optional attachment ID from provider
      attachment_id: uuid(),
      raw_text: text(),
      description: text(),
      message: text(),
      note: text(),
      card_purchase_method: text(),
      card_number_suffix: text(),
      customer_display_name: text(),
      deep_link_url: text(),
      is_categorizable: boolean().notNull(),
      /**
       * Amount
       */
      currency_code: text().notNull(),
      value: text().notNull(),
      value_in_base_units: integer().notNull(),
      foreign_currency_code: text(),
      foreign_value: text(),
      foreign_value_in_base_units: integer(),
      /**
       * Timestamps
       */
      created_at: timestamp({ withTimezone: true }).notNull(),
      settled_at: timestamp({ withTimezone: true }),
      deleted_at: timestamp({ withTimezone: true }),
      updated_at: timestamp({ withTimezone: true }),
      updated_by: text(),
      /**
       * Foreign keys
       */
      account_id: integer().notNull(),
      transfer_account_id: integer(),
      category_id: text(),
    },
    (table) => [
      foreignKey({
        name: 'transaction_account_fk',
        columns: [table.account_id],
        foreignColumns: [accountTable.account_id],
      }),
      foreignKey({
        name: 'transaction_transfer_account_fk',
        columns: [table.transfer_account_id],
        foreignColumns: [accountTable.account_id],
      }),
      foreignKey({
        name: 'transaction_category_fk',
        columns: [table.category_id],
        foreignColumns: [categoryTable.category_id],
      }),
      index('transaction_account_id_index').on(table.account_id),
      index('transaction_category_id_index').on(table.category_id),
      index('transaction_created_at_index').on(table.created_at),
    ]
  )
  .enableRLS();

export const transactionHoldInfoTable = schema
  .table(
    'transaction_hold_info',
    {
      transaction_id: integer().primaryKey(),
      currency_code: text().notNull(),
      value: text().notNull(),
      value_in_base_units: integer().notNull(),
      foreign_currency_code: text(),
      foreign_value: text(),
      foreign_value_in_base_units: integer(),
    },
    (table) => [
      foreignKey({
        name: 'transaction_hold_info_transaction_fk',
        columns: [table.transaction_id],
        foreignColumns: [transactionTable.transaction_id],
      }).onDelete('cascade'),
    ]
  )
  .enableRLS();

export const transactionRoundUpTable = schema
  .table(
    'transaction_round_up',
    {
      transaction_id: integer().primaryKey(),
      currency_code: text().notNull(),
      value: text().notNull(),
      value_in_base_units: integer().notNull(),
      boost_currency_code: text(),
      boost_value: text(),
      boost_value_in_base_units: integer(),
    },
    (table) => [
      foreignKey({
        name: 'transaction_round_up_transaction_fk',
        columns: [table.transaction_id],
        foreignColumns: [transactionTable.transaction_id],
      }).onDelete('cascade'),
    ]
  )
  .enableRLS();

export const transactionCashbackTable = schema
  .table(
    'transaction_cashback',
    {
      transaction_id: integer().primaryKey(),
      description: text().notNull(),
      currency_code: text().notNull(),
      value: text().notNull(),
      value_in_base_units: integer().notNull(),
    },
    (table) => [
      foreignKey({
        name: 'transaction_cashback_transaction_fk',
        columns: [table.transaction_id],
        foreignColumns: [transactionTable.transaction_id],
      }).onDelete('cascade'),
    ]
  )
  .enableRLS();

export const transactionTagTable = schema
  .table(
    'transaction_tag',
    {
      transaction_id: integer().notNull(),
      tag_id: text().notNull(),
    },
    (table) => [
      primaryKey({
        name: 'transaction_tag_pk',
        columns: [table.transaction_id, table.tag_id],
      }),
      foreignKey({
        name: 'transaction_tag_transaction_fk',
        columns: [table.transaction_id],
        foreignColumns: [transactionTable.transaction_id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'transaction_tag_tag_fk',
        columns: [table.tag_id],
        foreignColumns: [tagTable.tag_id],
      }).onDelete('cascade'),
    ]
  )
  .enableRLS();

/**
 * External transactions (e.g. purchases, salary)
 *
 * This excludes transfers between accounts
 * (i.e. non-categorizable transactions)
 */
export const transactionExternalTable = schema
  .view('transaction_external')
  .as((queryBuilder) => {
    const categoryParent = alias(categoryTable, 'category_parent');
    const transactionCols = getTableColumns(transactionTable);

    return queryBuilder
      .select({
        ...transactionCols,
        category: sql<string>`${categoryTable.category_name}`.as('category'),
        category_parent_id: sql<string>`${categoryParent.category_id}`.as(
          'category_parent_id'
        ),
        category_parent: sql<string>`${categoryParent.category_name}`.as(
          'category_parent'
        ),
      })
      .from(transactionTable)
      .where(
        and(
          eq(transactionTable.is_categorizable, true),
          isNull(transactionTable.deleted_at)
        )
      )
      .leftJoin(
        categoryTable,
        eq(transactionTable.category_id, categoryTable.category_id)
      )
      .leftJoin(
        categoryParent,
        eq(categoryTable.category_parent_id, categoryParent.category_id)
      );
  });
