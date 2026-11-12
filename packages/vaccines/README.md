# @notch/vaccines

Vaccination schedule engine in plain TypeScript: given a schedule, a birth date and the doses already given, it works out the state of every dose on a given day.

```ts
import { nextDose, planDoses, validateSchedule } from "@notch/vaccines";

validateSchedule(schedule);
const states = planDoses(schedule, "2026-01-01", vaccinations, "2026-03-10");
const next = nextDose(states); // the dose to show on the Today screen
```

| Status      | Meaning                                                              |
| ----------- | -------------------------------------------------------------------- |
| `done`      | Recorded as given                                                    |
| `due`       | Valid now, at most `overdueAfterDays` (default 30) past the due date |
| `overdue`   | More than `overdueAfterDays` past the due date                       |
| `upcoming`  | Not valid yet, within `upcomingWindowDays` (default 30)              |
| `scheduled` | Not valid yet, further away                                          |
| `waiting`   | The previous dose of the same vaccine has not been given             |
| `missed`    | Older than the maximum age for the dose                              |

The earliest date of a dose is the later of the minimum age and the minimum interval after the previous dose as actually given, so a late dose pushes the next one back. The due date is the recommended age, never earlier than the earliest date. All dates are calendar dates (`YYYY-MM-DD`), so time zones do not shift them.

## Products, diseases and appointments

In practice the clinic books each next dose and writes the date in the book, and one product can cover several diseases (Infanrix Hexa covers six). So the app records doses **per product** and shows them **per disease**:

```ts
import { CATALOG, appointmentStates, dosesByDisease, nextAppointment } from "@notch/vaccines";

const byDisease = dosesByDisease(records, CATALOG); // Map<DiseaseCode, DiseaseDose[]>, every disease of the book
const states = appointmentStates(appointments, records, "2030-03-20");
const next = nextAppointment(states); // overdue first, then the soonest
```

- `CATALOG` lists 22 diseases (the rows of a Vietnamese vaccination book) and the products recorded so far; `validateCatalog` checks it.
- An appointment is `fulfilled` once a dose with the same product and dose number is recorded; its date can be `null` for bookings like "after the first birthday" (`undated`).
- `planDoses` (below) stays useful for suggestions and minimum-interval checks when there is no appointment.

## Schedule data

Not included yet. The Vietnamese expanded programme (TCMR) and service vaccine schedules will be generated from an official source and checked with `validateSchedule`, not typed by hand. Tests use a fixture schedule with fake vaccines.
