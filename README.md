# Hebrew Calendar for Gladys Assistant

An external integration for [Gladys Assistant](https://gladysassistant.com): the Jewish calendar of your
house, **computed locally** with [`@hebcal/core`](https://github.com/hebcal/hebcal-es6), the engine of
[hebcal.com](https://www.hebcal.com). No account, no Internet access.

## Features

- **One device, "Hebrew calendar"**: Hebrew date (changes at sunset), holiday of the day (Rosh Chodesh,
  fasts and the day of Chanukah included), Shabbat or holiday now ("issur melakha", from candle lighting to
  havdalah), Shabbat or holiday tomorrow, next candle lighting, next havdalah, weekly Torah portion, Omer
  count, days until the next holiday.
- **Scene triggers**: candle lighting (at the time, or 10, 15, 30 minutes, 1 or 2 hours before), Shabbat or
  holiday begins, Shabbat or holiday ends — once for consecutive days.
- **Scene action** "Day information": today or tomorrow (Hebrew date, holiday, Shabbat or holiday as 1/0,
  candle lighting, havdalah, portion, Omer, zmanim) for the conditions of a scene.
- **Dashboard widget**: Hebrew date, Shabbat or holiday under way, next times, Omer, portion, next holiday
  and the zmanim of the day.
- Israel or diaspora (automatic from the time zone), candle lighting minutes (18, 40 in Jerusalem…), end of
  Shabbat at 8.5° or 42/50/72 minutes, names in French, English, German, Spanish, transliterated (Sephardic
  or Ashkenazi) or in Hebrew script.

Tested against the times published by hebcal.com for Paris, Jerusalem and New York over 2025-2027
(daylight saving changes included), not yet on many real Gladys instances: feedback welcome. No hardware is
involved.

## Requirements

- Gladys Assistant **5.1.0** or later.
- A house with coordinates in Gladys (**Settings → Houses**) and the right time zone (**Settings →
  System**).

## Installation

1. In Gladys, open **Integrations → Install from GitHub** and enter
   `https://github.com/guim31/gladys-hebcal`.
2. Open the **Configuration** tab of the integration, check the settings, save.
3. Open the **Discover** tab and add the **Hebrew calendar** device.

The user documentation, shown by Gladys, is in [`docs/`](docs/en.md) (English, French, German, Spanish).

## How it works

Every 20 seconds the container computes the calendar of the house for the current instant, in the time zone
of Gladys: it publishes the values that changed (and everything every 12 hours) and fires the scene events
that just became due. Their ids are kept in `/data/fired-events.json`, so a restart neither replays an event
nor loses one due less than 15 minutes ago. Candle lightings and havdalot are joined into periods: a holiday
followed by Shabbat is one period, with one start and one end.

## Limitations

- One house: the first Gladys house with coordinates. Times are computed at sea level.
- Near the poles, a missing candle lighting or havdalah means no Shabbat period.
- The reminders before candle lighting are fixed (10, 15, 30 minutes, 1 or 2 hours).

## Development

Node.js 22+, ESM, no build step. Runtime dependencies:
[`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js) and
[`@hebcal/core`](https://github.com/hebcal/hebcal-es6).

```bash
npm install
npm test              # node --test, against the SDK's fake Gladys; no network
npm run lint
npm run format:check
npx -y github:GladysAssistant/integration-store --skip-image-check .   # store validator
```

```
index.js              SDK wiring (src/app.js registers the handlers)
src/app.js            every SDK handler -> the service
src/service.js        the clock: house, states, scene events, widget refresh
src/calendar.js       @hebcal/core -> Hebrew date, holidays, periods, zmanim (pure)
src/names.js          names of holidays, months and portions in the chosen style
src/view.js           calendar values -> texts
src/device.js         the calendar device and its values
src/scenes.js         "Day information" scene action
src/widgets.js        "Hebrew calendar" dashboard widget
src/i18n.js           every text of the code, in four languages, time formats
src/config.js         DEFAULT_CONFIG (mirrors the manifest) + normalization
src/store.js          JSON files in /data
test/fixtures/        Gladys feature table, answers of hebcal.com (2025-2027)
```

To run it outside Gladys:

```bash
GLADYS_HOST_API_URL="http://localhost:1443" \
GLADYS_INTEGRATION_TOKEN="<token>" \
GLADYS_INTEGRATION_SELECTOR="hebcal" \
HEBCAL_DATA_DIR=./data \
TZ=Europe/Paris \
npm start
```

Releases are made by the **Release** workflow (Actions → Release); never edit the versions by hand. See
[`CLAUDE.md`](CLAUDE.md) for the project rules.

## Credits

- [`@hebcal/core`](https://github.com/hebcal/hebcal-es6) by Michael J. Radwin and the hebcal contributors
  (GPL-2.0-or-later): the calendar, the times and the weekly portions. The test fixtures are answers of the
  public [hebcal.com API](https://www.hebcal.com/home/developer-apis) (CC BY 4.0).
- Home Assistant's [`jewish_calendar`](https://www.home-assistant.io/integrations/jewish_calendar/)
  integration (Apache-2.0), which inspired the sensors.

## Disclaimer

Not affiliated with hebcal.com or Home Assistant. The times are given for convenience: follow your rabbi
for halachic decisions.

## License

[GPL-3.0-or-later](LICENSE). `@hebcal/core` is licensed under the GPL-2.0-or-later, which the image
distributes: the integration takes the GPL v3 (compatible with the Apache-2.0 of the Gladys SDK) instead of
the Apache-2.0 of the template it started from.
