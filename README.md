## 📦 About This Repository

Orb is an actively maintained and open source Discord bot with a lot of features. This is it's codebase. You are welcome to explore the code, contribute improvements, and suggest new features. Everything is welcome! But heads up, this is meant for people interested in contributing or experimenting. While Orb can be hosted on a local machine under the terms of the license, this is not officially supported at this point in time and this here will not provide help for issues on self-hosted instances. This repository also does not provide end-user support. For questions or support related to the hosted version of Orb, visit the homepage or [the support server on Discord](https://discord.gg/kUPz8dS7PM).

## 🤝 Contribute to Orb

### Got an idea?

If you have an idea, a suggestion or a feature request, you can make your voice heard in two ways. Either you get in contact with me through [the support server on Discord](https://discord.gg/kUPz8dS7PM), or, preferably, you create an Issue or a Discussion on here. Both works fine!

### Contributing code

If you want to submit code directly, please fork the repo, create a new branch (`feature/your-change`), and submit a pull request with a clear commit message. I'd love to be able to ask you to adhere to the coding style, but in all fairness, my codebase is still mostly a mess and I am still actively working on improving it.

## ⚙️ Requirements & Setup

### Prerequisites

You should have a Discord bot token available through your [Discord Developer Portal](https://discord.com/developers), and have [Node.js](https://nodejs.org) >20 and [PostgreSQL](https://www.postgresql.org/) >17.5 installed. This version of Orb was built and is running on Node.js 20.18.0 and PostgreSQL 17.5, using discord.js 14.20.0.

### Installation and Setup

Clone the repository into a new folder and run `npm install` to install the necessary packages. Then, create a `.env` file based on the structure in `.env.example` at `/config`, where `.env.example` is. Populate it with the necessary values.
Orb provides a development and a production version of each `.env` variable in case you want to run two bot instances at once, for example to not disturb the hosted version. The `config` script determines which to supply to the bot on startup based on the environment flag at the bottom of `.env`, which you have to change accordingly.

### Run

Orb provides the following executable scripts through `package.json`:

```bash
npm start               # run compiled build using tsx
npm run build           # compile to JavaScript code
npm run deployToBot     # deploy /src/commands to the Discord application specified in .env
npm run deployToServer  # deploy /src/commands to the guild specified in .env
```

## ⚖️ License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [`LICENSE`](./LICENSE) for the full text of the license. For a summary of the AGPL-3.0, visit [choosealicense.com](https://choosealicense.com/licenses/agpl-3.0/). A list of all third-party packages used in this project and their respective licenses can be found in [`NOTICE.md`](./NOTICE.md).

## 💭 Contact

Orb is developed and maintained with love and care by me, jonasfdb <3
To contact me, you can either directly contact me through Discord under the username "jonasfdb".
