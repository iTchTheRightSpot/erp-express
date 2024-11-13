import { env } from '@utils/env';
import init from './app';

init().listen(env.PORT, () =>
  console.log(`uHub api listening on port ${env.PORT}`)
);
