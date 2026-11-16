import { advance, owner, type Event, type Request } from './example';
import { contracts } from './contracts';
contracts((capacity, events) => {
  let request: Request = { phase: 'ready', capacity, transferred: 0 };
  for (const text of events) {
    const [type, bytes] = text.split(' ');
    const event = (
      type === 'complete' ? { type, bytes: Number(bytes) } : { type }
    ) as Event;
    request = advance(request, event);
  }
  return `${owner(request)} ${request.phase} ${request.transferred}`;
});
