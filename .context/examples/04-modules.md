# Example 04 – Modules

Demonstrates how to declare reusable modules and load them into a container.

```typescript
import { Container, createToken, injectable, defineModule, Lifecycle } from 'tsneedle';

// Tokens
export const ILogger = createToken<ILogger>('ILogger');
export const IDatabase = createToken<IDatabase>('IDatabase');
export const IUserService = createToken<IUserService>('IUserService');

interface ILogger { log(msg: string): void; }
interface IDatabase { query(sql: string): any; }
interface IUserService { getUser(id: string): Promise<any>; }

// Concrete implementations
@injectable()
class ConsoleLogger implements ILogger {
  log(msg: string) { console.log('[log]', msg); }
}

@injectable()
class PostgresDB implements IDatabase {
  query(sql: string) { /* pretend DB */ return []; }
}

@injectable()
class UserService implements IUserService {
  constructor(
    @inject(ILogger) private logger: ILogger,
    @inject(IDatabase) private db: IDatabase,
  ) {}

  async getUser(id: string) {
    this.logger.log(`Fetching ${id}`);
    return this.db.query(`SELECT * FROM users WHERE id='${id}'`);
  }
}

// Define a database module
export const DatabaseModule = defineModule({
  providers: [
    { token: ILogger, provider: { type: 'class', useClass: ConsoleLogger }, lifecycle: Lifecycle.Singleton },
    { token: IDatabase, provider: { type: 'class', useClass: PostgresDB }, lifecycle: Lifecycle.Singleton },
  ],
  exports: [ILogger, IDatabase],
});

// Define the application module that imports the database module
export const AppModule = defineModule({
  imports: [DatabaseModule],
  providers: [
    { token: IUserService, provider: { type: 'class', useClass: UserService } },
  ],
});

// Bootstrap
const container = new Container();
container.load(AppModule);

const userService = container.resolve(IUserService);
userService.getUser('42');
```

Modules are plain data objects, making them easy to compose, test, and tree‑shake.
