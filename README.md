## Setup on Windows, Linux or MacOS
1. Repo Setup. 
	- If you plan to use Git with your own vault (recommended to save & share files between your devices): Fork repo https://github.com/danrfletcher/Agile-Obsidian. If using this method, you may need to periodically update your fork to receive the latest content, see further instructions below. 
	- If you do not plan to use Git with your own vault (not recommended), you do not need to fork the repo. This method will allow you to save your vault’s state using Obsidian Relay (described later in the guide), but is not recommended due to potential for conflicts & errors.
	- New to GitHub? [Read Instructions on Forking a Repository Here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo).
2. Setup Git (Windows Only)
	- MacOS & Linux come preinstalled with Git. If on windows, you can download & install Git [here](https://git-scm.com/downloads/win).
3. Clone the Repo
	1. Navigate to the the location you would like your Agile Obsidian vault to be e.g. ‘Documents’. 
	2. Open this folder in your command line utility (right click on the folder & click ‘open in terminal’ or similar depending on your system).
	3. Paste the following command `git clone [YOUR FORKED REPO URL].git`
		- Replace [YOUR FORKED REPO URL] with the URL of your forked repo.
		- If using the existing repo, replace with https://github.com/danrfletcher/Agile-Obsidian
		- You may need to enter your GitHub credentials if asked, **your GitHub password will not work**. Instead use a GitHub ‘Personal Access Token’ with read/write access to your repositories when asked for your password. You can find out more about creating one [here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).
	4. Wait for the Git command line process to complete, the repo is now cloned to your local machine in the folder that appears called **’Agile-Obsidian’**
4. Obsidian Setup
	1. Download Obsidian for your device [here](https://obsidian.md/download).
	2. Open Obsidian, when prompted, select the **Agile-Obsidian** folder containing the git repository you just cloned, this will be your vault.
	3. When prompted, select ‘trust this author & enable plugins’. Skip to the Obsidian Relay setup guide below for instructions on how to add your team’s files & folders to your vault.
### Setup on iOS
1. Download [Obsidian](https://apps.apple.com/us/app/obsidian-connected-notes/id1557175442)
2. Create empty local vault in Obsidian called Vault.
3. Close Obsidian
4. Fork repo https://github.com/danrfletcher/Agile-Obsidian
5. Download [iSH](https://apps.apple.com/us/app/ish-shell/id1436902243).
6. Open iSH & run (when the folder selector opens, select the folder for the empty Obsidian vault you just created): 
```
apk update && apk add git && git config --global --add safe.directory /root/Vault && git config --global --add safe.directory /root/Vault/.obsidian && git config --global --add safe.directory /root/Vault/Templates/Sample Templates && git config --global submodule.recurse true && cd ~ && mkdir Nueral && mount -t ios . Nueral && cd Nueral && rm -rf .obsidian && git clone https://github.com/danrfletcher/Agile-Obsidian.git . && git submodule update --init --recursive
```
4. Reopen Obsidian, select trust this author & enable plugins.

### Setup Obsidian Relay & Add Existing Team Folders
1. Open Obsidian
2. Click the 3 lines in the bottom right of the screen & click ‘Relay’ (you can also find this in Settings > Relay).
3. Sign in & enter the share code for the team’s Obsidian Relay server. 
4. Add team name’s relay folders to the vault:
	1. Named team folder e.g. if the team name is ‘Team’ add the folder named ‘Team’ to the root directory of the vault, next to the existing Sample Team folder.
	2. Team templates folder e.g. if the team name is ‘Team’, add the folder named ‘Team Templates’ to the templates folder next to the existing Sample Templates folder: (the resulting location would be Templates/Team Templates).
5. In settings, find ‘Hotkeys for Templates’ & toggle every setting on - this will activate your team’s templates.