# Stellar Infinitum

An incremental/idle game built with Angular where you progress through multiple skill trees with increasing complexity via a prestige/ascension system.

## About the Game

Stellar Infinitum is an idle game where you:
- 🎯 Earn Energy automatically over time
- 📚 Unlock and upgrade skills using Energy
- ⚡ Build production chains through skill prerequisites
- 🌟 **Ascend through 5 warp tiers** (4 skills → 6 skills → 8 skills)
- � Gain **permanent bonuses** from each warp
- 💤 Benefit from offline progress when you're away
- 💾 Auto-save your progress every 10 seconds

### Current Features

- **5-Tier Progression System**
- **Prestige Mechanics**: Max all skills + reach threshold to unlock next tier
- **Permanent Bonuses**: Each warp multiplies production permanently
- **Resource System**: Energy with automatic production
- **Idle Mechanics**: Resources accumulate in real-time and offline
- **Persistent Saves**: All progress including ascensions saved to localStorage
- **Responsive UI**: Clean, gradient-based design that works on mobile and desktop
- **Achievement System**: 70+ achievements across 7 categories with permanent rewards
  - Track milestones, unlocks, and special accomplishments
  - Secret achievements for expert players
  - Visual notifications and progress tracking
  - See [ACHIEVEMENTS.md](ACHIEVEMENTS.md) for full details

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The game will start immediately!

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
