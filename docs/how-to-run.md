# How to Run

## Install

```bash
npm install
```

## Development Server

```bash
npm run dev
```

Open:

- Participant mode: `http://localhost:3000/task`
- Researcher debug mode: `http://localhost:3000/task?debug=1`

## Participant Flow

The Week 1-2 participant flow is:

1. Welcome
2. Consent
3. Instructions
4. Comprehension check
5. Practice trial
6. Main task
7. Debrief

Main task trials use staged reveal:

1. Role and requirements
2. Candidate summary
3. AI recommendation and decision controls

## Debug Mode

`/task?debug=1` shows researcher controls:

- current participant, condition, session, screen, and trial index
- reset assignment
- force condition A or B
- jump to any experiment screen
- export JSON or CSV

Debug controls do not change the participant-facing route unless `debug=1` is present.

## Verification Commands

```bash
npm run lint
npx tsc --noEmit
curl -L 'http://localhost:3000/task?debug=1'
```

`npm run build` may require an environment where Next/Turbopack can bind its internal local port.
