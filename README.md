## Setup

### Setup on iOS
1. Download [Obsidian](https://apps.apple.com/us/app/obsidian-connected-notes/id1557175442)
2. Create empty local vault in Obsidian called [Your Team Name].
3. Close Obsidian
4. Fork repo https://github.com/danrfletcher/Agile-Obsidian
5. Download [iSH](https://apps.apple.com/us/app/ish-shell/id1436902243).
6. Replace `https://github.com/you/your-forked-repo.git` in the following command with the URL of your forked repo.
7. Open iSH & run (when the folder selector opens, select the empty Obsidian vault you created): 
```
apk update && apk add git && git config --global --add safe.directory /root/Nueral && git config --global --add safe.directory /root/Nueral/.obsidian && git config --global submodule.recurse true && cd ~ && mkdir Nueral && mount -t ios . Nueral && cd Nueral && rm -rf .obsidian && git clone https://github.com/you/your-forked-repo-url.git . && git submodule update --init --recursive
```
4. Reopen Obsidian, select trust this author & enable plugins.
5. Click the 3 lines in the bottom right of the screen & click ‘Relay’.
6. Enter the share code for the team’s Obsidian Relay server. 
7. Add team relay folders to vault.