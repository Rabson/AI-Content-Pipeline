# Code Shape Rules

The repo enforces a structural lint check with `npm run lint:structure`.

## Rules
- Source files should stay at or below `100` lines.
- Controllers must not mix HTTP transport with Prisma, queue wiring, or direct external IO.
- Repositories must not perform queue operations or external HTTP/S3 calls.
- Service-like files must not combine direct `PrismaService` access with queue wiring or direct external IO.

## Exceptions
- Reviewed exceptions live in `config/code-shape-exceptions.json`.
- Exceptions are temporary pressure valves for dense repository/query files, large contract/type files, and a few route components that still need another extraction pass.
- New exceptions should be treated as design debt and justified in review.

## Commands
```bash
npm run lint:structure
npm run lint
```
