# Security policy

## Reporting a vulnerability

Please do **not** report a security problem in a public issue, pull request or
forum post.

Report it privately through GitHub instead: open the **Security** tab of this
repository, then **Report a vulnerability**.

No such button? Private reporting is not enabled yet: open an issue that only
asks the maintainers for a private contact, without any detail of the problem,
and send the report there.

Include, when you can:

- the version of the integration and of Gladys;
- what an attacker can do, and the steps to reproduce it;
- the log lines that help (remove tokens, passwords and addresses first).

The fix ships as a new version of the integration, and the advisory is
published once users can update.

## Supported versions

Only the latest release receives security fixes: update the integration from
Gladys before reporting a problem.

## Scope

In scope: the code of this repository and the Docker image it publishes.

What the integration stores and exchanges:

- `/data/fired-events.json`: the ids and times of the scene events fired in the last two days, so that a
  restart does not fire them again. Nothing personal, no secret: the integration asks for no account, no
  password and no API key.
- Gladys: the integration reads the coordinates of the houses (`location: true` in the manifest) and sends
  them nowhere. The position of the house appears, rounded to two decimals, in one log line at start.
- Network: none besides Gladys. Everything is computed in the container.

Out of scope: Gladys Assistant itself (see its
[security policy](https://github.com/GladysAssistant/Gladys/security/policy)) and the `@hebcal/core`
library.
