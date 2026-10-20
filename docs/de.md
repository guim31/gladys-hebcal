# Jüdischer Kalender

Der jüdische Kalender deines Zuhauses in Gladys: das hebräische Datum, Schabbat und Feiertage, die Zeiten
für Kerzenzünden und Hawdala, der Wochenabschnitt der Tora, der Omer und die wichtigsten Zmanim. Als Sensoren
für das Dashboard und die Bedingungen von Szenen, und als Szenen-Auslöser: das Licht beim Kerzenzünden
dimmen, den Wecker an Schabbat- und Feiertagsmorgen ausschalten, eine Erinnerung eine Stunde vor Schabbat
bekommen.

- **Zu Hause berechnet**, mit der Rechenmaschine von [hebcal.com](https://www.hebcal.com) (`@hebcal/core`):
  kein Konto, kein Internetzugang, nichts verlässt dein Gladys.
- **Israel oder Diaspora**: ein oder zwei Feiertage, und der passende Wochenabschnitt.
- **Die Bräuche deiner Gemeinde**: Minuten des Kerzenzündens vor Sonnenuntergang (18, 40 in Jerusalem…) und
  Ende des Schabbats (8,5° oder 42, 50, 72 Minuten).

> Mit der automatischen Testsuite gegen die von hebcal.com veröffentlichten Zeiten geprüft (Paris,
> Jerusalem, New York, 2025 bis 2027), aber noch nicht auf vielen echten Gladys-Installationen:
> Rückmeldungen sind im Gladys-Forum oder in den GitHub-Issues willkommen. Die Zeiten dienen der
> Orientierung: Für halachische Entscheidungen folge deinem Rabbiner.

## Was du brauchst

- Gladys Assistant 5.1.0 oder neuer.
- Ein Zuhause mit seinen Koordinaten in Gladys (**Einstellungen → Zuhause**): Die Zeiten hängen von der
  Lage des Zuhauses ab.
- Die richtige Zeitzone in Gladys (**Einstellungen → System**): Alle Zeiten werden in ihr berechnet und
  angezeigt.

## Konfiguration

Installiere die Integration (**Integrationen → Von GitHub installieren**, Adresse
`https://github.com/guim31/gladys-hebcal`), öffne ihren Reiter **Konfiguration**, prüfe die folgenden Felder
und speichere. Öffne dann den Reiter **Entdecken** und füge das Gerät **Jüdischer Kalender** hinzu.

### Zuhause und Zeitzone

Die Integration nimmt das erste Gladys-Zuhause mit Koordinaten. Gibt es keines, zeigt die Seite der
Integration das an, und die Integration versucht es alle 10 Minuten erneut. Nach einem Umzug des Zuhauses
starte die Integration neu (oder speichere ihre Konfiguration), um die Zeiten sofort neu zu berechnen.

### Israel oder Diaspora

**Automatisch** wählt Israel, wenn die Zeitzone von Gladys `Asia/Jerusalem` ist, sonst die Diaspora. Wähle
ausdrücklich, wenn deine Gemeinde dem anderen Kalender folgt.

### Kerzenzünden und Hawdala

- **Kerzenzünden: Minuten vor Sonnenuntergang**: standardmäßig 18. Jerusalem nimmt 40, Haifa 30, Tel Aviv
  20; manche Gemeinden 15, 20 oder 22.
- **Ende von Schabbat und Feiertagen**: die Zeit der Hawdala und das Ende des Schabbats für das Gerät und
  die Auslöser. Sonne 8,5° unter dem Horizont (drei kleine Sterne, Standard von hebcal.com) oder 42, 50
  oder 72 Minuten nach Sonnenuntergang (72: Rabbenu Tam).

### Namen und Sprache

- **Sprache der Texte**: die Namen der Sensoren, die Zeiten und die Texte der Szenen-Ereignisse und der
  Szenen-Aktion (standardmäßig Französisch). Die Sensornamen werden beim Hinzufügen des Geräts festgelegt:
  Lösche das Gerät nach einer Änderung und füge es erneut hinzu, um sie umzubenennen. Das Widget folgt der
  Sprache der Person, die es ansieht.
- **Namen der Feiertage und Monate**: die üblichen Namen der Sprache („Pessach", „Schawuot", „Rosch
  Haschana"; die Transliteration, wenn es keinen üblichen Namen gibt, wie bei den meisten
  Wochenabschnitten), die Transliteration von hebcal.com (sefardisch: „Shavuot"), die aschkenasische
  („Shavuos") oder hebräische Schrift.

## Das Kalendergerät

| Sensor                         | Wert                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Hebräisches Datum              | „9 Cheschwan 5787". Wechselt bei Sonnenuntergang, wie der hebräische Tag               |
| Feiertag heute                 | Der Feiertag, Rosch Chodesch, Fasttag oder Tag von Chanukka („Chanukka 3/8"), „Keiner" |
| Schabbat oder Feiertag jetzt   | An vom Kerzenzünden bis zur Hawdala (Schabbat, Jom Kippur, Jom-Tov-Tage)               |
| Schabbat oder Feiertag morgen  | An, wenn der morgige Tag ein Schabbat oder ein Jom-Tov-Tag ist                         |
| Nächstes Kerzenzünden          | „Fr., 23. Okt., 18:27"                                                                 |
| Nächste Hawdala                | „Sa., 24. Okt., 19:32"                                                                 |
| Wochenabschnitt                | Der Abschnitt des kommenden Schabbats oder der stattdessen gelesene Feiertag           |
| Omerzählung                    | Der Tag des Omer (1 bis 49), 0 außerhalb der Zählung. Wechselt bei Sonnenuntergang     |
| Tage bis zum nächsten Feiertag | Tage bis zum nächsten Jom-Tov-Tag (0 am Tag selbst)                                    |

Jeder Wert wird von der Integration gesendet, wenn er sich ändert (bei Sonnenuntergang, beim
Kerzenzünden, bei der Hawdala), und alle 12 Stunden erneut veröffentlicht: Es gibt nichts abzufragen.
Aufeinanderfolgende Tage (ein Feiertag mit anschließendem Schabbat, die zwei Tage eines Feiertags in der
Diaspora) bilden einen einzigen Zeitraum.

## Dashboard-Widget

**Jüdischer Kalender** zeigt das hebräische Datum, den laufenden Schabbat oder Feiertag mit seinem Ende,
das nächste Kerzenzünden und die nächste Hawdala, den Tag des Omer, den Wochenabschnitt, den Feiertag des
Tages, den nächsten Feiertag und, wenn du es in seinen Einstellungen nicht abschaltest, die Zmanim des
Tages: Morgengrauen (Alot haSchachar, 16,1°), Sonnenaufgang, spätestes Schma (Gra), Mittag (Chazot),
Sonnenuntergang und Nachteinbruch (Zeit, 8,5°).

## Szenen-Auslöser

- **Kerzenzünden**: zur Zeit des Kerzenzündens oder 10, 15, 30 Minuten, 1 oder 2 Stunden vorher (Feld
  **Wann**, Pflichtfeld). Auch am zweiten Abend eines Feiertags, bei Nachteinbruch. Variablen: Minuten
  vorher, Art (`shabbat` oder `holiday`), Name, Uhrzeit (ISO) und Ortszeit.
- **Schabbat oder Feiertag beginnt**: beim Kerzenzünden, einmal für aufeinanderfolgende Tage. Variablen:
  Art, Name, enthält einen Schabbat, Ende (ISO) und Ende in Ortszeit.
- **Schabbat oder Feiertag endet**: zur Hawdala, wenn der letzte der aufeinanderfolgenden Tage vorbei ist.
  Variablen: Art, Name, enthält einen Schabbat.

Der Filter **Schabbat oder Feiertag** behält nur eine Art (leer: beide). Ein Schabbat, der auch ein Feiertag
ist, und ein Zeitraum mit beiden zählen als Feiertag.

## Szenen-Aktion „Tagesinfos"

Gibt die Informationen von heute oder morgen (Feld **Tag**, leer: heute) an die folgenden Aktionen weiter:
Datum, hebräisches Datum, Feiertag, **Schabbat oder Feiertag (1 = ja, 0 = nein)**, Kerzenzünden und Hawdala
dieses Tages, Wochenabschnitt, Tag des Omer, Sonnenaufgang, spätestes Schma, Sonnenuntergang und
Nachteinbruch (Ortszeiten, leer, wenn der Tag keine hat). Prüfe den Wert 1/0 mit einem Schritt **Nur
fortsetzen, wenn**.

## Szenenbeispiele

- **Schabbat-Licht**: Auslöser **Schabbat oder Feiertag beginnt** → Licht im Esszimmer an, Heizung auf
  Komfort; **Schabbat oder Feiertag endet** → zurück zum Normalbetrieb.
- **Erinnerung**: Auslöser **Kerzenzünden**, **Wann** = 1 Stunde vorher → Nachricht „Kerzenzünden um
  {{triggerEvent.data.local_time}}" senden.
- **Kein Wecker am Schabbat**: um 21 Uhr Aktion **Tagesinfos** mit **Tag** = morgen, dann **Nur fortsetzen,
  wenn** „Schabbat oder Feiertag" gleich 0 → Wecker stellen.
- **Bedingung**: In jeder Szene verhindert die Bedingung „Schabbat oder Feiertag jetzt" auf Aus, dass die
  Szene während des Schabbats läuft.

## Fehlerbehebung

- **„Kein Zuhause mit Koordinaten"**: Trage Breiten- und Längengrad eines Zuhauses unter **Einstellungen →
  Zuhause** ein; die Integration übernimmt sie innerhalb von 10 Minuten.
- **Zeiten um eine Stunde verschoben**: Prüfe die Zeitzone von Gladys unter **Einstellungen → System**.
- **Sensornamen in der falschen Sprache**: Die Namen werden beim Hinzufügen des Geräts festgelegt; lösche
  das Gerät nach dem Sprachwechsel und füge es erneut hinzu.
- **Ein Auslöser kam nach einem Neustart zu spät oder gar nicht**: Ein Ereignis, das fällig wurde, während
  die Integration gestoppt war, wird beim Neustart innerhalb von 15 Minuten gesendet, nie später und nie
  zweimal.

## Grenzen

- Die Zeiten werden für die Koordinaten des Zuhauses auf Meereshöhe berechnet, wie standardmäßig bei
  hebcal.com.
- In Polnähe, wo die Sonne nicht untergeht oder nicht 8,5° tief sinkt, können Kerzenzünden oder Hawdala
  fehlen: Dann wird kein Schabbat-Zeitraum angezeigt.
- Die Erinnerungen vor dem Kerzenzünden sind fest (10, 15, 30 Minuten, 1 oder 2 Stunden).
- Ein Zuhause: das erste Gladys-Zuhause mit Koordinaten.

## Danksagung

Kalender, Zeiten und Wochenabschnitte: [@hebcal/core](https://github.com/hebcal/hebcal-es6) von Michael J.
Radwin und den hebcal-Mitwirkenden (GPL-2.0-or-later), die Rechenmaschine von hebcal.com. Die Integration
`jewish_calendar` von Home Assistant hat die Sensoren inspiriert. Diese Integration ist nicht mit hebcal.com
verbunden und steht unter der Lizenz GPL-3.0-or-later.
