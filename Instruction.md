Overview
This week we are going to practice rewriting git history. We're also going to give our 0.1 Release project a bit of a clean-up, and start to refactor the code.

This lab will help you practice the following:

creating branches to work on evolving your code
refactoring existing code to make it easier to read, easier to maintain, and more modular
using git rebase to rewrite history on a branch
using git commit --amend to add things to a previous commit and update a commit message
using git merge
NOTE: it is highly recommended that you watch this week's video on git rebasing before you start this lab.

Refactoring
As code evolves and grows new features, the complexity of the code often grows with it. We add features and in doing so we are forced to create new code paths, functions, classes, etc. It's easy to start losing control of the code.

This process of quickly extending software without managing the quality of the code is known as technical debt. Just as we must borrow money in order to buy a home, writing large software projects typically involves taking on debt, as we merge code that is good enough, but could be better if we had more time. Eventually, we'll need to pay-down this technical debt, and fix our code, or risk going bankrupt!

Understanding Refactoring
Refactoring is a technique for improving the structure and maintainability of your code without altering its behaviour. We aren't adding new features or fixing bugs; we're improving the quality of the code itself.

Let's walk through a simple example of how we might refactor some code. Imagine the following program in file.js, which defines, analyzes, and prints some data:

// age group 0-19
let total1 = 15 + 16 + 17;
let average1 = (15 + 16 + 17) / 3;
console.log(`Case data for population age group 0-19: total=${total1} average=${average1}`);

// age group 20-39
let total2 = 56 + 2 + 67;
let average2 = (56 + 2 + 67) / 3;
console.log(`Case data for population age group 20-39: total=${total2} average=${average2}`);
Running our program produces the following output:

$ node file.js
Case data for population age group 0-19: total=48 average=16
Case data for population age group 20-39: total=125 average=41.666666666666664
The program works, but the code is not as good as it could be. For one thing, we've copy/pasted some code in order to go quickly, and our variable names are really bad. When we need to add some additional age groups, doing more "copy/paste" programming is only going to make things worse.

We really want to make this code easier to work with, easier to understand, and easier to extend. Our goal is to keep the output the same, but improve the readability, maintainability, and structure of the code.

Improving Code through Refactoring
There are all kinds of common refactoring patterns we could use, but let's focus on a couple of obvious improvements.

First, we're repeating code, which is going to make it harder to change or maintain (i.e., if we find a bug in one spot, we have to remember to go and fix it in all the other copy/pasted versions). It would be nice if we could reduce the amount of duplication we're seeing.

Second, our variable naming is terrible, and it's taking too long to figure out what each line is doing.

Let's refactor and improve our code by:

extracting functions
extracting classes to avoid duplication;
renaming variables
splitting the code into multiple files
Step 1: Refactoring with Git, Creating a Refactoring Branch
Because we'll be making significant changes to our code, we want to be careful not to break our current, working program. It might not be pretty, but at least it works!

Let's move our development off of the main branch and create a separate and isolated refactoring branch:

# Make sure we have everything from GitHub in our local repo before we start
git checkout main
git pull origin main
# Create a new topic branch off of main
git checkout -b refactoring main
Now we can commit changes as we go without fear of destroying our current program. If at any time we need to quickly re-run our working program, we can git checkout main and everything will still be there.

Step 2: Extracting a Function
Our program is calculating averages in multiple places and repeating the same code each time. This is error prone, since we could make a mistake in one of the calculations. Also, it's impossible to test our program's logic without manually testing every single instance of our average calculation (e.g., two of them could work, but a third could be wrong).

Let's extract the average functionality into its own function, which we can call in multiple places:

// Calculate the average for a set of numbers
function average(...numbers) {
  let total = 0;
  let count = numbers.length;
  for(let i = 0; i < count; i++) {
    total += numbers[i];
  }
  return total / count;
}

// age group 0-19
let total1 = 15 + 16 + 17;
let average1 = average(15, 16, 17);
console.log(`Case data for population age group 0-19: total=${total1} average=${average1}`);

// age group 20-39
let total2 = 56 + 2 + 67;
let average2 = average(56, 2, 67);
console.log(`Case data for population age group 20-39: total=${total2} average=${average2}`);
This is getting better. Instead of repeating our average calculation over and over, we're now able to do it once in a single function. The name of the function helps us understand its purpose, and if we get the calculation right, it will work perfectly every time we call it.

After testing that everything still works, we commit to our refactoring branch:

$ git add file.js
$ git commit -m "Extract average() function"
Step 3: Extracting a Second Function
Our first refactoring step revealed that we're actually repeating ourselves in multiple places: our average() function requires a total, which we also need to calculate for each age group.

Luckily, we've already written the code for calculating a total, and can extract that too into a reusable function, which will simplify our average() implementation as well:

// Calculate the total for a set of numbers
function sum(...numbers) {
  let total = 0;
  let count = numbers.length;
  for(let i = 0; i < count; i++) {
    total += numbers[i];
  }
  return total;
}

// Calculate the average for a set of numbers
function average(...numbers) {
  return sum(...numbers) / numbers.length;
}

// age group 0-19
let total1 = sum(15, 16, 17);
let average1 = average(15, 16, 17);
console.log(`Case data for population age group 0-19: total=${total1} average=${average1}`);

// age group 20-39
let total2 = sum(56, 2, 67);
let average2 = average(56, 2, 67);
console.log(`Case data for population age group 20-39: total=${total2} average=${average2}`);
This is even better. We only have a single function for calculating totals and averages, and once we know they work, they will work everywhere. If we find a bug in one of them, we can fix it once, and it will be fixed for the whole program.

After testing that everything still works, we commit to our refactoring branch a second time:

$ git add file.js
$ git commit -m "Extract sum() function, refactor average() to re-use sum()"
Step 3: Extracting a Class
One of the things we're noticing about the code is that the total and average are closely connected: we end-up needing one to calculate the other, and we're having to type the same data over and over again. Every time we type the same thing, or copy/paste code, it feels like it's too easy to make mistake. It seems like this data is really part of something larger, and it might make more sense to combine it together into a single class:

class Data {
  constructor(...numbers) {
    this.numbers = numbers;
  }

  // Calculate the total for the set of numbers
  sum() {
    let numbers = this.numbers;
    let total = 0;
    let count = numbers.length;
    for(let i = 0; i < count; i++) {
      total += numbers[i];
    }
    return total;
  }      

  // Calculate the average for the set of numbers
  average() {
    return this.sum() / this.numbers.length;
  }
}

// age group 0-19
let data1 = new Data(15, 16, 17);
console.log(`Case data for population age group 0-19: total=${data1.sum()} average=${data1.average()}`);

// age group 20-39
let data2 = new Data(56, 2, 67);
console.log(`Case data for population age group 20-39: total=${data2.sum()} average=${data2.average()}`);
This is great. We've cut in half the number of times we have to enter the lists of data, which reduces the chances we make a mistake. Now we're encapsulating our data in a single object that can manage the analysis without knowledge of the rest of the program.

After testing that everything still works, we commit to our refactoring branch a third time:

$ git add file.js
$ git commit -m "Refactor sum() and average() into a Data class"
Step 3: Code Splitting
Our program isn't huge, but it's getting a bit larger than it needs to be. Our new Data class is really something separate from our main program. We decide to break our file.js into two files: our main program in index.js; and our Data class in data.js:

data.js
class Data {
  constructor(...numbers) {
    this.numbers = numbers;
  }

  // Calculate the total for the set of numbers
  sum() {
    let numbers = this.numbers;
    let total = 0;
    let count = numbers.length;
    for(let i = 0; i < count; i++) {
      total += numbers[i];
    }
    return total;
  }      

  // Calculate the average for the set of numbers
  average() {
    return this.sum() / this.numbers.length;
  }
}

// Export our Data class
module.exports.Data = Data;
index.js
We need to rename file.js to index.js in git:

$ git mv file.js index.js
Now we can update its contents:

// Import our Data class
const { Data } = require('./data');

// age group 0-19
let data1 = new Data(15, 16, 17);
console.log(`Case data for population age group 0-19: total=${data1.sum()} average=${data1.average()}`);

// age group 20-39
let data2 = new Data(56, 2, 67);
console.log(`Case data for population age group 20-39: total=${data2.sum()} average=${data2.average()}`);
This is way better. Our program is now made up of a few smaller units, each of which is easy to read and stands on its own. Having programs split across multiple files also makes things easier when working with git, since it means there's less chance that two people will be working on the same line(s) in the same file(s).

After testing that everything still works, we commit to our refactoring branch a fourth time:

$ git add index.js data.js
$ git commit -m "Split file.js into index.js and data.js"
Step 4: Improving Names
There's one last obvious improvement that we can make: our variable names are terrible. Using names like data1 and data2 is often known as a "bad code smell." Something is "off" with this, you can just sense it, even if you aren't sure exactly why. Names that have to be looked up in order to know what they are don't work (quick: which age group does data2 store?).

Let's use better names for our data:

// Import our Data class
const { Data } = require('./data');

// age group 0-19
let ageGroupUnder19 = new Data(15, 16, 17);
console.log(`Case data for population age group 0-19: total=${ageGroupUnder19.sum()} average=${ageGroupUnder19.average()}`);

// age group 20-39
let ageGroup20to39 = new Data(56, 2, 67);
console.log(`Case data for population age group 20-39: total=${ageGroup20to39.sum()} average=${ageGroup20to39.average()}`);
We can argue about the best names to use here, but no matter what we settle on, we've made a big improvement over data2.

After testing that everything still works, we commit to our refactoring branch a fifth time:

$ git add index.js
$ git commit -m "Rename age group variables to be more clear"
Step 5: Rebasing and Squashing
Now that we've finished our refactoring, let's get ready to merge this work into main. However, before we do, let's squash everything into a single commit. It took us 5 commits to refactor this code, but in our mind, the end product is really one single thing: we don't care about the steps it took to get here, just the end result.

git rebase main -i
This will start an interactive rebase, opening our editor, and allowing us to specify what to do with each commit:

pick 4710009 Extract average() function
pick 0c01069 Extract sum() function, refactor average() to re-use sum()
pick fd8e932 Refactor sum() and average() into a Data class
pick f9d85bf Split file.js into index.js and data.js
pick bfac3d3 Rename age group variables to be more clear

# Rebase ac38daf..bfac3d3 onto ac38daf (2 commands)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
# l, label <label> = label current HEAD with a name
# t, reset <label> = reset HEAD to a label
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]
# .       create a merge commit using the original merge commit's
# .       message (or the oneline, if no original merge commit was
# .       specified). Use -c <commit> to reword the commit message.
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
#
We want to squash the last 4 commits (squash) into the first (pick):

pick 4710009 Extract average() function
squash 0c01069 Extract sum() function, refactor average() to re-use sum()
squash fd8e932 Refactor sum() and average() into a Data class
squash f9d85bf Split file.js into index.js and data.js
squash bfac3d3 Rename age group variables to be more clear
After we save the file, git will create a new commit that uses the changes from all 5 commits in a single commit. The log message will include the combined log messages of all 5 commits.

Try running git log to confirm that it worked.

Step 5: Amending a Commit
Just as we finish our last step, we realize that our commit message wasn't quite right. We really want to change it before we merge. To do that, we'll do an amended commit, which will change the previous commit instead of making a new one:

git commit --amend
This will open your editor again with the previous log message, which we change like so:

Refactoring file.js to improve code maintainability:

  * Extract average() function
  * Extract sum() function, refactor average() to re-use sum()
  * Refactor sum() and average() into a Data class
  * Split file.js into index.js and data.js
  * Rename age group variables to be more clear
We save and the commit is updated with the new message. Once again, check that it worked with git log and git show to see the changes.

NOTE: you can also use git --amend --no-edit if you want to update the previous commit to add/change something, but don't want to change the commit message (--no-edit means leave the commit message as it is).

Step 6: Merging our Work
Our refactoring branch is finished, and we're ready to merge to main:

git checkout main
# We should be able to do a simple fast-forward merge
git merge --ff-only refactoring
git push origin main
Our main branch should now include the changes from refactoring in a single commit.

Your Turn to Refactor!
Based on the example refactoring walk-through you just read, it's your turn to improve some code. You are asked to refactor your own 0.1 Release repo to improve the code's structure, readability, modularity, and maintainability.

Use a similar method to the walk-through above:

create a refactoring branch off of your latest main
look through your code to find at least 3 improvements you could make. For example:
get rid of global variables
use functions instead of variables to calculate things vs. storing them
separate command-line argument parsing from file parsing from output
improve variable naming
reduce code duplication through shared functions, classes, etc
talk to your friends to see if they have ideas of other improvements you could make
each refactoring step should be done in a separate commit. Test your code before you commit changes and don't commit anything that breaks the program. Use good commit messages to describe what you did
each refactoring step can build on the previous one, but don't mix them (e.g., don't solve two separate problems in a single refactoring commit, use two commits instead).
when you are done, do an Interactive Git Rebase to squash all of your refactoring commits into a single commit
use an Amended Git Commit to update the commit message to make it more clear
do a git merge on your main branch to integrate your refactoring branch's changes
do a git push origin main to share your changes publicly on GitHub
We will be writing automated tests against this code later, so spend some time refining and improving your code as much as you can.

Write a Blog Post
Write a blog post about the process of refactoring your code. What did you focus on in your improvements? How did you fix your code so it would be better in each step? How did your interactive rebase go? Did you find any bugs in your code while you did this? Did you break your program while changing things? How did it go using Git to change your project's history?