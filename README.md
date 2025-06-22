## Setup

### Setup on iOS
1. Download [Obsidian](https://apps.apple.com/us/app/obsidian-connected-notes/id1557175442)
2. Create empty local vault in Obsidian called [Your Team Name].
3. Close Obsidian
4. Fork repo https://github.com/danrfletcher/Agile-Obsidian
5. Download [iSH](https://apps.apple.com/us/app/ish-shell/id1436902243).
6. Open iSH & run (when the folder selector opens, select the folder for the empty Obsidian vault you just created): 
```
apk update && apk add git && git config --global --add safe.directory /root/Nueral && git config --global --add safe.directory /root/Nueral/.obsidian && git config --global submodule.recurse true && cd ~ && mkdir Nueral && mount -t ios . Nueral && cd Nueral && rm -rf .obsidian && git clone https://github.com/danrfletcher/Agile-Obsidian.git . && git submodule update --init --recursive
```
4. Reopen Obsidian, select trust this author & enable plugins.
5. Click the 3 lines in the bottom right of the screen & click ‘Relay’.
6. Enter the share code for the team’s Obsidian Relay server. 
7. Add team name’s relay folders to the vault:
	1. Named team folder e.g. if the team name is ‘Team’ add the folder named ‘Team’ to the root directory of the vault.
	2. Team templates folder e.g. if the team name is ‘Team’, add the folder named ‘Team Templates’ to Templates/Team Templates.
8. In settings, find ‘Hotkeys for Templates’ & toggle every setting on.