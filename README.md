## Setup

### Setup on iOS
1. Create empty local vault in Obsidian called [Your Team Name].
2. Close Obsidian
3. Fork repo https://github.com/danrfletcher/Agile-Obsidian
4. Download [iSH](https://apps.apple.com/us/app/ish-shell/id1436902243).
5. Open iSH & run: 
```
apk update \
&& apk add git \
&& git config --global submodule.recurse true \
&& cd ~ && mkdir Nueral \
&& mount -t ios . Nueral \
&& cd Nueral \
&& rm -rf .obsidian \
&& git clone https://github.com/you/your-forked-repo . \
&& git submodule update --init --recursive \
```
4. Reopen Obsidian, select trust this author & enable plugins.
5. Click the 3 lines in the bottom right of the screen & click ‘Relay’.
6. Enter the share code for the team’s Obsidian Relay server. 
7. Add team relay folders to vault.


