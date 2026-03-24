/**
 * MigrationExecutor — applies a single migration against a JSDBC connection.
 *
 * Each SQL file may contain multiple statements separated by semicolons.
 * Statements are executed sequentially; the first failure aborts and rethrows.
 *
 * Flyway-inspired (https://flywaydb.org, Apache 2.0).
 */

export class MigrationExecutor {
  /**
   * Execute all statements in a migration's SQL against the given connection.
   *
   * @param {Connection} conn   — open JSDBC Connection
   * @param {string}     sql    — full SQL file content
   * @returns {Promise<void>}
   */
  async execute(conn, sql) {
    const statements = this._split(sql);
    for (const stmt of statements) {
      const st = await conn.createStatement();
      await st.execute(stmt);
    }
  }

  /**
   * Split SQL content into individual statements.
   * Strips SQL line comments (--) and blank lines, splits on ';'.
   *
   * @param {string} sql
   * @returns {string[]}
   */
  _split(sql) {
    return sql
      .split(';')
      .map((s) => s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim())
      .filter((s) => s.length > 0);
  }
}
