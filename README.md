# Beautiful-Together

### Getting Started

#### Installing node

1. Check if you have node and npm install by running `node -v` and `npm -v`. If both are installed, skip this section.
2. Download node from https://nodejs.org/en/download. Follow the steps as shown.
3. Ensure that you have everything downloaded by repeating Step 1.

#### Starting with React

1. [Clone the repository](https://github.com/git-guides/git-clone) into a local workspace
2. Open the repo in an IDE of your choice.
3. Open a new terminal for the project.
4. Run `npm install`. You will get many warnings and vulnerabilities. Ignore these. If you get errors, you will have to debug.
5. Run `npm run dev`. This will be the command you need to run to start the project most of the time.

#### Updating Dependencies and Running the Project

1. Update dependencies after pulling from the remote repository by running `npm install`
2. Run `npm run dev`

### Branching

All commands must be run inside your project terminal. For all your tasks, you will need to create a branch for your team and submit a pull request once you are done.

#### Creating New Branch

**Option 1: Creating a branch on GitHub**

1. Click the branch button on the github page of our repo. It should be right underneath the repo name and say "master"
2. Type in the name of the branch you want to create.
3. Click **Create Branch: [branch name]**
4. Open up your project
5. Run `git pull` in the terminal to update your branches
6. Run `git checkout [branch name]` or `git switch [branch name]` to switch to the newly created branch
7. Double check that you are in the correct repository by running `git branch -a`
8. Make your changes and push as normal while working within your branch

**Option 2: Creating a branch locally**

1. `git branch [name]` to create a branch with name of [name].
2. `git checkout [name]` to switch to branch [name].
3. When you've finished making your changes locally, run `git push -u origin [name]` to create the remote branch and push to there.

#### Submit a Pull Request

1. Navigate to the [repository page](https://github.com/cssgunc/catch).
2. Click the **master** branch button and navigate to the branch you worked on.
3. Click the **Contribute** button
4. Click **Open Pull Request**
5. Click write a description of your changes
6. Click **Create pull request**

### Working with the Backend

#### Getting Started

1. You will need to set up your **.env.local** file. It should be placed in your root directory of your project. More details on that will be sent out through email.

#### Resources:

- [ReactJS Tutorial](https://www.youtube.com/watch?v=Tn6-PIqc4UM)
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Learn Supabase](https://www.youtube.com/watch?v=dU7GwCOgvNY)
