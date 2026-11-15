import { utf8Bytes } from './example';
import { contracts } from './contracts';
contracts((codePoint) => utf8Bytes(codePoint).map((b) => b.value));
