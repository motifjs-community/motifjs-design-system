# Contributing to @motifx-community/design-system

Thanks for taking the time to help. Bug reports, fixes, tests and documentation improvements are all welcome.

For anything larger than a small fix, please open an issue first so we can agree on the direction before you spend
time on it. Questions and ideas go to the [MotifJS discussions](https://github.com/motifjsdev/motifjs/discussions).

## Setup

Node.js 22 or newer, nothing else: the package has no dependency by path.

```sh
npm ci
npm run dev     # the example page, drawn from the token map
```

## Checks

`npm run check` is what CI runs: the token build, typecheck, stylelint, the tests, the package build and the example
build. The parts on their own:

```sh
npm run build:tokens     # tokens/*.json → src/generated and the CSS layers
npm run contrast         # the colour roles against WCAG, also part of the build
npm test
npm run typecheck
npm run lint:css
npm run e2e              # real-browser checks: a local Chrome and playwright-core
```

## Making a change

- Keep a pull request focused on one thing. Two unrelated fixes are easier to review as two pull requests.
- Tokens are the source. Edit `tokens/*.json` (DTCG object values) and run `npm run build:tokens`; the files under
  `src/generated` are committed output, never edited by hand.
- A stylesheet carries no literal value that a token has: a length, a colour or a duration is read from its `--mx-*`
  property.
- Each design language (`data-identity`) is its own token set. A change to one language stays in its files and is
  looked at in the light and the dark theme, with the contrast check green.
- A change visible to users gets a line in CHANGELOG.md under "Unreleased".
- Write commit messages as a short summary line in the imperative ("Fix list reorder after splice"), with a body
  that explains why when it is not obvious.

## Reporting bugs

Please use the bug report form and include a minimal reproduction: the smallest component or snippet that shows the
problem, what you expected and what happened instead.

Security issues should not be reported in public issues. See the
[security policy](https://github.com/motifjs-community/.github/blob/main/SECURITY.md).

## Code of conduct

This project follows the [Code of Conduct](https://github.com/motifjs-community/.github/blob/main/CODE_OF_CONDUCT.md). By taking part you agree
to follow it.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) of this repository.
