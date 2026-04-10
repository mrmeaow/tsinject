import { Container, Lifecycle, createToken } from "@mrmeaow/tsinject";
import type { Token } from "@mrmeaow/tsinject";

interface IRepo {
  find(): string;
}
class Repo implements IRepo {
  find() {
    return "repo";
  }
}

const IRepo = createToken<IRepo>("IRepo");

type TestToken = typeof IRepo extends Token<IRepo> ? true : false;
const _tokenTypeCheck: TestToken = true;

const container = new Container();
container.registerClass(IRepo, Repo);

const repo = container.resolve(IRepo);
const _resolveTypeCheck: IRepo = repo;

interface IOther {
  foo(): void;
}
const IOther = createToken<IOther>("IOther");
const _differentToken = IOther;
const _notAssignable: IOther = repo;
