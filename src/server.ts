import { env } from '@utils/env';
import init from './app';

init().listen(env.PORT, () =>
  console.log(`landscape erp api listening on port ${env.PORT}`)
);
