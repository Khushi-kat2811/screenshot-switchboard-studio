# Build My Holiday: Demo-Day Presentation Script

**Presenters:** Khushi (first half) and Soumika (second half)
**Total time:** 20 minutes of presentation, then 10 minutes of Q&A

| Part | Who | Slides | Time |
|---|---|---|---|
| Opening skit | Both | — | 1:00 |
| First half | Khushi | 1–4 | 3:45 |
| Live demo | Khushi | 5 (6 is the backup) | 8:00 |
| Second half | Soumika | 7–11 | 5:30 |
| Buffer | | | 1:45 |
| **Total** | | | **20:00** |

---

## Opening skit: "Ten tabs, one family" (about 60 seconds, both)

**Props:** one laptop or phone, and a sticky note that says **₹3,50,000**.
**Cast:** Khushi plays **Priya Menon**, Soumika plays **Arun Menon**.

*(Priya sits staring at the laptop, scrolling fast. Arun stands behind her holding the ₹3,50,000 note.)*

**PRIYA:** Okay. Japan. Six nights. I have… eleven tabs open.
*(clicks)* Found it! The cheapest flight. Lands in Tokyo at nine-thirty at night. Booking it.

**ARUN:** Wait. How do we get from the airport? The airport bus stops at ten.

**PRIYA:** *(sigh)* Fine. Taxi. *(types)* …That's five thousand more than the other flight.

**ARUN:** And does one room fit us and Kiaan? And is that temple even open on Monday?

**PRIYA:** *(closes the laptop)* Every time I fix one thing, something else breaks.

**ARUN:** *(sticks the note on the laptop)* And we still have to stay inside this.

*(Both step forward and drop the characters.)*

**SOUMIKA:** That's the Menon family: two adults, a six-year-old, ₹3.5 lakh, and their first trip abroad.

**KHUSHI:** And this is how we solved it.

*(Soumika steps back. Khushi takes the clicker.)*

---

## First half: Khushi alone (slides 1–6, about 12 minutes with the demo)

### Slide 1: Cover (30 sec)

> "We are Khushi and Soumika, and this is **Build My Holiday**.
> You give us seven details: where you're leaving from, where you're going, when, how many nights, who's travelling, the children's ages and your budget. We give you a complete holiday back. That's flights, hotels, airport transfers, trains between cities and things to do, with every rule respected, and it stays correct when you change something.
> I'll show you what it does. Then Soumika will show you how it works inside."

*[Click]*

### Slide 2: The problem (1 min 15 sec)

> "You just saw the problem: every booking depends on the others.
> Today people solve it in three ways. A **travel agent** plans by hand, which is slow, and every change is a phone call. A **fixed package** is ready-made, but you can't swap a hotel or a flight. And **doing it yourself** means five websites and a spreadsheet, and every check is yours.
> On the right is exactly what Priya hit. The cheaper flight lands at **21:30**. The airport bus stopped at **22:00**. So only a taxi works, and the trip costs **₹5,740 more**. The first day's plan and the budget both change. One small choice, and everything moves."

*[Click]*

### Slide 3: Our solution (1 min 15 sec)

> "Our answer: seven inputs in, one full trip out. The engine does it in three steps, with no AI.
> **One, enumerate.** It lists every possible city plan: every order of cities and every way to split the nights, with at least two nights in each city. For the Menons that's 27 plans.
> **Two, greedy.** For each plan it picks the cheapest parts that fit, and it picks the flight, airport transfer and hotel *together*, because the cheapest flight alone can be a trap.
> **Three, validate.** It checks the whole trip against all 21 rules from the brief, and checks again after every change.
> This screenshot is the result for the Menons."

*[Click]*

### Slide 4: Demo setup (45 sec)

> "Here are the Menons again: from Bengaluru to Japan, starting 10 April 2027, for six nights. Two adults and a six-year-old, with ₹3.5 lakh for everything. They don't know Japan, so they don't choose the cities. The app does.
> In the demo, watch for four moments: we **build** the trip, **compare** three options, **change** a flight and **book** it."

*[Click]*

### Slide 5: Live demo (8 min). Khushi drives and talks

*Switch to the browser.*

**1. Fill the form (1 min)**
> "I could fill the form, but I'll type one sentence instead: '2 adults 1 kid age 6 Bengaluru to Japan 10 Apr 6 nights 3.5 lakh'. *(Fill search)* Every field is filled. That's simple pattern matching, no AI: '3.5 lakh' becomes 3,50,000. I'll tick *Compare 3 options* and search."

**2. Compare three trips (1 min 30 sec)**
> "We get three complete trips: cheapest, fastest and best rated. Each one has already passed all 21 rules. The best-rated one upgrades the hotels to five stars and still stays under budget. I'll choose one."

**3. The trip (1 min)**
> "Here's the day-by-day plan. The flight leaves the night before and lands on day one, then the airport bus, the hotel, and something to do each day. On the right you can see the total, the budget and how much is left."

**4. Change a flight (2 min)**
> "Now let's be Priya and pick the cheaper flight. *(Change flight)* The ticket is cheaper, but the trip shows **+₹5,740**. It lands late, the bus is gone, and the app has already switched the pickup to a taxi. It tells you this *before* you choose. That's the problem from slide two, solved. And it only lists flights that keep the trip valid."

**5. Add an activity (1 min)**
> "Let's add something on a free day. *(add attraction)* It goes into a free time slot, and the total updates. If I pick something that breaks a rule, like a place in another city or a day it's closed, it's refused with the exact reason, and my trip stays as it was."

**6. Book it (1 min 30 sec)**
> "Book this trip. *(click)* We get a 10-digit booking number. *(Find a booking)* It opens the same booking, and it's saved in the database, so it survives a restart. A wrong number just says 'Reservation not found'."

*Back to the slides.*

### Slide 6: Demo backup (only if the live demo fails)

> "We recorded the same flow, just in case." *(Play the video and narrate the same six steps.)*

### Hand-off (one line)

> "That's what it does. Soumika will show you how it works inside, and how we know it's right."

*(Hand the clicker to Soumika.)*

---

## Second half: Soumika alone (slides 7–11, about 6 minutes)

### Slide 7: Architecture (1 min 30 sec)

> "The app has four layers, and each one only talks to the layer below it.
> The **web app** shows results. It never calculates a price or checks a rule.
> The **API** checks every input and saves each change as a new version. That gives us undo, and two tabs can't overwrite each other.
> The **engine** is plain Python with no web or database code, so it's easy to test. The Builder chooses the cities and the parts, and Pricing uses the five formulas from the brief.
> In the **data** layer, the catalog files are loaded into memory once and never edited, and MySQL keeps the trips, versions and bookings.
> The key choice is this yellow box: one **Validator**. Building, every change, booking and export all go through the same rule check. So a trip that breaks a rule can never be shown, saved or exported, and when it refuses a change, it says which rule and why."

*[Click]*

### Slide 8: Testing (1 min 30 sec)

> "We have **150 automated tests**, and one command runs them in seconds. They come in four kinds.
> **Every rule, both ways:** each rule has a trip that must pass and one that must fail, so we know it really catches mistakes.
> **Fast search equals slow search:** we kept a slow search that tries every flight, transfer and hotel. Our fast search must find the *same* cheapest trip. That's how we learned the cheapest flight is a trap.
> **Trips we never planned for:** other cities, the UAE, big families and tiny budgets, all re-checked against every rule.
> **The whole journey:** build, change, book and look up through the API, the same way the web app does."

*[Click]*

### Slide 9: Where it stands (1 min)

> "All **8 must-haves** work end to end, all **4 good-to-haves** work, and so do our **3 stretch** features: the one-line quick request, seats and rooms used up on booking, and popular trips with travel tips.
> What isn't ready yet: a new search doesn't count seats that are already booked. The booking step still catches it and says 'sold out', so nothing is ever double-booked. Also, the page loads its styles from the internet."

*[Click]*

### Slide 10: What's next (1 min 15 sec)

> "With more time, we'd do five things.
> **Smarter than brute force:** today we try every city plan on purpose. It's at most 135, so it's instant and never misses the cheapest trip. With much bigger data we'd go step by step: reuse repeated work, drop weak plans early, then use dynamic programming, and keep the slow search as a test.
> **Ready for a bigger catalog:** more cities and flights should still answer in a second.
> **Many customers booking at once:** lock the seats and rooms while a booking runs, so the last room is sold only once.
> **Search that knows what's booked:** never offer a trip that will fail at booking.
> **Days that suit the family:** pick attractions by interests, and balance busy and easy days."

*[Click]*

### Slide 11: Thank you (15 sec)

> "That's Build My Holiday. Thank you! We'd love your questions about the code and the choices behind it."

*(Khushi steps forward again for Q&A.)*

---

## Q&A split (10 minutes)

Split the questions by topic:

- **Soumika:** the algorithm, rules, testing, scaling and concurrency.
- **Khushi:** the demo flow, API, database, booking and frontend.

## Before going on stage

- Run `demo_reset.sql` so the Menon booking does not return SOLD_OUT.
- Make sure the demo laptop has internet, because the page loads its styles online.
- Keep the backup video ready on slide 6.
