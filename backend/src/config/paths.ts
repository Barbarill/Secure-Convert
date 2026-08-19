import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

export function createTempWorkDir(): string {
  return path.join(os.tmpdir(), `secureconvert-${randomUUID()}`);
}