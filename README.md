```
  _
 | | _____  _ __   __ _
 | |/ / _ \| '_ \ / _` |
 |   < (_) | | | | (_| |_
 |_|\_\___/|_| |_|\__,_(_)

```

this is the monorepo for [kcodes.me](https://kcodes.me) and the various things orbiting it.

---

## what's in here

| thing | what it does | where it lives |
|-------|--------------|----------------|
| **site** | portfolio with too many animations | `src/` |
| **blog** | markdown cms that i actually use | `blog/` |
| **films** | same cms but for movies i watch | `films/` |
| **api** | silly (and less silly) public apis | `c-lion-api/` |

## the api

lives at `api.kcodes.me`. currently serving:

**c-lion** — sea lion facts and memes. because why not.
```bash
curl https://api.kcodes.me/c-lion/v1/fact
curl https://api.kcodes.me/c-lion/v1/meme  # returns svg
```

**jargon** — turns normal sentences into corporate or legal speak via llm.
```bash
curl "https://api.kcodes.me/jargon/v1/corporate?text=we should talk"
# => "Let's circle back to synergize on this initiative..."

curl "https://api.kcodes.me/jargon/v1/legal?text=you can use this"
# => "WHEREAS, the party of the first part hereby grants..."
```

rate limited to prevent my wallet from catching fire.

## running locally

```bash
bun install
bun run dev
```

workers live in their own dirs with their own `package.json`. deploy with `npx wrangler deploy`.

## stack

- bun (runtime, bundler, package manager, everything)
- cloudflare workers + d1 + kv (hosting, db, cache)
- react + vite (frontend)
- cerebras (fast inference for jargon api)

---

<sub>*built between mass and midnight*</sub>
