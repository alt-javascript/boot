import { isPlainObject } from '@alt-javascript/common';

export default class JSONFormatter {
  // eslint-disable-next-line class-methods-use-this
  format(timestamp, category, level, message, meta) {
    return JSON.stringify(
      {
        level,
        message,
        timestamp,
        category,
        ...(isPlainObject(meta) ? meta : { meta }),
      },
    );
  }
}
