Step 2: Add Continuous Integration
What is CI?
Our test framework has been integrated and we've written a number of tests, but so far they only run if you remember to run them. Developers are human and make mistakes. It's easy to forget to run the tests before pushing new code or merging a pull request. What if that new code breaks our tests?

A central idea of testing on a large project is that no developer is ever allowed to break the main branch. If someone's changes would break the tests, we can't merge them; if we do, we'll introduce a bug that will derail the work of other developers on the project until it gets fixed, and also affect users.

To help us keep the default branch working at all times, we need to add Continuous Integration (aka CI) to our project. CI is a method whereby we build and run our tests (i.e., integrate everything in our project) automatically whenever anything is pushed to the repo, or a new pull request is made. With CI we do this continually and ideally on every change. This lets us monitor the effect of a given change and assess its quality.

For CI to work, we need dedicated machines to be available to checkout our code, build it, and run our tests. We could set up our own machines and have them listen for various events on GitHub in order to trigger a build; or we can use any number of existing CI cloud providers who will do this for us. Many of these are free for open source developers.

GitHub Actions
GitHub provides its own CI service called GitHub Actions. Actions allow us to automate workflows in response to events in a GitHub repo (e.g., merging to main, creating a pull request, etc).

We can add a GitHub Action via the GitHub UI for our repo. Doing so will create a new file YAML file with information about when to trigger the action, and which steps to perform.

You can read more about how to create a CI workflow for your language using these GitHub guides:

Building and testing Node.js
Building and testing Python
Building and testing Go
Building and testing Rust
There are also starter workflow files for many other languages, including dotnet core, C/C++, Rust, Go, etc.

Create a GitHub Actions Workflow
In your repo, create a GitHub Actions Workflow that runs your tests. It should be triggered on any push to your default branch (e.g., main), and for any pull_request to your default branch. You can add, edit, and commit the file directly in GitHub. When you do, it should trigger a build that you can inspect in the Actions tab of your repo.

NOTE: if you commit the .yml workflow file via the GitHub web page, make sure you git pull origin master to your local repo so that you also get this change on your local machine's repo!

Step 3. Create a Pull Request to Test your CI
To make sure that our CI workflow is correct, we'll try creating a pull request against our own repo.

Pick a third area of your code that needs some tests, for example another function. Create a new branch for this work (e.g., add-more-tests) and write your new tests. Use your coverage tool to help you know when you've done enough work.

When all of your tests are passing, commit your new test cases to the add-more-tests branch, and push this branch to your origin (don't merge it to master):

$ git push origin add-more-tests
When this completes, git will let you create a new Pull Request (or you can do it manually via the GitHub UI). Create a pull request from your add-more-tests branch to your main branch.

NOTE: this might seem odd to you--why would I ever make a pull request to my own repo? As strange as this sounds, it's often done in projects where a community of developers is working, and one of the people owns the repo. This allows the owner to also have their code reviewed and go through CI.

In GitHub, make sure your pull request has triggered your CI workflow, and you have a report of whether it is running, passed, or failed. If you don't see this in the pull request, something is wrong in Step 2, and you should go back to investigate.

If you do see your CI workflow being run, congratulations! Try making another commit that breaks the tests (e.g., make a new commit on your branch that breaks the logic in your function, so the tests will fail). Push this broken commit to GitHub and watch your CI build to make sure it fails as you expect. Go and inspect the workflow's logs to see the error message that your tests produced. Does it make sense to you?

Once you can confirm that a failed test will break your CI workflow, and know how to inspect the logs, make another change to fix the failing test and push it. Confirm that this change fixes the CI and everything is green.

Once you have successfully passed, failed, and passed CI again, go ahead and merge your pull request to master.