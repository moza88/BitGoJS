# BitGo sdk-coin-algo

SDK coins provide a modular approach to a monolithic architecture. This and all BitGoJS SDK coins allow developers to use only the coins needed for a given project.

## Installation

All coins are loaded traditionally through the `bitgo` package. If you are using coins individually, you will be accessing the coin via the `@bitgo/sdk-api` package.

In your project install both `@bitgo/sdk-api` and `@bitgo/sdk-coin-algo`.

```shell
npm i @bitgo/sdk-api @bitgo/sdk-coin-algo
```

Next, you will be able to initialize an instance of "bitgo" through `@bitgo/sdk-api` instead of via `bitgo`.

```javascript
import { BitGo } from '@bitgo/sdk-api';

async function init() {
  const algo = await import('@bitgo/sdk-coin-algo');
  BitGo.register(Algorand, algo);
  return new BitGo();
}

async function main() {
  (await init()).coin('algo');
}
```

## Development

Most of the coin implementations are derived from `@bitgo/sdk-core`, `@bitgo/statics`, and coin specific packages. These implementations are used to interact with the BitGo API and BitGo platform services.

You will notice that the basic version of common class extensions have been provided to you and must be resolved before the package build will succeed. Upon initiation of a given SDK coin, you will need to verify that your coin has been included in the root `tsconfig.packages.json` and that the linting, formatting, and testing succeeds when run both within the coin and from the root of BitGoJS.
