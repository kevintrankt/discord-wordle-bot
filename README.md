# Discord Wordle Bot

[Wordle](https://www.powerlanguage.co.uk/wordle/) is a daily word game, and Discord Wordle Bot is designed to keep score of everyone's daily Wordle scores. The bot parses the Wordle result and adds points for the user based on their score. A running scoreboard is kept and reposted whenever a new Wordle challenge is available.

I built this bot just for my own server so it's not designed to keep track of multiple servers ¯\\_(ツ)_/¯

## README UNDER CONSTRUCTION

<img  src="https://raw.githubusercontent.com/kevintrankt/discord-wordle-bot/main/screenshot.jpg"  alt="Discord Wordle Bot Screenshot"  width="600"/>

### Features

- Parse Wordle results and assign points to users
-  *1/6 = 7 points, 2/6 = 6 points, 3/6 = 5 points ... 1/6 = 1 point, X/6 = 0 point*
- Keep a leaderboard of total points, attempts, and average # of guesses
- Reminder for new Wordle challenges
- LOTR quotes lol

### Requirements

- Node v16 or higher
- TypeScript & ts-node

### Setup
1. Follow the steps to create a new bot on [Discord's developer portal](https://discord.com/developers/applications)
2.  `git clone https://github.com/kevintrankt/discord-wordle-bot.git`
3.  `cd discord-wordle-bot`
4. Create a new `.env` file containing `TOKEN=CLIENTSECRET` where `CLIENTSECRET` is your bot's client secret token from the developer portal
5.  `npm install`
6.  `ts-node index.ts` to start the bot

 

### Initialization

As long as the bot is on, it will detect Wordle results and keep track of scores.

  

### Commands
All commands are start with `!w`
- [!w scores](#scores) - _Display Leaderboard_

### `scores`
Sends leaderboard embed message in the channel 